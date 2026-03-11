/**
 * ai.js - AI 接口封装文件
 * 集成 DeepSeek 大模型，提供「途味助手」AI 功能
 */

// ==================== 配置信息 ====================

/**
 * AI 配置对象
 * 注意：实际使用时请替换为真实的 DeepSeek API 配置
 */
const AI_CONFIG = {
  // API 基础地址（模拟接口，实际使用时替换为真实 DeepSeek API 地址）
  baseUrl: 'https://api.deepseek.com/v1',
  
  // API 密钥（实际使用时从环境变量或安全存储中获取）
  apiKey: 'YOUR_DEEPSEEK_API_KEY',
  
  // 模型名称
  model: 'deepseek-chat',
  
  // 超时时间（毫秒）
  timeout: 30000,
  
  // 最大重试次数
  maxRetries: 3,
  
  // 重试延迟（毫秒）
  retryDelay: 1000
};

// ==================== AI 助手类 ====================

/**
 * 途味助手 AI 类
 * 封装所有 AI 相关功能
 */
class TuWeiAssistant {
  constructor(config = {}) {
    this.config = { ...AI_CONFIG, ...config };
    this.isGenerating = false;
    this.abortController = null;
  }
  
  /**
   * 调用 AI 接口
   * @param {string} prompt - 用户输入
   * @param {object} options - 选项
   * @returns {Promise<string>} AI 响应结果
   */
  async chat(prompt, options = {}) {
    if (this.isGenerating) {
      throw new Error('AI 正在生成中，请稍候...');
    }
    
    this.isGenerating = true;
    this.abortController = new AbortController();
    
    const messages = [
      {
        role: 'system',
        content: options.systemPrompt || this._getDefaultSystemPrompt(options.type)
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    try {
      // 如果是模拟模式，返回模拟数据
      if (this.config.mockMode) {
        return await this._mockChat(prompt, options);
      }
      
      const response = await this._request('/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: false
        }),
        signal: this.abortController.signal
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求已取消');
      }
      console.error('AI 调用失败:', error);
      throw new Error(`AI 调用失败：${error.message}`);
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }
  
  /**
   * 生成美食教程
   * @param {object} params - 参数
   * @param {string} params.dishName - 菜品名称
   * @param {string} params.cuisineType - 菜系类型
   * @param {string} params.difficulty - 难度
   * @returns {Promise<object>} 教程对象
   */
  async generateFoodRecipe(params) {
    const prompt = `请为"${params.dishName}"这道菜生成详细的制作教程。
要求：
1. 菜系：${params.cuisineType || '家常菜'}
2. 难度：${params.difficulty || '中等'}
3. 包含食材清单（主料、辅料、调料）
4. 详细的制作步骤
5. 烹饪小贴士和注意事项

请以结构化的方式输出，便于解析。`;
    
    const response = await this.chat(prompt, {
      type: 'food',
      systemPrompt: `你是一位专业的美食家和专业厨师，擅长各种菜系的烹饪。
你的任务是为用户提供详细、易懂的美食制作教程。
输出格式要求：
- 使用清晰的标题
- 分点列出食材
- 步骤化说明制作过程
- 提供实用的小贴士`
    });
    
    return this._parseRecipe(response);
  }
  
  /**
   * 生成旅游路线
   * @param {object} params - 参数
   * @param {string} params.departure - 出发地
   * @param {string} params.destination - 目的地
   * @param {number} params.days - 游玩天数
   * @param {number} params.budget - 预算
   * @param {array} params.preferences - 偏好
   * @returns {Promise<object>} 路线对象
   */
  async generateTravelRoute(params) {
    const prompt = `请为我生成一份详细的旅游路线规划。
基本信息：
- 出发地：${params.departure}
- 目的地：${params.destination}
- 游玩天数：${params.days}天
- 预算范围：${params.budget ? '¥' + params.budget : '适中'}
- 偏好：${params.preferences ? params.preferences.join('、') : '无特殊偏好'}

请包含以下内容：
1. 每日详细行程（上午、下午、晚上）
2. 交通方式建议
3. 景点推荐及游玩时间
4. 美食推荐
5. 住宿建议
6. 预算分配
7. 注意事项`;
    
    const response = await this.chat(prompt, {
      type: 'travel',
      systemPrompt: `你是一位经验丰富的旅行规划师，熟悉国内外各大旅游目的地。
你的任务是根据用户的需求，制定合理、详细的旅行路线。
输出格式要求：
- 按天数组织内容
- 每天分为上午、下午、晚上
- 包含交通、餐饮、住宿建议
- 提供实用的旅行贴士`
    });
    
    return this._parseRoute(response);
  }
  
  /**
   * 取消当前生成
   */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      showToast('已取消生成', 'warning');
    }
  }
  
  /**
   * 发送 API 请求
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * 获取默认系统提示
   * @private
   */
  _getDefaultSystemPrompt(type) {
    const prompts = {
      food: `你是一位专业的美食家和专业厨师，擅长各种菜系的烹饪。
你的任务是为用户提供详细、易懂的美食制作教程。
输出格式要求：
- 使用清晰的标题
- 分点列出食材
- 步骤化说明制作过程
- 提供实用的小贴士`,
      
      travel: `你是一位经验丰富的旅行规划师，熟悉国内外各大旅游目的地。
你的任务是根据用户的需求，制定合理、详细的旅行路线。
输出格式要求：
- 按天数组织内容
- 每天分为上午、下午、晚上
- 包含交通、餐饮、住宿建议
- 提供实用的旅行贴士`
    };
    
    return prompts[type] || '你是一个有帮助的 AI 助手。';
  }
  
  /**
   * 模拟 AI 响应（用于演示）
   * @private
   */
  async _mockChat(prompt, options) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    if (options.type === 'food') {
      return this._getMockRecipe(prompt);
    } else if (options.type === 'travel') {
      return this._getMockRoute(prompt);
    }
    
    return '这是一个模拟响应。实际使用时请配置真实的 DeepSeek API。';
  }
  
  /**
   * 获取模拟食谱
   * @private
   */
  _getMockRecipe(prompt) {
    return `## 🍳 ${prompt.includes('"') ? prompt.split('"')[1] : '美味佳肴'} 制作教程

### 📋 食材准备

**主料：**
- 主要食材 500g
- 配菜 200g

**辅料：**
- 姜片 3 片
- 蒜瓣 4 瓣
- 葱段 适量

**调料：**
- 生抽 2 勺
- 老抽 1 勺
- 料酒 1 勺
- 盐 适量
- 糖 少许
- 食用油 适量

### 👨‍🍳 制作步骤

**步骤 1：食材处理**
将主料清洗干净，切成适当大小的块状。配菜洗净切好备用。

**步骤 2：腌制入味**
将主料放入碗中，加入姜片、料酒和少许盐，抓匀腌制 15 分钟。

**步骤 3：烹饪加工**
1. 热锅凉油，油温六成热时放入主料
2. 煎至两面金黄后盛出
3. 锅中留底油，爆香姜蒜
4. 放入主料和配菜翻炒

**步骤 4：调味收汁**
加入生抽、老抽、糖和适量清水，大火烧开后转小火焖煮 10 分钟，最后大火收汁即可。

### 💡 烹饪小贴士

1. **火候控制**：煎制时要用中小火，避免外焦里生
2. **去腥技巧**：可以用姜片和料酒有效去除腥味
3. **口感提升**：收汁时不停翻炒，让食材均匀裹上酱汁
4. **变化做法**：可根据个人口味添加辣椒或其他调料

### ⚠️ 注意事项

- 确保食材新鲜
- 注意用油安全，防止溅油烫伤
- 根据食材量调整调料用量
- 烹饪过程中注意观察火候`;
  }
  
  /**
   * 获取模拟路线
   * @private
   */
  _getMockRoute(prompt) {
    const destination = prompt.match(/目的地.*?[:：]\s*(\S+)/)?.[1] || '目的地';
    const days = parseInt(prompt.match(/(\d+) 天/)?.[1]) || 3;
    
    let route = `## 🗺️ ${destination} ${days}日游详细路线\n\n`;
    
    for (let i = 1; i <= days; i++) {
      route += `### 📅 第${i}天\n\n`;
      route += `#### 🌅 上午\n`;
      route += `- **景点**：${destination}著名景点 A\n`;
      route += `- **时间**：9:00 - 12:00\n`;
      route += `- **交通**：建议乘坐地铁/公交前往\n`;
      route += `- **门票**：约¥80\n\n`;
      
      route += `#### 🍽️ 中午\n`;
      route += `- **午餐**：品尝当地特色美食\n`;
      route += `- **推荐**：特色餐厅 B\n`;
      route += `- **预算**：人均¥50\n\n`;
      
      route += `#### 🌞 下午\n`;
      route += `- **景点**：${destination}知名景点 C\n`;
      route += `- **时间**：14:00 - 17:00\n`;
      route += `- **活动**：参观、拍照、体验当地文化\n\n`;
      
      route += `#### 🌃 晚上\n`;
      route += `- **晚餐**：当地夜市或特色餐厅\n`;
      route += `- **夜游**：欣赏${destination}夜景\n`;
      route += `- **住宿**：建议住在市中心区域\n\n`;
    }
    
    route += `### 💰 预算参考\n`;
    route += `- **交通**：往返大交通 + 当地交通 约¥XXX\n`;
    route += `- **住宿**：${days - 1}晚酒店 约¥XXX\n`;
    route += `- **餐饮**：${days}天用餐 约¥XXX\n`;
    route += `- **门票**：各景点门票 约¥XXX\n`;
    route += `- **总计**：人均约¥XXXX\n\n`;
    
    route += `### ⚠️ 注意事项\n`;
    route += `1. 提前预订门票和酒店可享受优惠\n`;
    route += `2. 注意查看天气预报，合理安排行程\n`;
    route += `3. 保管好个人财物，注意旅行安全\n`;
    route += `4. 尊重当地风俗习惯\n`;
    route += `5. 准备好常用药品以备不时之需`;
    
    return route;
  }
  
  /**
   * 解析食谱响应
   * @private
   */
  _parseRecipe(response) {
    // 简单的解析逻辑，实际使用中可以根据 AI 返回的格式进行更复杂的解析
    return {
      raw: response,
      title: response.match(/##\s*(.+)/)?.[1] || '美食教程',
      sections: this._extractSections(response)
    };
  }
  
  /**
   * 解析路线响应
   * @private
   */
  _parseRoute(response) {
    return {
      raw: response,
      title: response.match(/##\s*(.+)/)?.[1] || '旅游路线',
      days: this._extractDays(response)
    };
  }
  
  /**
   * 提取章节
   * @private
   */
  _extractSections(text) {
    const sections = [];
    const sectionRegex = /###\s+(.+?)\n([\s\S]*?)(?=###|$)/g;
    let match;
    
    while ((match = sectionRegex.exec(text)) !== null) {
      sections.push({
        title: match[1],
        content: match[2].trim()
      });
    }
    
    return sections;
  }
  
  /**
   * 提取天数
   * @private
   */
  _extractDays(text) {
    const days = [];
    const dayRegex = /###\s+第 ([一二三四五六七八九十\d]+) 天/g;
    let match;
    
    while ((match = dayRegex.exec(text)) !== null) {
      days.push(match[0]);
    }
    
    return days;
  }
}

// ==================== 导出实例 ====================

/**
 * 全局 AI 助手实例
 */
const tuweiAssistant = new TuWeiAssistant({
  mockMode: true // 默认使用模拟模式，实际使用时改为 false 并配置真实 API
});

// ==================== 便捷函数 ====================

/**
 * 生成美食教程（便捷函数）
 * @param {object} params - 参数
 */
async function generateRecipe(params) {
  try {
    return await tuweiAssistant.generateFoodRecipe(params);
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

/**
 * 生成旅游路线（便捷函数）
 * @param {object} params - 参数
 */
async function generateRoute(params) {
  try {
    return await tuweiAssistant.generateTravelRoute(params);
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

/**
 * 通用 AI 对话（便捷函数）
 * @param {string} prompt - 输入
 * @param {object} options - 选项
 */
async function askAI(prompt, options = {}) {
  try {
    return await tuweiAssistant.chat(prompt, options);
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

/**
 * 取消当前 AI 生成
 */
function cancelAIGeneration() {
  tuweiAssistant.cancel();
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🤖 途味助手 AI 模块已加载');
  console.log('💡 提示：当前为模拟模式，真实使用请配置 DeepSeek API');
});

// ==================== 导出模块 ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TuWeiAssistant,
    tuweiAssistant,
    generateRecipe,
    generateRoute,
    askAI,
    cancelAIGeneration,
    AI_CONFIG
  };
}
