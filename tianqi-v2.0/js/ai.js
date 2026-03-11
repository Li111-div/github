/**
 * ai.js - AI 助手界面逻辑
 * 包含对话管理、打字机效果、建议生成等功能
 */

// ==================== AI 助手模块 ====================
const AIAssistant = {
  // AI 名称
  name: '小天同学',
  
  // 对话历史
  conversationHistory: [],
  
  // 是否正在生成回复
  isGenerating: false,
  
  // 当前城市（用于天气相关回答）
  currentCity: '北京',
  
  /**
   * 初始化 AI 助手
   */
  init() {
    console.log('AIAssistant 初始化');
    
    // 加载历史对话
    this.loadHistory();
    
    // 渲染欢迎界面
    this.renderWelcome();
    
    // 绑定事件
    this.bindEvents();
    
    // 更新城市
    this.currentCity = getStorage('selectedCity', APP_CONFIG.DEFAULT_CITY);
  },
  
  /**
   * 加载对话历史
   */
  loadHistory() {
    const history = getStorage('aiConversationHistory', []);
    this.conversationHistory = history;
  },
  
  /**
   * 保存对话历史
   */
  saveHistory() {
    // 只保留最近 20 条
    const recent = this.conversationHistory.slice(-20);
    setStorage('aiConversationHistory', recent);
  },
  
  /**
   * 渲染欢迎界面
   */
  renderWelcome() {
    const messagesContainer = $('.chat-messages');
    if (!messagesContainer) return;
    
    // 如果有历史记录，显示历史记录
    if (this.conversationHistory.length > 0) {
      this.renderHistory();
      return;
    }
    
    // 显示欢迎界面
    const welcomeHTML = `
      <div class="ai-welcome fade-in">
        <div class="ai-welcome__avatar">
          <span class="material-icons" style="font-size: 3rem; color: #fff;">wb_sunny</span>
        </div>
        <h2 class="ai-welcome__title">你好，我是${this.name}</h2>
        <p class="ai-welcome__subtitle">你的智能天气助手<br/>有任何天气问题都可以问我哦~</p>
        
        <div class="ai-features">
          <div class="feature-card animate-enter" data-delay="100">
            <span class="material-icons feature-card__icon">question_answer</span>
            <div class="feature-card__title">天气问答</div>
            <div class="feature-card__desc">解答各种天气疑问</div>
          </div>
          <div class="feature-card animate-enter" data-delay="200">
            <span class="material-icons feature-card__icon">today</span>
            <div class="feature-card__title">未来预报</div>
            <div class="feature-card__desc">预测未来天气趋势</div>
          </div>
          <div class="feature-card animate-enter" data-delay="300">
            <span class="material-icons feature-card__icon">tips_and_updates</span>
            <div class="feature-card__title">生活建议</div>
            <div class="feature-card__desc">提供贴心生活提示</div>
          </div>
        </div>
      </div>
    `;
    
    messagesContainer.innerHTML = welcomeHTML;
    
    // 添加入场动画
    setTimeout(() => {
      $$('.animate-enter').forEach((el, i) => {
        addEnterAnimation(el, parseInt(el.dataset.delay) || i * 100);
      });
    }, 100);
  },
  
  /**
   * 渲染历史对话
   */
  renderHistory() {
    const messagesContainer = $('.chat-messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    this.conversationHistory.forEach(msg => {
      this.appendMessage(msg.role, msg.content, false);
    });
    
    // 滚动到底部
    this.scrollToBottom();
  },
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    const backBtn = $('.ai-header__back');
    if (backBtn) {
      on(backBtn, 'click', () => {
        if (window.App && App.navigate) {
          App.navigate('weather');
        }
      });
    }
    
    // 输入框
    const inputEl = $('.ai-input-field');
    if (inputEl) {
      // 自动高度
      on(inputEl, 'input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
      });
      
      // 回车发送（Shift+Enter 换行）
      on(inputEl, 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });
    }
    
    // 发送按钮
    const sendBtn = $('.ai-send-btn');
    if (sendBtn) {
      on(sendBtn, 'click', () => this.handleSend());
    }
    
    // 快捷建议
    $$('.suggestion-chip').forEach(chip => {
      on(chip, 'click', () => {
        const question = chip.dataset.question;
        if (inputEl) {
          inputEl.value = question;
          this.handleSend();
        }
      });
    });
    
    // 清空对话按钮
    const clearBtn = $('.clear-chat-btn');
    if (clearBtn) {
      on(clearBtn, 'click', () => this.clearConversation());
    }
  },
  
  /**
   * 处理发送
   */
  async handleSend() {
    if (this.isGenerating) return;
    
    const inputEl = $('.ai-input-field');
    if (!inputEl) return;
    
    const question = inputEl.value.trim();
    if (!question) return;
    
    // 清空输入框
    inputEl.value = '';
    inputEl.style.height = 'auto';
    
    // 添加用户消息
    this.appendMessage('user', question);
    this.saveToHistory('user', question);
    
    // 隐藏欢迎界面
    this.hideWelcome();
    
    // 显示思考状态
    this.showThinking();
    
    // 生成回复
    this.isGenerating = true;
    const answer = await this.generateAnswer(question);
    this.isGenerating = false;
    
    // 移除思考状态
    this.removeThinking();
    
    // 添加 AI 回复（打字机效果）
    this.appendMessage('ai', answer, true, true);
    this.saveToHistory('ai', answer);
  },
  
  /**
   * 生成回答（模拟接口）
   * TODO: 实际项目中可替换为真实的 DeepSeek API 或其他 AI 接口
   */
  async generateAnswer(question) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    
    // 简单关键词匹配（模拟 AI）
    const q = question.toLowerCase();
    
    // 天气相关问题
    if (q.includes('天气') || q.includes('温度') || q.includes('下雨') || q.includes('晴天')) {
      return this.generateWeatherAnswer(question);
    }
    
    // 运动/活动相关问题
    if (q.includes('运动') || q.includes('爬山') || q.includes('跑步') || q.includes('户外')) {
      return this.generateSportAnswer(question);
    }
    
    // 穿衣相关问题
    if (q.includes('穿') || q.includes('衣服') || q.includes('穿搭')) {
      return this.generateClothingAnswer(question);
    }
    
    // 洗车相关问题
    if (q.includes('洗车')) {
      return this.generateCarWashAnswer(question);
    }
    
    // 健康相关问题
    if (q.includes('感冒') || q.includes('病毒') || q.includes('健康')) {
      return this.generateHealthAnswer(question);
    }
    
    // 默认回答
    return this.getDefaultAnswer(question);
  },
  
  /**
   * 生成天气相关回答
   */
  generateWeatherAnswer(question) {
    const weatherData = getStorage('lastWeatherData');
    const realtime = weatherData?.realtime;
    const forecast = weatherData?.forecast;
    
    if (!forecast) {
      return "抱歉，我暂时无法获取天气数据，请您查看主界面的天气信息。";
    }
    
    const today = forecast[0];
    const tomorrow = forecast[1];
    
    // 今天天气
    if (question.includes('今天')) {
      return `今天${this.currentCity}的天气是${today.weatherDay}，气温${today.tempNight}°C~${today.tempDay}°C。\n\n${this.getWeatherSuggestion(today.weatherDay)}`;
    }
    
    // 明天天气
    if (question.includes('明天')) {
      return `明天${this.currentCity}的天气是${tomorrow.weatherDay}，气温${tomorrow.tempNight}°C~${tomorrow.tempDay}°C。\n\n${this.getWeatherSuggestion(tomorrow.weatherDay)}`;
    }
    
    // 周末天气
    if (question.includes('周末') || question.includes('下周')) {
      const weekendForecast = forecast.slice(1, 4);
      let answer = `未来几天${this.currentCity}的天气情况：\n\n`;
      weekendForecast.forEach(day => {
        answer += `${day.week}：${day.weatherDay} ${day.tempNight}°C~${day.tempDay}°C\n`;
      });
      return answer;
    }
    
    // 一般天气查询
    return `目前${this.currentCity}${realtime?.weather || '晴'}，温度${formatTemp(realtime?.temperature || 25)}，湿度${realtime?.humidity || 45}%。\n\n${this.getWeatherSuggestion(realtime?.weather || '晴')}`;
  },
  
  /**
   * 生成运动建议回答
   */
  generateSportAnswer(question) {
    const weatherData = getStorage('lastWeatherData');
    const realtime = weatherData?.realtime;
    
    const weather = realtime?.weather || '晴';
    const temp = realtime?.temperature || 25;
    
    if (weather.includes('雨') || weather.includes('雪')) {
      return `今天${weather}，不太适合户外运动哦~\n\n建议您：\n• 选择室内运动，如瑜伽、健身操\n• 在家做一些简单的力量训练\n• 等天气好转再进行户外活动`;
    }
    
    if (temp > 32) {
      return `今天气温较高（${formatTemp(temp)}），请注意防暑降温。\n\n建议：\n• 避免在烈日下剧烈运动\n• 选择清晨或傍晚时段\n• 运动时注意补充水分\n• 推荐游泳等水上运动`;
    }
    
    if (temp < 5) {
      return `今天气温较低（${formatTemp(temp)}），户外运动请注意保暖。\n\n建议：\n• 充分热身后再开始运动\n• 穿着保暖透气的运动服\n• 携带外套，运动后及时穿上\n• 推荐慢跑、登山等运动`;
    }
    
    return `今天天气条件很好，非常适合户外运动！\n\n推荐活动：\n• 晨跑或夜跑\n• 骑行郊游\n• 爬山徒步\n• 球类运动\n\n记得做好热身和拉伸哦~`;
  },
  
  /**
   * 生成穿衣建议回答
   */
  generateClothingAnswer(question) {
    const weatherData = getStorage('lastWeatherData');
    const realtime = weatherData?.realtime;
    const temp = realtime?.temperature || 25;
    
    if (temp >= 30) {
      return `今天气温${formatTemp(temp)}，比较炎热。\n\n穿衣建议：\n• 短袖 T 恤、背心、短裤\n• 透气性好的棉麻材质\n• 浅色系服装反射阳光\n• 戴帽子、墨镜防晒`;
    } else if (temp >= 25) {
      return `今天气温${formatTemp(temp)}，温暖舒适。\n\n穿衣建议：\n• 薄款长袖衬衫、T 恤\n• 单层连衣裙、薄牛仔裤\n• 透气舒适的鞋子\n• 可备一件薄外套应对空调房`;
    } else if (temp >= 20) {
      return `今天气温${formatTemp(temp)}，比较舒适。\n\n穿衣建议：\n• 薄外套 + T 恤\n• 卫衣、针织衫\n• 休闲裤、长裙\n• 早晚温差大，注意适当保暖`;
    } else if (temp >= 15) {
      return `今天气温${formatTemp(temp)}，有些凉爽。\n\n穿衣建议：\n• 夹克、风衣\n• 厚卫衣 + 长袖内搭\n• 牛仔裤、休闲裤\n• 可以搭配围巾增加保暖度`;
    } else {
      return `今天气温${formatTemp(temp)}，比较寒冷。\n\n穿衣建议：\n• 羽绒服、棉服\n• 毛衣、保暖内衣\n• 加绒裤子\n• 戴围巾、手套、帽子\n• 注意脚部保暖`;
    }
  },
  
  /**
   * 生成洗车建议回答
   */
  generateCarWashAnswer(question) {
    const weatherData = getStorage('lastWeatherData');
    const forecast = weatherData?.forecast;
    
    if (!forecast) {
      return "抱歉，我暂时无法获取天气数据，请您先查看主界面的天气信息。";
    }
    
    const hasRain = forecast.slice(0, 3).some(day => 
      day.weatherDay.includes('雨') || day.weatherDay.includes('雪')
    );
    
    if (hasRain) {
      return "不建议近期洗车哦~\n\n未来几天可能有降水，洗车后容易变脏，建议您：\n• 等天气晴朗后再洗车\n• 如需清洁，可做简单擦拭\n• 关注天气预报，选择连续晴天`;
    } else {
      return "很适合洗车呢！\n\n未来几天天气晴朗，建议您：\n• 选择上午或下午阳光不强烈时\n• 使用专业洗车液保护车漆\n• 清洗后及时擦干避免水渍\n• 可以打蜡增加光泽度";
    }
  },
  
  /**
   * 生成健康建议回答
   */
  generateHealthAnswer(question) {
    const weatherData = getStorage('lastWeatherData');
    const realtime = weatherData?.realtime;
    const temp = realtime?.temperature || 25;
    const humidity = realtime?.humidity || 50;
    
    if (temp < 15 || humidity < 30) {
      return "当前气象条件下容易引发感冒，请注意防护：\n\n健康建议：\n• 及时增添衣物，注意保暖\n• 多喝温水，保持身体水分\n• 室内定时通风换气\n• 勤洗手，少去人群密集场所\n• 可适当补充维生素 C";
    } else if (temp > 30 && humidity > 70) {
      return "高温高湿环境容易滋生细菌，请注意：\n\n健康建议：\n• 注意饮食卫生，避免生冷食物\n• 适当使用空调除湿\n• 保持充足睡眠\n• 适量运动增强免疫力\n• 如有不适应及时就医";
    } else {
      return "当前气象条件较好，不易引发疾病。\n\n日常建议：\n• 保持规律作息\n• 均衡饮食\n• 适量运动\n• 保持良好心态\n• 定期体检";
    }
  },
  
  /**
   * 生成默认回答
   */
  getDefaultAnswer(question) {
    const answers = [
      "这个问题有点难倒我了...不过我可以帮您分析天气情况，比如问\"今天适合户外运动吗？\"或者\"明天会下雨吗？\"",
      "我还在学习中，暂时无法回答这个问题。您可以问我关于天气、穿衣、运动、洗车等方面的问题哦~",
      "感谢您的提问！作为天气助手，我更擅长回答与天气相关的问题。试试问我\"这周天气怎么样？\"吧~"
    ];
    
    return answers[Math.floor(Math.random() * answers.length)];
  },
  
  /**
   * 获取天气建议
   */
  getWeatherSuggestion(weather) {
    const suggestions = {
      '晴': '阳光明媚，适合外出活动，注意防晒补水。',
      '多云': '云层较多，紫外线较弱，适宜户外活动。',
      '阴': '天气阴沉，可能转雨，建议携带雨具。',
      '小雨': '有小雨，出门请带伞，路面湿滑注意安全。',
      '中雨': '雨势较大，尽量减少外出，驾车注意减速。',
      '大雨': '暴雨天气，避免外出，注意防范积水。',
      '雷阵雨': '有雷电活动，避免在树下、高处停留。',
      '小雪': '有小雪，路面可能结冰，注意防滑。',
      '大雪': '雪势较大，注意保暖，减少不必要外出。'
    };
    
    for (const key in suggestions) {
      if (weather.includes(key)) {
        return suggestions[key];
      }
    }
    
    return '天气变化多端，请注意适时增减衣物。';
  },
  
  /**
   * 追加消息到聊天
   */
  appendMessage(role, content, useTypewriter = false, scroll = true) {
    const messagesContainer = $('.chat-messages');
    if (!messagesContainer) return;
    
    // 移除欢迎界面
    const welcome = messagesContainer.querySelector('.ai-welcome');
    if (welcome) {
      welcome.style.display = 'none';
    }
    
    const messageEl = createElement('div', {
      className: `message message--${role}`
    });
    
    const avatar = role === 'user' ? '👤' : '🌤️';
    const bubbleContent = useTypewriter ? '' : this.formatContent(content);
    
    messageEl.innerHTML = `
      <div class="message__avatar">${avatar}</div>
      <div class="message__content">
        <div class="message__bubble">${bubbleContent}</div>
        <div class="message__time">${formatTime(new Date(), false)}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    
    // 打字机效果
    if (useTypewriter) {
      const bubbleEl = messageEl.querySelector('.message__bubble');
      this.typewriterEffect(bubbleEl, content);
    }
    
    // 滚动到底部
    if (scroll) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  },
  
  /**
   * 打字机效果
   */
  async typewriterEffect(el, text) {
    el.classList.add('typing-cursor');
    el.textContent = '';
    
    const formattedText = text.replace(/\n/g, '\n');
    const chars = formattedText.split('');
    const speed = 30; // 每个字符的间隔（毫秒）
    
    for (let i = 0; i < chars.length; i++) {
      el.textContent += chars[i];
      this.scrollToBottom();
      
      // 随机速度，模拟真实打字
      const delay = speed + Math.random() * 20;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    el.classList.remove('typing-cursor');
  },
  
  /**
   * 显示思考状态
   */
  showThinking() {
    const messagesContainer = $('.chat-messages');
    if (!messagesContainer) return;
    
    const thinkingEl = createElement('div', {
      className: 'message message--ai thinking-message',
      id: 'thinkingIndicator'
    });
    
    thinkingEl.innerHTML = `
      <div class="message__avatar">🌤️</div>
      <div class="message__content">
        <div class="thinking-indicator">
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(thinkingEl);
    this.scrollToBottom();
  },
  
  /**
   * 移除思考状态
   */
  removeThinking() {
    const thinkingEl = $('#thinkingIndicator');
    if (thinkingEl) {
      thinkingEl.remove();
    }
  },
  
  /**
   * 隐藏欢迎界面
   */
  hideWelcome() {
    const welcome = $('.ai-welcome');
    if (welcome) {
      fadeOut(welcome).then(() => {
        welcome.style.display = 'none';
      });
    }
  },
  
  /**
   * 格式化内容（支持换行和列表）
   */
  formatContent(text) {
    if (!text) return '';
    
    // 换行转<br/>
    let html = text.replace(/\n/g, '<br/>');
    
    // 列表项处理
    html = html.replace(/• /g, '<span style="color: var(--primary-color);">• </span>');
    
    return html;
  },
  
  /**
   * 保存到对话历史
   */
  saveToHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    this.saveHistory();
  },
  
  /**
   * 清空对话
   */
  clearConversation() {
    if (!confirm('确定要清空对话历史吗？')) return;
    
    this.conversationHistory = [];
    this.saveHistory();
    this.renderWelcome();
  },
  
  /**
   * 滚动到底部
   */
  scrollToBottom() {
    const messagesContainer = $('.chat-messages');
    if (!messagesContainer) return;
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};

// 导出到全局
window.AIAssistant = AIAssistant;
