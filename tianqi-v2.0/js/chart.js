/**
 * chart.js - 详细天气图表界面逻辑
 * 使用 ECharts 实现温度趋势、降水概率、风力风向等图表
 */

// ==================== 图表页面模块 ====================
const ChartPage = {
  // 当前选中的图表类型
  currentChart: 'temperature',
  
  // ECharts 实例存储
  charts: {},
  
  // 天气数据
  weatherData: null,
  
  /**
   * 初始化图表页面
   */
  async init(options = {}) {
    console.log('ChartPage 初始化', options);
    
    // 加载数据
    await this.loadData();
    
    // 渲染页面
    this.render();
    
    // 绑定事件
    this.bindEvents();
    
    // 延迟初始化图表（确保容器已渲染）
    setTimeout(() => {
      this.initCharts();
    }, 300);
  },
  
  /**
   * 加载数据
   */
  async loadData() {
    // 优先从缓存读取
    const cached = getStorage('lastWeatherData');
    if (cached) {
      this.weatherData = cached;
    } else {
      // 请求新数据
      this.weatherData = await WeatherAPI.getWeatherForecast();
    }
  },
  
  /**
   * 渲染页面
   */
  render() {
    if (!this.weatherData) return;
    
    // 更新页面标题
    const titleEl = $('.chart-header__title');
    if (titleEl) {
      titleEl.textContent = `${this.weatherData.city}天气趋势`;
    }
  },
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    const backBtn = $('.chart-header__back');
    if (backBtn) {
      on(backBtn, 'click', () => {
        if (window.App && App.navigate) {
          App.navigate('weather');
        }
      });
    }
    
    // 图表标签切换
    $$('.chart-tabs__item').forEach(item => {
      on(item, 'click', () => {
        const chartType = item.dataset.chart;
        this.switchChart(chartType);
      });
    });
    
    // 窗口大小改变时重绘图表
    window.addEventListener('resize', debounce(() => {
      this.resizeCharts();
    }, 300));
  },
  
  /**
   * 切换图表
   */
  switchChart(chartType) {
    if (this.currentChart === chartType) return;
    
    // 更新激活状态
    $$('.chart-tabs__item').forEach(item => {
      item.classList.toggle('chart-tabs__item--active', item.dataset.chart === chartType);
    });
    
    // 隐藏所有图表容器
    $$('.chart-container').forEach(container => {
      container.classList.remove('chart-container--active');
    });
    
    // 显示目标图表
    const targetContainer = $(`#chart-${chartType}`);
    if (targetContainer) {
      targetContainer.classList.add('chart-container--active');
      
      // 如果图表未初始化，则初始化
      if (!this.charts[chartType]) {
        setTimeout(() => {
          this.initChart(chartType);
        }, 100);
      }
    }
    
    this.currentChart = chartType;
  },
  
  /**
   * 初始化所有图表
   */
  initCharts() {
    this.initChart('temperature');
    this.initChart('precipitation');
    this.initChart('wind');
  },
  
  /**
   * 初始化单个图表
   */
  initChart(type) {
    const container = $(`#chart-${type}`);
    if (!container) return;
    
    const wrapper = container.querySelector('.chart-wrapper');
    if (!wrapper) return;
    
    // 创建 ECharts 实例
    const chart = echarts.init(wrapper, null, {
      renderer: 'canvas',
      devicePixelRatio: window.devicePixelRatio || 1
    });
    
    // 根据类型设置选项
    let option;
    switch (type) {
      case 'temperature':
        option = this.getTemperatureOption();
        break;
      case 'precipitation':
        option = this.getPrecipitationOption();
        break;
      case 'wind':
        option = this.getWindOption();
        break;
    }
    
    if (option) {
      chart.setOption(option);
      this.charts[type] = chart;
    }
  },
  
  /**
   * 获取温度趋势图配置
   */
  getTemperatureOption() {
    const forecast = this.weatherData?.forecast || [];
    const hourlyTemp = WeatherAPI.getMockHourlyTemp(25);
    
    // 24 小时温度数据
    const hours = hourlyTemp.map(h => h.time);
    const temps = hourlyTemp.map(h => h.temp);
    const feelsLikeTemps = hourlyTemp.map(h => h.feelsLike);
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          const time = params[0].name;
          let html = `<div style="font-weight: 600; margin-bottom: 4px;">${time}</div>`;
          params.forEach(param => {
            const color = param.color;
            const name = param.seriesName;
            const value = param.value;
            html += `<div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; background: ${color}; border-radius: 50%;"></span>
              <span>${name}: ${value}°C</span>
            </div>`;
          });
          return html;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisLabel: { 
          color: 'rgba(255, 255, 255, 0.7)',
          formatter: '{value}°'
        }
      },
      series: [
        {
          name: '实时温度',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: temps,
          lineStyle: {
            color: '#FF9800',
            width: 3
          },
          itemStyle: {
            color: '#FF9800',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 152, 0, 0.5)' },
              { offset: 1, color: 'rgba(255, 152, 0, 0.05)' }
            ])
          }
        },
        {
          name: '体感温度',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: feelsLikeTemps,
          lineStyle: {
            color: '#2196F3',
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: '#2196F3',
            borderColor: '#fff',
            borderWidth: 2
          }
        }
      ]
    };
  },
  
  /**
   * 获取降水概率图配置
   */
  getPrecipitationOption() {
    const forecast = this.weatherData?.forecast || [];
    
    const dates = forecast.map(day => {
      const date = new Date(day.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const precipitation = forecast.map(day => day.precipitation || 0);
    const weatherIcons = forecast.map(day => this.getWeatherIcon(day.weatherDay));
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          const param = params[0];
          return `${param.name}<br/>降水概率：${param.value}%`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisLabel: { 
          color: 'rgba(255, 255, 255, 0.7)',
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '降水概率',
          type: 'bar',
          barWidth: '40%',
          data: precipitation,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2196F3' },
              { offset: 1, color: 'rgba(33, 150, 243, 0.3)' }
            ]),
            borderRadius: [8, 8, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: 'rgba(255, 255, 255, 0.8)',
            formatter: '{c}%'
          }
        }
      ]
    };
  },
  
  /**
   * 获取风力风向图配置
   */
  getWindOption() {
    const forecast = this.weatherData?.forecast || [];
    
    const dates = forecast.map(day => {
      const date = new Date(day.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    // 风力等级转风速
    const windSpeeds = forecast.map(day => {
      const power = parseInt(day.windPowerDay) || 0;
      return Math.min(power * 2.5, 30);
    });
    
    // 风向转角度
    const windDirections = forecast.map(day => {
      const dirMap = { '北': 0, '东北': 45, '东': 90, '东南': 135, '南': 180, '西南': 225, '西': 270, '西北': 315 };
      return dirMap[day.windDirectionDay] || 0;
    });
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          const param = params[0];
          const speed = param.value;
          const level = Math.round(speed / 2.5);
          return `${param.name}<br/>风速：${speed.toFixed(1)}m/s<br/>风力：${level}级`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisLabel: { 
          color: 'rgba(255, 255, 255, 0.7)',
          formatter: '{value}m/s'
        }
      },
      series: [
        {
          name: '风速',
          type: 'line',
          smooth: true,
          symbol: 'triangle',
          symbolSize: 10,
          symbolRotate: (index) => windDirections[index] || 0,
          data: windSpeeds,
          lineStyle: {
            color: '#607D8B',
            width: 3
          },
          itemStyle: {
            color: '#607D8B',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(96, 125, 139, 0.5)' },
              { offset: 1, color: 'rgba(96, 125, 139, 0.05)' }
            ])
          }
        }
      ]
    };
  },
  
  /**
   * 重绘所有图表
   */
  resizeCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  },
  
  /**
   * 销毁图表
   */
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.dispose === 'function') {
        chart.dispose();
      }
    });
    this.charts = {};
  },
  
  /**
   * 获取天气图标
   */
  getWeatherIcon(weather) {
    const map = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '小雨': '🌧️',
      '中雨': '🌧️',
      '大雨': '⛈️',
      '雷阵雨': '⛈️',
      '小雪': '🌨️',
      '大雪': '❄️'
    };
    
    for (const key in map) {
      if (weather.includes(key)) {
        return map[key];
      }
    }
    
    return '☀️';
  }
};

// 导出到全局
window.ChartPage = ChartPage;
