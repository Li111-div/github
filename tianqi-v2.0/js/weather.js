/**
 * weather.js - 主天气界面逻辑
 * 包含即时天气展示、关键指标渲染、未来天气预报、生活建议等功能
 */

// ==================== 主界面模块 ====================
const WeatherPage = {
  // 当前天气数据
  weatherData: null,
  
  // 当前城市
  currentCity: '北京',
  
  /**
   * 初始化主界面
   */
  async init() {
    console.log('WeatherPage 初始化');
    
    // 从存储读取上次选择的城市
    const savedCity = getStorage('selectedCity', APP_CONFIG.DEFAULT_CITY);
    this.currentCity = savedCity;
    
    // 加载天气数据
    await this.loadWeather();
    
    // 绑定事件
    this.bindEvents();
    
    // 添加入场动画
    this.addEnterAnimations();
    
    // 启动背景动画
    BackgroundAnimation.init();
  },
  
  /**
   * 加载天气数据
   */
  async loadWeather() {
    this.showLoading(true);
    
    try {
      // 请求天气数据
      this.weatherData = await WeatherAPI.getWeatherForecast(this.currentCity);
      
      // 更新城市名
      this.currentCity = this.weatherData.city || this.currentCity;
      
      // 渲染页面
      this.render();
      
      // 更新主题
      ThemeManager.update(this.weatherData);
      
      // 保存数据
      setStorage('lastWeatherData', this.weatherData);
      setStorage('lastUpdateTime', new Date().toISOString());
      
    } catch (error) {
      console.error('加载天气数据失败:', error);
      // 使用缓存数据
      const cached = getStorage('lastWeatherData');
      if (cached) {
        this.weatherData = cached;
        this.render();
      }
    } finally {
      this.showLoading(false);
    }
  },
  
  /**
   * 渲染页面
   */
  render() {
    if (!this.weatherData) return;
    
    const { realtime, forecast } = this.weatherData;
    
    // 渲染主天气
    this.renderMainWeather(realtime);
    
    // 渲染关键指标
    this.renderWeatherGrid(realtime);
    
    // 渲染未来预报
    this.renderForecast(forecast);
    
    // 渲染生活建议
    this.renderLifeAdvice(this.weatherData);
    
    // 更新头部城市
    this.updateHeader();
  },
  
  /**
   * 渲染主天气区域
   */
  renderMainWeather(realtime) {
    // 温度（数字滚动动画）
    const tempEl = $('.main-weather__temp');
    if (tempEl && realtime.temperature) {
      rollNumber(tempEl, 0, realtime.temperature, 1000);
    }
    
    // 天气状况图标
    const iconEl = $('.main-weather__icon');
    if (iconEl) {
      const iconName = this.getWeatherIcon(realtime.weather);
      iconEl.innerHTML = `<span class="material-icons icon--huge">${iconName}</span>`;
    }
    
    // 天气状况文字
    const conditionEl = $('.main-weather__condition');
    if (conditionEl) {
      conditionEl.textContent = realtime.weather || '晴';
    }
    
    // 温度范围
    const rangeEl = $('.main-weather__range');
    if (rangeEl && this.weatherData.forecast?.[0]) {
      const today = this.weatherData.forecast[0];
      rangeEl.innerHTML = `
        <div class="main-weather__range-item">
          <span class="material-icons">arrow_upward</span>
          <span>${formatTemp(today.tempDay)}</span>
        </div>
        <div class="main-weather__range-item">
          <span class="material-icons">arrow_downward</span>
          <span>${formatTemp(today.tempNight)}</span>
        </div>
      `;
    }
  },
  
  /**
   * 渲染关键指标网格
   */
  renderWeatherGrid(realtime) {
    const gridEl = $('.weather-grid');
    if (!gridEl) return;
    
    // 紫外线指数
    const uvInfo = formatUVIndex(realtime.uvIndex || 5);
    
    // 风力描述
    const windDesc = formatWindSpeed(realtime.windSpeed || 0);
    
    gridEl.innerHTML = `
      <div class="card weather-card animate-enter" data-animation-delay="100">
        <span class="material-icons weather-card__icon icon--large">water_drop</span>
        <div class="weather-card__label">湿度</div>
        <div class="weather-card__value">${realtime.humidity || '--'}<span class="weather-card__unit">%</span></div>
      </div>
      
      <div class="card weather-card animate-enter" data-animation-delay="200">
        <span class="material-icons weather-card__icon icon--large">wb_sunny</span>
        <div class="weather-card__label">紫外线</div>
        <div class="weather-card__value">${uvInfo.level}</div>
        <div class="weather-card__desc">${uvInfo.suggestion}</div>
      </div>
      
      <div class="card weather-card animate-enter" data-animation-delay="300">
        <span class="material-icons weather-card__icon icon--large">thermostat</span>
        <div class="weather-card__label">体感温度</div>
        <div class="weather-card__value">${formatTemp(realtime.feelsLike || realtime.temperature)}${realtime.feelsLike ? '' : ''}</div>
      </div>
      
      <div class="card weather-card animate-enter" data-animation-delay="400">
        <span class="material-icons weather-card__icon icon--large">air</span>
        <div class="weather-card__label">${realtime.windDirection || '北'}风</div>
        <div class="weather-card__value">${realtime.windPower || 0}级</div>
        <div class="weather-card__desc">${windDesc}</div>
      </div>
    `;
  },
  
  /**
   * 渲染未来天气预报
   */
  renderForecast(forecast) {
    const containerEl = $('.forecast-container');
    if (!containerEl || !forecast) return;
    
    let html = '';
    forecast.forEach((day, index) => {
      const date = formatDate(day.date, 'short');
      const week = day.week || formatDate(day.date, 'weekday');
      const icon = this.getWeatherIcon(day.weatherDay);
      const isSelected = index === 0 ? 'forecast-day--selected' : '';
      
      html += `
        <div class="glass-panel forecast-day ${isSelected}" data-index="${index}" data-date="${day.date}">
          <div class="forecast-day__date">${index === 0 ? '今天' : week}</div>
          <span class="material-icons forecast-day__icon">${icon}</span>
          <div class="forecast-day__temp">
            <span class="forecast-day__temp-high">${formatTemp(day.tempDay)}</span>
            <span class="forecast-day__temp-low">${formatTemp(day.tempNight)}</span>
          </div>
        </div>
      `;
    });
    
    containerEl.innerHTML = html;
    
    // 绑定点击事件
    $$('.forecast-day').forEach(el => {
      on(el, 'click', () => {
        const index = parseInt(el.dataset.index);
        const date = el.dataset.date;
        this.onForecastClick(index, date);
      });
    });
  },
  
  /**
   * 渲染生活建议
   */
  renderLifeAdvice(weatherData) {
    const adviceGridEl = $('.life-advice-grid');
    if (!adviceGridEl) return;
    
    // 生成建议
    const advice = LifeAdviceGenerator.generate(weatherData);
    
    adviceGridEl.innerHTML = `
      <div class="card advice-card animate-enter" data-animation-delay="100">
        <span class="material-icons advice-card__icon icon--large">${advice.clothing.icon}</span>
        <div class="advice-card__title">${advice.clothing.title}</div>
        <div class="advice-card__content">${advice.clothing.content}</div>
      </div>
      
      <div class="card advice-card animate-enter" data-animation-delay="200">
        <span class="material-icons advice-card__icon icon--large">${advice.uvProtection.icon}</span>
        <div class="advice-card__title">防晒</div>
        <div class="advice-card__content">${advice.uvProtection.content}</div>
      </div>
      
      <div class="card advice-card animate-enter" data-animation-delay="300">
        <span class="material-icons advice-card__icon icon--large">${advice.sport.icon}</span>
        <div class="advice-card__title">运动</div>
        <div class="advice-card__content">${advice.sport.content}</div>
      </div>
      
      <div class="card advice-card animate-enter" data-animation-delay="400">
        <span class="material-icons advice-card__icon icon--large">${advice.carWash.icon}</span>
        <div class="advice-card__title">洗车</div>
        <div class="advice-card__content">${advice.carWash.content}</div>
      </div>
      
      <div class="card advice-card advice-card--full animate-enter" data-animation-delay="500">
        <span class="material-icons advice-card__icon icon--large">${advice.rain.icon}</span>
        <div class="advice-card__title">${advice.rain.title}</div>
        <div class="advice-card__content">${advice.rain.content}</div>
      </div>
      
      <div class="card advice-card advice-card--full animate-enter" data-animation-delay="600">
        <span class="material-icons advice-card__icon icon--large">${advice.virus.icon}</span>
        <div class="advice-card__title">健康提示</div>
        <div class="advice-card__content">${advice.virus.content}</div>
      </div>
    `;
  },
  
  /**
   * 更新头部信息
   */
  updateHeader() {
    const locationEl = $('.header__location .header__city');
    if (locationEl) {
      locationEl.textContent = this.currentCity;
    }
    
    const timeEl = $('.header__time');
    if (timeEl) {
      timeEl.textContent = formatTime(new Date(), false);
    }
  },
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 刷新按钮
    const refreshBtn = $('.refresh-btn');
    if (refreshBtn) {
      on(refreshBtn, 'click', () => this.handleRefresh());
    }
    
    // 城市选择
    const locationEl = $('.header__location');
    if (locationEl) {
      on(locationEl, 'click', () => CitySelector.open());
    }
    
    // 下拉刷新（移动端）
    if (isMobile()) {
      this.initPullToRefresh();
    }
    
    // 定时更新时间
    setInterval(() => this.updateHeader(), 1000);
  },
  
  /**
   * 处理刷新
   */
  async handleRefresh() {
    const refreshBtn = $('.refresh-btn');
    if (!refreshBtn) return;
    
    // 添加旋转动画
    refreshBtn.classList.add('is-refreshing');
    
    // 重新加载数据
    await this.loadWeather();
    
    // 移除动画
    setTimeout(() => {
      refreshBtn.classList.remove('is-refreshing');
    }, 800);
  },
  
  /**
   * 初始化下拉刷新
   */
  initPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    const threshold = 100; // 下拉阈值
    
    on(document, 'touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        isPulling = true;
      }
    });
    
    on(document, 'touchmove', (e) => {
      if (!isPulling) return;
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;
      
      if (diff > 0 && diff < threshold * 2) {
        e.preventDefault();
      }
    });
    
    on(document, 'touchend', async (e) => {
      if (!isPulling) return;
      const endY = e.changedTouches[0].pageY;
      const diff = endY - startY;
      
      if (diff > threshold) {
        await this.handleRefresh();
      }
      
      isPulling = false;
    });
  },
  
  /**
   * 预报点击处理
   */
  onForecastClick(index, date) {
    console.log('点击预报:', index, date);
    
    // 跳转到图表页面
    if (window.App && window.App.navigate) {
      App.navigate('chart', { date, index });
    }
  },
  
  /**
   * 显示/隐藏加载状态
   */
  showLoading(show) {
    const refreshBtn = $('.refresh-btn');
    if (refreshBtn) {
      if (show) {
        refreshBtn.classList.add('is-refreshing');
      } else {
        refreshBtn.classList.remove('is-refreshing');
      }
    }
  },
  
  /**
   * 添加入场动画
   */
  addEnterAnimations() {
    // 延迟添加入场动画，确保 DOM 已就绪
    setTimeout(() => {
      $$('.animate-enter').forEach((el, index) => {
        const delay = parseInt(el.dataset.animationDelay) || index * 100;
        addEnterAnimation(el, delay);
      });
    }, 100);
  },
  
  /**
   * 获取天气图标名称（Material Icons）
   */
  getWeatherIcon(weather) {
    if (!weather) return 'wb_sunny';
    
    const map = {
      '晴': 'wb_sunny',
      '多云': 'partly_cloudy_day',
      '阴': 'cloud',
      '小雨': 'rainy',
      '中雨': 'rainy',
      '大雨': 'thunderstorm',
      '暴雨': 'thunderstorm',
      '雷阵雨': 'thunderstorm',
      '小雪': 'snowing',
      '中雪': 'snowing',
      '大雪': 'snowing',
      '雾': 'foggy',
      '霾': 'blur_on',
      '沙尘': 'grain'
    };
    
    // 模糊匹配
    for (const key in map) {
      if (weather.includes(key)) {
        return map[key];
      }
    }
    
    return 'wb_sunny'; // 默认晴天
  }
};

// ==================== 主题管理器 ====================
const ThemeManager = {
  /**
   * 根据天气和时间更新主题
   */
  update(weatherData) {
    const hour = new Date().getHours();
    const isNightTime = isNight(hour);
    const weather = weatherData.realtime?.weather || '';
    
    let theme = APP_CONFIG.THEMES.SUNNY_DAY;
    
    // 判断主题
    if (isNightTime) {
      theme = APP_CONFIG.THEMES.NIGHT;
    } else if (weather.includes('雨')) {
      theme = APP_CONFIG.THEMES.RAINY_DAY;
    } else if (weather.includes('云') || weather.includes('阴')) {
      theme = APP_CONFIG.THEMES.CLOUDY_DAY;
    } else {
      theme = APP_CONFIG.THEMES.SUNNY_DAY;
    }
    
    // 设置到 body
    document.body.setAttribute('data-theme', theme);
    
    // 保存到存储
    setStorage('currentTheme', theme);
    
    console.log('主题更新:', theme);
  },
  
  /**
   * 获取当前主题
   */
  getCurrent() {
    return getStorage('currentTheme', APP_CONFIG.THEMES.SUNNY_DAY);
  }
};

// ==================== 城市选择器 ====================
const CitySelector = {
  // 热门城市列表
  popularCities: [
    { name: '北京', code: '110000' },
    { name: '上海', code: '310000' },
    { name: '广州', code: '440100' },
    { name: '深圳', code: '440300' },
    { name: '成都', code: '510100' },
    { name: '杭州', code: '330100' },
    { name: '武汉', code: '420100' },
    { name: '西安', code: '610100' },
    { name: '南京', code: '320100' },
    { name: '重庆', code: '500000' }
  ],
  
  /**
   * 打开城市选择弹窗
   */
  open() {
    const modal = $('#cityModal');
    if (!modal) return;
    
    // 渲染城市列表
    this.renderList();
    
    // 显示弹窗
    modal.classList.add('city-modal--visible');
    document.body.classList.add('no-scroll');
    
    // 绑定关闭事件
    const closeBtn = $('.city-modal__close');
    if (closeBtn) {
      on(closeBtn, 'click', () => this.close());
    }
    
    on(modal, 'click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });
  },
  
  /**
   * 关闭弹窗
   */
  close() {
    const modal = $('#cityModal');
    if (!modal) return;
    
    modal.classList.remove('city-modal--visible');
    document.body.classList.remove('no-scroll');
  },
  
  /**
   * 渲染城市列表
   */
  renderList() {
    const listEl = $('.city-list');
    if (!listEl) return;
    
    const currentCity = WeatherPage.currentCity;
    
    let html = '';
    this.popularCities.forEach(city => {
      const isCurrent = city.name === currentCity;
      html += `
        <div class="city-item ${isCurrent ? 'city-item--current' : ''}" data-code="${city.code}" data-name="${city.name}">
          <span>${city.name}</span>
          ${isCurrent ? '<span class="material-icons" style="font-size: 16px;">check</span>' : ''}
        </div>
      `;
    });
    
    listEl.innerHTML = html;
    
    // 绑定点击事件
    $$('.city-item').forEach(el => {
      on(el, 'click', () => {
        const code = el.dataset.code;
        const name = el.dataset.name;
        this.selectCity(code, name);
      });
    });
  },
  
  /**
   * 选择城市
   */
  selectCity(code, name) {
    console.log('选择城市:', name, code);
    
    // 保存选择
    setStorage('selectedCity', code);
    
    // 更新天气页面
    WeatherPage.currentCity = name;
    WeatherPage.loadWeather();
    
    // 关闭弹窗
    this.close();
  }
};

// ==================== 背景动画管理器 ====================
const BackgroundAnimation = {
  container: null,
  
  /**
   * 初始化背景动画
   */
  init() {
    this.container = $('#backgroundContainer');
    if (!this.container) return;
    
    // 根据主题创建动画
    const theme = ThemeManager.getCurrent();
    this.create(theme);
  },
  
  /**
   * 创建对应类型的背景动画
   */
  create(theme) {
    if (!this.container) return;
    
    // 清空容器
    this.container.innerHTML = '';
    
    switch (theme) {
      case 'sunny':
        this.createSunny();
        break;
      case 'rainy':
        this.createRainy();
        break;
      case 'cloudy':
        this.createCloudy();
        break;
      case 'night':
        this.createNight();
        break;
    }
  },
  
  /**
   * 晴天动画
   */
  createSunny() {
    // 添加阳光粒子
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = createElement('div', {
        className: 'sun-particle'
      });
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = (10 + Math.random() * 10) + 's';
      this.container.appendChild(particle);
    }
    
    // 添加太阳光晕
    const glow = createElement('div', { className: 'sun-glow' });
    this.container.appendChild(glow);
  },
  
  /**
   * 雨天动画
   */
  createRainy() {
    const dropCount = 100;
    for (let i = 0; i < dropCount; i++) {
      const drop = createElement('div', { className: 'raindrop' });
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDelay = Math.random() * 2 + 's';
      drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
      this.container.appendChild(drop);
    }
  },
  
  /**
   * 多云动画
   */
  createCloudy() {
    const clouds = ['cloud--1', 'cloud--2', 'cloud--3'];
    clouds.forEach(className => {
      const cloud = createElement('div', { className: `cloud ${className}` });
      this.container.appendChild(cloud);
    });
  },
  
  /**
   * 夜晚动画
   */
  createNight() {
    // 添加星星
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const star = createElement('div', { className: 'star' });
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 60 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      this.container.appendChild(star);
    }
    
    // 添加流星
    const shootingStar = createElement('div', { className: 'shooting-star' });
    shootingStar.style.top = Math.random() * 30 + '%';
    shootingStar.style.right = Math.random() * 50 + '%';
    shootingStar.style.animationDelay = Math.random() * 2 + 's';
    this.container.appendChild(shootingStar);
    
    // 添加月亮光晕
    const moonGlow = createElement('div', { className: 'moon-glow' });
    this.container.appendChild(moonGlow);
  }
};

// 导出到全局
window.WeatherPage = WeatherPage;
window.ThemeManager = ThemeManager;
window.CitySelector = CitySelector;
window.BackgroundAnimation = BackgroundAnimation;
