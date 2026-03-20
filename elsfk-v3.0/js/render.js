/**
 * 俄罗斯方块 - 渲染系统
 */

// ==================== 渲染系统 ====================

/**
 * 绘制单个方块（带立体效果）
 * @param {CanvasRenderingContext2D} context - 画布上下文
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {number} size - 方块大小
 * @param {string} color - 颜色
 * @param {boolean} isGhost - 是否为幽灵方块（半透明）
 */
function drawBlock(context, x, y, size, color, isGhost = false) {
    if (isGhost) {
        context.globalAlpha = 0.3;
    }

    // 填充色
    context.fillStyle = color;
    context.fillRect(x, y, size, size);

    // 高光效果（左上边）
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fillRect(x, y, size, 3);
    context.fillRect(x, y, 3, size);

    // 阴影效果（右下边）
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(x, y + size - 3, size, 3);
    context.fillRect(x + size - 3, y, 3, size);

    // 内边框
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 1;
    context.strokeRect(x + 1, y + 1, size - 2, size - 2);

    context.globalAlpha = 1.0;
}

/**
 * 绘制游戏主区域
 */
function drawBoard() {
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格线（可选，增加复古感）
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }

    // 绘制已锁定的方块
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, board[y][x]);
            }
        }
    }

    // 绘制当前方块
    if (currentPiece) {
        const shape = currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    drawBlock(
                        ctx,
                        (currentPiece.x + x) * BLOCK_SIZE,
                        (currentPiece.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        currentPiece.color
                    );
                }
            }
        }

        // 绘制幽灵方块（显示落点位置）
        let ghostY = currentPiece.y;
        // 创建幽灵方块的深拷贝，避免引用问题
        const ghostShape = currentPiece.shape.map(row => [...row]);
        let testY = currentPiece.y;
        while (!checkCollision({
            ...currentPiece,
            shape: ghostShape,
            y: testY
        }, 0, 1)) {
            testY++;
        }
        ghostY = testY;

        if (ghostY !== currentPiece.y) {
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        drawBlock(
                            ctx,
                            (currentPiece.x + x) * BLOCK_SIZE,
                            (ghostY + y) * BLOCK_SIZE,
                            BLOCK_SIZE,
                            currentPiece.color,
                            true
                        );
                    }
                }
            }
        }
    }
}

/**
 * 绘制下一个方块预览
 */
function drawNextPreview() {
    // 清空画布
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPieceType) return;

    const tetromino = TETROMINOES[nextPieceType];
    const shape = tetromino.shapes[0];
    const blockSize = PREVIEW_BLOCK_SIZE;

    // 计算居中位置
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;
    const offsetX = Math.floor((nextCanvas.width / blockSize - shapeWidth) / 2);
    const offsetY = Math.floor((nextCanvas.height / blockSize - shapeHeight) / 2);

    // 绘制方块
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                drawBlock(
                    nextCtx,
                    (offsetX + x) * blockSize,
                    (offsetY + y) * blockSize,
                    blockSize,
                    tetromino.color
                );
            }
        }
    }
}

/**
 * 绘制下下一个方块预览
 */
function drawNextNextPreview() {
    // 清空画布
    nextNextCtx.fillStyle = '#000';
    nextNextCtx.fillRect(0, 0, nextNextCanvas.width, nextNextCanvas.height);

    if (!nextNextPieceType) return;

    const tetromino = TETROMINOES[nextNextPieceType];
    const shape = tetromino.shapes[0];
    const blockSize = PREVIEW_BLOCK_SIZE;

    // 计算居中位置
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;
    const offsetX = Math.floor((nextNextCanvas.width / blockSize - shapeWidth) / 2);
    const offsetY = Math.floor((nextNextCanvas.height / blockSize - shapeHeight) / 2);

    // 绘制方块
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                drawBlock(
                    nextNextCtx,
                    (offsetX + x) * blockSize,
                    (offsetY + y) * blockSize,
                    blockSize,
                    tetromino.color
                );
            }
        }
    }
}

/**
 * 更新 UI 显示
 */
function updateDisplay() {
    // 得分显示（8 位数字）
    document.getElementById('scoreDisplay').textContent = 
        score.toString().padStart(8, '0');
    
    // 等级显示（2 位数字）
    document.getElementById('levelDisplay').textContent = 
        level.toString().padStart(2, '0');
    
    // 行数显示（4 位数字）
    document.getElementById('linesDisplay').textContent = 
        lines.toString().padStart(4, '0');
}

/**
 * 更新下一个方块预览
 */
function updateNextPreview() {
    drawNextPreview();
}

/**
 * 更新下下一个方块预览
 */
function updateNextNextPreview() {
    drawNextNextPreview();
}

/**
 * 绘制消除动画（单行）- 只显示有方块的部分
 * @param {number} y - 行号
 * @returns {Promise} 动画完成后的 Promise
 */
function drawLineClearAnimation(y) {
    return new Promise(resolve => {
        const rowY = y * BLOCK_SIZE;
        
        // 检查这一行哪些位置有方块
        const hasBlocks = [];
        const blockColors = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== null) {
                hasBlocks.push(x);
                blockColors.push(board[y][x]);
            }
        }
        
        // 如果这一行没有方块，直接返回
        if (hasBlocks.length === 0) {
            setTimeout(resolve, 600);
            return;
        }
        
        // 创建临时 canvas 层用于动画
        const animCanvas = document.createElement('canvas');
        animCanvas.width = canvas.width;
        animCanvas.height = BLOCK_SIZE;
        animCanvas.style.position = 'absolute';
        animCanvas.style.left = '0';
        animCanvas.style.top = rowY + 'px';
        animCanvas.style.pointerEvents = 'none';
        animCanvas.className = 'line-clear-anim';
        animCanvas.style.filter = 'drop-shadow(0 0 10px #fff) drop-shadow(0 0 20px #0ff)';
        
        const animCtx = animCanvas.getContext('2d');
        
        // 先填充透明背景
        animCtx.clearRect(0, 0, animCanvas.width, animCanvas.height);
        
        // 只复制有方块的位置
        hasBlocks.forEach((x, index) => {
            const color = blockColors[index];
            // 绘制发光效果
            animCtx.shadowBlur = 20;
            animCtx.shadowColor = color;
            animCtx.drawImage(
                canvas, 
                x * BLOCK_SIZE, rowY, BLOCK_SIZE, BLOCK_SIZE,
                x * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE
            );
        });
        
        // 添加到画布容器
        canvas.parentElement.appendChild(animCanvas);
        
        // 创建粒子爆炸效果
        createExplosionEffect(rowY + BLOCK_SIZE / 2, hasBlocks.map(x => x * BLOCK_SIZE + BLOCK_SIZE / 2), blockColors);
        
        // 等待动画完成
        setTimeout(() => {
            animCanvas.remove();
            resolve();
        }, 600);
    });
}

/**
 * 创建粒子爆炸效果
 * @param {number} y - Y 坐标
 * @param {Array} xPositions - X 坐标数组
 * @param {Array} colors - 颜色数组
 */
function createExplosionEffect(y, xPositions, colors) {
    const particleCount = 30;
    const particles = [];
    
    xPositions.forEach((x, index) => {
        const color = colors[index];
        for (let i = 0; i < particleCount / xPositions.length; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    });
    
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = canvas.width;
    particleCanvas.height = canvas.height;
    particleCanvas.style.position = 'absolute';
    particleCanvas.style.left = '0';
    particleCanvas.style.top = '0';
    particleCanvas.style.pointerEvents = 'none';
    particleCanvas.className = 'particle-effect';
    
    const particleCtx = particleCanvas.getContext('2d');
    canvas.parentElement.appendChild(particleCanvas);
    
    function animateParticles() {
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        
        let hasAlive = false;
        particles.forEach(p => {
            if (p.life > 0) {
                hasAlive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3;
                
                particleCtx.globalAlpha = p.life;
                particleCtx.fillStyle = p.color;
                particleCtx.shadowBlur = 10;
                particleCtx.shadowColor = p.color;
                particleCtx.beginPath();
                particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                particleCtx.fill();
                
                p.life -= p.decay;
            }
        });
        
        particleCtx.globalAlpha = 1;
        
        if (hasAlive) {
            requestAnimationFrame(animateParticles);
        } else {
            particleCanvas.remove();
        }
    }
    
    animateParticles();
}

/**
 * 绘制多行消除炫酷动画
 * @param {Array} lines - 要消除的行号数组
 * @returns {Promise} 动画完成后的 Promise
 */
function drawMultiLineClearAnimation(lines) {
    return new Promise(resolve => {
        const tempCanvases = [];
        const allParticles = [];
        
        lines.forEach((y, index) => {
            const rowY = y * BLOCK_SIZE;
            
            // 检查这一行哪些位置有方块
            const hasBlocks = [];
            const blockColors = [];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (board[y][x] !== null) {
                    hasBlocks.push(x);
                    blockColors.push(board[y][x]);
                }
            }
            
            // 如果没有方块，跳过
            if (hasBlocks.length === 0) return;
            
            // 创建临时 canvas 层用于动画
            const animCanvas = document.createElement('canvas');
            animCanvas.width = canvas.width;
            animCanvas.height = BLOCK_SIZE;
            animCanvas.style.position = 'absolute';
            animCanvas.style.left = '0';
            animCanvas.style.top = rowY + 'px';
            animCanvas.style.pointerEvents = 'none';
            animCanvas.className = 'multi-line-clear';
            animCanvas.style.filter = 'drop-shadow(0 0 15px #fff) drop-shadow(0 0 30px #0ff)';
            animCanvas.style.animationDelay = (index * 0.1) + 's';
            
            const animCtx = animCanvas.getContext('2d');
            
            // 先填充透明背景
            animCtx.clearRect(0, 0, animCanvas.width, animCanvas.height);
            
            // 只复制有方块的位置（带发光）
            hasBlocks.forEach((x, i) => {
                const color = blockColors[i];
                animCtx.shadowBlur = 20;
                animCtx.shadowColor = color;
                animCtx.drawImage(
                    canvas, 
                    x * BLOCK_SIZE, rowY, BLOCK_SIZE, BLOCK_SIZE,
                    x * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE
                );
            });
            
            canvas.parentElement.appendChild(animCanvas);
            tempCanvases.push(animCanvas);
            
            // 创建粒子爆炸效果
            const particleCount = 40;
            for (let i = 0; i < particleCount; i++) {
                hasBlocks.forEach((x, idx) => {
                    const color = blockColors[idx];
                    allParticles.push({
                        x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
                        y: rowY + BLOCK_SIZE / 2,
                        vx: (Math.random() - 0.5) * 12,
                        vy: (Math.random() - 0.5) * 12 - 2,
                        size: Math.random() * 5 + 2,
                        color: color,
                        life: 1.0,
                        decay: Math.random() * 0.025 + 0.015
                    });
                });
            }
        });
        
        // 如果有粒子，创建粒子画布
        if (allParticles.length > 0) {
            const particleCanvas = document.createElement('canvas');
            particleCanvas.width = canvas.width;
            particleCanvas.height = canvas.height;
            particleCanvas.style.position = 'absolute';
            particleCanvas.style.left = '0';
            particleCanvas.style.top = '0';
            particleCanvas.style.pointerEvents = 'none';
            particleCanvas.className = 'multi-particle-effect';
            
            const particleCtx = particleCanvas.getContext('2d');
            canvas.parentElement.appendChild(particleCanvas);
            
            function animateMultiParticles() {
                particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
                
                let hasAlive = false;
                allParticles.forEach(p => {
                    if (p.life > 0) {
                        hasAlive = true;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.3;
                        
                        particleCtx.globalAlpha = p.life;
                        particleCtx.fillStyle = p.color;
                        particleCtx.shadowBlur = 10;
                        particleCtx.shadowColor = p.color;
                        particleCtx.beginPath();
                        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        particleCtx.fill();
                        
                        p.life -= p.decay;
                    }
                });
                
                particleCtx.globalAlpha = 1;
                
                if (hasAlive) {
                    requestAnimationFrame(animateMultiParticles);
                } else {
                    particleCanvas.remove();
                }
            }
            
            animateMultiParticles();
        }
        
        // 等待动画完成
        setTimeout(() => {
            tempCanvases.forEach(c => c.remove());
            resolve();
        }, 800);
    });
}

/**
 * 创建粒子爆炸效果
 * @param {Array} lines - 行号数组
 */
function createParticleEffect(lines) {
    lines.forEach(y => {
        const rowY = y * BLOCK_SIZE + BLOCK_SIZE / 2;
        
        // 创建多个粒子
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'absolute';
            particle.style.left = (Math.random() * canvas.width) + 'px';
            particle.style.top = rowY + 'px';
            
            // 随机颜色（从当前主题中选取）
            const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FFA500'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // 设置爆炸方向（使用 CSS 变量）
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            canvas.parentElement.appendChild(particle);
            
            // 清理粒子
            setTimeout(() => particle.remove(), 600);
        }
    });
}
