// 3D 贪食蛇游戏逻辑
class SnakeGame3D {
    constructor() {
        this.gridSize = 20;
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.speed = 1;
        this.direction = { x: 1, y: 0, z: 0 };
        this.nextDirection = { x: 1, y: 0, z: 0 };
        this.moveCounter = 0;
        this.moveDelay = 10;
        
        // 蛇的身体 - 初始化为3段
        this.snake = [
            { x: 10, y: 10, z: 10 },
            { x: 9, y: 10, z: 10 },
            { x: 8, y: 10, z: 10 }
        ];
        
        // 食物位置
        this.food = this.generateFood();
        
        // Three.js 场景设置
        this.setupScene();
        this.createGameObjects();
        
        // 事件监听
        this.setupControls();
        
        // 启动游戏循环
        this.animate();
    }
    
    setupScene() {
        // 创建场景、相机、渲染器
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 35);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        
        const container = document.getElementById('gameContainer');
        container.appendChild(this.renderer.domElement);
        
        // 光源设置
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 20, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
        
        // 添加点光源营造iOS风格
        const pointLight = new THREE.PointLight(0x667eea, 0.5);
        pointLight.position.set(-20, -20, 20);
        this.scene.add(pointLight);
        
        // 窗口大小改变时调整
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createGameObjects() {
        // 清空场景中的之前对象
        this.snakeMeshes = [];
        this.foodMesh = null;
        
        // 创建游戏边界（可选的视觉效果）
        this.createBoundary();
        
        // 初始化蛇
        this.updateSnakeMeshes();
        
        // 创建食物
        this.createFoodMesh();
    }
    
    createBoundary() {
        const size = this.gridSize + 2;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x444444 }));
        line.position.set(this.gridSize / 2 - 0.5, this.gridSize / 2 - 0.5, this.gridSize / 2 - 0.5);
        this.scene.add(line);
    }
    
    updateSnakeMeshes() {
        // 移除旧的蛇mesh
        this.snakeMeshes.forEach(mesh => this.scene.remove(mesh));
        this.snakeMeshes = [];
        
        // 创建新的蛇segments
        this.snake.forEach((segment, index) => {
            const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            
            // 头部使用不同颜色
            if (index === 0) {
                const material = new THREE.MeshPhongMaterial({
                    color: 0x00ff00,
                    emissive: 0x00aa00,
                    shininess: 100
                });
                var mesh = new THREE.Mesh(geometry, material);
            } else {
                const material = new THREE.MeshPhongMaterial({
                    color: 0x00cc00,
                    shininess: 50
                });
                var mesh = new THREE.Mesh(geometry, material);
            }
            
            mesh.position.set(segment.x, segment.y, segment.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.snakeMeshes.push(mesh);
        });
    }
    
    createFoodMesh() {
        if (this.foodMesh) {
            this.scene.remove(this.foodMesh);
        }
        
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff6b6b,
            emissive: 0xff0000,
            shininess: 100
        });
        this.foodMesh = new THREE.Mesh(geometry, material);
        this.foodMesh.position.set(this.food.x, this.food.y, this.food.z);
        this.foodMesh.castShadow = true;
        this.foodMesh.receiveShadow = true;
        this.scene.add(this.foodMesh);
        
        // 食物旋转动画
        this.foodMesh.rotationSpeed = 0.02;
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
                z: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.isSnakePosition(newFood));
        
        return newFood;
    }
    
    isSnakePosition(pos) {
        return this.snake.some(segment => 
            segment.x === pos.x && segment.y === pos.y && segment.z === pos.z
        );
    }
    
    setupControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 触屏控制
        this.setupTouchControls();
        
        // 陀螺仪控制（如果支持）
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => this.handleDeviceOrientation(e));
        }
    }
    
    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        // 开始/继续游戏
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
            this.setDirection(0, 1, 0);
            event.preventDefault();
        } else if (['arrowdown', 's'].includes(key)) {
            this.setDirection(0, -1, 0);
            event.preventDefault();
        } else if (['arrowleft', 'a'].includes(key)) {
            this.setDirection(-1, 0, 0);
            event.preventDefault();
        } else if (['arrowright', 'd'].includes(key)) {
            this.setDirection(1, 0, 0);
            event.preventDefault();
        } else if (['q', 'arrowup'].includes(key)) {
            // Z轴控制
            this.setDirection(0, 0, 1);
            event.preventDefault();
        } else if (['e', 'arrowdown'].includes(key)) {
            this.setDirection(0, 0, -1);
            event.preventDefault();
        }
    }
    
    setupTouchControls() {
        let startX = 0, startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            // 点击屏幕开始游戏
            if (!this.gameRunning) {
                this.startGame();
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!this.gameRunning) return;
            
            const endX = e.touches[0].clientX;
            const endY = e.touches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平滑动
                if (deltaX > 20) {
                    this.setDirection(1, 0, 0);
                } else if (deltaX < -20) {
                    this.setDirection(-1, 0, 0);
                }
            } else {
                // 竖直滑动
                if (deltaY > 20) {
                    this.setDirection(0, -1, 0);
                } else if (deltaY < -20) {
                    this.setDirection(0, 1, 0);
                }
            }
        }, { passive: true });
    }
    
    handleDeviceOrientation(event) {
        // 可选：使用设备陀螺仪进行3D控制
        // 这里简化实现，复杂版本可以基于倾斜角度进行方向控制
    }
    
    setDirection(x, y, z) {
        // 防止蛇向后转
        if (this.direction.x * -1 === x && this.direction.y * -1 === y && this.direction.z * -1 === z) {
            return;
        }
        
        this.nextDirection = { x, y, z };
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
            statusEl.textContent = '暂停 - 按空格继续';
            statusEl.classList.remove('hidden');
        } else {
            statusEl.classList.add('hidden');
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('gameStatus').textContent = `游戏结束！分数: ${this.score}\n按空格重新开始`;
        document.getElementById('gameStatus').classList.remove('hidden');
        
        // 重置游戏
        setTimeout(() => {
            this.resetGame();
        }, 100);
    }
    
    resetGame() {
        this.score = 0;
        this.snake = [
            { x: 10, y: 10, z: 10 },
            { x: 9, y: 10, z: 10 },
            { x: 8, y: 10, z: 10 }
        ];
        this.direction = { x: 1, y: 0, z: 0 };
        this.nextDirection = { x: 1, y: 0, z: 0 };
        this.food = this.generateFood();
        this.updateSnakeMeshes();
        this.createFoodMesh();
        this.updateScore();
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
            y: head.y + this.direction.y,
            z: head.z + this.direction.z
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
        if (newHead.x === this.food.x && newHead.y === this.food.y && newHead.z === this.food.z) {
            this.score += 10;
            this.updateScore();
            
            // 增加速度（可选）
            if (this.moveDelay > 4) {
                this.moveDelay--;
            }
            
            // 生成新食物
            this.food = this.generateFood();
            this.createFoodMesh();
        } else {
            // 移除尾部
            this.snake.pop();
        }
        
        // 更新蛇的meshes
        this.updateSnakeMeshes();
    }
    
    checkBoundaryCollision(pos) {
        return pos.x < 0 || pos.x >= this.gridSize ||
               pos.y < 0 || pos.y >= this.gridSize ||
               pos.z < 0 || pos.z >= this.gridSize;
    }
    
    updateScore() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
    }
    
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateGame();
        
        // 食物旋转动画
        if (this.foodMesh) {
            this.foodMesh.rotation.x += 0.01;
            this.foodMesh.rotation.y += 0.02;
        }
        
        // 相机跟随蛇头
        if (this.snake.length > 0) {
            const head = this.snake[0];
            const targetX = head.x - 5;
            const targetY = head.y + 5;
            const targetZ = head.z + 25;
            
            this.camera.position.lerp(
                new THREE.Vector3(targetX, targetY, targetZ),
                0.05
            );
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new SnakeGame3D();
});
