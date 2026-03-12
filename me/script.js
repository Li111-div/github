// ===== 导航功能 =====
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page');
const hamburger = document.querySelector('.hamburger');

// 汉堡菜单切换
hamburger.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    links.classList.toggle('active');
});

// 页面切换功能
function switchPage(targetId) {
    // 移除所有页面的 active 类
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // 移除所有导航链接的 active 类
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // 添加 active 类到目标页面
    const targetPage = document.getElementById(targetId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 添加 active 类到对应的导航链接
    const activeLink = document.querySelector(`.nav-links a[href="#${targetId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 在移动端，点击后关闭菜单
    if (window.innerWidth <= 768) {
        document.querySelector('.nav-links').classList.remove('active');
    }

    // 更新 URL（不触发刷新）
    history.pushState(null, null, `#${targetId}`);
    
    // 如果切换到技能页面，初始化雷达图
    if (targetId === 'skills') {
        setTimeout(initSkillRadar, 300);
    }
}

// 为所有导航链接添加点击事件
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-page');
        switchPage(targetId);
    });
});

// 为所有带 data-page 属性的元素添加点击事件
document.querySelectorAll('[data-page]').forEach(element => {
    element.addEventListener('click', (e) => {
        if (!element.classList.contains('nav-links')) {
            e.preventDefault();
            const targetId = element.getAttribute('data-page');
            switchPage(targetId);
        }
    });
});

// ===== Chart.js 雷达图 =====
let skillRadarInitialized = false;

function initSkillRadar() {
    if (skillRadarInitialized) return;
    
    const canvas = document.getElementById('skillRadar');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['编程能力', '算法思维', '工程实践', '团队协作', '创新能力'],
            datasets: [{
                label: '能力评估',
                data: [85, 78, 82, 88, 80],
                backgroundColor: 'rgba(30, 136, 229, 0.3)',
                borderColor: '#1E88E5',
                borderWidth: 2,
                pointBackgroundColor: '#FF6F00',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { 
                        stepSize: 20,
                        backdropColor: 'transparent',
                        color: '#90A4AE'
                    },
                    grid: {
                        color: 'rgba(58, 90, 106, 0.5)'
                    },
                    angleLines: {
                        color: 'rgba(58, 90, 106, 0.5)'
                    },
                    pointLabels: {
                        color: '#E3F2FD',
                        font: {
                            size: 12,
                            family: "'Microsoft YaHei', 'Segoe UI', sans-serif"
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(13, 27, 42, 0.9)',
                    titleColor: '#E3F2FD',
                    bodyColor: '#E3F2FD',
                    borderColor: '#1E88E5',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '得分：' + context.parsed.r + '/100';
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
    
    skillRadarInitialized = true;
}

// ===== 证书弹窗功能 =====
function openCertificateModal(imageSrc, caption) {
    const modal = document.getElementById('certificateModal');
    const img = document.getElementById('modalImage');
    const captionEl = document.getElementById('modalCaption');
    
    if (!modal || !img) return;
    
    // 设置图片和说明文字
    img.src = imageSrc;
    captionEl.textContent = caption;
    
    // 显示弹窗
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 禁止背景滚动
}

function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 恢复滚动
    }
}

// ===== 微信二维码弹窗 =====
function openWechatModal() {
    const modal = document.getElementById('wechatModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeWechatModal() {
    const modal = document.getElementById('wechatModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 弹窗点击关闭
window.addEventListener('click', (e) => {
    const certificateModal = document.getElementById('certificateModal');
    const wechatModal = document.getElementById('wechatModal');
    
    if (e.target === certificateModal) {
        closeCertificateModal();
    }
    if (e.target === wechatModal) {
        closeWechatModal();
    }
});

// ESC 键关闭弹窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCertificateModal();
        closeWechatModal();
    }
});

// ===== 表单提交 =====
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn?.querySelector('.btn-text');
const btnLoading = submitBtn?.querySelector('.btn-loading');
const currentLengthEl = document.getElementById('currentLength');
const messageTextarea = document.getElementById('message');

// 字符计数
if (messageTextarea && currentLengthEl) {
    messageTextarea.addEventListener('input', () => {
        currentLengthEl.textContent = messageTextarea.value.length;
    });
}

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 显示 loading 状态
        if (btnText && btnLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        }
        submitBtn.disabled = true;
        
        // 模拟表单提交（实际使用时可替换为真实的 AJAX 请求）
        setTimeout(() => {
            alert('✅ 感谢您的留言！我会在 24 小时内回复您，请注意查收邮件。');
            contactForm.reset();
            
            // 重置字符计数
            if (currentLengthEl) {
                currentLengthEl.textContent = '0';
            }
            
            // 恢复按钮状态
            if (btnText && btnLoading) {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
            submitBtn.disabled = false;
        }, 1500);
    });
}

// ===== 滚动效果 =====
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // 导航栏阴影效果
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.5)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ===== 键盘导航 =====
document.addEventListener('keydown', (e) => {
    const currentPage = document.querySelector('.page.active');
    const pageIndex = Array.from(pages).indexOf(currentPage);
    
    // 使用方向键或 Page Down/Page Up 切换页面
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (pageIndex < pages.length - 1) {
            e.preventDefault();
            const nextPage = pages[pageIndex + 1];
            switchPage(nextPage.id);
        }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (pageIndex > 0) {
            e.preventDefault();
            const prevPage = pages[pageIndex - 1];
            switchPage(prevPage.id);
        }
    }
});

// ===== 页面加载完成后的初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 检查 URL hash，如果有则切换到对应页面
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        switchPage(hash);
    } else {
        // 默认显示首页
        switchPage('home');
    }
    
    // 监听技能页面激活，自动初始化雷达图
    const skillsPage = document.getElementById('skills');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('active')) {
                setTimeout(initSkillRadar, 300);
            }
        });
    }, { threshold: 0.5 });
    
    if (skillsPage) {
        observer.observe(skillsPage);
    }
    
    // 添加页面切换动画监听
    pages.forEach(page => {
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && 
                    page.classList.contains('active') && 
                    page.id === 'skills') {
                    setTimeout(initSkillRadar, 300);
                }
            });
        });
        
        mutationObserver.observe(page, { attributes: true });
    });
    
    // 图片错误处理
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const nextSibling = this.nextElementSibling;
            if (nextSibling && nextSibling.classList.contains('wechat-placeholder')) {
                nextSibling.style.display = 'flex';
            }
        });
    });
});

// ===== 控制台欢迎信息 =====
console.log('%c👋 你好，开发者！', 'color: #1E88E5; font-size: 24px; font-weight: bold;');
console.log('%c欢迎来到我的个人作品集网站！如果你对我的代码感兴趣，欢迎查看 GitHub 仓库。', 'color: #E3F2FD; font-size: 14px;');
console.log('%c技能成就梦想，奋斗成就未来 💪', 'color: #FF6F00; font-size: 14px; font-style: italic;');
console.log('%cBuilt with ❤️ by [你的姓名]', 'color: #FFA000; font-size: 12px;');
