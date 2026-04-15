/**
 * 校园树洞 - 匿名论坛主脚本 v2.0
 * 包含完整主题系统、明暗模式、表白墙专属功能等
 */

// ==================== Supabase 配置 ====================
const SUPABASE_URL = 'https://br-cute-duck-832d841d.supabase2.aidap-global.cn-beijing.volces.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTY2NDcyNDUsInJvbGUiOiJhbm9uIn0.0vB7A5Eb9FgSqIU9jyc9Rbh0qoajSr9z0Gnzyj16GyE';

// 简化版 Supabase REST API 封装（备用）
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    async request(method, table, options = {}) {
        const { filters = [], data, select = '*', single = false, order, limit, upsert } = options;
        
        let query = `${this.url}/rest/v1/${table}?${select ? `select=${select}` : ''}`;
        
        filters.forEach(f => {
            if (f.eq) query += `&${f.column}=eq.${encodeURIComponent(f.eq)}`;
            if (f.gte) query += `&${f.column}=gte.${encodeURIComponent(f.gte)}`;
            if (f.order) query += `&order=${f.column}.${f.order}`;
        });
        
        if (limit) query += `&limit=${limit}`;
        
        try {
            const response = await fetch(query, {
                method: method,
                headers: this.headers,
                body: method !== 'GET' && data ? JSON.stringify(data) : undefined
            });
            
            let result = await response.json();
            if (single && Array.isArray(result)) result = result[0];
            
            return { data: result, error: response.ok ? null : { message: result.message || 'Request failed' } };
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    }

    from(table) {
        return {
            select: (cols = '*', options = {}) => this.request('GET', table, { ...options, select: cols }),
            insert: (data, options = {}) => this.request('POST', table, { data, ...options }),
            update: (data, options = {}) => this.request('PATCH', table, { data, ...options }),
            delete: () => this.request('DELETE', table),
            upsert: (data, options = {}) => this.request('POST', table, { data, upsert: true })
        };
    }
}

// 初始化 Supabase 客户端
let supabaseClient = null;

// 简化查询辅助函数
const db = {
    async query(table, options = {}) {
        return supabaseClient.from(table).select(options.select || '*', options);
    },
    async insert(table, data) {
        return supabaseClient.from(table).insert(data);
    },
    async update(table, data, filters) {
        return supabaseClient.from(table).update(data, filters);
    },
    async delete(table, filters) {
        return supabaseClient.from(table).delete(filters);
    }
};

// ==================== 本地存储管理 ====================
const LocalDB = {
    // 本地存储键名
    KEYS: {
        POSTS: 'campus_posts',
        COMMENTS: 'campus_comments',
        USERS: 'campus_users',
        FAVORITES: 'campus_favorites',
        NOTIFICATIONS: 'campus_notifications',
        VOTES: 'campus_votes',  // 用户点赞/踩记录
        FRIENDS: 'campus_friends',  // 好友列表
        FRIEND_REQUESTS: 'campus_friend_requests',  // 好友申请
        MESSAGES: 'campus_messages'  // 聊天消息
    },

    // 清理本地数据，与云端同步
    async syncLocalData() {
        try {
            // 同步帖子
            const { data: cloudPosts } = await supabaseClient.from('posts').select('*');
            if (cloudPosts) {
                localStorage.setItem('campus_posts', JSON.stringify(cloudPosts));
            }
            
            // 同步评论
            const { data: cloudComments } = await supabaseClient.from('comments').select('*');
            if (cloudComments) {
                localStorage.setItem('campus_comments', JSON.stringify(cloudComments));
            }
            
            // 同步用户
            const { data: cloudUsers } = await supabaseClient.from('user_profiles').select('*');
            if (cloudUsers) {
                localStorage.setItem('campus_users', JSON.stringify(cloudUsers));
            }
            
            // 同步收藏
            const { data: cloudFavorites } = await supabaseClient.from('favorites').select('*');
            if (cloudFavorites) {
                localStorage.setItem('campus_favorites', JSON.stringify(cloudFavorites));
            }
            
            // 同步投票
            const { data: cloudVotes } = await supabaseClient.from('campus_votes').select('*');
            if (cloudVotes) {
                localStorage.setItem('campus_votes', JSON.stringify(cloudVotes));
            }
        } catch (e) {
            console.warn('同步本地数据失败:', e);
        }
    },
    
    // 初始化本地数据
    init() {
        if (!localStorage.getItem(this.KEYS.POSTS)) {
            localStorage.setItem(this.KEYS.POSTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.COMMENTS)) {
            localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.USERS)) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.FAVORITES)) {
            localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.NOTIFICATIONS)) {
            localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.VOTES)) {
            localStorage.setItem(this.KEYS.VOTES, JSON.stringify([]));
        }
    },

    // 投票操作（点赞/踩）
    getUserVote(postId, userId) {
        const votes = JSON.parse(localStorage.getItem(this.KEYS.VOTES) || '[]');
        return votes.find(v => v.post_id === postId && v.user_id === userId);
    },

    addVote(postId, userId, voteType) {
        const votes = JSON.parse(localStorage.getItem(this.KEYS.VOTES) || '[]');
        // 移除旧投票
        const filtered = votes.filter(v => !(v.post_id === postId && v.user_id === userId));
        // 添加新投票
        filtered.push({
            id: this.uuid(),
            post_id: postId,
            user_id: userId,
            vote_type: voteType, // 'like' or 'dislike'
            created_at: new Date().toISOString()
        });
        localStorage.setItem(this.KEYS.VOTES, JSON.stringify(filtered));
    },

    removeVote(postId, userId) {
        const votes = JSON.parse(localStorage.getItem(this.KEYS.VOTES) || '[]');
        const filtered = votes.filter(v => !(v.post_id === postId && v.user_id === userId));
        localStorage.setItem(this.KEYS.VOTES, JSON.stringify(filtered));
    },

    // 生成 UUID
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Posts 操作
    getPosts(category = 'all', sort = 'latest', limit = 20, offset = 0) {
        let posts = JSON.parse(localStorage.getItem(this.KEYS.POSTS) || '[]');
        
        // 过滤板块
        if (category !== 'all') {
            posts = posts.filter(p => p.category === category);
        }
        
        // 排序
        if (sort === 'latest') {
            posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sort === 'hot') {
            posts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        }
        
        // 过滤被隐藏的帖子
        posts = posts.filter(p => p.downvotes < 10);
        
        return posts.slice(offset, offset + limit);
    },

    getPost(id) {
        const posts = JSON.parse(localStorage.getItem(this.KEYS.POSTS) || '[]');
        return posts.find(p => p.id === id);
    },

    addPost(post) {
        const posts = JSON.parse(localStorage.getItem(this.KEYS.POSTS) || '[]');
        post.id = post.id || this.uuid();
        post.created_at = post.created_at || new Date().toISOString();
        post.upvotes = post.upvotes || 0;
        post.downvotes = post.downvotes || 0;
        posts.unshift(post);
        localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
        return post;
    },

    updatePost(id, updates) {
        const posts = JSON.parse(localStorage.getItem(this.KEYS.POSTS) || '[]');
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updates };
            localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
        }
    },

    deletePost(id) {
        const posts = JSON.parse(localStorage.getItem(this.KEYS.POSTS) || '[]');
        const filtered = posts.filter(p => p.id !== id);
        localStorage.setItem(this.KEYS.POSTS, JSON.stringify(filtered));
    },

    // Comments 操作
    getComments(postId) {
        const comments = JSON.parse(localStorage.getItem(this.KEYS.COMMENTS) || '[]');
        return comments.filter(c => c.post_id === postId)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },

    addComment(comment) {
        const comments = JSON.parse(localStorage.getItem(this.KEYS.COMMENTS) || '[]');
        comment.id = comment.id || this.uuid();
        comment.created_at = comment.created_at || new Date().toISOString();
        comments.push(comment);
        localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify(comments));
        return comment;
    },

    deleteComment(id) {
        const comments = JSON.parse(localStorage.getItem(this.KEYS.COMMENTS) || '[]');
        const filtered = comments.filter(c => c.id !== id);
        localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify(filtered));
    },

    // Users 操作
    getUsers() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    },

    getUser(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = user.id || this.uuid();
        user.created_at = user.created_at || new Date().toISOString();
        users.push(user);
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        return user;
    },

    updateUser(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        }
    },
    
    async updateUserProfile(id, updates) {
        // 更新本地
        this.updateUser(id, updates);
        
        // 更新云端
        if (supabaseClient && supabaseClient.isConnected) {
            await supabaseClient.from('user_profiles').update(updates).eq('id', id);
        }
    },

    // Favorites 操作
    getFavorites(userId) {
        const favorites = JSON.parse(localStorage.getItem(this.KEYS.FAVORITES) || '[]');
        return favorites.filter(f => f.user_id === userId);
    },

    toggleFavorite(postId, userId) {
        const favorites = JSON.parse(localStorage.getItem(this.KEYS.FAVORITES) || '[]');
        const index = favorites.findIndex(f => f.post_id === postId && f.user_id === userId);
        
        if (index !== -1) {
            favorites.splice(index, 1);
            localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
            return false;
        } else {
            favorites.push({ id: this.uuid(), post_id: postId, user_id: userId, created_at: new Date().toISOString() });
            localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
            return true;
        }
    },

    // Friends 操作
    getFriends(userId) {
        const friends = JSON.parse(localStorage.getItem(this.KEYS.FRIENDS) || '[]');
        return friends.filter(f => f.user_id === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    addFriend(userId, friendId, friendName, friendAvatar) {
        const friends = JSON.parse(localStorage.getItem(this.KEYS.FRIENDS) || '[]');
        // 检查是否已经存在
        const exists = friends.find(f => f.user_id === userId && f.friend_id === friendId);
        if (exists) {
            return false;
        }
        friends.push({
            id: this.uuid(),
            user_id: userId,
            friend_id: friendId,
            friend_name: friendName,
            friend_avatar: friendAvatar,
            created_at: new Date().toISOString()
        });
        localStorage.setItem(this.KEYS.FRIENDS, JSON.stringify(friends));
        return true;
    },

    removeFriend(friendId) {
        const friends = JSON.parse(localStorage.getItem(this.KEYS.FRIENDS) || '[]');
        const index = friends.findIndex(f => f.id === friendId);
        if (index !== -1) {
            friends.splice(index, 1);
            localStorage.setItem(this.KEYS.FRIENDS, JSON.stringify(friends));
        }
    },

    // 好友申请操作（云端）
    async getFriendRequests(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('friend_requests')
                .select('*')
                .eq('to_user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            // 降级到本地
            const requests = JSON.parse(localStorage.getItem(this.KEYS.FRIEND_REQUESTS) || '[]');
            return requests.filter(r => r.to_user_id === userId && r.status === 'pending')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    },

    async sendFriendRequest(fromUser, toUserId, toUserName, toUserAvatar, message) {
        try {
            // 检查是否已是好友
            const { data: existingFriends } = await supabaseClient
                .from('friends')
                .select('id')
                .eq('user_id', fromUser.id)
                .eq('friend_id', toUserId)
                .single();
            
            if (existingFriends) {
                return { success: false, message: '你们已经是好友了' };
            }
            
            // 检查是否已发送过申请
            const { data: existingRequest } = await supabaseClient
                .from('friend_requests')
                .select('id')
                .eq('from_user_id', fromUser.id)
                .eq('to_user_id', toUserId)
                .eq('status', 'pending')
                .single();
            
            if (existingRequest) {
                return { success: false, message: '已发送过好友申请，请等待对方确认' };
            }
            
            const { error } = await supabaseClient.from('friend_requests').insert({
                from_user_id: fromUser.id,
                from_user_name: fromUser.anonymous_name || '匿名用户',
                from_user_avatar: fromUser.avatar || 0,
                to_user_id: toUserId,
                to_user_name: toUserName,
                to_user_avatar: toUserAvatar,
                message: message || '',
                status: 'pending'
            });
            
            if (error) throw error;
            return { success: true };
        } catch (e) {
            return { success: false, message: '发送失败，请重试' };
        }
    },

    async acceptFriendRequest(requestId, userId, user) {
        try {
            // 获取申请信息
            const { data: request, error: fetchError } = await supabaseClient
                .from('friend_requests')
                .select('*')
                .eq('id', requestId)
                .eq('to_user_id', userId)
                .single();
            
            if (fetchError || !request) {
                return { success: false, message: '无效的申请' };
            }
            
            // 更新申请状态
            await supabaseClient
                .from('friend_requests')
                .update({ status: 'accepted' })
                .eq('id', requestId);
            
            // 添加双向好友关系到 posts 表
            await supabaseClient.from('friends').insert({
                user_id: request.from_user_id,
                friend_id: request.to_user_id,
                friend_name: request.to_user_name,
                friend_avatar: request.to_user_avatar
            });
            
            await supabaseClient.from('friends').insert({
                user_id: request.to_user_id,
                friend_id: request.from_user_id,
                friend_name: request.from_user_name,
                friend_avatar: request.from_user_avatar
            });
            
            return { success: true };
        } catch (e) {
            return { success: false, message: '操作失败，请重试' };
        }
    },

    async rejectFriendRequest(requestId, userId) {
        try {
            await supabaseClient
                .from('friend_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId)
                .eq('to_user_id', userId);
            
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    async getFriends(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('friends')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            return [];
        }
    },

    async removeFriend(userId, friendId) {
        try {
            // 删除双向好友关系
            await supabaseClient.from('friends').delete()
                .eq('user_id', userId)
                .eq('friend_id', friendId);
            
            await supabaseClient.from('friends').delete()
                .eq('user_id', friendId)
                .eq('friend_id', userId);
            
            return true;
        } catch (e) {
            return false;
        }
    },

    // 聊天消息操作（云端）
    async getMessages(userId, friendId) {
        try {
            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .or(`and(from_id.eq.${userId},to_id.eq.${friendId}),and(from_id.eq.${friendId},to_id.eq.${userId})`)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            return [];
        }
    },

    async sendMessage(fromUser, toId, toName, toAvatar, content) {
        try {
            const { error } = await supabaseClient.from('messages').insert({
                from_id: fromUser.id,
                from_name: fromUser.anonymous_name || '匿名用户',
                from_avatar: fromUser.avatar || 0,
                to_id: toId,
                to_name: toName,
                to_avatar: toAvatar,
                content: content
            });
            
            if (error) throw error;
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    // Notifications 操作
    getNotifications(userId) {
        const notifications = JSON.parse(localStorage.getItem(this.KEYS.NOTIFICATIONS) || '[]');
        return notifications.filter(n => n.user_id === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    addNotification(notification) {
        const notifications = JSON.parse(localStorage.getItem(this.KEYS.NOTIFICATIONS) || '[]');
        notification.id = notification.id || this.uuid();
        notification.created_at = notification.created_at || new Date().toISOString();
        notification.is_read = false;
        notifications.push(notification);
        localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    },

    markNotificationRead(id) {
        const notifications = JSON.parse(localStorage.getItem(this.KEYS.NOTIFICATIONS) || '[]');
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications[index].is_read = true;
            localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        }
    }
};

// 关键词屏蔽列表
const BLOCKED_KEYWORDS = [
    '政治', '色情', '暴力', '赌博', '毒品', '诈骗',
    '自杀', '杀人', '恐怖', '分裂', '反动', '习近平', '共产党'
];

// 板块配置
const CATEGORIES = {
    chat: { name: '校园闲聊', icon: 'chat-3', color: 'chat' },
    study: { name: '学习求助', icon: 'book-open', color: 'study' },
    love: { name: '表白墙', icon: 'heart', color: 'love' },
    lost: { name: '失物招领', icon: 'search', color: 'lost' },
    friend: { name: '交友脱单', icon: 'user-add', color: 'friend' }
};

// 头像配置
const AVATARS = [
    { bg: 'bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400', icon: 'ri-user-heart-line' },
    { bg: 'bg-gradient-to-br from-sky-200 via-sky-300 to-indigo-300', icon: 'ri-user-star-line' },
    { bg: 'bg-gradient-to-br from-cyan-200 via-blue-200 to-sky-300', icon: 'ri-leaf-line' },
    { bg: 'bg-gradient-to-br from-indigo-200 via-blue-200 to-blue-300', icon: 'ri-sun-line' },
    { bg: 'bg-gradient-to-br from-blue-200 via-indigo-200 to-blue-300', icon: 'ri-star-line' },
    { bg: 'bg-gradient-to-br from-sky-200 via-cyan-200 to-blue-300', icon: 'ri-water-flash-line' },
    { bg: 'bg-gradient-to-br from-blue-200 to-cyan-300', icon: 'ri-fire-line' },
    { bg: 'bg-gradient-to-br from-indigo-200 via-blue-200 to-sky-300', icon: 'ri-heart-line' },
    { bg: 'bg-gradient-to-br from-cyan-200 to-sky-300', icon: 'ri-moon-line' },
    { bg: 'bg-gradient-to-br from-blue-200 via-sky-200 to-indigo-300', icon: 'ri-flashlight-line' },
    { bg: 'bg-gradient-to-br from-sky-200 to-blue-300', icon: 'ri-drop-line' },
    { bg: 'bg-gradient-to-br from-blue-200 via-indigo-200 to-blue-300', icon: 'ri-bear-smile-line' },
    { bg: 'bg-gradient-to-br from-cyan-200 via-sky-200 to-blue-300', icon: 'ri-cloud-line' },
    { bg: 'bg-gradient-to-br from-indigo-200 to-sky-300', icon: 'ri-bird-line' },
    { bg: 'bg-gradient-to-br from-blue-200 to-indigo-300', icon: 'ri-firefox-line' },
    { bg: 'bg-gradient-to-br from-sky-200 via-cyan-200 to-blue-300', icon: 'ri-moon-cloudy-line' },
    { bg: 'bg-gradient-to-br from-cyan-200 via-blue-200 to-sky-300', icon: 'ri-shining-line' },
    { bg: 'bg-gradient-to-br from-blue-200 via-sky-200 to-indigo-300', icon: 'ri-heart-2-line' },
    { bg: 'bg-gradient-to-br from-indigo-200 via-cyan-200 to-blue-300', icon: 'ri-sun-cloudy-line' },
    { bg: 'bg-gradient-to-br from-sky-200 to-blue-300', icon: 'ri-plant-line' }
];

// 获取随机头像
function getRandomAvatar() {
    return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

// 获取用户头像配置
function getAvatarConfig(avatarIndex) {
    if (avatarIndex && AVATARS[avatarIndex]) {
        return AVATARS[avatarIndex];
    }
    return AVATARS[0];
}

// ==================== 全局状态 ====================
let currentUser = null;
let currentCategory = 'all';
let currentSort = 'latest';
let currentPage = 'auth';
let previousPage = 'home';
let selectedPostCategory = null;
let postsOffset = 0;
const POSTS_PER_PAGE = 10;
let currentPostId = null;
let currentTheme = 'system';
let retryAction = null;

// ==================== 主题系统 ====================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    currentTheme = savedTheme;
    applyTheme(savedTheme);
    updateThemeUI(savedTheme);
}

function applyTheme(theme) {
    let isDark = false;
    
    if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        isDark = theme === 'dark';
    }
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // 更新主题图标
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle('hidden', isDark);
        darkIcon.classList.toggle('hidden', !isDark);
    }
}

function updateThemeUI(theme) {
    // 更新主题选择菜单
    document.querySelectorAll('.theme-option').forEach(btn => {
        const checkIcon = btn.querySelector('.check-icon');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
            btn.style.background = 'var(--bg-secondary)';
            if (checkIcon) checkIcon.classList.remove('hidden');
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            if (checkIcon) checkIcon.classList.add('hidden');
        }
    });
    
    // 更新设置页面的主题按钮
    document.querySelectorAll('.settings-theme-btn').forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    updateThemeUI(theme);
    document.getElementById('themeDropdown').classList.add('hidden');
}

function toggleThemeMenu() {
    const dropdown = document.getElementById('themeDropdown');
    dropdown.classList.toggle('hidden');
}

// ==================== 工具函数 ====================
// Toast 模态框
function showToast(message, type = 'info') {
    const modal = document.getElementById('toastModal');
    const content = document.getElementById('toastContent');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    
    // 设置消息内容
    msg.textContent = message;
    
    // 设置图标和颜色
    const configs = {
        success: {
            bg: 'bg-gradient-to-br from-green-400 to-emerald-500',
            icon: '<i class="ri-checkbox-circle-fill text-3xl text-white"></i>'
        },
        error: {
            bg: 'bg-gradient-to-br from-red-400 to-rose-500',
            icon: '<i class="ri-close-circle-fill text-3xl text-white"></i>'
        },
        warning: {
            bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
            icon: '<i class="ri-alert-fill text-3xl text-white"></i>'
        },
        info: {
            bg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
            icon: '<i class="ri-information-fill text-3xl text-white"></i>'
        }
    };
    
    const config = configs[type] || configs.info;
    icon.className = `w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${config.bg}`;
    icon.innerHTML = config.icon;
    
    // 显示模态框
    modal.classList.remove('hidden');
    // 丝滑动画：先显示，再添加动画类
    requestAnimationFrame(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
    });
    
    // 3秒后自动关闭
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        hideToastModal();
    }, 3000);
}

function hideToastModal() {
    const modal = document.getElementById('toastModal');
    const content = document.getElementById('toastContent');
    
    // 丝滑关闭动画
    content.style.transform = 'scale(0.9)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function containsBlockedKeywords(content) {
    const lowerContent = content.toLowerCase();
    return BLOCKED_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function generateAnonymousName() {
    const adjectives = ['快乐的', '安静的', '勇敢的', '聪明的', '温柔的', '可爱的', '热情的', '冷静的', '神秘的', '浪漫的'];
    const nouns = ['路人', '同学', '小伙伴', '小天使', '小可爱', '小红帽', '小白', '小黑', '小蓝', '小绿'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return adj + noun + Math.floor(Math.random() * 100);
}

// ==================== Supabase 初始化 ====================
async function initSupabase() {
    // 初始化本地数据库
    LocalDB.init();
    
    // 添加示例数据（如果本地数据为空）
    if (LocalDB.getPosts().length === 0) {
        const demoPosts = [
            { id: LocalDB.uuid(), user_id: 'demo1', username: 'demo', anonymous_name: '开心的企鹅', title: '欢迎来到校园树洞', content: '这里是一个匿名的校园论坛，欢迎大家分享自己的想法！', category: 'chat', upvotes: 10, downvotes: 0, created_at: new Date().toISOString() },
            { id: LocalDB.uuid(), user_id: 'demo2', username: 'demo', anonymous_name: '孤独的鲸鱼', title: '找一个一起学习的伙伴', content: '本人大三大数据专业，想找一个一起考研的战友，有兴趣的可以留言～', category: 'study', upvotes: 5, downvotes: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: LocalDB.uuid(), user_id: 'demo1', username: 'demo', anonymous_name: '开心的企鹅', title: '表白墙测试', content: '只是想测试一下表白墙功能哈哈', category: 'love', upvotes: 15, downvotes: 0, created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: LocalDB.uuid(), user_id: 'demo3', username: 'demo', anonymous_name: '可爱的考拉', title: '丢失校园卡一张', content: '昨天下午在图书馆丢失校园卡一张，卡号后四位是1234，有捡到的同学请联系～', category: 'lost', upvotes: 2, downvotes: 0, created_at: new Date(Date.now() - 172800000).toISOString() }
        ];
        demoPosts.forEach(post => LocalDB.addPost(post));
    }
    
    try {
        // 使用 supabase-js SDK
        if (window.supabase) {
            const { createClient } = window.supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { error } = await supabaseClient.from('posts').select('id').limit(1);
            if (error) {
                console.warn('Supabase REST API 警告:', error);
            }
        } else {
            // 如果 SDK 未加载，使用简化的 REST API
            supabaseClient = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        
        console.log('Supabase初始化完成');
        return true;
    } catch (err) {
        console.error('Supabase初始化失败:', err);
        // 使用本地存储作为后备
        supabaseClient = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        showToast('数据库连接异常，已切换到本地模式', 'warning');
        return true;
    }
}

// ==================== 认证相关 ====================
async function login() {
    // 检查规则是否已同意
    if (!document.getElementById('rulesAgreed').checked) {
        App.showRulesAgreement();
        return;
    }
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('请填写用户名和密码', 'warning');
        return;
    }
    
    showLoading();
    let profile = null;
    
    try {
        // 优先尝试云端登录
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('username', username)
            .single();
        
        if (!error && data) {
            profile = data;
        }
    } catch (e) {
        console.warn('云端登录失败，检查本地存储:', e);
    }
    
    // 云端失败，检查本地存储
    if (!profile) {
        const localUsers = LocalDB.getUsers();
        profile = localUsers.find(u => u.username === username);
    }
    
    hideLoading();
    
    if (!profile) {
        showToast('用户名或密码错误', 'error');
        return;
    }
    
    if (profile.password !== password) {
        showToast('用户名或密码错误', 'error');
        return;
    }
    
    currentUser = profile;
    localStorage.setItem('campus_user', JSON.stringify(profile));
    
    showToast('登录成功！', 'success');
    App.updateUIForLoggedInUser();
    App.goHome();
    
    // 显示新功能介绍弹窗
    setTimeout(() => {
        App.showNewFeaturesModal();
    }, 500);
}

async function register() {
    // 检查规则是否已同意
    if (!document.getElementById('rulesAgreed').checked) {
        App.showRulesAgreement();
        return;
    }
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!username || !password || !confirmPassword) {
        showToast('请填写所有字段', 'warning');
        return;
    }
    
    if (username.length < 3 || username.length > 20) {
        showToast('用户名需3-20位', 'warning');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showToast('用户名只能包含字母、数字、下划线', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showToast('密码至少6位', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('两次密码不一致', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        // 检查用户名是否已存在（优先云端，本地后备）
        let existingUser = null;
        try {
            const { data: existing } = await supabaseClient
                .from('user_profiles')
                .select('id')
                .eq('username', username)
                .single();
            if (existing) existingUser = existing;
        } catch (e) {
            // 云端查询失败，检查本地
            const localUsers = LocalDB.getUsers();
            if (localUsers.find(u => u.username === username)) {
                existingUser = { id: true };
            }
        }
        
        if (existingUser) {
            hideLoading();
            showToast('用户名已被占用', 'warning');
            return;
        }
        
        // 创建新用户（优先云端，本地后备）
        let newUser = null;
        const userData = {
            username: username,
            password: password,
            anonymous_name: generateAnonymousName(),
            avatar: Math.floor(Math.random() * AVATARS.length),
            created_at: new Date().toISOString(),
            is_active: true,
            today_post_count: 0,
            today_comment_count: 0,
            last_post_date: null,
            last_comment_date: null
        };
        
        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .insert(userData)
                .select()
                .single();
            
            if (!error && data) {
                newUser = data;
            } else {
                throw error;
            }
        } catch (e) {
            // 云端插入失败，使用本地存储
            console.warn('云端注册失败，使用本地存储:', e);
            newUser = LocalDB.addUser(userData);
        }
        
        hideLoading();
        showToast('注册成功！请登录', 'success');
        App.switchAuthTab('login');
        document.getElementById('loginUsername').value = username;
        
    } catch (err) {
        hideLoading();
        console.error('注册错误:', err);
        // 本地注册作为最终后备
        const localUsers = LocalDB.getUsers();
        if (localUsers.find(u => u.username === username)) {
            showToast('用户名已被占用', 'warning');
            return;
        }
        
        const userData = {
            username: username,
            password: password,
            anonymous_name: generateAnonymousName(),
            avatar: 'avatar1',
            created_at: new Date().toISOString(),
            is_active: true,
            today_post_count: 0,
            today_comment_count: 0
        };
        LocalDB.addUser(userData);
        hideLoading();
        showToast('注册成功！请登录', 'success');
        App.switchAuthTab('login');
        document.getElementById('loginUsername').value = username;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('campus_user');
    showToast('已退出登录', 'info');
    App.updateUIForLoggedOutUser();
    App.showPage('auth');
}

async function checkAuthStatus() {
    const savedUser = localStorage.getItem('campus_user');
    
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            
            // 优先尝试从云端获取最新用户数据
            try {
                const { data: dbUser } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('id', userData.id)
                    .single();
                
                if (dbUser) {
                    currentUser = dbUser;
                    localStorage.setItem('campus_user', JSON.stringify(dbUser));
                    return true;
                }
            } catch (e) {
                console.warn('云端获取用户失败，使用本地缓存');
            }
            
            // 云端失败，使用本地缓存的用户数据
            const localUsers = LocalDB.getUsers();
            const localUser = localUsers.find(u => u.id === userData.id);
            if (localUser) {
                currentUser = localUser;
                return true;
            }
            
            // 本地也没有，使用保存的用户数据（可能是旧数据）
            currentUser = userData;
            return true;
            
        } catch (err) {
            console.error('检查登录状态失败:', err);
        }
    }
    
    return false;
}

// ==================== 帖子相关 ====================
async function loadPosts(reset = true) {
    if (reset) {
        postsOffset = 0;
        document.getElementById('postList').innerHTML = '';
    }
    
    document.getElementById('skeletonLoader').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('loadMoreIndicator')?.classList.add('hidden');
    
    try {
        // 尝试从云端获取
        let query = supabaseClient
            .from('posts')
            .select('*')
            .range(postsOffset, postsOffset + POSTS_PER_PAGE - 1);
        
        if (currentCategory !== 'all') {
            query = query.eq('category', currentCategory);
        }
        
        if (currentSort === 'latest') {
            query = query.order('created_at', { ascending: false });
        } else {
            // 最热排序：按 (点赞数 + 评论数) 降序
            query = query.order('upvotes', { ascending: false });
        }
        
        const { data: cloudPosts, error } = await query;
        
        // 如果云端获取成功，用云端数据完全覆盖本地
        if (!error && cloudPosts) {
            localStorage.setItem('campus_posts', JSON.stringify(cloudPosts));
            posts = cloudPosts;
        } else if (cloudPosts && cloudPosts.length > 0) {
            posts = cloudPosts;
        } else {
            // 云端无数据，清空本地
            localStorage.setItem('campus_posts', JSON.stringify([]));
            posts = [];
        }
        
        document.getElementById('skeletonLoader').classList.add('hidden');
        
        if (!posts || posts.length === 0) {
            if (reset) {
                document.getElementById('emptyState').classList.remove('hidden');
            }
            return;
        }
        
        document.getElementById('emptyState').classList.add('hidden');
        
        // 为每个帖子获取评论数（从云端获取）
        for (let post of posts) {
            try {
                const { data: cloudComments } = await supabaseClient
                    .from('comments')
                    .select('id')
                    .eq('post_id', post.id);
                post.commentCount = cloudComments?.length || 0;
            } catch (e) {
                // 云端获取失败，使用本地评论数
                const localComments = LocalDB.getComments(post.id);
                post.commentCount = localComments.length;
            }
        }
        
        // 最热排序：按 (点赞数 + 评论数) 降序
        if (currentSort === 'hot') {
            posts.sort((a, b) => {
                const hotA = (a.upvotes || 0) + (a.commentCount || 0);
                const hotB = (b.upvotes || 0) + (b.commentCount || 0);
                return hotB - hotA;
            });
        }
        
        const postList = document.getElementById('postList');
        posts.forEach((post, index) => {
            const postCard = createPostCard(post);
            postCard.style.animationDelay = `${index * 0.1}s`;
            postList.appendChild(postCard);
        });
        
        postsOffset += posts.length;
        
    } catch (err) {
        document.getElementById('skeletonLoader').classList.add('hidden');
        console.error('加载帖子失败:', err);
        // 云端失败时清空本地并显示空状态
        localStorage.setItem('campus_posts', JSON.stringify([]));
        document.getElementById('emptyState').classList.remove('hidden');
    }
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card cursor-pointer';
    card.dataset.postId = post.id;
    
    // 点击卡片进入详情页
    card.addEventListener('click', (e) => {
        // 阻止按钮和头像的冒泡
        if (e.target.closest('button')) return;
        if (e.target.closest('.avatar-btn')) return;
        App.viewPostDetail(post.id);
    });
    
    const isHidden = post.downvotes >= 10;
    const category = CATEGORIES[post.category] || CATEGORIES.chat;
    const isLove = post.category === 'love';
    const displayName = post.anonymous_name || '匿名用户';
    const commentCount = post.commentCount || 0;
    const isOwner = currentUser && currentUser.id === post.user_id;
    
    // 检查用户是否已点赞
    const userVote = currentUser ? LocalDB.getUserVote(post.id, currentUser.id) : null;
    const hasLiked = userVote && userVote.vote_type === 'like';
    const hasDisliked = userVote && userVote.vote_type === 'dislike';
    
    if (isHidden) {
        card.classList.add('post-card-hidden');
    }
    
    if (isLove) {
        card.classList.add('post-card-love');
    }
    
    // 检查是否是好友（从帖子获取的用户信息）
    const canAddFriend = !isOwner && currentUser && post.user_id && post.username;
    
    card.innerHTML = `
        <div class="flex items-start gap-3">
            ${canAddFriend ? `
                <div onclick="App.showFriendRequestModal('${post.user_id}', '${escapeHtml(post.anonymous_name || '匿名用户')}', '${post.avatar || 0}')" class="avatar-btn w-10 h-10 rounded-xl ${getAvatarConfig(post.avatar).bg} flex items-center justify-center flex-shrink-0 text-white cursor-pointer hover:opacity-80 transition-opacity">
                    <i class="${getAvatarConfig(post.avatar).icon}"></i>
                </div>
            ` : `
                <div class="w-10 h-10 rounded-xl ${getAvatarConfig(post.avatar).bg} flex items-center justify-center flex-shrink-0 text-white">
                    <i class="${getAvatarConfig(post.avatar).icon}"></i>
                </div>
            `}
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="category-tag tag-${category.color}">
                        ${isLove ? '<i class="ri-heart-fill mr-1"></i>' : ''}
                        ${category.name}
                    </span>
                    <span class="text-xs time-relative">${formatTimeAgo(post.created_at)}</span>
                    ${isLove ? '<span class="text-xs love-text"><i class="ri-shield-check-line mr-1"></i>匿名</span>' : ''}
                </div>
                <h3 class="font-medium mb-1 ${isHidden ? 'blur-sm' : ''}" style="color: var(--text-primary);">${escapeHtml(post.title || '无标题')}</h3>
                <p class="text-sm leading-relaxed ${isHidden ? 'blur-sm' : ''}" style="color: var(--text-secondary); word-break: break-all;">${escapeHtml(post.content)}</p>
                
                <div class="flex items-center gap-4 mt-3 flex-wrap">
                    <button onclick="App.likePost('${post.id}')" class="action-btn action-btn-like ${hasLiked ? 'text-red-500' : ''}">
                        <i class="${hasLiked ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
                        <span class="like-count">${post.upvotes || 0}</span>
                    </button>
                    <button onclick="App.dislikePost('${post.id}')" class="action-btn action-btn-dislike ${hasDisliked ? 'text-gray-600 dark:text-gray-400' : ''}">
                        <i class="${hasDisliked ? 'ri-thumb-down-fill' : 'ri-thumb-down-line'}"></i>
                        <span class="dislike-count">${post.downvotes || 0}</span>
                    </button>
                    <button onclick="App.viewPostDetail('${post.id}')" class="action-btn">
                        <i class="ri-chat-3-line"></i>
                        <span>${commentCount}</span>
                    </button>
                    ${isOwner ? `
                        <button onclick="App.confirmDeletePost('${post.id}')" class="action-btn action-btn-delete ml-auto">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    ` : `
                        <button onclick="App.showReportModal('${post.id}')" class="action-btn ml-auto">
                            <i class="ri-alert-line"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

async function createPost() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        App.showPage('auth');
        return;
    }
    
    // 测试阶段不限制发帖数量，但保留计数用于显示
    const today = getTodayDate();
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
        showToast('请输入内容', 'warning');
        return;
    }
    
    if (containsBlockedKeywords(title + content)) {
        showToast('内容包含敏感词，请修改', 'error');
        return;
    }
    
    if (!selectedPostCategory) {
        showToast('请选择板块', 'warning');
        return;
    }
    
    const submitBtn = document.getElementById('submitPostBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-2-line animate-spin mr-2"></i>发布中...';
    
    try {
        // 构建帖子数据
        const postData = {
            user_id: currentUser.id,
            username: currentUser.username,
            anonymous_name: selectedPostCategory === 'love' ? '匿名用户' : currentUser.anonymous_name,
            title: title || '匿名表白',
            content: content,
            category: selectedPostCategory,
            upvotes: 0,
            downvotes: 0,
            created_at: new Date().toISOString()
        };
        
        // 尝试保存到云端
        let newPost = null;
        try {
            const { data, error } = await supabaseClient
                .from('posts')
                .insert(postData)
                .select()
                .single();
            
            if (!error && data) {
                newPost = data;
            }
        } catch (e) {
            console.warn('云端存储失败，使用本地存储:', e);
        }
        
        // 如果云端失败，保存到本地
        if (!newPost) {
            newPost = LocalDB.addPost(postData);
        }
        
        // 更新用户发帖计数
        const newPostCount = currentUser.last_post_date === today ? currentUser.today_post_count + 1 : 1;
        currentUser.today_post_count = newPostCount;
        currentUser.last_post_date = today;
        localStorage.setItem('campus_user', JSON.stringify(currentUser));
        
        // 更新本地用户数据
        LocalDB.updateUser(currentUser.id, { today_post_count: newPostCount, last_post_date: today });
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-send-plane-line mr-2"></i>发布帖子';
        
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('titleCount').textContent = '0';
        document.getElementById('contentCount').textContent = '0';
        selectedPostCategory = null;
        document.querySelectorAll('.post-category-btn').forEach(btn => btn.classList.remove('active'));
        
        showToast('发布成功！', 'success');
        App.goHome();
        
    } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-send-plane-line mr-2"></i>发布帖子';
        console.error('发布失败:', err);
        showToast('发布失败，请重试', 'error');
    }
}

async function deletePost(postId) {
    try {
        // 优先删除云端数据
        try {
            await supabaseClient
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', currentUser.id);
        } catch (e) {
            console.warn('云端删除失败，使用本地删除');
        }
        
        // 始终删除本地数据
        LocalDB.deletePost(postId);
        
        showToast('删除成功', 'success');
        const card = document.querySelector(`[data-post-id="${postId}"]`);
        if (card) {
            card.style.transform = 'translateX(100%)';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        }
        
        if (currentPostId === postId) {
            App.goHome();
        }
        
    } catch (err) {
        console.error('删除失败:', err);
        showToast('删除失败，请重试', 'error');
    }
}

async function likePost(postId) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    const likeBtn = card.querySelector('.action-btn-like');
    const dislikeBtn = card.querySelector('.action-btn-dislike');
    const likeCount = card.querySelector('.like-count');
    const dislikeCount = card.querySelector('.dislike-count');
    const currentLikes = parseInt(likeCount.textContent);
    const currentDislikes = parseInt(dislikeCount.textContent);
    const userVote = LocalDB.getUserVote(postId, currentUser.id);
    
    // 检查当前用户是否已经点过赞
    if (userVote && userVote.vote_type === 'like') {
        // 已经点赞过，取消点赞
        const newLikes = Math.max(0, currentLikes - 1);
        likeCount.textContent = newLikes;
        likeBtn.classList.remove('text-red-500');
        likeBtn.querySelector('i').className = 'ri-heart-line';
        LocalDB.removeVote(postId, currentUser.id);
        LocalDB.updatePost(postId, { upvotes: newLikes });
        showToast('已取消点赞', 'info');
        
        // 后台尝试云端同步
        try {
            await supabaseClient.from('posts').update({ upvotes: newLikes }).eq('id', postId);
        } catch (e) {}
    } else {
        // 未点赞或点了踩，执行点赞
        const newLikes = currentLikes + 1;
        // 如果之前点过踩，先取消踩
        let newDislikes = currentDislikes;
        if (userVote && userVote.vote_type === 'dislike') {
            newDislikes = Math.max(0, currentDislikes - 1);
            dislikeCount.textContent = newDislikes;
            dislikeBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
            dislikeBtn.querySelector('i').className = 'ri-thumb-down-line';
            LocalDB.updatePost(postId, { downvotes: newDislikes });
        }
        
        likeCount.textContent = newLikes;
        likeBtn.classList.add('text-red-500');
        likeBtn.querySelector('i').className = 'ri-heart-fill';
        LocalDB.addVote(postId, currentUser.id, 'like');
        LocalDB.updatePost(postId, { upvotes: newLikes, downvotes: newDislikes });
        showToast('点赞成功！', 'success');
        
        // 后台尝试云端同步
        try {
            await supabaseClient.from('posts').update({ upvotes: newLikes, downvotes: newDislikes }).eq('id', postId);
        } catch (e) {}
    }
}

async function dislikePost(postId) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    const likeBtn = card.querySelector('.action-btn-like');
    const dislikeBtn = card.querySelector('.action-btn-dislike');
    const likeCount = card.querySelector('.like-count');
    const dislikeCount = card.querySelector('.dislike-count');
    const currentLikes = parseInt(likeCount.textContent);
    const currentDislikes = parseInt(dislikeCount.textContent);
    const userVote = LocalDB.getUserVote(postId, currentUser.id);
    
    // 检查当前用户是否已经点过踩
    if (userVote && userVote.vote_type === 'dislike') {
        // 已经踩过，取消踩
        const newDislikes = Math.max(0, currentDislikes - 1);
        dislikeCount.textContent = newDislikes;
        dislikeBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
        dislikeBtn.querySelector('i').className = 'ri-thumb-down-line';
        LocalDB.removeVote(postId, currentUser.id);
        LocalDB.updatePost(postId, { downvotes: newDislikes });
        showToast('已取消踩', 'info');
        
        // 后台尝试云端同步
        try {
            await supabaseClient.from('posts').update({ downvotes: newDislikes }).eq('id', postId);
        } catch (e) {}
    } else {
        // 未踩或点了赞，执行踩
        const newDislikes = currentDislikes + 1;
        // 如果之前点过赞，先取消赞
        let newLikes = currentLikes;
        if (userVote && userVote.vote_type === 'like') {
            newLikes = Math.max(0, currentLikes - 1);
            likeCount.textContent = newLikes;
            likeBtn.classList.remove('text-red-500');
            likeBtn.querySelector('i').className = 'ri-heart-line';
            LocalDB.updatePost(postId, { upvotes: newLikes });
        }
        
        dislikeCount.textContent = newDislikes;
        dislikeBtn.classList.add('text-gray-600', 'dark:text-gray-400');
        dislikeBtn.querySelector('i').className = 'ri-thumb-down-fill';
        LocalDB.addVote(postId, currentUser.id, 'dislike');
        LocalDB.updatePost(postId, { upvotes: newLikes, downvotes: newDislikes });
        
        // 如果踩数达到10，隐藏帖子
        if (newDislikes >= 10) {
            card.classList.add('post-card-hidden');
            showToast('帖子因踩数过多已被隐藏', 'info');
        } else {
            showToast('踩了一下', 'info');
        }
        
        // 后台尝试云端同步
        try {
            await supabaseClient.from('posts').update({ upvotes: newLikes, downvotes: newDislikes }).eq('id', postId);
        } catch (e) {}
    }
}

async function viewPostDetail(postId) {
    showLoading();
    
    let post = null;
    let comments = [];
    
    try {
        // 优先从云端获取帖子
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();
        
        if (!error && data) {
            post = data;
        }
    } catch (e) {
        console.warn('云端获取帖子失败');
    }
    
    // 如果云端帖子获取失败，使用本地帖子
    if (!post) {
        post = LocalDB.getPost(postId);
    }
    
    // 获取评论（无论帖子来自云端还是本地）
    try {
        const { data: cloudComments, error: commentError } = await supabaseClient
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (!commentError && cloudComments && cloudComments.length > 0) {
            comments = cloudComments;
        } else {
            // 云端评论为空或获取失败，使用本地评论
            comments = LocalDB.getComments(postId);
        }
    } catch (e) {
        // 网络错误，直接使用本地评论
        comments = LocalDB.getComments(postId);
    }
    
    // 如果评论为空，尝试本地评论
    if (comments.length === 0) {
        comments = LocalDB.getComments(postId);
    }
    
    hideLoading();
    
    if (!post) {
        showToast('帖子不存在', 'error');
        return;
    }
    
    currentPostId = postId;
    previousPage = 'home';
    App.showPage('postDetail');
    renderPostDetail(post, comments);
}

function renderPostDetail(post, comments) {
    const container = document.getElementById('postDetailContent');
    const category = CATEGORIES[post.category] || CATEGORIES.chat;
    const isLove = post.category === 'love';
    const isHidden = post.downvotes >= 10;
    const isOwner = currentUser && currentUser.id === post.user_id;
    const canAddFriend = !isOwner && currentUser && post.user_id && post.username;
    
    // 检查用户是否已点赞/踩
    const userVote = currentUser ? LocalDB.getUserVote(post.id, currentUser.id) : null;
    const hasLiked = userVote && userVote.vote_type === 'like';
    const hasDisliked = userVote && userVote.vote_type === 'dislike';
    
    if (isLove) {
        container.className = 'card-love rounded-2xl p-6 mb-6';
    } else {
        container.className = 'card rounded-2xl p-6 mb-6';
    }
    
    container.innerHTML = `
        <div class="flex items-start gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl ${getAvatarConfig(post.avatar).bg} flex items-center justify-center flex-shrink-0 text-white">
                <i class="ri-user-line text-lg"></i>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="font-medium" style="color: var(--text-primary);">
                        ${isLove ? '匿名用户' : escapeHtml(post.anonymous_name || '匿名用户')}
                    </span>
                    <span class="category-tag tag-${category.color}">
                        ${isLove ? '<i class="ri-heart-fill mr-1"></i>' : ''}
                        ${category.name}
                    </span>
                    ${canAddFriend ? '<span class="text-xs primary-text cursor-pointer hover:underline" onclick="App.showFriendRequestModal(\'' + post.user_id + '\', \'' + escapeHtml(post.anonymous_name || '匿名用户') + '\', \'' + (post.avatar || 0) + '\')">+ 添加好友</span>' : ''}
                </div>
                <p class="text-xs time-relative">${formatTimeAgo(post.created_at)}</p>
            </div>
            ${isOwner ? `
                <button onclick="App.confirmDeletePost('${post.id}')" class="action-btn action-btn-delete">
                    <i class="ri-delete-bin-line text-lg"></i>
                </button>
            ` : ''}
        </div>
        
        <h2 class="text-xl font-bold mb-3 ${isHidden ? 'blur-sm' : ''}" style="color: var(--text-primary);">${escapeHtml(post.title || '无标题')}</h2>
        <p class="leading-relaxed whitespace-pre-wrap ${isHidden ? 'blur-sm' : ''}" style="color: var(--text-secondary); word-break: break-all;">${escapeHtml(post.content)}</p>
        
        ${isHidden ? `<p class="text-center text-sm mt-4 py-2 rounded-lg" style="background: rgba(239,68,68,0.1); color: var(--warning);">
            <i class="ri-eye-off-line mr-1"></i>此帖因违规已被隐藏
        </p>` : ''}
        
        <div class="flex items-center gap-4 mt-6 pt-4" style="border-top: 1px solid var(--border-color);">
            <button onclick="App.likePostDetail('${post.id}')" class="action-btn action-btn-like ${hasLiked ? 'text-red-500' : ''}">
                <i class="${hasLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg"></i>
                <span id="detailLikeCount">${post.upvotes || 0}</span>
            </button>
            <button onclick="App.dislikePostDetail('${post.id}')" class="action-btn action-btn-dislike ${hasDisliked ? 'text-gray-600 dark:text-gray-400' : ''}">
                <i class="${hasDisliked ? 'ri-thumb-down-fill' : 'ri-thumb-down-line'} text-lg"></i>
                <span id="detailDislikeCount">${post.downvotes || 0}</span>
            </button>
            ${canAddFriend ? `
                <button onclick="App.showFriendRequestModal('${post.user_id}', '${escapeHtml(post.anonymous_name || '匿名用户')}', '${post.avatar || 0}')" class="action-btn ml-auto">
                    <i class="ri-user-add-line text-lg"></i>
                    <span>加好友</span>
                </button>
            ` : ''}
        </div>
    `;
    
    // 表白墙提示
    if (isLove) {
        document.getElementById('loveCommentTip').classList.remove('hidden');
    } else {
        document.getElementById('loveCommentTip').classList.add('hidden');
    }
    
    renderComments(comments, post.category);
}

function renderComments(comments, postCategory = 'chat') {
    const container = document.getElementById('commentList');
    const noComments = document.getElementById('noComments');
    const commentCount = document.getElementById('commentCount');
    const isLove = postCategory === 'love';
    
    commentCount.textContent = comments ? comments.length : 0;
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '';
        noComments.classList.remove('hidden');
        return;
    }
    
	    noComments.classList.add('hidden');
	    container.innerHTML = comments.map(comment => {
	        const canAdd = currentUser && currentUser.id !== comment.user_id && comment.user_id;
	        const onclick = canAdd ? `onclick="App.showFriendRequestModal('${comment.user_id}','${escapeHtml(comment.anonymous_name)}','${comment.avatar||0}')"` : '';
	        return '<div class="comment-card animate-fade-in" data-comment-id="' + comment.id + '">' +
	            '<div class="flex items-start gap-3">' +
	                '<div class="w-8 h-8 rounded-lg ' + getAvatarConfig(comment.avatar).bg + ' flex items-center justify-center flex-shrink-0 text-white' + (canAdd ? ' cursor-pointer hover:opacity-80' : '') + '" ' + onclick + '>' +
	                    '<i class="' + getAvatarConfig(comment.avatar).icon + ' text-xs"></i>' +
	                '</div>' +
	                '<div class="flex-1 min-w-0">' +
	                    '<div class="flex items-center gap-2 mb-1">' +
	                        '<span class="text-sm font-medium' + (canAdd ? ' cursor-pointer primary-text hover:underline' : '') + '" style="color: var(--text-primary);" ' + onclick + '>' +
	                            (isLove ? '匿名用户' : escapeHtml(comment.anonymous_name || '匿名用户')) +
	                        '</span>' +
	                        (canAdd ? '<span class="text-xs primary-text">+ 加好友</span>' : '') +
	                        '<span class="text-xs time-relative">' + formatTimeAgo(comment.created_at) + '</span>' +
	                    '</div>' +
	                    '<p class="text-sm leading-relaxed" style="color: var(--text-secondary); word-break: break-all;">' + escapeHtml(comment.content || '') + '</p>' +
	                '</div>' +
	                (currentUser && currentUser.id === comment.user_id ? '<button onclick="App.deleteComment(\'' + comment.id + '\')" class="action-btn action-btn-delete"><i class="ri-delete-bin-line"></i></button>' : '') +
	            '</div>' +
	        '</div>';
	    }).join('');
    document.getElementById('commentCount').textContent = comments.length;
}

async function submitComment() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    // 测试阶段不限制评论数量
    const today = getTodayDate();
    
    const content = document.getElementById('commentContent').value.trim();
    
    if (!content) {
        showToast('请输入评论内容', 'warning');
        return;
    }
    
    if (containsBlockedKeywords(content)) {
        showToast('评论包含敏感词，请修改', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitCommentBtn');
    submitBtn.disabled = true;
    
    // 获取帖子信息，判断是否是表白墙
    let isLoveComment = false;
    try {
        const post = LocalDB.getPost(currentPostId);
        if (post) {
            isLoveComment = post.category === 'love';
        }
        // 尝试从云端获取
        try {
            const { data } = await supabaseClient
                .from('posts')
                .select('category')
                .eq('id', currentPostId)
                .single();
            if (data) isLoveComment = data.category === 'love';
        } catch (e) {}
    } catch (e) {}
    
    // 构建评论数据
    const commentData = {
        id: LocalDB.uuid(),
        post_id: currentPostId,
        user_id: currentUser.id,
        username: currentUser.username,
        anonymous_name: isLoveComment ? '匿名用户' : currentUser.anonymous_name,
        content: content,
        created_at: new Date().toISOString()
    };
    
    // 尝试保存到云端
    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert(commentData);
        if (error) {
            console.warn('云端评论失败:', error);
        }
    } catch (e) {
        console.warn('云端评论失败，使用本地存储');
    }
    
    // 始终保存到本地
    LocalDB.addComment(commentData);
    
    // 获取帖子信息，发送通知给帖子作者
    try {
        const post = LocalDB.getPost(currentPostId) || await supabaseClient.from('posts').select('user_id, title').eq('id', currentPostId).single();
        const postOwnerId = post?.user_id;
        
        // 如果帖子作者不是评论者，发送通知
        if (postOwnerId && postOwnerId !== currentUser.id) {
            const notification = {
                id: LocalDB.uuid(),
                user_id: postOwnerId,
                type: 'comment',
                content: `${currentUser.anonymous_name} 评论了你的帖子 "${(post.title || '无标题').substring(0, 20)}${(post.title || '').length > 20 ? '...' : ''}"`,
                post_id: currentPostId,
                comment_id: commentData.id,
                is_read: false,
                created_at: new Date().toISOString()
            };
            
            // 保存到云端
            try {
                await supabaseClient.from('notifications').insert(notification);
            } catch (e) {
                console.warn('云端通知保存失败');
            }
            
            // 保存到本地
            LocalDB.addNotification(notification);
        }
    } catch (e) {
        console.warn('获取帖子信息失败:', e);
    }
    
    // 更新用户评论计数
    const newCommentCount = currentUser.last_comment_date === today ? currentUser.today_comment_count + 1 : 1;
    currentUser.today_comment_count = newCommentCount;
    currentUser.last_comment_date = today;
    localStorage.setItem('campus_user', JSON.stringify(currentUser));
    LocalDB.updateUser(currentUser.id, { today_comment_count: newCommentCount, last_comment_date: today });
    
    submitBtn.disabled = false;
    document.getElementById('commentContent').value = '';
    document.getElementById('commentInputCount').textContent = '0';
    
    showToast('评论成功！', 'success');
    
    // 添加评论到列表
    const noComments = document.getElementById('noComments');
    const container = document.getElementById('commentList');
    noComments.classList.add('hidden');
    
    const commentCard = document.createElement('div');
    commentCard.className = 'comment-card animate-bounce-in';
    commentCard.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg ${getAvatarConfig(currentUser.avatar).bg} flex items-center justify-center flex-shrink-0 text-white">
                <i class="ri-user-line text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium" style="color: var(--text-primary);">
                        ${isLoveComment ? '匿名用户' : escapeHtml(currentUser.anonymous_name)}
                    </span>
                    <span class="text-xs time-relative">刚刚</span>
                </div>
                <p class="text-sm leading-relaxed" style="color: var(--text-secondary); word-break: break-all;">${escapeHtml(content)}</p>
            </div>
        </div>
    `;
    container.insertBefore(commentCard, container.firstChild);
}

async function deleteComment(commentId) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    try {
        // 尝试删除云端
        try {
            await supabaseClient
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUser.id);
        } catch (e) {
            console.warn('云端删除失败，使用本地删除');
        }
        
        // 始终删除本地
        LocalDB.deleteComment(commentId);
        
        showToast('评论已删除', 'success');
        
        // 尝试动画删除评论卡片
        const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentCard) {
            commentCard.style.transform = 'translateX(100%)';
            commentCard.style.opacity = '0';
            setTimeout(() => commentCard.remove(), 300);
            // 更新评论数
            const countEl = document.getElementById('commentCount');
            if (countEl) {
                countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
            }
        }
        
        // 如果在帖子详情页，刷新评论列表
        if (currentPostId) {
            const comments = LocalDB.getComments(currentPostId);
            renderComments(comments, document.querySelector('#postDetailPage .category-tag')?.textContent?.includes('表白') ? 'love' : 'chat');
        }
        
    } catch (err) {
        console.error('删除评论失败:', err);
        showToast('删除失败，请重试', 'error');
    }
}

// ==================== 个人中心 ====================
// 更新未读通知红点
async function updateUnreadBadge() {
    if (!currentUser) {
        document.getElementById('navUnreadBadge')?.classList.add('hidden');
        document.getElementById('unreadBadge')?.classList.add('hidden');
        return;
    }
    
    try {
        const { data: notifications } = await supabaseClient
            .from('notifications')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('is_read', false);
        
        const unreadCount = notifications?.length || 0;
        
        // 更新导航栏红点
        const navBadge = document.getElementById('navUnreadBadge');
        if (navBadge) {
            if (unreadCount > 0) {
                navBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                navBadge.classList.remove('hidden');
            } else {
                navBadge.classList.add('hidden');
            }
        }
        
        // 更新个人中心红点
        const profileBadge = document.getElementById('unreadBadge');
        if (profileBadge) {
            if (unreadCount > 0) {
                profileBadge.textContent = unreadCount;
                profileBadge.classList.remove('hidden');
            } else {
                profileBadge.classList.add('hidden');
            }
        }
    } catch (err) {
        console.warn('检查未读通知失败:', err);
    }
}

async function loadMyPosts() {
    if (!currentUser) return;
    
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        document.getElementById('profileTodayPosts').textContent = currentUser.today_post_count || 0;
        document.getElementById('profileTodayComments').textContent = currentUser.today_comment_count || 0;
        
        const container = document.getElementById('myPostList');
        const noPosts = document.getElementById('noMyPosts');
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '';
            noPosts.classList.remove('hidden');
            return;
        }
        
        noPosts.classList.add('hidden');
        container.innerHTML = posts.map(post => {
            const category = CATEGORIES[post.category] || CATEGORIES.chat;
            const isHidden = post.downvotes >= 10;
            
            return `
                <div class="p-4 rounded-xl border transition-all hover:border-primary/50" style="background: var(--bg-secondary); border-color: var(--border-color);">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="category-tag tag-${category.color}">${category.name}</span>
                        <span class="text-xs time-relative">${formatTimeAgo(post.created_at)}</span>
                        ${isHidden ? '<span class="text-xs" style="color: var(--warning);">已隐藏</span>' : ''}
                    </div>
                    <h4 class="font-medium mb-1 ${isHidden ? 'blur-sm' : ''}" style="color: var(--text-primary);">${escapeHtml(post.title || '无标题')}</h4>
                    <p class="text-sm line-clamp-2 mb-2 ${isHidden ? 'blur-sm' : ''}" style="color: var(--text-secondary);">${escapeHtml(post.content)}</p>
                    <div class="flex items-center gap-2">
                        <button onclick="App.viewPostDetail('${post.id}')" class="text-xs primary-text hover:underline">查看</button>
                        <button onclick="App.confirmDeletePost('${post.id}')" class="text-xs" style="color: var(--warning);">删除</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('加载我的帖子失败:', err);
    }
}

async function loadMyComments() {
    if (!currentUser) return;
    
    try {
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select('*, posts(title, category)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('myCommentList');
        const noComments = document.getElementById('noMyComments');
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '';
            noComments.classList.remove('hidden');
            return;
        }
        
        noComments.classList.add('hidden');
        container.innerHTML = comments.map(comment => {
            const category = CATEGORIES[comment.posts?.category] || CATEGORIES.chat;
            
            return `
                <div class="p-4 rounded-xl border" style="background: var(--bg-secondary); border-color: var(--border-color);">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="category-tag tag-${category.color} text-xs">${category.name}</span>
                        <span class="text-xs time-relative">${formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p class="text-sm mb-2" style="color: var(--text-primary);">${escapeHtml(comment.content)}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs" style="color: var(--text-secondary);">
                            回复: ${escapeHtml(comment.posts?.title || '无标题帖子')}
                        </span>
                        <button onclick="deleteMyComment('${comment.id}')" class="text-xs" style="color: var(--warning);">删除</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('加载我的评论失败:', err);
    }
}

// 删除我的评论（从我的评论页面）
async function deleteMyComment(commentId) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    try {
        // 删除云端
        try {
            await supabaseClient
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUser.id);
        } catch (e) {
            console.warn('云端删除失败');
        }
        
        // 删除本地
        LocalDB.deleteComment(commentId);
        
        showToast('评论已删除', 'success');
        loadMyComments(); // 刷新评论列表
        loadMyPosts(); // 刷新我的发布（评论数可能变化）
        
    } catch (err) {
        console.error('删除评论失败:', err);
        showToast('删除失败', 'error');
    }
}

async function loadMyFavorites() {
    if (!currentUser) return;
    
    try {
        const { data: favorites, error } = await supabaseClient
            .from('favorites')
            .select('*, posts(*)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('myFavoriteList');
        const noFavorites = document.getElementById('noMyFavorites');
        
        if (!favorites || favorites.length === 0) {
            container.innerHTML = '';
            noFavorites.classList.remove('hidden');
            return;
        }
        
        noFavorites.classList.add('hidden');
        container.innerHTML = favorites.map(fav => {
            const post = fav.posts;
            if (!post) return '';
            const category = CATEGORIES[post.category] || CATEGORIES.chat;
            
            return `
                <div class="p-4 rounded-xl border transition-all hover:border-primary/50" style="background: var(--bg-secondary); border-color: var(--border-color);">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="category-tag tag-${category.color} text-xs">${category.name}</span>
                        <span class="text-xs time-relative">${formatTimeAgo(post.created_at)}</span>
                    </div>
                    <h4 class="font-medium mb-1" style="color: var(--text-primary);">${escapeHtml(post.title || '无标题')}</h4>
                    <div class="flex items-center justify-between">
                        <button onclick="App.viewPostDetail('${post.id}')" class="text-xs primary-text hover:underline">查看详情</button>
                        <button onclick="App.removeFavorite('${fav.id}')" class="text-xs" style="color: var(--warning);">取消收藏</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('加载我的收藏失败:', err);
    }
}

async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const container = document.getElementById('notificationList');
        const noNotifs = document.getElementById('noNotifications');
        const unreadBadge = document.getElementById('unreadBadge');
        
        const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
        if (unreadCount > 0) {
            unreadBadge.textContent = unreadCount;
            unreadBadge.classList.remove('hidden');
        } else {
            unreadBadge.classList.add('hidden');
        }
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = '';
            noNotifs.classList.remove('hidden');
            return;
        }
        
        noNotifs.classList.add('hidden');
        container.innerHTML = notifications.map(notif => `
            <div class="p-3 rounded-xl flex items-start gap-3 ${notif.is_read ? '' : 'unread-notification'}" 
                 style="background: ${notif.is_read ? 'var(--bg-secondary)' : 'rgba(66, 185, 131, 0.1)'}; border: 1px solid var(--border-color);">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${notif.type === 'like' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}">
                    <i class="${notif.type === 'like' ? 'ri-heart-fill' : 'ri-chat-3-fill'}"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm" style="color: var(--text-primary);">${escapeHtml(notif.content)}</p>
                    <p class="text-xs time-relative mt-1">${formatTimeAgo(notif.created_at)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (err) {
        console.error('加载通知失败:', err);
    }
}

async function markAllRead() {
    if (!currentUser) return;
    
    try {
        await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);
        
        document.getElementById('unreadBadge').classList.add('hidden');
        loadNotifications();
        showToast('已标记全部已读', 'success');
        
    } catch (err) {
        console.error('标记已读失败:', err);
    }
}

// ==================== 弹窗功能 ====================
let pendingConfirmAction = null;

function showConfirmModal(title, message, action) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    pendingConfirmAction = action;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    pendingConfirmAction = null;
}

function confirmAction() {
    if (pendingConfirmAction) {
        pendingConfirmAction();
    }
    closeConfirmModal();
}

let reportPostId = null;

function showReportModal(postId) {
    reportPostId = postId;
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
    reportPostId = null;
    document.getElementById('reportDetail').value = '';
    document.querySelectorAll('input[name="reportReason"]').forEach(r => r.checked = false);
}

async function submitReport() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    const reason = document.querySelector('input[name="reportReason"]:checked')?.value;
    const detail = document.getElementById('reportDetail').value.trim();
    
    if (!reason) {
        showToast('请选择举报原因', 'warning');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('reports')
            .insert({
                post_id: reportPostId,
                user_id: currentUser.id,
                reason: reason,
                detail: detail,
                status: 'pending',
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        closeReportModal();
        showToast('举报已提交，系统将自动处理', 'success');
        
    } catch (err) {
        console.error('举报失败:', err);
        showToast('举报失败，请重试', 'error');
    }
}

function showNetworkError(retryFn) {
    retryAction = retryFn;
    document.getElementById('networkErrorModal').classList.remove('hidden');
}

function closeNetworkError() {
    document.getElementById('networkErrorModal').classList.add('hidden');
}

function retryActionHandler() {
    closeNetworkError();
    if (retryAction) {
        retryAction();
    }
}

function showEditNameModal() {
    document.getElementById('newNickname').value = currentUser?.anonymous_name || '';
    document.getElementById('editNameModal').classList.remove('hidden');
}

function closeEditNameModal() {
    document.getElementById('editNameModal').classList.add('hidden');
}

async function saveNickname() {
    const newName = document.getElementById('newNickname').value.trim();
    
    if (!newName || newName.length < 2 || newName.length > 20) {
        showToast('昵称需2-20个字符', 'warning');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ anonymous_name: newName })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        currentUser.anonymous_name = newName;
        localStorage.setItem('campus_user', JSON.stringify(currentUser));
        
        closeEditNameModal();
        App.updateUIForLoggedInUser();
        showToast('昵称修改成功', 'success');
        
    } catch (err) {
        console.error('修改昵称失败:', err);
        showToast('修改失败，请重试', 'error');
    }
}




function showPrivacyModal() {
    document.getElementById('privacyModal').classList.remove('hidden');
}

function closePrivacyModal() {
    document.getElementById('privacyModal').classList.add('hidden');
}

// ==================== 收藏功能 ====================
async function toggleFavorite(postId) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    try {
        const { data: existing } = await supabaseClient
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('post_id', postId)
            .single();
        
        if (existing) {
            await supabaseClient.from('favorites').delete().eq('id', existing.id);
            showToast('已取消收藏', 'info');
        } else {
            await supabaseClient.from('favorites').insert({
                user_id: currentUser.id,
                post_id: postId,
                created_at: new Date().toISOString()
            });
            showToast('已添加收藏', 'success');
        }
        
    } catch (err) {
        console.error('收藏操作失败:', err);
    }
}

async function removeFavorite(favoriteId) {
    try {
        await supabaseClient.from('favorites').delete().eq('id', favoriteId);
        showToast('已取消收藏', 'info');
        loadMyFavorites();
        
    } catch (err) {
        console.error('取消收藏失败:', err);
    }
}

// ==================== 应用主类 ====================
const App = {
    async init() {
        initTheme();
        
        const connected = await initSupabase();
        if (!connected) {
            showToast('数据库连接失败，请刷新重试', 'error');
        }
        
        // 初始化时同步本地数据与云端
        this.syncLocalData();
        
        const isLoggedIn = await checkAuthStatus();
        
        if (isLoggedIn) {
            this.updateUIForLoggedInUser();
            this.goHome();
        } else {
            this.updateUIForLoggedOutUser();
            this.showPage('auth');
        }
        
        this.bindGlobalEvents();
        this.bindInputCounters();
        
        window.matchMedia('(prefers-color-scheme: dark').addEventListener('change', () => {
            if (currentTheme === 'system') {
                applyTheme('system');
            }
        });
    },
    
    bindGlobalEvents() {
        document.addEventListener('click', (e) => {
            // 关闭主题菜单
            if (!e.target.closest('#themeDropdown') && !e.target.closest('[onclick*="toggleThemeMenu"]')) {
                document.getElementById('themeDropdown').classList.add('hidden');
            }
        });
    },
    
    bindInputCounters() {
        const titleInput = document.getElementById('postTitle');
        const titleCount = document.getElementById('titleCount');
        titleInput?.addEventListener('input', () => {
            titleCount.textContent = titleInput.value.length;
        });
        
        const contentInput = document.getElementById('postContent');
        const contentCount = document.getElementById('contentCount');
        contentInput?.addEventListener('input', () => {
            contentCount.textContent = contentInput.value.length;
        });
        
        const commentInput = document.getElementById('commentContent');
        const commentCount = document.getElementById('commentInputCount');
        commentInput?.addEventListener('input', () => {
            commentCount.textContent = commentInput.value.length;
        });
        
        const feedbackInput = document.getElementById('feedbackContent');
        const feedbackCount = document.getElementById('feedbackCount');
        feedbackInput?.addEventListener('input', () => {
            feedbackCount.textContent = feedbackInput.value.length;
        });
    },
    
    submitFeedback() {
        const type = document.getElementById('feedbackType').value;
        const content = document.getElementById('feedbackContent').value.trim();
        const contact = document.getElementById('feedbackContact').value.trim();
        
        if (!content) {
            showToast('请输入问题描述', 'warning');
            return;
        }
        
        const feedback = {
            id: LocalDB.uuid(),
            type,
            content,
            contact,
            user_id: currentUser?.id || 'guest',
            user_name: currentUser?.anonymous_name || '游客',
            created_at: new Date().toISOString()
        };
        
        // 保存到本地
        const feedbacks = JSON.parse(localStorage.getItem('campus_feedbacks') || '[]');
        feedbacks.unshift(feedback);
        localStorage.setItem('campus_feedbacks', JSON.stringify(feedbacks));
        
        // 如果已登录，也保存到云端
        if (currentUser) {
            supabaseClient.from('feedbacks').insert({
                id: feedback.id,
                type: feedback.type,
                content: feedback.content,
                contact: feedback.contact,
                user_id: feedback.user_id,
                user_name: feedback.user_name,
                created_at: feedback.created_at
            }).then(({ error }) => {
                if (error) console.warn('云端反馈保存失败:', error);
            });
        }
        
        showToast('感谢您的反馈！', 'success');
        document.getElementById('feedbackContent').value = '';
        document.getElementById('feedbackContact').value = '';
        document.getElementById('feedbackCount').textContent = '0';
    },
    
    switchAuthTab(tab) {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    },
    
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('hidden');
    },
    
    toggleThemeMenu() {
        const dropdown = document.getElementById('themeDropdown');
        dropdown.classList.toggle('hidden');
    },
    
    setTheme(theme) {
        setTheme(theme);
    },
    
    updateUIForLoggedInUser() {
        if (currentUser) {
            // 显示导航栏功能按钮
            const navActions = document.getElementById('navActions');
            if (navActions) {
                navActions.querySelectorAll('button').forEach(btn => btn.classList.remove('hidden'));
            }
            
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                profileAvatar.className = `w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white ${getAvatarConfig(currentUser.avatar).bg}`;
                profileAvatar.innerHTML = `<i class="${getAvatarConfig(currentUser.avatar).icon}"></i>`;
            }
            
            // 更新未读通知红点
            updateUnreadBadge();
        }
    },
    
    updateUIForLoggedOutUser() {
        // 隐藏导航栏功能按钮
        const navActions = document.getElementById('navActions');
        if (navActions) {
            navActions.querySelectorAll('button').forEach(btn => btn.classList.add('hidden'));
        }
    },
    
    showPage(page) {
        // 离开详情页时重置 currentPostId
        if (currentPage === 'postDetail' && page !== 'postDetail') {
            currentPostId = null;
        }
        
        ['authPage', 'homePage', 'createPostPage', 'postDetailPage', 'profilePage', 'settingsPage', 'rulesPage', 'feedbackPage', 'friendsPage', 'chatPage'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
        
        switch (page) {
            case 'auth':
                document.getElementById('authPage').classList.remove('hidden');
                // 重置规则同意状态
                document.getElementById('rulesAgreed').checked = false;
                break;
            case 'home':
                document.getElementById('homePage').classList.remove('hidden');
                this.checkPostLimit();
                break;
            case 'createPost':
                if (!currentUser) {
                    this.showPage('auth');
                    showToast('请先登录', 'warning');
                    return;
                }
                document.getElementById('createPostPage').classList.remove('hidden');
                if (selectedPostCategory === 'love') {
                    document.getElementById('postTitle').placeholder = '匿名表白';
                    document.getElementById('postTitle').value = '';
                }
                break;
            case 'postDetail':
                document.getElementById('postDetailPage').classList.remove('hidden');
                break;
            case 'profile':
                if (!currentUser) {
                    this.showPage('auth');
                    showToast('请先登录', 'warning');
                    return;
                }
                document.getElementById('profilePage').classList.remove('hidden');
                this.updateProfileInfo();
                this.showProfileTab('posts');
                break;
            case 'settings':
                document.getElementById('settingsPage').classList.remove('hidden');
                break;
            case 'rules':
                document.getElementById('rulesPage').classList.remove('hidden');
                break;
            case 'feedback':
                document.getElementById('feedbackPage').classList.remove('hidden');
                document.getElementById('feedbackContent').value = '';
                document.getElementById('feedbackContact').value = '';
                document.getElementById('feedbackCount').textContent = '0';
                break;
            case 'friends':
                this.showFriendsPage();
                break;
        }
        
        previousPage = currentPage;
        currentPage = page;
        window.scrollTo(0, 0);
    },
    
    goBack() {
        if (previousPage === 'postDetail') {
            this.goHome();
        } else {
            this.showPage(previousPage || 'home');
        }
    },
    
    goHome() {
        this.showPage('home');
        loadPosts(true);
        if (currentUser) {
            updateUnreadBadge();
        }
    },
    
    filterByCategory(category) {
        currentCategory = category;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        if (category === 'love') {
            document.documentElement.setAttribute('data-category-theme', 'love');
        } else {
            document.documentElement.removeAttribute('data-category-theme');
        }
        
        loadPosts(true);
    },
    
    setSort(sort) {
        currentSort = sort;
        
        document.getElementById('sortLatest').classList.toggle('active', sort === 'latest');
        document.getElementById('sortHottest').classList.toggle('active', sort === 'hottest');
        
        loadPosts(true);
    },
    
    selectCategory(category) {
        selectedPostCategory = category;
        
        document.querySelectorAll('.post-category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        const titleInput = document.getElementById('postTitle');
        if (category === 'love') {
            titleInput.placeholder = '匿名表白';
        } else {
            titleInput.placeholder = '给帖子起个标题吧~';
        }
    },
    
    checkPostLimit() {
        // 测试阶段不限制发帖数量
    },
    
    loadMorePosts() {
        loadPosts(false);
    },
    
    updateProfileInfo() {
        if (!currentUser) return;
        
        document.getElementById('profileUsername').textContent = currentUser.anonymous_name || currentUser.username;
        document.getElementById('profileTodayPosts').textContent = currentUser.today_post_count || 0;
        document.getElementById('profileTodayComments').textContent = currentUser.today_comment_count || 0;
        
        const statusEl = document.getElementById('profileStatus');
        statusEl.textContent = '状态正常，可正常发言';
        statusEl.className = 'text-sm success-text';
        statusEl.style.color = 'var(--success)';
    },
    
    showProfileTab(tab) {
        ['myPostsTab', 'myCommentsTab', 'myFavoritesTab', 'notificationsTab'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        
        document.querySelectorAll('.profile-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`.profile-tab[data-tab="${tab}"]`)?.classList.add('active');
        
        switch (tab) {
            case 'posts':
                document.getElementById('myPostsTab').classList.remove('hidden');
                loadMyPosts();
                break;
            case 'comments':
                document.getElementById('myCommentsTab').classList.remove('hidden');
                loadMyComments();
                break;
            case 'favorites':
                document.getElementById('myFavoritesTab').classList.remove('hidden');
                loadMyFavorites();
                break;
            case 'notifications':
                document.getElementById('notificationsTab').classList.remove('hidden');
                loadNotifications();
                break;
        }
    },
    
    // 公开方法
    login() { login(); },
    register() { register(); },
    logout() { logout(); },
    viewPostDetail(postId) { window.viewPostDetail(postId); },
    likePost(postId) { window.likePost(postId); },
    dislikePost(postId) { window.dislikePost(postId); },
    deletePost(postId) { window.deletePost(postId); },
    confirmDeletePost(postId) {
        showConfirmModal('删除帖子', '确定要删除这条帖子吗？', () => window.deletePost(postId));
    },
    createPost() { createPost(); },
    submitComment() { submitComment(); },
    deleteComment(commentId) { window.deleteComment(commentId); },
    showReportModal(postId) { window.showReportModal(postId); },
    submitReport() { submitReport(); },
    closeReportModal() { closeReportModal(); },
    markAllRead() { markAllRead(); },
    removeFavorite(favoriteId) { window.removeFavorite(favoriteId); },
    toggleFavorite(postId) { toggleFavorite(postId); },
    showEditNameModal() { showEditNameModal(); },
    closeEditNameModal() { closeEditNameModal(); },
    saveNickname() { saveNickname(); },
    showPrivacyModal() { showPrivacyModal(); },
    closePrivacyModal() { closePrivacyModal(); },
    closeNetworkError() { closeNetworkError(); },
    retryAction() { retryActionHandler(); },
    closeConfirmModal() { closeConfirmModal(); },
    confirmAction() { confirmAction(); },
    showRulesAgreement() { 
        document.getElementById('rulesAgreementModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },
    closeRulesAgreement() { 
        document.getElementById('rulesAgreementModal').classList.add('hidden');
        document.body.style.overflow = '';
    },
    showNewFeaturesModal() {
        document.getElementById('newFeaturesModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },
    closeNewFeaturesModal() {
        document.getElementById('newFeaturesModal').classList.add('hidden');
        document.body.style.overflow = '';
    },
    showSettings() {
        document.getElementById('settingsPage').classList.remove('hidden');
        
        if (currentUser) {
            document.getElementById('settingsUsername').value = currentUser.username || '';
            document.getElementById('settingsAnonymousName').textContent = currentUser.anonymous_name || '-';
            document.getElementById('settingsCreatedAt').textContent = currentUser.created_at ? formatTimeAgo(currentUser.created_at) : '-';
            document.getElementById('settingsStatus').textContent = '正常';
            document.getElementById('settingsStatus').className = 'success-text';
        }
    },
    closeSettings() {
        document.getElementById('settingsPage').classList.add('hidden');
    },
    async saveUsername() {
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }
        
        const newUsername = document.getElementById('settingsUsername').value.trim();
        
        if (!newUsername) {
            showToast('请输入用户名', 'warning');
            return;
        }
        
        if (newUsername.length < 3 || newUsername.length > 20) {
            showToast('用户名需3-20位', 'warning');
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
            showToast('用户名只能包含字母、数字、下划线', 'warning');
            return;
        }
        
        // 更新本地数据
        currentUser.username = newUsername;
        localStorage.setItem('campus_user', JSON.stringify(currentUser));
        
        // 更新云端
        try {
            await LocalDB.updateUserProfile(currentUser.id, { username: newUsername });
            showToast('用户名修改成功', 'success');
            App.closeSettings();
        } catch (error) {
            showToast('修改失败，请重试', 'error');
        }
    },
    confirmRulesAgreement() { 
        const modalCheckbox = document.getElementById('rulesAgreedModal');
        if (!modalCheckbox.checked) {
            showToast('请先勾选"我已阅读并完全理解"', 'warning');
            return;
        }
        document.getElementById('rulesAgreed').checked = true;
        this.closeRulesAgreement();
    },
    
    showFriendsPage() {
        document.getElementById('friendsPage').classList.remove('hidden');
        
        const loginTip = document.getElementById('friendsLoginTip');
        const tabs = document.getElementById('friendsTabs');
        
        if (!currentUser) {
            loginTip.classList.remove('hidden');
            tabs.classList.add('hidden');
            document.getElementById('friendsRequestsContainer').classList.add('hidden');
            document.getElementById('friendsListContainer').classList.add('hidden');
            document.getElementById('friendsRequestsEmpty').classList.add('hidden');
            document.getElementById('friendsEmpty').classList.add('hidden');
            return;
        }
        
        loginTip.classList.add('hidden');
        tabs.classList.remove('hidden');
        
        // 默认显示申请列表
        this.switchFriendsTab('requests');
    },
    
    switchFriendsTab(tab) {
        const tabRequests = document.getElementById('friendsTabRequests');
        const tabList = document.getElementById('friendsTabList');
        const requestsContainer = document.getElementById('friendsRequestsContainer');
        const listContainer = document.getElementById('friendsListContainer');
        const requestsEmpty = document.getElementById('friendsRequestsEmpty');
        const listEmpty = document.getElementById('friendsEmpty');
        
        if (tab === 'requests') {
            tabRequests.className = 'px-4 py-2 rounded-full text-sm font-medium primary-btn';
            tabList.className = 'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap';
            
            requestsContainer.classList.remove('hidden');
            listContainer.classList.add('hidden');
            listEmpty.classList.add('hidden');
            
            // 加载申请列表（云端）
            this.loadFriendRequests();
        } else {
            tabList.className = 'px-4 py-2 rounded-full text-sm font-medium primary-btn';
            tabRequests.className = 'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap';
            
            listContainer.classList.remove('hidden');
            requestsContainer.classList.add('hidden');
            requestsEmpty.classList.add('hidden');
            
            // 加载好友列表（云端）
            this.loadFriendsList();
        }
    },
    
    async loadFriendRequests() {
        const requestsContainer = document.getElementById('friendsRequestsContainer');
        const requestsEmpty = document.getElementById('friendsRequestsEmpty');
        
        try {
            const requests = await LocalDB.getFriendRequests(currentUser.id);
            if (!requests || requests.length === 0) {
                requestsEmpty.classList.remove('hidden');
                requestsContainer.classList.add('hidden');
            } else {
                requestsEmpty.classList.add('hidden');
                requestsContainer.classList.remove('hidden');
                this.renderFriendRequests(requests);
            }
        } catch (e) {
            requestsEmpty.classList.remove('hidden');
            requestsContainer.classList.add('hidden');
        }
    },
    
    async loadFriendsList() {
        const listContainer = document.getElementById('friendsListContainer');
        const listEmpty = document.getElementById('friendsEmpty');
        
        try {
            const friends = await LocalDB.getFriends(currentUser.id);
            if (!friends || friends.length === 0) {
                listEmpty.classList.remove('hidden');
                listContainer.classList.add('hidden');
            } else {
                listEmpty.classList.add('hidden');
                listContainer.classList.remove('hidden');
                this.renderFriendsList(friends);
            }
        } catch (e) {
            listEmpty.classList.remove('hidden');
            listContainer.classList.add('hidden');
        }
    },
    
    renderFriendRequests(requests) {
        const container = document.getElementById('friendsRequestsContainer');
        container.innerHTML = '';
        
        requests.forEach(request => {
            const card = document.createElement('div');
            card.className = 'card rounded-2xl p-4';
            card.innerHTML = `
                <div class="flex items-start gap-3 mb-3">
                    <div class="w-12 h-12 rounded-xl ${getAvatarConfig(request.from_user_avatar).bg} flex items-center justify-center flex-shrink-0 text-white">
                        <i class="${getAvatarConfig(request.from_user_avatar).icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium form-label">${escapeHtml(request.from_user_name)}</h4>
                        <p class="text-xs form-hint">${formatTimeAgo(request.created_at)}</p>
                        ${request.message ? `<p class="text-sm mt-1" style="color: var(--text-secondary);">${escapeHtml(request.message)}</p>` : ''}
                    </div>
                </div>
                <div class="flex gap-3">
                    <button onclick="App.rejectFriendRequest('${request.id}')" class="flex-1 py-2 rounded-xl border transition-all form-label">
                        拒绝
                    </button>
                    <button onclick="App.acceptFriendRequest('${request.id}')" class="flex-1 py-2 primary-btn rounded-xl font-medium transition-all">
                        接受
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    },
    
    renderFriendsList(friends) {
        const container = document.getElementById('friendsListContainer');
        container.innerHTML = '';
        
        friends.forEach(friend => {
            const card = document.createElement('div');
            card.className = 'card rounded-2xl p-4 flex items-center gap-3';
            card.innerHTML = `
                <div class="w-12 h-12 rounded-xl ${getAvatarConfig(friend.friend_avatar).bg} flex items-center justify-center flex-shrink-0 text-white">
                    <i class="${getAvatarConfig(friend.friend_avatar).icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium form-label truncate">${escapeHtml(friend.friend_name)}</h4>
                    <p class="text-xs form-hint">ID: ${friend.friend_id.slice(0, 8)}...</p>
                </div>
                <button onclick="App.showChat('${friend.friend_id}', '${escapeHtml(friend.friend_name)}', '${friend.friend_avatar}')" class="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all" title="聊天">
                    <i class="ri-message-3-line"></i>
                </button>
                <button onclick="App.removeFriend('${friend.friend_id}')" class="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all" title="删除好友">
                    <i class="ri-user-unfollow-line"></i>
                </button>
            `;
            container.appendChild(card);
        });
    },
    
    async removeFriend(friendId) {
        if (confirm('确定要删除该好友吗？')) {
            await LocalDB.removeFriend(currentUser.id, friendId);
            showToast('已删除好友', 'success');
            this.loadFriendsList();
        }
    },
    
    showFriendRequestModal(userId, userName, userAvatar) {
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }
        
        if (userId === currentUser.id) {
            showToast('不能添加自己为好友', 'warning');
            return;
        }
        
        // 保存目标用户信息
        this._friendRequestTarget = { id: userId, name: userName, avatar: userAvatar };
        
        // 显示模态框
        const modal = document.getElementById('friendRequestModal');
        const targetDiv = document.getElementById('friendRequestTarget');
        const messageInput = document.getElementById('friendRequestMessage');
        const countSpan = document.getElementById('friendRequestCount');
        
        targetDiv.innerHTML = `
            <div class="w-12 h-12 rounded-xl ${getAvatarConfig(userAvatar).bg} flex items-center justify-center flex-shrink-0 text-white">
                <i class="${getAvatarConfig(userAvatar).icon}"></i>
            </div>
            <div>
                <h4 class="font-medium form-label">${escapeHtml(userName)}</h4>
                <p class="text-xs form-hint">是否添加为好友</p>
            </div>
        `;
        
        messageInput.value = '';
        countSpan.textContent = '0';
        
        modal.classList.remove('hidden');
        messageInput.focus();
    },

    closeFriendRequestModal() {
        document.getElementById('friendRequestModal').classList.add('hidden');
        this._friendRequestTarget = null;
    },
    
    async sendFriendRequest() {
        if (!currentUser || !this._friendRequestTarget) {
            showToast('发送失败', 'error');
            return;
        }
        
        const message = document.getElementById('friendRequestMessage').value.trim();
        const result = await LocalDB.sendFriendRequest(
            currentUser,
            this._friendRequestTarget.id,
            this._friendRequestTarget.name,
            this._friendRequestTarget.avatar,
            message
        );
        
        if (result.success) {
            showToast('好友申请已发送', 'success');
            this.closeFriendRequestModal();
        } else {
            showToast(result.message, 'warning');
        }
    },
    
    async acceptFriendRequest(requestId) {
        if (!currentUser) return;
        
        const result = await LocalDB.acceptFriendRequest(requestId, currentUser.id, currentUser);
        if (result.success) {
            showToast('已添加好友，可以开始聊天了', 'success');
            this.loadFriendRequests();
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    },
    
    async rejectFriendRequest(requestId) {
        if (!currentUser) return;
        
        await LocalDB.rejectFriendRequest(requestId, currentUser.id);
        showToast('已拒绝申请', 'info');
        this.loadFriendRequests();
    },

    showChat(friendId, friendName, friendAvatar) {
        this._currentChatFriend = { id: friendId, name: friendName, avatar: friendAvatar };
        document.getElementById('chatPage').classList.remove('hidden');
        document.getElementById('chatFriendName').textContent = friendName;
        document.getElementById('chatFriendAvatar').className = `w-10 h-10 rounded-xl ${getAvatarConfig(friendAvatar).bg} flex items-center justify-center flex-shrink-0 text-white`;
        document.getElementById('chatFriendAvatar').innerHTML = `<i class="${getAvatarConfig(friendAvatar).icon}"></i>`;
        this.loadChatMessages();
        
        // 设置定时器，每2秒自动刷新消息
        this._chatRefreshInterval = setInterval(() => {
            this.loadChatMessages();
        }, 2000);
    },

    closeChat() {
        document.getElementById('chatPage').classList.add('hidden');
        this._currentChatFriend = null;
        // 清除定时器
        if (this._chatRefreshInterval) {
            clearInterval(this._chatRefreshInterval);
            this._chatRefreshInterval = null;
        }
    },

    async loadChatMessages() {
        if (!currentUser || !this._currentChatFriend) return;
        
        const messages = await LocalDB.getMessages(currentUser.id, this._currentChatFriend.id);
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-sm form-hint">
                    还没有消息，快打个招呼吧~
                </div>
            `;
            return;
        }
        
        messages.forEach(msg => {
            const isMe = msg.from_id === currentUser.id;
            const div = document.createElement('div');
            div.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`;
            div.innerHTML = `
                ${isMe ? '' : `
                    <div class="w-8 h-8 rounded-lg ${getAvatarConfig(msg.from_avatar || 0).bg} flex items-center justify-center flex-shrink-0 text-white mr-2">
                        <i class="${getAvatarConfig(msg.from_avatar || 0).icon} text-sm"></i>
                    </div>
                `}
                <div class="max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? 'rounded-br-md chat-my-msg' : 'rounded-bl-md'}" ${isMe ? '' : `style="background: var(--bg-secondary); color: var(--text-primary);"`}>
                    <p class="break-all" style="color: ${isMe ? 'var(--on-primary)' : 'inherit'};">${escapeHtml(msg.content)}</p>
                    <p class="text-xs ${isMe ? '' : 'form-hint'} mt-1" style="color: ${isMe ? 'var(--on-primary)' : 'inherit'}; opacity: 0.7;">${formatTimeAgo(msg.created_at)}</p>
                </div>
                ${isMe ? `
                    <div class="w-8 h-8 rounded-lg ${getAvatarConfig(currentUser.avatar).bg} flex items-center justify-center flex-shrink-0 text-white ml-2">
                        <i class="${getAvatarConfig(currentUser.avatar).icon} text-sm"></i>
                    </div>
                ` : ''}
            `;
            container.appendChild(div);
        });
        
        container.scrollTop = container.scrollHeight;
    },

    async sendChatMessage() {
        if (!currentUser || !this._currentChatFriend) return;
        
        const input = document.getElementById('chatInput');
        const content = input.value.trim();
        if (!content) return;
        
        await LocalDB.sendMessage(
            currentUser,
            this._currentChatFriend.id,
            this._currentChatFriend.name,
            this._currentChatFriend.avatar,
            content
        );
        input.value = '';
        this.loadChatMessages();
    },
    
    async likePostDetail(postId) {
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }
        
        const likeBtn = document.querySelector('#postDetailContent .action-btn-like');
        const dislikeBtn = document.querySelector('#postDetailContent .action-btn-dislike');
        const likeCountEl = document.getElementById('detailLikeCount');
        const dislikeCountEl = document.getElementById('detailDislikeCount');
        const currentLikes = parseInt(likeCountEl.textContent);
        const currentDislikes = parseInt(dislikeCountEl.textContent);
        const userVote = LocalDB.getUserVote(postId, currentUser.id);
        
        // 检查当前用户是否已经点过赞
        if (userVote && userVote.vote_type === 'like') {
            // 已经点赞过，取消点赞
            const newLikes = Math.max(0, currentLikes - 1);
            likeCountEl.textContent = newLikes;
            likeBtn.classList.remove('text-red-500');
            likeBtn.querySelector('i').className = 'ri-heart-line text-lg';
            LocalDB.removeVote(postId, currentUser.id);
            LocalDB.updatePost(postId, { upvotes: newLikes });
            showToast('已取消点赞', 'info');
            
            try {
                await supabaseClient.from('posts').update({ upvotes: newLikes }).eq('id', postId);
            } catch (e) {}
        } else {
            // 未点赞或点了踩，执行点赞
            const newLikes = currentLikes + 1;
            let newDislikes = currentDislikes;
            
            // 如果之前点过踩，先取消踩
            if (userVote && userVote.vote_type === 'dislike') {
                newDislikes = Math.max(0, currentDislikes - 1);
                dislikeCountEl.textContent = newDislikes;
                dislikeBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
                dislikeBtn.querySelector('i').className = 'ri-thumb-down-line text-lg';
                LocalDB.updatePost(postId, { downvotes: newDislikes });
            }
            
            likeCountEl.textContent = newLikes;
            likeBtn.classList.add('text-red-500');
            likeBtn.querySelector('i').className = 'ri-heart-fill text-lg';
            LocalDB.addVote(postId, currentUser.id, 'like');
            LocalDB.updatePost(postId, { upvotes: newLikes, downvotes: newDislikes });
            showToast('点赞成功！', 'success');
            
            try {
                await supabaseClient.from('posts').update({ upvotes: newLikes, downvotes: newDislikes }).eq('id', postId);
            } catch (e) {}
        }
    },
    
    async dislikePostDetail(postId) {
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }
        
        const likeBtn = document.querySelector('#postDetailContent .action-btn-like');
        const dislikeBtn = document.querySelector('#postDetailContent .action-btn-dislike');
        const likeCountEl = document.getElementById('detailLikeCount');
        const dislikeCountEl = document.getElementById('detailDislikeCount');
        const currentLikes = parseInt(likeCountEl.textContent);
        const currentDislikes = parseInt(dislikeCountEl.textContent);
        const userVote = LocalDB.getUserVote(postId, currentUser.id);
        
        // 检查当前用户是否已经点过踩
        if (userVote && userVote.vote_type === 'dislike') {
            // 已经踩过，取消踩
            const newDislikes = Math.max(0, currentDislikes - 1);
            dislikeCountEl.textContent = newDislikes;
            dislikeBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
            dislikeBtn.querySelector('i').className = 'ri-thumb-down-line text-lg';
            LocalDB.removeVote(postId, currentUser.id);
            LocalDB.updatePost(postId, { downvotes: newDislikes });
            showToast('已取消踩', 'info');
            
            try {
                await supabaseClient.from('posts').update({ downvotes: newDislikes }).eq('id', postId);
            } catch (e) {}
        } else {
            // 未踩或点了赞，执行踩
            const newDislikes = currentDislikes + 1;
            let newLikes = currentLikes;
            
            // 如果之前点过赞，先取消赞
            if (userVote && userVote.vote_type === 'like') {
                newLikes = Math.max(0, currentLikes - 1);
                likeCountEl.textContent = newLikes;
                likeBtn.classList.remove('text-red-500');
                likeBtn.querySelector('i').className = 'ri-heart-line text-lg';
                LocalDB.updatePost(postId, { upvotes: newLikes });
            }
            
            dislikeCountEl.textContent = newDislikes;
            dislikeBtn.classList.add('text-gray-600', 'dark:text-gray-400');
            dislikeBtn.querySelector('i').className = 'ri-thumb-down-fill text-lg';
            LocalDB.addVote(postId, currentUser.id, 'dislike');
            LocalDB.updatePost(postId, { upvotes: newLikes, downvotes: newDislikes });
            showToast('踩了一下', 'info');
            
            try {
                await supabaseClient.from('posts').update({ upvotes: newLikes, downvotes: newDislikes }).eq('id', postId);
            } catch (e) {}
        }
    },
    
    // 导出数据
    exportData() {
        const data = {
            posts: JSON.parse(localStorage.getItem('campus_posts') || '[]'),
            comments: JSON.parse(localStorage.getItem('campus_comments') || '[]'),
            users: JSON.parse(localStorage.getItem('campus_users') || '[]'),
            favorites: JSON.parse(localStorage.getItem('campus_favorites') || '[]'),
            notifications: JSON.parse(localStorage.getItem('campus_notifications') || '[]'),
            votes: JSON.parse(localStorage.getItem('campus_votes') || '[]'),
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus_data_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('数据导出成功！', 'success');
    },
    
    // 导入数据
    importData(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.posts || !Array.isArray(data.posts)) {
                    showToast('无效的数据文件', 'error');
                    return;
                }
                
                // 合并数据
                const currentPosts = JSON.parse(localStorage.getItem('campus_posts') || '[]');
                const currentComments = JSON.parse(localStorage.getItem('campus_comments') || '[]');
                const currentFavorites = JSON.parse(localStorage.getItem('campus_favorites') || '[]');
                const currentVotes = JSON.parse(localStorage.getItem('campus_votes') || '[]');
                
                // 合并帖子（避免重复ID）
                const postIds = new Set(currentPosts.map(p => p.id));
                const newPosts = data.posts.filter(p => !postIds.has(p.id));
                const mergedPosts = [...currentPosts, ...newPosts];
                localStorage.setItem('campus_posts', JSON.stringify(mergedPosts));
                
                // 合并评论
                const commentIds = new Set(currentComments.map(c => c.id));
                const newComments = (data.comments || []).filter(c => !commentIds.has(c.id));
                const mergedComments = [...currentComments, ...newComments];
                localStorage.setItem('campus_comments', JSON.stringify(mergedComments));
                
                // 合并收藏
                const favIds = new Set(currentFavorites.map(f => f.id));
                const newFavorites = (data.favorites || []).filter(f => !favIds.has(f.id));
                const mergedFavorites = [...currentFavorites, ...newFavorites];
                localStorage.setItem('campus_favorites', JSON.stringify(mergedFavorites));
                
                // 合并投票
                const voteKeys = new Set(currentVotes.map(v => `${v.post_id}_${v.user_id}`));
                const newVotes = (data.votes || []).filter(v => !voteKeys.has(`${v.post_id}_${v.user_id}`));
                const mergedVotes = [...currentVotes, ...newVotes];
                localStorage.setItem('campus_votes', JSON.stringify(mergedVotes));
                
                // 合并用户
                if (data.users && currentUser) {
                    const userIds = new Set();
                    const users = JSON.parse(localStorage.getItem('campus_users') || '[]');
                    const mergedUsers = users.filter(u => {
                        if (u.id === currentUser.id) return true;
                        if (userIds.has(u.id)) return false;
                        userIds.add(u.id);
                        return true;
                    });
                    localStorage.setItem('campus_users', JSON.stringify(mergedUsers));
                }
                
                showToast(`导入成功！共导入 ${newPosts.length} 条帖子`, 'success');
                
                // 刷新页面
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                showToast('导入失败：' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        fileInput.value = '';
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出全局函数
window.App = App;
window.login = login;
window.register = register;
window.showToast = showToast;
window.loadPosts = loadPosts;
window.createPost = createPost;
window.viewPostDetail = viewPostDetail;
window.likePost = likePost;
window.dislikePost = dislikePost;
window.deletePost = deletePost;
window.submitComment = submitComment;
window.deleteComment = deleteComment;
window.deleteMyComment = deleteMyComment;
window.showReportModal = showReportModal;
window.submitReport = submitReport;
window.closeReportModal = closeReportModal;
window.markAllRead = markAllRead;
window.removeFavorite = removeFavorite;
window.LocalDB = LocalDB;
