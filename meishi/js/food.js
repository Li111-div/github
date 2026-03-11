/**
 * food.js - 美食板块 JavaScript 文件
 * 处理美食展示、购物车、AI 生成教程等功能
 */

// ==================== 全局变量 ====================

/**
 * 美食数据（模拟数据，实际使用时可从后端获取）
 */
const FOOD_DATA = {
  // 八大菜系
  cuisines: [
    { id: 1, name: '川菜', title: '四川菜系', desc: '麻辣鲜香，口味多变', image: 'images/food/chuan.jpg', tags: ['麻辣', '重口味', '火锅'] },
    { id: 2, name: '粤菜', title: '广东菜系', desc: '清淡鲜美，讲究原汁原味', image: 'images/food/yue.jpg', tags: ['清淡', '海鲜', '早茶'] },
    { id: 3, name: '鲁菜', title: '山东菜系', desc: '咸鲜为主，精于制汤', image: 'images/food/lu.jpg', tags: ['咸鲜', '宫廷', '海鲜'] },
    { id: 4, name: '苏菜', title: '江苏菜系', desc: '甜润适中，刀工精细', image: 'images/food/su.jpg', tags: ['甜润', '精细', '淮扬'] },
    { id: 5, name: '浙菜', title: '浙江菜系', desc: '鲜嫩滑爽，清鲜脆嫩', image: 'images/food/zhe.jpg', tags: ['鲜嫩', '清爽', '杭帮'] },
    { id: 6, name: '闽菜', title: '福建菜系', desc: '鲜香酸甜，擅长红糟', image: 'images/food/min.jpg', tags: ['酸甜', '海鲜', '红糟'] },
    { id: 7, name: '湘菜', title: '湖南菜系', desc: '酸辣香鲜，油重色浓', image: 'images/food/xiang.jpg', tags: ['酸辣', '香辣', '腊味'] },
    { id: 8, name: '徽菜', title: '安徽菜系', desc: '重油重色，火功独到', image: 'images/food/hui.jpg', tags: ['重油', '山珍', '炖煮'] }
  ],
  
  // 地方小吃
  snacks: [
    { id: 1, name: '东北锅包肉', location: '黑龙江·哈尔滨', price: 38, rating: 4.8, image: 'images/food/guobaorou.jpg', badge: '热门' },
    { id: 2, name: '云南过桥米线', location: '云南·昆明', price: 25, rating: 4.9, image: 'images/food/mixian.jpg', badge: '特色' },
    { id: 3, name: '北京炸酱面', location: '北京', price: 22, rating: 4.7, image: 'images/food/zhajiangmian.jpg', badge: '' },
    { id: 4, name: '西安肉夹馍', location: '陕西·西安', price: 15, rating: 4.8, image: 'images/food/roujiamo.jpg', badge: '必吃' },
    { id: 5, name: '上海小笼包', location: '上海', price: 28, rating: 4.9, image: 'images/food/xiaolongbao.jpg', badge: '热门' },
    { id: 6, name: '成都担担面', location: '四川·成都', price: 18, rating: 4.6, image: 'images/food/dandanmian.jpg', badge: '' }
  ],
  
  // 商品列表
  products: [
    { id: 1, name: '正宗川菜水煮牛肉', price: 68, sales: 2350, image: 'images/food/shuizhuniurou.jpg' },
    { id: 2, name: '粤式广式腊肠', price: 45, sales: 1890, image: 'images/food/lachang.jpg' },
    { id: 3, name: '鲁菜九转大肠', price: 88, sales: 956, image: 'images/food/jiuzhuandachang.jpg' },
    { id: 4, name: '松鼠鳜鱼', price: 128, sales: 723, image: 'images/food/songshuguiyu.jpg' },
    { id: 5, name: '西湖醋鱼', price: 98, sales: 1245, image: 'images/food/xihucuyu.jpg' },
    { id: 6, name: '佛跳墙', price: 298, sales: 445, image: 'images/food/fotiaoqiang.jpg' },
    { id: 7, name: '剁椒鱼头', price: 78, sales: 1678, image: 'images/food/duojiaoyutou.jpg' },
    { id: 8, name: '臭鳜鱼', price: 108, sales: 834, image: 'images/food/chouguiyu.jpg' }
  ]
};

/**
 * 购物车数据
 */
let cartData = storage.get('foodCart') || [];

// ==================== 页面初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🍳 美食板块已加载');
  
  // 初始化菜系卡片
  initCuisineCards();
  
  // 初始化小吃卡片
  initSnackCards();
  
  // 初始化商品列表
  initProductList();
  
  // 初始化功能模块切换
  initModuleTabs();
  
  // 初始化搜索筛选
  initFoodSearch();
  
  // 初始化筛选器
  initFilter();
  
  // 更新购物车数量
  updateCartCount();
});

// ==================== 菜系卡片 ====================

/**
 * 初始化菜系卡片
 */
function initCuisineCards() {
  const grid = document.querySelector('.cuisine-grid');
  if (!grid) return;
  
  grid.innerHTML = FOOD_DATA.cuisines.map(cuisine => `
    <div class="cuisine-card" data-id="${cuisine.id}" data-name="${cuisine.name}">
      <div class="cuisine-card__image-wrapper">
        <img src="${cuisine.image}" alt="${cuisine.title}" class="cuisine-card__image" 
             onerror="this.src='https://via.placeholder.com/400x300/FF7F24/FFFFFF?text=${encodeURIComponent(cuisine.name)}'">
        <div class="cuisine-card__overlay"></div>
      </div>
      <div class="cuisine-card__content">
        <h3 class="cuisine-card__title">${cuisine.title}</h3>
        <p class="cuisine-card__desc">${cuisine.desc}</p>
        <div class="cuisine-card__tags">
          ${cuisine.tags.map(tag => `<span class="cuisine-card__tag">${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
  
  // 添加点击事件
  grid.querySelectorAll('.cuisine-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const name = card.dataset.name;
      showToast(`正在加载${name}菜品...`);
      // 可以跳转到详情页或筛选该菜系的菜品
      filterByCuisine(name);
    });
  });
}

/**
 * 按菜系筛选
 * @param {string} cuisineName - 菜系名称
 */
function filterByCuisine(cuisineName) {
  // 实现筛选逻辑
  console.log('筛选菜系:', cuisineName);
  showToast(`已筛选：${cuisineName}`);
}

// ==================== 小吃卡片 ====================

/**
 * 初始化小吃卡片
 */
function initSnackCards() {
  const grid = document.querySelector('.snack-grid');
  if (!grid) return;
  
  grid.innerHTML = FOOD_DATA.snacks.map(snack => `
    <div class="snack-card" data-id="${snack.id}">
      <div class="snack-card__image-wrapper">
        <img src="${snack.image}" alt="${snack.name}" class="snack-card__image"
             onerror="this.src='https://via.placeholder.com/400x300/FFB366/FFFFFF?text=${encodeURIComponent(snack.name)}'">
        ${snack.badge ? `<span class="snack-card__badge">${snack.badge}</span>` : ''}
      </div>
      <div class="snack-card__content">
        <h3 class="snack-card__name">${snack.name}</h3>
        <p class="snack-card__location">📍 ${snack.location}</p>
        <div class="snack-card__footer">
          <span class="snack-card__price">¥${snack.price}</span>
          <div class="snack-card__rating">
            ${getStarRating(snack.rating)}
            <span>${snack.rating}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // 添加点击事件
  grid.querySelectorAll('.snack-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      window.location.href = `pages/food_detail.html?id=${id}`;
    });
  });
}

/**
 * 生成星级评分 HTML
 * @param {number} rating - 评分
 * @returns {string}
 */
function getStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let html = '';
  
  for (let i = 0; i < fullStars; i++) {
    html += '⭐';
  }
  if (hasHalf) {
    html += '⭐';
  }
  const empty = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < empty; i++) {
    html += '<span class="rating__star--empty">☆</span>';
  }
  
  return html;
}

// ==================== 商品列表 ====================

/**
 * 初始化商品列表
 */
function initProductList() {
  const grid = document.querySelector('.food-shop-grid');
  if (!grid) return;
  
  grid.innerHTML = FOOD_DATA.products.map(product => `
    <div class="food-product-card" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}" class="food-product-card__image"
           onerror="this.src='https://via.placeholder.com/400x400/FF7F24/FFFFFF?text=${encodeURIComponent(product.name)}'">
      <div class="food-product-card__info">
        <h3 class="food-product-card__name">${product.name}</h3>
        <div class="food-product-card__price-row">
          <span class="food-product-card__price">
            <small class="food-product-card__price-symbol">¥</small>${product.price}
          </span>
          <span class="food-product-card__sales">已售${formatNumber(product.sales)}</span>
        </div>
        <div class="food-product-card__actions">
          <div class="food-product-card__quantity">
            <button class="food-product-card__btn btn-minus">-</button>
            <span class="food-product-card__num">1</span>
            <button class="food-product-card__btn btn-plus">+</button>
          </div>
          <button class="food-product-card__add-cart">加入购物车</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // 添加事件委托
  grid.addEventListener('click', handleProductCardClick);
}

/**
 * 处理商品卡片点击
 * @param {Event} e - 事件对象
 */
function handleProductCardClick(e) {
  const card = e.target.closest('.food-product-card');
  if (!card) return;
  
  // 加减数量
  if (e.target.classList.contains('btn-minus')) {
    const numEl = card.querySelector('.food-product-card__num');
    let num = parseInt(numEl.textContent);
    if (num > 1) {
      numEl.textContent = num - 1;
    }
  }
  
  if (e.target.classList.contains('btn-plus')) {
    const numEl = card.querySelector('.food-product-card__num');
    let num = parseInt(numEl.textContent);
    numEl.textContent = num + 1;
  }
  
  // 加入购物车
  if (e.target.classList.contains('food-product-card__add-cart')) {
    const id = parseInt(card.dataset.id);
    const quantity = parseInt(card.querySelector('.food-product-card__num').textContent);
    addToCart(id, quantity);
  }
}

/**
 * 添加到购物车
 * @param {number} productId - 商品 ID
 * @param {number} quantity - 数量
 */
function addToCart(productId, quantity) {
  const product = FOOD_DATA.products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cartData.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cartData.push({
      ...product,
      quantity
    });
  }
  
  storage.set('foodCart', cartData);
  updateCartCount();
  showToast('已加入购物车', 'success');
  
  // 显示购物车浮动按钮
  showCartFloat();
}

/**
 * 更新购物车数量显示
 */
function updateCartCount() {
  const count = cartData.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('.cart-float__badge');
  if (badge) {
    badge.textContent = count;
    if (count > 0) {
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * 显示购物车浮动按钮
 */
function showCartFloat() {
  const cartFloat = document.querySelector('.cart-float');
  if (cartFloat && cartData.length > 0) {
    cartFloat.classList.add('cart-float--show');
  }
}

// ==================== 功能模块切换 ====================

/**
 * 初始化功能模块切换
 */
function initModuleTabs() {
  const tabs = document.querySelectorAll('.food-module-tabs__item');
  const modules = document.querySelectorAll('.food-module');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.module;
      
      // 切换 Tab 状态
      tabs.forEach(t => t.classList.remove('food-module-tabs__item--active'));
      tab.classList.add('food-module-tabs__item--active');
      
      // 切换模块显示
      modules.forEach(m => m.classList.remove('food-module--active'));
      document.getElementById(target)?.classList.add('food-module--active');
    });
  });
}

// ==================== AI 生成教程 ====================

/**
 * 初始化 AI 生成教程功能
 */
function initAICook() {
  const form = document.querySelector('.ai-cook-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dishName = form.querySelector('[name="dishName"]')?.value.trim();
    const cuisineType = form.querySelector('[name="cuisineType"]')?.value;
    const difficulty = form.querySelector('[name="difficulty"]')?.value;
    
    if (!dishName) {
      showToast('请输入菜品名称', 'warning');
      return;
    }
    
    const btn = form.querySelector('.ai-cook-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading loading--food"></span> 正在生成中...';
    
    try {
      const result = await generateRecipe({
        dishName,
        cuisineType,
        difficulty
      });
      
      displayRecipeResult(result);
      showToast('教程生成成功', 'success');
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
 * 显示食谱结果
 * @param {object} recipe - 食谱对象
 */
function displayRecipeResult(recipe) {
  const container = document.querySelector('.ai-result-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="ai-result-card">
      <h3 class="ai-result-title">📖 ${recipe.title}</h3>
      
      ${recipe.sections.map(section => `
        <div class="ai-result-section">
          <h4 class="ai-result-section-title">${section.title}</h4>
          <div class="ai-result-content">${formatContent(section.content)}</div>
        </div>
      `).join('')}
      
      <div class="ai-result-actions">
        <button class="ai-result-action-btn--copy" onclick="copyRecipe()">
          📋 复制教程
        </button>
        <button class="ai-result-action-btn--export" onclick="exportRecipe()">
          💾 导出 PDF
        </button>
      </div>
    </div>
  `;
  
  container.classList.add('ai-result-container--show');
  
  // 存储当前食谱用于复制
  window.currentRecipe = recipe;
}

/**
 * 格式化内容
 * @param {string} content - 内容
 * @returns {string}
 */
function formatContent(content) {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/(\d+)\./g, '<span class="ai-result-list-index">$1</span>');
}

/**
 * 复制食谱
 */
function copyRecipe() {
  if (window.currentRecipe) {
    copyToClipboard(window.currentRecipe.raw);
  }
}

/**
 * 导出食谱
 */
function exportRecipe() {
  if (window.currentRecipe) {
    showModal('导出功能开发中...', '提示');
  }
}

// ==================== 搜索筛选 ====================

/**
 * 初始化美食搜索
 */
function initFoodSearch() {
  const searchInput = document.querySelector('.search-box__input');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', debounce((e) => {
    const keyword = e.target.value.trim().toLowerCase();
    filterFoodItems(keyword);
  }, 300));
}

/**
 * 筛选美食项目
 * @param {string} keyword - 关键词
 */
function filterFoodItems(keyword) {
  const cards = document.querySelectorAll('.cuisine-card, .snack-card, .food-product-card');
  
  cards.forEach(card => {
    const name = card.dataset.name || card.querySelector('.food-product-card__name')?.textContent || '';
    const match = name.toLowerCase().includes(keyword);
    
    if (keyword === '' || match) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

// ==================== 筛选器 ====================

/**
 * 初始化筛选器
 */
function initFilter() {
  const filterItems = document.querySelectorAll('.filter__item');
  
  filterItems.forEach(item => {
    item.addEventListener('click', () => {
      filterItems.forEach(i => i.classList.remove('filter__item--active'));
      item.classList.add('filter__item--active');
      
      const type = item.dataset.type;
      filterByType(type);
    });
  });
}

/**
 * 按类型筛选
 * @param {string} type - 类型
 */
function filterByType(type) {
  console.log('筛选类型:', type);
  showToast(`筛选：${type}`);
}

// ==================== 页面跳转 ====================

/**
 * 跳转到美食详情页
 * @param {number} id - 美食 ID
 */
function goToFoodDetail(id) {
  window.location.href = `pages/food_detail.html?id=${id}`;
}

/**
 * 跳转到购物车页
 */
function goToCart() {
  window.location.href = 'pages/cart.html';
}

// ==================== 工具函数 ====================

/**
 * 格式化数字
 * @param {number} num - 数字
 * @returns {string}
 */
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return String(num);
}

// ==================== 导出模块 ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FOOD_DATA,
    addToCart,
    updateCartCount,
    goToFoodDetail,
    goToCart,
    initAICook,
    copyRecipe,
    exportRecipe
  };
}
