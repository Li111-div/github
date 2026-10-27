(function(){
  const sidebarNav = document.getElementById('sidebarNav');
  const content = document.getElementById('content');
  const searchInput = document.getElementById('searchInput');
  const resultsCount = document.getElementById('resultsCount');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  let allProps = [];
  cssData.forEach(cat => cat.props.forEach(p => { allProps.push({...p, category: cat.category}); }));

  function renderSidebar(){
    let html = '';
    cssData.forEach(cat => {
      const commonCount = cat.props.filter(p => p.common).length;
      html += `<div class="nav-group collapsed" data-cat="${cat.category}">
        <div class="nav-group-title">
          <span>${cat.category}</span>
          <span class="arrow">&#9662;</span>
        </div>
        <ul class="nav-items">
          ${cat.props.map(p => `<li data-prop="${p.name}">${p.name}</li>`).join('')}
        </ul>
      </div>`;
    });
    sidebarNav.innerHTML = html;

    sidebarNav.querySelectorAll('.nav-group-title').forEach(title => {
      title.querySelector('.arrow').addEventListener('click', (e) => {
        e.stopPropagation();
        title.parentElement.classList.toggle('collapsed');
      });
      title.addEventListener('click', () => {
        const group = title.parentElement;
        const isCollapsed = group.classList.contains('collapsed');
        if(isCollapsed){
          group.classList.remove('collapsed');
        }
        const cat = group.dataset.cat;
        const sec = document.getElementById('cat-' + cat);
        if(sec){
          sec.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });

    sidebarNav.querySelectorAll('.nav-items li').forEach(li => {
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        const propName = li.dataset.prop;
        const card = document.getElementById('prop-' + propName);
        if(card){
          card.scrollIntoView({behavior:'smooth', block:'center'});
          card.classList.add('highlight');
          setTimeout(() => card.classList.remove('highlight'), 1500);
        }
        if(window.innerWidth <= 768){
          closeSidebar();
        }
      });
    });
  }

  function renderContent(filter){
    let html = '';
    let totalCount = 0;

    const filteredCats = cssData.map(cat => {
      let props = cat.props;
      if(filter){
        const f = filter.toLowerCase();
        const catNameMatch = cat.category.toLowerCase().includes(f);
        if(catNameMatch){
          props = cat.props;
        } else {
          props = cat.props.filter(p => 
            p.name.toLowerCase().includes(f) || 
            p.desc.toLowerCase().includes(f) ||
            p.values.toLowerCase().includes(f)
          );
        }
      }
      return { category: cat.category, props };
    }).filter(cat => cat.props.length > 0);

    const isSearching = !!filter;

    filteredCats.forEach(cat => {
      if(cat.props.length === 0) return;
      totalCount += cat.props.length;

      const commonProps = cat.props.filter(p => p.common);
      const lessProps = cat.props.filter(p => !p.common);

      let orderedProps = [];
      if(isSearching){
        orderedProps = cat.props;
      } else {
        orderedProps = [...commonProps, ...lessProps];
      }

      html += `<section class="category-section" id="cat-${cat.category}" data-cat="${cat.category}">
        <h2 class="category-title">
          ${cat.category}
          <span class="count">${cat.props.length} 个属性</span>
        </h2>
        <div class="props-grid">
          ${orderedProps.map(p => renderPropCard(p)).join('')}
        </div>
      </section>`;
    });

    if(isSearching && totalCount === 0){
      html = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <p>没有找到匹配 "${filter}" 的属性</p>
      </div>`;
    }

    content.innerHTML = html;
    resultsCount.textContent = isSearching ? `找到 ${totalCount} 个属性` : `共 ${allProps.length} 个 CSS 属性`;

    content.querySelectorAll('.prop-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        const prop = allProps.find(p => p.name === name);
        if(prop) openModal(prop);
      });
    });
  }

  function renderPropCard(p){
    const tagCommon = p.common ? '<span class="tag common">常用</span>' : '<span class="tag less">不常用</span>';
    return `<div class="prop-card" id="prop-${p.name}" data-name="${p.name}">
      <div class="prop-name">${p.name}</div>
      <div class="prop-desc">${p.desc}</div>
      <div class="prop-tags">
        ${tagCommon}
      </div>
    </div>`;
  }

  function openModal(prop){
    modalTitle.textContent = prop.name;
    let html = '';
    html += `<h3>说明</h3><p>${prop.desc}</p>`;
    html += `<h3>取值</h3><div class="prop-value">${prop.values}</div>`;
    html += `<h3>默认值</h3><p><code>${prop.initial}</code></p>`;
    html += `<h3>是否继承</h3><p>${prop.inherited}</p>`;
    modalBody.innerHTML = html;
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if(e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modalOverlay.classList.contains('show')){
      closeModal();
    }
  });

  searchInput.addEventListener('input', (e) => {
    renderContent(e.target.value.trim());
  });

  menuToggle.addEventListener('click', openSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  function openSidebar(){
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
  }
  function closeSidebar(){
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  }

  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const sections = document.querySelectorAll('.category-section');
      const scrollPos = window.scrollY + 120;
      let currentCat = '';
      sections.forEach(sec => {
        if(sec.offsetTop <= scrollPos){
          currentCat = sec.dataset.cat;
        }
      });
      sidebarNav.querySelectorAll('.nav-items li').forEach(li => {
        const propName = li.dataset.prop;
        const prop = allProps.find(p => p.name === propName);
        if(prop && prop.category === currentCat){
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      });
      sidebarNav.querySelectorAll('.nav-group').forEach(g => {
        if(g.dataset.cat === currentCat){
          g.classList.remove('collapsed');
        }
      });
    }, 100);
  });

  renderSidebar();
  renderContent('');
})();
