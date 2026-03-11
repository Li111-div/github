/**
 * travel.js - 旅游板块 JavaScript 文件
 * 处理景点展示、AI 路线生成、收藏等功能
 */

// ==================== 全局变量 ====================

/**
 * 旅游数据（模拟数据）
 */
const TRAVEL_DATA = {
  // 国内景点
  domestic: [
    { id: 1, name: '故宫博物院', location: '北京', rating: 4.9, price: 60, image: 'images/travel/gugong.jpg', desc: '中国明清两代的皇家宫殿，世界上现存规模最大的木质结构古建筑群' },
    { id: 2, name: '外滩', location: '上海', rating: 4.8, price: 0, image: 'images/travel/waitan.jpg', desc: '上海标志性景点，欣赏黄浦江两岸的万国建筑博览群' },
    { id: 3, name: '兵马俑', location: '西安', rating: 4.9, price: 150, image: 'images/travel/bingmayong.jpg', desc: '世界第八大奇迹，秦始皇陵的陪葬坑' },
    { id: 4, name: '九寨沟', location: '四川', rating: 5.0, price: 220, image: 'images/travel/jiuzhaigou.jpg', desc: '童话世界，人间仙境，以翠湖、叠瀑、彩林等六绝著称' },
    { id: 5, name: '丽江古城', location: '云南', rating: 4.7, price: 80, image: 'images/travel/lijiang.jpg', desc: '世界文化遗产，具有浓郁纳西族风情的古镇' },
    { id: 6, name: '桂林山水', location: '广西', rating: 4.8, price: 210, image: 'images/travel/guilin.jpg', desc: '桂林山水甲天下，漓江风光甲桂林' },
    { id: 7, name: '布达拉宫', location: '西藏', rating: 4.9, price: 200, image: 'images/travel/budala.jpg', desc: '世界屋脊上的明珠，藏式古建筑的杰出代表' },
    { id: 8, name: '西湖', location: '杭州', rating: 4.8, price: 0, image: 'images/travel/xihu.jpg', desc: '人间天堂，中国著名的淡水湖，以秀丽的湖光山色闻名' }
  ],
  
  // 国外景点
  international: [
    { id: 101, name: '富士山', location: '日本', rating: 4.8, price: 0, image: 'images/travel/fujisan.jpg', desc: '日本最高峰，日本的象征，世界文化遗产' },
    { id: 102, name: '埃菲尔铁塔', location: '法国·巴黎', rating: 4.7, price: 26, image: 'images/travel/aifeier.jpg', desc: '巴黎地标性建筑，世界著名建筑之一' },
    { id: 103, name: '罗马斗兽场', location: '意大利·罗马', rating: 4.8, price: 16, image: 'images/travel/doushou.jpg', desc: '古罗马文明的象征，世界八大名胜之一' },
    { id: 104, name: '大皇宫', location: '泰国·曼谷', rating: 4.6, price: 17, image: 'images/travel/daohuanggong.jpg', desc: '泰国王室居住地，金碧辉煌的泰式建筑群' },
    { id: 105, name: '自由女神像', location: '美国·纽约', rating: 4.7, price: 23, image: 'images/travel Ziyou.jpg', desc: '美国象征，欢迎世界各地移民的到来' },
    { id: 106, name: '悉尼歌剧院', location: '澳大利亚', rating: 4.8, price: 43, image: 'images/travel/gejuyuan.jpg', desc: '20 世纪最具特色的建筑之一，悉尼地标' },
    { id: 107, name: '圣家堂', location: '西班牙·巴塞罗那', rating: 4.9, price: 26, image: 'images/travel/shengjiatang.jpg', desc: '高迪的杰作，世界上唯一未完工的世界遗产' },
    { id: 108, name: '马尔代夫海滩', location: '马尔代夫', rating: 5.0, price: 0, image: 'images/travel/maldives.jpg', desc: '印度洋上的珍珠，世界顶级海岛度假胜地' }
  ]
};

/**
 * 收藏列表
 */
let favoritesData = storage.get('travelFavorites') || [];

// ==================== 页面初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('✈️ 旅游板块已加载');
  
  // 初始化景点分类
  initScenicTabs();
  
  // 初始化瀑布流布局
  initWaterfallLayout();
  
  // 初始化 AI 路线生成
  initAIRoute();
  
  // 初始化轮播图
  initCarousel();
  
  // 初始化收藏功能
  initFavorites();
  
  // 初始化排序功能
  initSort();
});

// ==================== 景点分类切换 ====================

/**
 * 初始化景点分类切换
 */
function initScenicTabs() {
  const tabs = document.querySelectorAll('.travel-tabs__item');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.dataset.type;
      
      // 切换 Tab 状态
      tabs.forEach(t => t.classList.remove('travel-tabs__item--active'));
      tab.classList.add('travel-tabs__item--active');
      
      // 加载对应数据
      loadScenicData(type);
    });
  });
}

/**
 * 加载景点数据
 * @param {string} type - 类型：domestic 或 international
 */
function loadScenicData(type) {
  const container = document.querySelector('.scenic-waterfall');
  if (!container) return;
  
  const data = type === 'domestic' ? TRAVEL_DATA.domestic : TRAVEL_DATA.international;
  
  container.innerHTML = data.map(item => createScenicCard(item)).join('');
  
  // 重新初始化懒加载
  initLazyLoad();
}

/**
 * 创建景点卡片 HTML
 * @param {object} item - 景点数据
 * @returns {string}
 */
function createScenicCard(item) {
  const isFavorite = favoritesData.some(fav => fav.id === item.id);
  
  return `
    <div class="scenic-card" data-id="${item.id}">
      <button class="favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}" data-id="${item.id}">
        ${isFavorite ? '❤️' : '🤍'}
      </button>
      <img src="${item.image}" alt="${item.name}" class="scenic-card__image" 
           onerror="this.src='https://via.placeholder.com/400x300/1E88E5/FFFFFF?text=${encodeURIComponent(item.name)}'">
      <div class="scenic-card__hover-info">
        <h4 class="scenic-card__hover-title">${item.name}</h4>
        <p class="scenic-card__hover-text">${item.desc.substring(0, 50)}...</p>
      </div>
      <div class="scenic-card__content">
        <h3 class="scenic-card__name">${item.name}</h3>
        <p class="scenic-card__location">📍 ${item.location}</p>
        <p class="scenic-card__desc">${item.desc}</p>
        <div class="scenic-card__footer">
          <div class="scenic-card__rating">
            ${getStarRating(item.rating)}
            <span>${item.rating}</span>
          </div>
          <span class="scenic-card__price">${item.price > 0 ? '¥' + item.price : '免费'}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 初始化瀑布流布局
 */
function initWaterfallLayout() {
  // 默认加载国内景点
  loadScenicData('domestic');
}

// ==================== AI 路线生成 ====================

/**
 * 初始化 AI 路线生成功能
 */
function initAIRoute() {
  const form = document.querySelector('.ai-route-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const departure = form.querySelector('[name="departure"]')?.value.trim();
    const destination = form.querySelector('[name="destination"]')?.value.trim();
    const days = parseInt(form.querySelector('[name="days"]')?.value) || 3;
    const budget = form.querySelector('[name="budget"]')?.value;
    
    // 获取偏好
    const preferences = Array.from(form.querySelectorAll('[name="preference"]:checked'))
      .map(cb => cb.value);
    
    if (!departure || !destination) {
      showToast('请填写出发地和目的地', 'warning');
      return;
    }
    
    const btn = form.querySelector('.ai-route-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading loading--travel"></span> 正在规划中...';
    
    try {
      const result = await generateRoute({
        departure,
        destination,
        days,
        budget: budget ? parseInt(budget) : null,
        preferences
      });
      
      displayRouteResult(result);
      showToast('路线生成成功', 'success');
    } catch (error) {
      console.error('生成失败:', error);
      showToast('生成失败，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

/**
 * 显示路线结果
 * @param {object} route - 路线对象
 */
function displayRouteResult(route) {
  const container = document.querySelector('.route-result-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="route-result-card">
      <div class="route-result-header">
        <h3 class="route-result-title">🗺️ ${route.title}</h3>
        <div class="route-result-actions">
          <button class="route-result-action-btn--print" onclick="printRoute()">
            🖨️ 打印
          </button>
          <button class="route-result-action-btn--share" onclick="shareRoute()">
            📤 分享
          </button>
          <button class="route-result-action-btn--edit" onclick="editRoute()">
            ✏️ 编辑
          </button>
        </div>
      </div>
      
      <div class="route-days">
        ${formatRouteDays(route.raw)}
      </div>
    </div>
  `;
  
  container.classList.add('route-result-container--show');
  
  // 存储当前路线
  window.currentRoute = route;
  
  // 滚动到结果区域
  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * 格式化路线天数
 * @param {string} raw - 原始内容
 * @returns {string}
 */
function formatRouteDays(raw) {
  // 简单的解析逻辑，实际使用可以更复杂
  const days = raw.split(/###\s+第\s*[一二三四五六七八九十\d]+\s*天/g).filter(Boolean);
  
  return days.map((day, index) => `
    <div class="route-day" data-day="${index + 1}">
      <div class="route-day__header">
        <h4 class="route-day__title">📅 第${index + 1}天</h4>
        <span class="route-day__date">Day ${index + 1}</span>
      </div>
      <div class="route-day__schedule">
        ${formatSchedule(day)}
      </div>
    </div>
  `).join('');
}

/**
 * 格式化行程安排
 * @param {string} content - 内容
 * @returns {string}
 */
function formatSchedule(content) {
  const sections = {
    morning: content.match(/####\s*🌅\s*上午([\s\S]*?)(?=####|$)/)?.[1] || '',
    afternoon: content.match(/####\s*🌞\s*下午([\s\S]*?)(?=####|$)/)?.[1] || '',
    evening: content.match(/####\s*🌃\s*晚上([\s\S]*?)(?=####|$)/)?.[1] || ''
  };
  
  let html = '';
  
  if (sections.morning) {
    html += `
      <div class="route-schedule-item route-schedule-item--morning">
        <span class="route-schedule-time">🌅 上午</span>
        <div class="route-schedule-content">
          ${formatScheduleContent(sections.morning)}
        </div>
      </div>
    `;
  }
  
  if (sections.afternoon) {
    html += `
      <div class="route-schedule-item route-schedule-item--afternoon">
        <span class="route-schedule-time">🌞 下午</span>
        <div class="route-schedule-content">
          ${formatScheduleContent(sections.afternoon)}
        </div>
      </div>
    `;
  }
  
  if (sections.evening) {
    html += `
      <div class="route-schedule-item route-schedule-item--evening">
        <span class="route-schedule-time">🌃 晚上</span>
        <div class="route-schedule-content">
          ${formatScheduleContent(sections.evening)}
        </div>
      </div>
    `;
  }
  
  return html;
}

/**
 * 格式化行程内容
 * @param {string} content - 内容
 * @returns {string}
 */
function formatScheduleContent(content) {
  return content
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${line.replace(/^[*-]\s*/, '')}</p>`)
    .join('');
}

/**
 * 打印路线
 */
function printRoute() {
  window.print();
}

/**
 * 分享路线
 */
async function shareRoute() {
  if (window.currentRoute) {
    const text = window.currentRoute.raw;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的旅行路线',
          text: text
        });
        showToast('分享成功', 'success');
      } catch (err) {
        copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  }
}

/**
 * 编辑路线
 */
function editRoute() {
  showModal('编辑功能开发中...', '提示');
}

// ==================== 轮播图 ====================

/**
 * 初始化轮播图
 */
function initCarousel() {
  const carousel = document.querySelector('.scenic-carousel');
  if (!carousel) return;
  
  const slides = carousel.querySelectorAll('.scenic-carousel__slide');
  if (slides.length === 0) return;
  
  let currentIndex = 0;
  const indicators = carousel.querySelectorAll('.scenic-carousel__indicator');
  
  // 自动播放
  let timer = setInterval(() => {
    showSlide(currentIndex + 1);
  }, 5000);
  
  // 鼠标悬停暂停
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', () => {
    timer = setInterval(() => {
      showSlide(currentIndex + 1);
    }, 5000);
  });
  
  // 上一张
  carousel.querySelector('.scenic-carousel__prev')?.addEventListener('click', () => {
    showSlide(currentIndex - 1);
  });
  
  // 下一张
  carousel.querySelector('.scenic-carousel__next')?.addEventListener('click', () => {
    showSlide(currentIndex + 1);
  });
  
  // 指示器
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
    });
  });
  
  function showSlide(index) {
    slides[currentIndex]?.classList.remove('scenic-carousel__slide--active');
    indicators[currentIndex]?.classList.remove('scenic-carousel__indicator--active');
    
    currentIndex = (index + slides.length) % slides.length;
    
    slides[currentIndex]?.classList.add('scenic-carousel__slide--active');
    indicators[currentIndex]?.classList.add('scenic-carousel__indicator--active');
  }
}

// ==================== 收藏功能 ====================

/**
 * 初始化收藏功能
 */
function initFavorites() {
  // 使用事件委托处理收藏按钮点击
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite-btn')) {
      const id = parseInt(e.target.dataset.id);
      toggleFavorite(id, e.target);
    }
  });
}

/**
 * 切换收藏状态
 * @param {number} id - 景点 ID
 * @param {HTMLElement} btn - 按钮元素
 */
function toggleFavorite(id, btn) {
  const index = favoritesData.findIndex(fav => fav.id === id);
  
  if (index > -1) {
    // 取消收藏
    favoritesData.splice(index, 1);
    btn.textContent = '🤍';
    btn.classList.remove('favorite-btn--active');
    showToast('已取消收藏', 'warning');
  } else {
    // 添加收藏
    const allData = [...TRAVEL_DATA.domestic, ...TRAVEL_DATA.international];
    const item = allData.find(d => d.id === id);
    if (item) {
      favoritesData.push(item);
      btn.textContent = '❤️';
      btn.classList.add('favorite-btn--active');
      showToast('收藏成功', 'success');
    }
  }
  
  storage.set('travelFavorites', favoritesData);
}

/**
 * 获取收藏列表
 * @returns {array}
 */
function getFavorites() {
  return favoritesData;
}

// ==================== 排序功能 ====================

/**
 * 初始化排序功能
 */
function initSort() {
  const sortSelect = document.querySelector('.sort-select');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    sortScenicCards(type);
  });
}

/**
 * 排序景点卡片
 * @param {string} type - 排序类型
 */
function sortScenicCards(type) {
  const container = document.querySelector('.scenic-waterfall');
  if (!container) return;
  
  const cards = Array.from(container.querySelectorAll('.scenic-card'));
  const allData = [...TRAVEL_DATA.domestic, ...TRAVEL_DATA.international];
  
  cards.sort((a, b) => {
    const idA = parseInt(a.dataset.id);
    const idB = parseInt(b.dataset.id);
    const itemA = allData.find(d => d.id === idA);
    const itemB = allData.find(d => d.id === idB);
    
    switch (type) {
      case 'rating':
        return itemB.rating - itemA.rating;
      case 'price-asc':
        return itemA.price - itemB.price;
      case 'price-desc':
        return itemB.price - itemA.price;
      default:
        return 0;
    }
  });
  
  cards.forEach(card => container.appendChild(card));
}

// ==================== 工具函数 ====================

/**
 * 生成星级评分 HTML
 * @param {number} rating - 评分
 * @returns {string}
 */
function getStarRating(rating) {
  const fullStars = Math.floor(rating);
  let html = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += '⭐';
    } else {
      html += '<span class="rating__star--empty">☆</span>';
    }
  }
  
  return html;
}

/**
 * 跳转到景点详情页
 * @param {number} id - 景点 ID
 */
function goToScenicDetail(id) {
  window.location.href = `pages/scenic_detail.html?id=${id}`;
}

/**
 * 跳转到路线详情页
 * @param {string} routeId - 路线 ID
 */
function goToRouteDetail(routeId) {
  window.location.href = `pages/route_detail.html?id=${routeId}`;
}

/**
 * 跳转到收藏页
 */
function goToFavorites() {
  window.location.href = 'pages/favorites.html';
}

// ==================== 导出模块 ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TRAVEL_DATA,
    toggleFavorite,
    getFavorites,
    goToScenicDetail,
    goToRouteDetail,
    goToFavorites,
    initAIRoute,
    printRoute,
    shareRoute,
    editRoute
  };
}
