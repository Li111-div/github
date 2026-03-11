/**
 * api.js - 高德天气 API 封装 + 模拟数据
 * 包含 API 请求、数据解析、模拟数据等功能
 */

// ==================== API 配置 ====================
const WeatherAPI = {
  // TODO: 请在此处替换您的高德天气 API Key
  // 获取方式：访问 https://lbs.amap.com/ 注册开发者账号，创建应用获取 Key
  API_KEY: APP_CONFIG.AMAP_API_KEY,
  
  // 高德天气 API 基础 URL
  BASE_URL: APP_CONFIG.AMAP_WEATHER_URL,
  
  // 默认城市（北京）
  DEFAULT_CITY: APP_CONFIG.DEFAULT_CITY,
  
  /**
   * 获取实时天气数据
   * @param {string} city - 城市编码（高德城市 code）
   * @returns {Promise<object>}
   */
  async getWeatherRealtime(city = this.DEFAULT_CITY) {
    return this._request({
      city,
      extensions: 'base' // base 返回实时天气
    });
  },
  
  /**
   * 获取天气预报数据（未来 3-4 天）
   * @param {string} city - 城市编码
   * @returns {Promise<object>}
   */
  async getWeatherForecast(city = this.DEFAULT_CITY) {
    return this._request({
      city,
      extensions: 'all' // all 返回实时 + 预报
    });
  },
  
  /**
   * 内部请求方法
   * @private
   * @param {object} params - 请求参数
   * @returns {Promise<object>}
   */
  async _request(params) {
    const defaultParams = {
      key: this.API_KEY,
      city: params.city || this.DEFAULT_CITY,
      extensions: params.extensions || 'base'
    };
    
    // 使用 jQuery AJAX 请求（项目要求）
    return new Promise((resolve, reject) => {
      $.ajax({
        url: this.BASE_URL,
        type: 'GET',
        data: defaultParams,
        dataType: 'json',
        timeout: 10000,
        success: (response) => {
          if (response.status === '1') {
            // API 调用成功
            const data = this._parseResponse(response, params.extensions);
            resolve(data);
          } else {
            // API 返回错误
            console.warn('高德 API 返回错误:', response.info);
            // 使用模拟数据兜底
            resolve(this.getMockData());
          }
        },
        error: (xhr, status, error) => {
          console.error('高德 API 请求失败:', error);
          // 请求失败时使用模拟数据兜底
          resolve(this.getMockData());
        }
      });
    });
  },
  
  /**
   * 解析 API 响应数据
   * @private
   * @param {object} response - API 原始响应
   * @param {string} extension - 扩展类型（base/all）
   * @returns {object}
   */
  _parseResponse(response, extension = 'base') {
    const weatherData = response.lives?.[0];
    const forecasts = response.forecasts?.[0];
    
    if (!weatherData && !forecasts) {
      return this.getMockData();
    }
    
    const result = {
      // 基础信息
      city: weatherData?.city || forecasts?.city || '未知城市',
      adcode: weatherData?.adcode || forecasts?.adcode || '',
      reportTime: weatherData?.reporttime || forecasts?.reporttime || '',
      
      // 实时天气
      realtime: null,
      
      // 天气预报
      forecast: null
    };
    
    // 解析实时天气
    if (weatherData) {
      result.realtime = {
        temperature: parseFloat(weatherData.temperature) || 0,
        feelsLike: parseFloat(weatherData.feelslike) || 0,
        humidity: parseFloat(weatherData.humidity) || 0,
        weather: weatherData.weather || '晴',
        windDirection: weatherData.winddirection || '北',
        windPower: weatherData.windpower || 0,
        windSpeed: this._windPowerToSpeed(windPower),
        uvIndex: this._calculateUVIndex(), // 高德 API 不直接返回，需计算
        visibility: parseFloat(weatherData.visibility) || 10,
        pressure: 1013 // 高德 API 未返回，使用标准值
      };
    }
    
    // 解析天气预报
    if (forecasts && extension === 'all') {
      result.forecast = forecasts.predicts.map(day => ({
        date: day.date,
        week: day.week,
        weatherDay: day.dayweather,
        weatherNight: day.nightweather,
        tempDay: parseFloat(day.daytemp) || 0,
        tempNight: parseFloat(day.nighttemp) || 0,
        windDirectionDay: day.daywind,
        windPowerDay: day.daypower,
        windDirectionNight: day.nightwind,
        windPowerNight: day.nightpower,
        precipitation: this._calculatePrecipitation(day.dayweather)
      }));
    }
    
    return result;
  },
  
  /**
   * 风力等级转风速（m/s）
   * @private
   * @param {number} power - 风力等级
   * @returns {number}
   */
  _windPowerToSpeed(power) {
    const level = parseInt(power) || 0;
    // 简化换算
    const speedMap = {
      0: 0.3, 1: 1.0, 2: 2.0, 3: 4.0, 4: 6.5,
      5: 9.0, 6: 11.5, 7: 14.5, 8: 18.0, 9: 21.5,
      10: 25.5, 11: 29.5, 12: 33.5
    };
    return speedMap[level] || level * 2.5;
  },
  
  /**
   * 根据天气状况估算降水概率
   * @private
   * @param {string} weather - 天气状况
   * @returns {number}
   */
  _calculatePrecipitation(weather) {
    if (!weather) return 0;
    if (weather.includes('雨')) return weather.includes('小') ? 30 : weather.includes('中') ? 60 : 80;
    if (weather.includes('雪')) return 40;
    if (weather.includes('雾')) return 10;
    return 0;
  },
  
  /**
   * 估算紫外线指数（基于时间和天气）
   * @private
   * @returns {number}
   */
  _calculateUVIndex() {
    const hour = new Date().getHours();
    // 简单估算：白天中午最高
    if (hour < 6 || hour >= 18) return 0;
    if (hour >= 10 && hour <= 14) return 6;
    if (hour >= 8 && hour <= 16) return 4;
    return 2;
  },
  
  // ==================== 模拟数据（API 不可用时使用） ====================
  
  /**
   * 获取模拟天气数据
   * @returns {object}
   */
  getMockData() {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour < 6 || hour >= 18;
    
    // 模拟不同天气场景
    const mockWeathers = [
      { name: '晴', icon: 'sunny', theme: isNight ? 'night' : 'sunny' },
      { name: '多云', icon: 'cloudy', theme: 'cloudy' },
      { name: '小雨', icon: 'rainy', theme: 'rainy' },
      { name: '阴', icon: 'cloudy', theme: 'cloudy' }
    ];
    
    const selectedWeather = mockWeathers[0]; // 默认晴天
    
    return {
      city: '北京市',
      adcode: '110000',
      reportTime: now.toISOString(),
      
      realtime: {
        temperature: isNight ? 18 : 25,
        feelsLike: isNight ? 17 : 26,
        humidity: isNight ? 65 : 45,
        weather: selectedWeather.name,
        windDirection: '东南',
        windSpeed: 3.5,
        windPower: 2,
        uvIndex: isNight ? 0 : 5,
        visibility: 10,
        pressure: 1013
      },
      
      forecast: this._getMockForecast()
    };
  },
  
  /**
   * 获取模拟的 7 天预报数据
   * @private
   * @returns {Array}
   */
  _getMockForecast() {
    const weathers = ['晴', '多云', '阴', '小雨', '晴', '多云', '晴'];
    const forecast = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const baseTemp = 20 + Math.random() * 10;
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        week: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
        weatherDay: weathers[i],
        weatherNight: weathers[i] === '小雨' ? '阴' : weathers[i],
        tempDay: Math.round(baseTemp + Math.random() * 5),
        tempNight: Math.round(baseTemp - 8 - Math.random() * 3),
        windDirectionDay: ['东', '南', '西', '北'][Math.floor(Math.random() * 4)],
        windPowerDay: Math.floor(Math.random() * 4),
        windDirectionNight: ['东', '南', '西', '北'][Math.floor(Math.random() * 4)],
        windPowerNight: Math.floor(Math.random() * 3),
        precipitation: weathers[i].includes('雨') ? 60 : 0
      });
    }
    
    return forecast;
  },
  
  /**
   * 获取模拟的小时温度数据（用于 24 小时趋势图）
   * @param {number} baseTemp - 基础温度
   * @returns {Array}
   */
  getMockHourlyTemp(baseTemp = 25) {
    const hourly = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() + i);
      
      // 模拟温度变化：凌晨最低，下午最高
      const hour = time.getHours();
      let tempOffset = 0;
      
      if (hour >= 0 && hour < 6) tempOffset = -5;
      else if (hour >= 6 && hour < 9) tempOffset = -2;
      else if (hour >= 9 && hour < 12) tempOffset = 2;
      else if (hour >= 12 && hour < 15) tempOffset = 5;
      else if (hour >= 15 && hour < 18) tempOffset = 3;
      else tempOffset = 0;
      
      hourly.push({
        time: formatTime(time, false),
        temp: Math.round(baseTemp + tempOffset + Math.random() * 2 - 1),
        feelsLike: Math.round(baseTemp + tempOffset + Math.random() * 3 - 1)
      });
    }
    
    return hourly;
  }
};

// ==================== 生活建议生成 ====================

const LifeAdviceGenerator = {
  /**
   * 根据天气数据生成生活建议
   * @param {object} weatherData - 天气数据
   * @returns {object}
   */
  generate(weatherData) {
    const { realtime, forecast } = weatherData;
    
    return {
      clothing: this._generateClothingAdvice(realtime),
      uvProtection: this._generateUVAdvice(realtime),
      sport: this._generateSportAdvice(realtime, forecast),
      carWash: this._generateCarWashAdvice(forecast),
      rain: this._generateRainAdvice(forecast),
      virus: this._generateVirusAdvice(realtime)
    };
  },
  
  /**
   * 穿衣建议
   * @private
   */
  _generateClothingAdvice(realtime) {
    const temp = realtime.temperature;
    const weather = realtime.weather;
    
    if (temp >= 30) {
      return {
        title: '炎热',
        content: '建议穿短衫、短裤等夏季服装，注意防暑降温',
        icon: 'thermostat'
      };
    } else if (temp >= 25) {
      return {
        title: '温暖',
        content: '建议穿单层棉麻衬衫、薄长裙，舒适透气',
        icon: 'checkroom'
      };
    } else if (temp >= 20) {
      return {
        title: '舒适',
        content: '建议穿薄外套 + T 恤，早晚注意适当保暖',
        icon: 'checkroom'
      };
    } else if (temp >= 15) {
      return {
        title: '凉爽',
        content: '建议穿夹克、风衣 + 长袖衬衫，注意保暖',
        icon: 'checkroom'
      };
    } else if (temp >= 10) {
      return {
        title: '较冷',
        content: '建议穿厚外套、毛衣，体弱者可穿薄羽绒服',
        icon: 'checkroom'
      };
    } else {
      return {
        title: '寒冷',
        content: '建议穿厚羽绒服、毛衣，戴围巾手套，注意防寒保暖',
        icon: 'ac_unit'
      };
    }
  },
  
  /**
   * 紫外线防护建议
   * @private
   */
  _generateUVAdvice(realtime) {
    const uv = realtime.uvIndex || 0;
    const formatted = formatUVIndex(uv);
    
    return {
      title: `紫外线${formatted.level}`,
      content: formatted.suggestion,
      icon: 'wb_sunny'
    };
  },
  
  /**
   * 运动建议
   * @private
   */
  _generateSportAdvice(realtime, forecast) {
    const weather = realtime.weather;
    const temp = realtime.temperature;
    
    if (weather.includes('雨') || weather.includes('雪')) {
      return {
        title: '不宜户外',
        content: '今天有降水，建议选择室内运动，如瑜伽、健身操等',
        icon: 'fitness_center'
      };
    } else if (temp > 32) {
      return {
        title: '避免暴晒',
        content: '气温较高，建议避免在烈日下运动，可选择清晨或傍晚',
        icon: 'sports'
      };
    } else if (temp < 5) {
      return {
        title: '注意保暖',
        content: '气温较低，户外运动前请充分热身，注意保暖',
        icon: 'sports'
      };
    } else {
      return {
        title: '适宜运动',
        content: '天气条件良好，适合进行各类户外运动，如跑步、骑行等',
        icon: 'directions_run'
      };
    }
  },
  
  /**
   * 洗车建议
   * @private
   */
  _generateCarWashAdvice(forecast) {
    if (!forecast) {
      return {
        title: '适宜洗车',
        content: '近期天气良好，适宜洗车',
        icon: 'local_car_wash'
      };
    }
    
    const hasRain = forecast.slice(0, 3).some(day => 
      day.weatherDay.includes('雨') || day.weatherDay.includes('雪')
    );
    
    if (hasRain) {
      return {
        title: '不宜洗车',
        content: '未来几天可能有降水，洗车后容易变脏，建议推迟',
        icon: 'block'
      };
    } else {
      return {
        title: '适宜洗车',
        content: '未来几天天气晴朗，适宜洗车',
        icon: 'local_car_wash'
      };
    }
  },
  
  /**
   * 下雨提示
   * @private
   */
  _generateRainAdvice(forecast) {
    if (!forecast) {
      return {
        title: '无降雨',
        content: '近期无降雨，可以放心出行',
        icon: 'cloud_done'
      };
    }
    
    const todayRain = forecast[0]?.precipitation || 0;
    const tomorrowRain = forecast[1]?.precipitation || 0;
    
    if (todayRain > 50) {
      return {
        title: '有雨带伞',
        content: '今天降水概率较大，出门请携带雨具',
        icon: 'umbrella',
        alert: true
      };
    } else if (tomorrowRain > 50) {
      return {
        title: '明天有雨',
        content: '明天可能下雨，请提前准备雨具',
        icon: 'umbrella'
      };
    } else {
      return {
        title: '晴朗干燥',
        content: '近期无降雨，空气干燥，注意补水保湿',
        icon: 'water_drop'
      };
    }
  },
  
  /**
   * 病毒传染提示
   * @private
   */
  _generateVirusAdvice(realtime) {
    const temp = realtime.temperature;
    const humidity = realtime.humidity;
    
    // 温差大、干燥时易感冒
    if (temp < 15 || humidity < 30) {
      return {
        title: '易感冒',
        content: '气温较低或空气干燥，病毒活跃，请注意保暖和通风',
        icon: 'coronavirus'
      };
    } else if (temp > 30 && humidity > 70) {
      return {
        title: '注意防暑',
        content: '高温高湿环境易滋生细菌，注意饮食卫生',
        icon: 'warning'
      };
    } else {
      return {
        title: '健康舒适',
        content: '气象条件较好，不易引发感冒等疾病',
        icon: 'favorite'
      };
    }
  }
};

// 导出到全局
window.WeatherAPI = WeatherAPI;
window.LifeAdviceGenerator = LifeAdviceGenerator;
