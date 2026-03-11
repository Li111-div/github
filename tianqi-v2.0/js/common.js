/**
 * common.js - 公共工具函数库
 * 包含 DOM 操作、格式化、动画等通用函数
 */

// ==================== 全局配置 ====================
const APP_CONFIG = {
  // API 配置（请在此处替换您的高德 API Key）
  AMAP_API_KEY: 'a4db0093766f7bc349fcc370ec03913d', // TODO: 替换为真实 API Key
  AMAP_WEATHER_URL: 'https://restapi.amap.com/v3/weather/weatherInfo',
  
  // 默认城市编码（请在此处替换默认城市）
  DEFAULT_CITY: '110000', // 北京，TODO: 可替换为其他城市编码
  
  // 动画配置
  ANIMATION_DURATION: 500, // 毫秒
  ANIMATION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // 主题配置
  THEMES: {
    SUNNY_DAY: 'sunny',
    RAINY_DAY: 'rainy',
    CLOUDY_DAY: 'cloudy',
    NIGHT: 'night'
  }
};

// ==================== DOM 工具函数 ====================

/**
 * 获取 DOM 元素
 * @param {string} selector - CSS 选择器
 * @returns {Element|null}
 */
function $(selector) {
  return document.querySelector(selector);
}

/**
 * 获取多个 DOM 元素
 * @param {string} selector - CSS 选择器
 * @returns {NodeList}
 */
function $$(selector) {
  return document.querySelectorAll(selector);
}

/**
 * 创建 DOM 元素
 * @param {string} tag - 标签名
 * @param {object} options - 选项（className, id, innerHTML, dataset 等）
 * @returns {Element}
 */
function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  
  if (options.className) el.className = options.className;
  if (options.id) el.id = options.id;
  if (options.innerHTML) el.innerHTML = options.innerHTML;
  if (options.text) el.textContent = options.text;
  if (options.dataset) {
    Object.assign(el.dataset, options.dataset);
  }
  if (options.style) {
    Object.assign(el.style, options.style);
  }
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  
  return el;
}

/**
 * 添加事件监听器
 * @param {Element} el - DOM 元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 处理函数
 * @param {boolean} capture - 是否捕获
 */
function on(el, event, handler, capture = false) {
  if (el) {
    el.addEventListener(event, handler, capture);
  }
}

/**
 * 移除事件监听器
 * @param {Element} el - DOM 元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 处理函数
 */
function off(el, event, handler) {
  if (el) {
    el.removeEventListener(event, handler);
  }
}

/**
 * 触发事件
 * @param {Element} el - DOM 元素
 * @param {string} event - 事件类型
 * @param {object} data - 事件数据
 */
function trigger(el, event, data = {}) {
  if (el) {
    const customEvent = new CustomEvent(event, { detail: data });
    el.dispatchEvent(customEvent);
  }
}

// ==================== 动画工具函数 ====================

/**
 * 执行动画并等待完成
 * @param {Element} el - DOM 元素
 * @param {object} keyframes - 关键帧
 * @param {number} duration - 持续时间
 * @returns {Promise}
 */
async function animate(el, keyframes, duration = 300) {
  return new Promise((resolve) => {
    const animation = el.animate(keyframes, {
      duration,
      easing: APP_CONFIG.ANIMATION_EASING,
      fill: 'forwards'
    });
    
    animation.onfinish = resolve;
  });
}

/**
 * 淡入效果
 * @param {Element} el - DOM 元素
 * @param {number} duration - 持续时间
 */
async function fadeIn(el, duration = 300) {
  if (!el) return;
  el.style.opacity = '0';
  el.style.display = 'block';
  await animate(el, [{ opacity: 0 }, { opacity: 1 }], duration);
}

/**
 * 淡出效果
 * @param {Element} el - DOM 元素
 * @param {number} duration - 持续时间
 */
async function fadeOut(el, duration = 300) {
  if (!el) return;
  await animate(el, [{ opacity: 1 }, { opacity: 0 }], duration);
  el.style.display = 'none';
}

/**
 * 滑动进入效果
 * @param {Element} el - DOM 元素
 * @param {string} direction - 方向（up, down, left, right）
 * @param {number} duration - 持续时间
 */
async function slideIn(el, direction = 'up', duration = 300) {
  if (!el) return;
  
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 }
  };
  
  const { x, y } = directions[direction] || directions.up;
  
  el.style.opacity = '0';
  el.style.transform = `translate(${x}px, ${y}px)`;
  el.style.display = 'block';
  
  await animate(el, [
    { opacity: 0, transform: `translate(${x}px, ${y}px)` },
    { opacity: 1, transform: 'translate(0, 0)' }
  ], duration);
}

/**
 * 添加入场动画类
 * @param {Element} el - DOM 元素
 * @param {number} delay - 延迟（毫秒）
 */
function addEnterAnimation(el, delay = 0) {
  if (!el) return;
  el.classList.add('animate-enter');
  if (delay > 0) {
    el.classList.add(`animate-delay-${Math.min(Math.round(delay / 100), 5)}`);
  }
  setTimeout(() => el.classList.add('visible'), delay + 50);
}

// ==================== 格式化函数 ====================

/**
 * 格式化温度
 * @param {number} temp - 温度值
 * @returns {string}
 */
function formatTemp(temp) {
  return `${Math.round(temp)}°`;
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @param {string} format - 格式（weekday, short, full）
 * @returns {string}
 */
function formatDate(date, format = 'short') {
  const d = new Date(date);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  if (format === 'weekday') {
    return weekdays[d.getDay()];
  } else if (format === 'short') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } else if (format === 'full') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {boolean} showSeconds - 是否显示秒
 * @returns {string}
 */
function formatTime(date = new Date(), showSeconds = false) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

/**
 * 判断是否为夜晚
 * @param {number} hour - 小时（0-23）
 * @returns {boolean}
 */
function isNight(hour) {
  return hour < 6 || hour >= 18;
}

/**
 * 根据当前时间获取时段描述
 * @returns {string}
 */
function getTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return '早晨';
  if (hour >= 9 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '中午';
  if (hour >= 14 && hour < 18) return '下午';
  if (hour >= 18 && hour < 22) return '傍晚';
  return '夜晚';
}

/**
 * 格式化风速
 * @param {number} speed - 风速（m/s）
 * @returns {string}
 */
function formatWindSpeed(speed) {
  if (speed < 0.3) return '无风';
  if (speed < 1.6) return '软风';
  if (speed < 3.4) return '轻风';
  if (speed < 5.5) return '微风';
  if (speed < 8.0) return '和风';
  if (speed < 10.8) return '清风';
  if (speed < 13.9) return '强风';
  if (speed < 17.2) return '劲风';
  if (speed < 20.8) return '大风';
  return '烈风';
}

/**
 * 格式化紫外线指数
 * @param {number} index - 紫外线指数
 * @returns {object} { level, suggestion }
 */
function formatUVIndex(index) {
  if (index <= 2) {
    return { level: '最弱', suggestion: '不需要防护' };
  } else if (index <= 4) {
    return { level: '较弱', suggestion: '涂抹 SPF15 防晒霜' };
  } else if (index <= 6) {
    return { level: '中等', suggestion: '涂抹 SPF30 防晒霜，戴帽子' };
  } else if (index <= 8) {
    return { level: '较强', suggestion: '避免外出，必须外出时做好防护' };
  } else {
    return { level: '很强', suggestion: '尽量避免外出，务必做好防护' };
  }
}

/**
 * 格式化空气质量
 * @param {number} aqi - AQI 指数
 * @returns {object} { level, color, suggestion }
 */
function formatAQI(aqi) {
  if (aqi <= 50) {
    return { level: '优', color: '#00E400', suggestion: '空气清新，适合户外活动' };
  } else if (aqi <= 100) {
    return { level: '良', color: '#FFFF00', suggestion: '空气质量可接受' };
  } else if (aqi <= 150) {
    return { level: '轻度污染', color: '#FF7E00', suggestion: '敏感人群减少户外活动' };
  } else if (aqi <= 200) {
    return { level: '中度污染', color: '#FF0000', suggestion: '减少户外活动，佩戴口罩' };
  } else if (aqi <= 300) {
    return { level: '重度污染', color: '#99004C', suggestion: '避免户外活动' };
  } else {
    return { level: '严重污染', color: '#7E0023', suggestion: '严禁户外活动' };
  }
}

// ==================== 存储工具函数 ====================

/**
 * 本地存储设置
 * @param {string} key - 键
 * @param {any} value - 值
 */
function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage 写入失败:', e);
  }
}

/**
 * 本地存储获取
 * @param {string} key - 键
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
function getStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.warn('LocalStorage 读取失败:', e);
    return defaultValue;
  }
}

/**
 * 本地存储删除
 * @param {string} key - 键
 */
function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('LocalStorage 删除失败:', e);
  }
}

// ==================== 数字滚动动画 ====================

/**
 * 数字滚动动画
 * @param {Element} el - 显示数字的元素
 * @param {number} from - 起始值
 * @param {number} to - 结束值
 * @param {number} duration - 持续时间
 */
function rollNumber(el, from, to, duration = 1000) {
  if (!el) return;
  
  const start = performance.now();
  const diff = to - from;
  
  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    
    // 缓动函数
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = from + (diff * easeOutQuart);
    
    el.textContent = Math.round(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// ==================== 防抖节流 ====================

/**
 * 防抖函数
 * @param {Function} func - 目标函数
 * @param {number} wait - 等待时间
 * @returns {Function}
 */
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 目标函数
 * @param {number} limit - 限制时间
 * @returns {Function}
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

// ==================== 设备检测 ====================

/**
 * 是否为移动设备
 * @returns {boolean}
 */
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 是否为微信浏览器
 * @returns {boolean}
 */
function isWeChat() {
  return /micromessenger/i.test(navigator.userAgent);
}

/**
 * 获取设备像素比
 * @returns {number}
 */
function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

// ==================== 日志输出 ====================

/**
 * 开发环境日志
 * @param {string} message - 消息
 * @param {any} data - 数据
 */
function log(message, data = null) {
  if (process?.env?.NODE_ENV !== 'production') {
    console.log(`[Weather App] ${message}`, data || '');
  }
}

/**
 * 错误日志
 * @param {string} message - 消息
 * @param {Error} error - 错误对象
 */
function logError(message, error = null) {
  console.error(`[Weather App Error] ${message}`, error || '');
}

// ==================== 初始化检查 ====================

/**
 * 检查必要的依赖
 * @returns {boolean}
 */
function checkDependencies() {
  const checks = {
    jQuery: typeof $ !== 'undefined' && typeof $.ajax === 'function',
    ECharts: typeof echarts !== 'undefined'
  };
  
  const allPassed = Object.values(checks).every(v => v);
  
  if (!allPassed) {
    console.warn('缺少依赖:', checks);
  }
  
  return allPassed;
}

// 导出到全局 window 对象（便于其他模块使用）
window.WeatherUtils = {
  $, $$, createElement, on, off, trigger,
  animate, fadeIn, fadeOut, slideIn, addEnterAnimation,
  formatTemp, formatDate, formatTime, isNight, getTimePeriod,
  formatWindSpeed, formatUVIndex, formatAQI,
  setStorage, getStorage, removeStorage,
  rollNumber, debounce, throttle,
  isMobile, isWeChat, getDevicePixelRatio,
  log, logError, checkDependencies
};
