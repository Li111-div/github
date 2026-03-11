/**
 * common.js - 公共 JavaScript 文件
 * 包含通用工具函数、DOM 操作、事件处理等
 */

// ==================== 全局工具函数 ====================

/**
 * 显示提示框
 * @param {string} message - 提示信息
 * @param {string} type - 类型：success, error, warning
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 触发动画
  setTimeout(() => toast.classList.add('toast--show'), 10);
  
  // 3 秒后移除
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/**
 * 显示模态框
 * @param {string} content - 内容
 * @param {string} title - 标题
 */
function showModal(content, title = '提示') {
  const modal = document.createElement('div');
  modal.className = 'modal modal--show';
  modal.innerHTML = `
    <div class="modal__content">
      <div class="modal__header">
        <h3 class="modal__title">${title}</h3>
        <button class="modal__close">&times;</button>
      </div>
      <div class="modal__body">${content}</div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 关闭按钮事件
  modal.querySelector('.modal__close').addEventListener('click', () => {
    closeModal(modal);
  });
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

/**
 * 关闭模态框
 * @param {HTMLElement} modal - 模态框元素
 */
function closeModal(modal) {
  modal.classList.remove('modal--show');
  setTimeout(() => modal.remove(), 300);
}

/**
 * 复制到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback();
    return true;
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopyFeedback();
      return true;
    } catch (err2) {
      showToast('复制失败，请手动复制', 'error');
      return false;
    } finally {
      textarea.remove();
    }
  }
}

/**
 * 显示复制成功反馈
 */
function showCopyFeedback() {
  const feedback = document.createElement('div');
  feedback.className = 'copy-feedback copy-feedback--show';
  feedback.innerHTML = `
    <span>✓</span>
    <span>复制成功</span>
  `;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.remove('copy-feedback--show');
    setTimeout(() => feedback.remove(), 300);
  }, 1500);
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @param {string} format - 格式
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @param {string} symbol - 货币符号
 * @returns {string}
 */
function formatMoney(amount, symbol = '¥') {
  return symbol + Number(amount).toFixed(2);
}

/**
 * 格式化数字（添加千分位）
 * @param {number} num - 数字
 * @returns {string}
 */
function formatNumber(num) {
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 获取 URL 参数
 * @param {string} name - 参数名
 * @returns {string|null}
 */
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * 平滑滚动到指定位置
 * @param {number} targetY - 目标 Y 坐标
 * @param {number} duration - 动画时长（毫秒）
 */
function scrollTo(targetY, duration = 500) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  let startTime = null;
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);
    
    window.scrollTo(0, startY + distance * ease);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }
  
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  requestAnimationFrame(animation);
}

/**
 * 回到顶部
 */
function backToTop() {
  scrollTo(0);
}

/**
 * 图片懒加载
 * @param {NodeList} images - 图片元素列表
 */
function lazyLoadImages(images) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy-image');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

/**
 * 本地存储封装
 */
const storage = {
  /**
   * 设置存储
   * @param {string} key - 键
   * @param {any} value - 值
   */
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  /**
   * 获取存储
   * @param {string} key - 键
   * @returns {any}
   */
  get(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  /**
   * 移除存储
   * @param {string} key - 键
   */
  remove(key) {
    localStorage.removeItem(key);
  },
  
  /**
   * 清空存储
   */
  clear() {
    localStorage.clear();
  }
};

/**
 * 会话存储封装
 */
const session = {
  /**
   * 设置存储
   * @param {string} key - 键
   * @param {any} value - 值
   */
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  
  /**
   * 获取存储
   * @param {string} key - 键
   * @returns {any}
   */
  get(key) {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  /**
   * 移除存储
   * @param {string} key - 键
   */
  remove(key) {
    sessionStorage.removeItem(key);
  },
  
  /**
   * 清空存储
   */
  clear() {
    sessionStorage.clear();
  }
};

// ==================== 页面初始化 ====================

/**
 * 页面加载完成后的初始化
 */
document.addEventListener('DOMContentLoaded', function() {
  // 初始化回到顶部按钮
  initBackToTop();
  
  // 初始化移动端菜单
  initMobileMenu();
  
  // 初始化图片懒加载
  initLazyLoad();
  
  // 初始化搜索功能
  initSearch();
});

/**
 * 初始化回到顶部按钮
 */
function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;
  
  window.addEventListener('scroll', throttle(() => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('back-to-top--show');
    } else {
      backToTopBtn.classList.remove('back-to-top--show');
    }
  }, 100));
  
  backToTopBtn.addEventListener('click', backToTop);
}

/**
 * 初始化移动端菜单
 */
function initMobileMenu() {
  const menuBtn = document.querySelector('.header__menu-btn');
  const nav = document.querySelector('.header__nav');
  
  if (!menuBtn || !nav) return;
  
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('header__menu-btn--active');
    nav.classList.toggle('header__nav--active');
  });
}

/**
 * 初始化图片懒加载
 */
function initLazyLoad() {
  const images = document.querySelectorAll('img[data-src]');
  if (images.length > 0) {
    lazyLoadImages(images);
  }
}

/**
 * 初始化搜索功能
 */
function initSearch() {
  const searchInputs = document.querySelectorAll('.search-box__input, .input--search');
  
  searchInputs.forEach(input => {
    input.addEventListener('input', debounce((e) => {
      const value = e.target.value.trim();
      handleSearch(value);
    }, 300));
  });
}

/**
 * 处理搜索
 * @param {string} keyword - 关键词
 */
function handleSearch(keyword) {
  // 这是一个通用函数，具体实现由各页面决定
  console.log('搜索关键词:', keyword);
}

// ==================== 事件委托工具 ====================

/**
 * 添加事件委托
 * @param {HTMLElement} parent - 父元素
 * @param {string} selector - 选择器
 * @param {string} event - 事件类型
 * @param {Function} handler - 处理函数
 */
function addDelegateEvent(parent, selector, event, handler) {
  parent.addEventListener(event, function(e) {
    const target = e.target.closest(selector);
    if (parent.contains(target)) {
      handler.call(target, e);
    }
  });
}

// ==================== 动画控制 ====================

/**
 * 滚动动画
 */
const scrollAnimation = {
  elements: [],
  observer: null,
  
  /**
   * 初始化
   */
  init() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('[data-animate]').forEach(el => {
      this.elements.push(el);
      this.observer.observe(el);
    });
  },
  
  /**
   * 添加到观察列表
   * @param {HTMLElement} element - 元素
   */
  add(element) {
    this.elements.push(element);
    this.observer.observe(element);
  }
};

// ==================== 表单验证 ====================

/**
 * 表单验证工具
 */
const formValidator = {
  /**
   * 验证邮箱
   * @param {string} email - 邮箱地址
   * @returns {boolean}
   */
  isEmail(email) {
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return reg.test(email);
  },
  
  /**
   * 验证手机号
   * @param {string} phone - 手机号
   * @returns {boolean}
   */
  isPhone(phone) {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(phone);
  },
  
  /**
   * 验证身份证
   * @param {string} idCard - 身份证号
   * @returns {boolean}
   */
  isIdCard(idCard) {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
  },
  
  /**
   * 验证是否为空
   * @param {string} value - 值
   * @returns {boolean}
   */
  isEmpty(value) {
    return !value || value.trim() === '';
  },
  
  /**
   * 验证长度
   * @param {string} value - 值
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {boolean}
   */
  isLength(value, min, max) {
    const len = value ? value.length : 0;
    return len >= min && len <= max;
  }
};

// ==================== 浏览器兼容性检测 ====================

/**
 * 检测浏览器功能支持情况
 */
const browserSupport = {
  /**
   * 是否支持 localStorage
   */
  localStorage: function() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }(),
  
  /**
   * 是否支持 Clipboard API
   */
  clipboard: function() {
    return !!navigator.clipboard;
  }(),
  
  /**
   * 是否支持 IntersectionObserver
   */
  intersectionObserver: function() {
    return 'IntersectionObserver' in window;
  }(),
  
  /**
   * 是否支持 Fetch API
   */
  fetch: function() {
    return 'fetch' in window;
  }()
};

// ==================== 导出模块（如果使用模块化） ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    showModal,
    closeModal,
    copyToClipboard,
    debounce,
    throttle,
    formatDate,
    formatMoney,
    formatNumber,
    getUrlParam,
    scrollTo,
    backToTop,
    storage,
    session,
    addDelegateEvent,
    scrollAnimation,
    formValidator,
    browserSupport
  };
}
