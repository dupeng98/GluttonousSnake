// 2D 贪食蛇游戏
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置canvas尺寸
        this.setupCanvas();
        
        // 游戏配置
        this.gridSize = 20;
        this.tileCount = 20;
        this.tileWidth = this.canvas.width / this.tileCount;
        this.tileHeight = this.canvas.height / this.tileCount;
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // 蛇初始化 - 身体为3段
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        
        // 食物位置
        this.food = this.generateFood();
        
        // 游戏速度
        this.moveCounter = 0;
        this.moveDelay = 6;
        
        // 事件监听
        this.setupControls();
        
        // 更新高分显示
        this.updateHighScore();
        
        // 启动游戏循环
        this.animate();
    }
    
    setupCanvas() {
        const container = document.getElementById('gameWrapper');
        const size = Math.min(container.clientWidth - 40, container.clientHeight - 200);
        
        this.canvas.width = size;
        this.canvas.height = size;
    }
    
    setupControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 触屏/按钮控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.handleButtonPress(direction);
                if (!this.gameRunning) {
                    this.startGame();
                }
            });
        });
        
        // 触屏滑动控制
        this.setupTouchControls();
        
        // 窗口大小改变
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupTouchControls() {
        let startX = 0, startY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            if (!this.gameRunning) {
                this.startGame();
            }
        }, { passive: true });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            const endX = e.touches[0].clientX;
            const endY = e.touches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                // 水平滑动
                if (deltaX > 0) {
                    this.setDirection(1, 0);
                } else {
                    this.setDirection(-1, 0);
                }
                startX = endX;
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
                // 竖直滑动
                if (deltaY > 0) {
                    this.setDirection(0, 1);
                } else {
                    this.setDirection(0, -1);
                }
                startY = endY;
            }
        }, { passive: true });
    }
    
    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        // 开始/暂停
        if (key === ' ') {
            event.preventDefault();
            if (!this.gameRunning) {
                this.startGame();
            } else {
                this.togglePause();
            }
            return;
        }
        
        // 方向控制
        if (['arrowup', 'w'].includes(key)) {
            this.setDirection(0, -1);
            event.preventDefault();
        } else if (['arrowdown', 's'].includes(key)) {
            this.setDirection(0, 1);
            event.preventDefault();
        } else if (['arrowleft', 'a'].includes(key)) {
            this.setDirection(-1, 0);
            event.preventDefault();
        } else if (['arrowright', 'd'].includes(key)) {
            this.setDirection(1, 0);
            event.preventDefault();
        }
    }
    
    handleButtonPress(direction) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(direction) {
            case 'up':
                this.setDirection(0, -1);
                break;
            case 'down':
                this.setDirection(0, 1);
                break;
            case 'left':
                this.setDirection(-1, 0);
                break;
            case 'right':
                this.setDirection(1, 0);
                break;
        }
    }
    
    setDirection(x, y) {
        // 防止蛇向后转
        if (this.direction.x * -1 === x && this.direction.y * -1 === y) {
            return;
        }
        
        this.nextDirection = { x, y };
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('gameStatus').classList.add('hidden');
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const statusEl = document.getElementById('gameStatus');
        if (this.gamePaused) {
            statusEl.textContent = '暂停中\n按空格继续游戏';
            statusEl.classList.remove('hidden');
        } else {
            statusEl.classList.add('hidden');
        }
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.isSnakePosition(newFood));
        
        return newFood;
    }
    
    isSnakePosition(pos) {
        return this.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    }
    
    updateGame() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.moveCounter++;
        if (this.moveCounter < this.moveDelay) return;
        
        this.moveCounter = 0;
        
        // 更新方向
        this.direction = { ...this.nextDirection };
        
        // 计算新头位置
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // 检查碰撞边界
        if (this.checkBoundaryCollision(newHead)) {
            this.gameOver();
            return;
        }
        
        // 检查自身碰撞
        if (this.isSnakePosition(newHead)) {
            this.gameOver();
            return;
        }
        
        // 添加新头
        this.snake.unshift(newHead);
        
        // 检查是否吃到食物
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            
            // 增加速度
            if (this.moveDelay > 3) {
                this.moveDelay -= 0.5;
            }
            
            // 生成新食物
            this.food = this.generateFood();
        } else {
            // 移除尾部
            this.snake.pop();
        }
    }
    
    checkBoundaryCollision(pos) {
        return pos.x < 0 || pos.x >= this.tileCount ||
               pos.y < 0 || pos.y >= this.tileCount;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }
        
        const statusEl = document.getElementById('gameStatus');
        statusEl.textContent = `游戏结束!\n分数: ${this.score}\n按空格重新开始`;
        statusEl.classList.remove('hidden');
        
        // 重置游戏
        setTimeout(() => {
            this.resetGame();
        }, 100);
    }
    
    resetGame() {
        this.score = 0;
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = this.generateFood();
        this.moveDelay = 6;
        this.updateScore();
    }
    
    updateScore() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
    }
    
    updateHighScore() {
        document.getElementById('highScore').textContent = `最高: ${this.highScore}`;
    }
    
    onWindowResize() {
        this.setupCanvas();
        this.tileWidth = this.canvas.width / this.tileCount;
        this.tileHeight = this.canvas.height / this.tileCount;
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格（可选）
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.tileWidth;
            // 竖线
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            // 横线
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }
    
    drawFood() {
        const x = this.food.x * this.tileWidth;
        const y = this.food.y * this.tileHeight;
        const size = Math.min(this.tileWidth, this.tileHeight) * 0.6;
        
        // 食物发光效果
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 绘制食物圆形
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(x + this.tileWidth / 2, y + this.tileHeight / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内部高亮
        this.ctx.fillStyle = '#ff9999';
        this.ctx.beginPath();
        this.ctx.arc(x + this.tileWidth / 2 - size / 6, y + this.tileHeight / 2 - size / 6, size / 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowColor = 'transparent';
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.tileWidth;
            const y = segment.y * this.tileHeight;
            const padding = this.tileWidth * 0.1;
            
            if (index === 0) {
                // 蛇头 - 明亮的绿色，带发光
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                
                this.ctx.fillStyle = '#00ff00';
                this.ctx.beginPath();
                this.ctx.roundRect(
                    x + padding, y + padding,
                    this.tileWidth - padding * 2, this.tileHeight - padding * 2,
                    5
                );
                this.ctx.fill();
                
                // 蛇的眼睛
                this.ctx.fillStyle = '#000000';
                const eyeSize = this.tileWidth * 0.15;
                if (this.direction.x === 1) {
                    // 右
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileWidth - eyeSize * 1.5, y + this.tileHeight * 0.35, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileWidth - eyeSize * 1.5, y + this.tileHeight * 0.65, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (this.direction.x === -1) {
                    // 左
                    this.ctx.beginPath();
                    this.ctx.arc(x + eyeSize * 1.5, y + this.tileHeight * 0.35, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(x + eyeSize * 1.5, y + this.tileHeight * 0.65, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (this.direction.y === -1) {
                    // 上
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileWidth * 0.35, y + eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileWidth * 0.65, y + eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (this.direction.y === 1) {
                    // 下
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileWidth * 0.35, y + this.tileHeight - eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileWidth * 0.65, y + this.tileHeight - eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // 蛇身 - 深绿色
                this.ctx.shadowColor = 'rgba(0, 200, 0, 0.5)';
                this.ctx.shadowBlur = 10;
                
                const gradient = this.ctx.createLinearGradient(x, y, x + this.tileWidth, y + this.tileHeight);
                gradient.addColorStop(0, '#00cc00');
                gradient.addColorStop(1, '#008800');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.roundRect(
                    x + padding, y + padding,
                    this.tileWidth - padding * 2, this.tileHeight - padding * 2,
                    3
                );
                this.ctx.fill();
            }
        });
        
        this.ctx.shadowColor = 'transparent';
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateGame();
        this.draw();
    }
}

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
    // 添加roundRect polyfill（用于旧浏览器）
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }
    
    new SnakeGame();
});

