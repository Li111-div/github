// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
	// 1. 滚动触发动画逻辑
	const animateElements = document.querySelectorAll('.animate, .animate-left, .animate-right');

	// 创建观察者实例
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('active');
				// 只触发一次动画
				observer.unobserve(entry.target);
			}
		});
	}, {
		threshold: 0.1, // 元素进入视口10%时触发
		rootMargin: '0px 0px -50px 0px' // 优化触发时机
	});

	// 观察所有动画元素
	animateElements.forEach(element => {
		observer.observe(element);
	});

	// 2. 移动端导航切换
	const menuToggle = document.querySelector('.menu-toggle');
	const navMenu = document.querySelector('.nav-menu');

	if (menuToggle && navMenu) {
		menuToggle.addEventListener('click', function() {
			navMenu.classList.toggle('active');
			// 切换菜单图标（简化版，可替换为图标字体）
			menuToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
		});
	}

	// 3. 滚动时导航栏样式变化
	const header = document.querySelector('.header');
	window.addEventListener('scroll', function() {
		if (window.scrollY > 50) {
			header.style.padding = '10px 0';
			header.style.background = 'rgba(255, 255, 255, 0.98)';
			header.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
		} else {
			header.style.padding = '15px 0';
			header.style.background = 'rgba(255, 255, 255, 0.95)';
			header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
		}
	});

	// 4. 关闭移动端导航（点击链接后）
	const navLinks = document.querySelectorAll('.nav-menu a');
	navLinks.forEach(link => {
		link.addEventListener('click', function() {
			if (navMenu.classList.contains('active')) {
				navMenu.classList.remove('active');
				if (menuToggle) {
					menuToggle.textContent = '☰';
				}
			}
		});
	});
});
