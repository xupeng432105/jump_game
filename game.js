class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME_CONFIG.canvas.width;
        this.canvas.height = GAME_CONFIG.canvas.height;
        
        // 游戏状态
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isCountingDown = true;
        this.countdown = 3;
        this.lastCountdownUpdate = performance.now();
        
        // 卷动速度设置
        this.normalScrollSpeed = GAME_CONFIG.game.normalScrollSpeed;
        this.fastScrollSpeed = GAME_CONFIG.game.fastScrollSpeed;
        this.scrollSpeed = 0; // 初始时速度为0，倒计时结束后才设置正常速度
        
        // 获取DOM元素
        this.countdownDiv = document.getElementById('countdown');
        this.countdownContainer = document.getElementById('countdownContainer');
        this.pauseButton = document.getElementById('pauseButton');
        this.pauseText = document.getElementById('pauseText');
        this.gameOverMask = document.getElementById('gameOverMask');
        this.gameOver = document.getElementById('gameOver');
        this.restartButton = document.getElementById('restartButton');
        this.scoreElement = document.getElementById('score');
        
        // 初始化倒计时显示
        this.countdownDiv.textContent = this.countdown;
        this.countdownContainer.style.display = 'block';
        
        // 玩家属性
        this.player = {
            x: 100,
            y: 0,
            width: GAME_CONFIG.player.width,
            height: GAME_CONFIG.player.height,
            jumping: false,
            jumpCount: 0,
            velocityY: 0,
            gravity: GAME_CONFIG.player.gravity,
            jumpVelocity: GAME_CONFIG.player.jumpVelocity,
            maxJumpCount: GAME_CONFIG.player.maxJumpCount
        };
        
        // 跳跃控制
        this.jumpKeyPressed = false;
        this.jumpKeyTimer = null;
        this.jumpKeyCount = 0;
        
        // 木桩属性
        this.stumps = [];
        this.baseStumpWidth = GAME_CONFIG.stump.baseWidth;
        this.stumpHeight = GAME_CONFIG.stump.height;
        this.minStumpWidth = GAME_CONFIG.stump.minWidth;
        this.maxStumpWidth = GAME_CONFIG.stump.maxWidth;
        
        // 跳跃距离计算
        this.jumpDistances = GAME_CONFIG.jumpDistances;
        
        // 连续木桩配置
        this.stumpPatterns = GAME_CONFIG.stumpPatterns;
        
        // 道具属性
        this.items = [];
        this.itemSpawnInterval = GAME_CONFIG.item.spawnInterval;
        this.lastItemSpawnTime = 0;
        this.itemSize = GAME_CONFIG.item.size;
        
        // 浮空效果
        this.isFloating = false;
        this.floatStartTime = 0;
        this.floatDuration = GAME_CONFIG.float.duration;
        this.floatWarningTime = GAME_CONFIG.float.warningTime;
        this.isFlashing = false;
        this.flashInterval = GAME_CONFIG.float.flashInterval;
        this.lastFlashTime = 0;
        this.floatPauseTime = 0;
        this.floatRemainingTime = 0;
        this.pauseStartTime = 0;
        this.totalFloatDuration = 0;
        
        // 云朵属性
        this.clouds = [];
        this.cloudSpawnInterval = GAME_CONFIG.cloud.spawnInterval;
        this.lastCloudSpawnTime = 0;
        this.cloudTypes = GAME_CONFIG.cloud.types;
        
        // 弹珠属性
        this.marbles = [];
        this.marbleSpawnInterval = GAME_CONFIG.marble.spawnInterval;
        this.lastMarbleSpawnTime = 0;
        this.marbleSize = GAME_CONFIG.marble.size;
        this.marbleSpeed = GAME_CONFIG.marble.verticalSpeed;
        this.horizontalMarbleSpeed = GAME_CONFIG.marble.horizontalSpeed;
        
        // 初始化木桩
        this.initStumps();
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    generateStumpWidth() {
        // 随机生成1-3倍的木桩宽度，确保宽度在合理范围内
        const multiplier = Math.floor(Math.random() * 3) + 1;
        const width = this.baseStumpWidth * multiplier;
        return Math.min(Math.max(width, this.minStumpWidth), this.maxStumpWidth);
    }
    
    generateStumpPattern() {
        // 决定是否生成连续木桩
        if (Math.random() < this.stumpPatterns.easy.probability) {
            const count = Math.floor(Math.random() * 
                (this.stumpPatterns.easy.maxCount - this.stumpPatterns.easy.minCount + 1)) + 
                this.stumpPatterns.easy.minCount;
            return {
                type: 'easy',
                count: count,
                gap: this.stumpPatterns.easy.gap
            };
        }
        
        // 否则生成普通木桩
        const jumpType = Math.floor(Math.random() * 3) + 1;
        let gap;
        
        switch(jumpType) {
            case 1:
                gap = this.jumpDistances.single;
                break;
            case 2:
                gap = this.jumpDistances.double;
                break;
            case 3:
                gap = this.jumpDistances.triple;
                break;
        }
        
        // 添加一些随机变化
        const randomVariation = Math.floor(Math.random() * 20) - 10;
        gap = Math.max(this.jumpDistances.single, Math.min(gap + randomVariation, this.jumpDistances.triple));
        
        return {
            type: 'normal',
            count: 1,
            gap: gap
        };
    }
    
    initStumps() {
        // 创建初始木桩
        let lastX = 0;
        let remainingStumps = 10;
        
        while (remainingStumps > 0) {
            const pattern = this.generateStumpPattern();
            
            for (let i = 0; i < pattern.count && remainingStumps > 0; i++) {
                const stumpWidth = this.generateStumpWidth();
                const stump = {
                    x: lastX,
                    y: this.canvas.height - this.stumpHeight,
                    width: stumpWidth,
                    height: this.stumpHeight
                };
                this.stumps.push(stump);
                lastX = stump.x + stump.width + pattern.gap;
                remainingStumps--;
            }
        }
    }
    
    jump() {
        // 如果正在浮空，不允许跳跃
        if (this.isFloating) return;
        
        if (this.player.jumpCount < this.player.maxJumpCount) {
            this.player.jumping = true;
            this.player.jumpCount++;
            // 根据跳跃次数调整跳跃速度
            this.player.velocityY = this.player.jumpVelocity * (1 + (this.player.jumpCount - 1) * 0.2);
        }
    }
    
    update() {
        if (this.isPaused || this.isGameOver) return;

        if (this.isCountingDown) {
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastCountdownUpdate;
            
            if (elapsed >= 1000) {
                this.countdown--;
                this.lastCountdownUpdate = currentTime;
                this.countdownDiv.textContent = this.countdown;
                
                if (this.countdown <= 0) {
                    this.isCountingDown = false;
                    this.countdownContainer.style.display = 'none';
                    this.scrollSpeed = this.normalScrollSpeed;
                }
            }
            return;
        }
        
        // 更新玩家位置
        if (!this.isFloating) {
            this.player.velocityY += this.player.gravity;
            this.player.y += this.player.velocityY;
            this.scrollSpeed = this.normalScrollSpeed;
            this.isFlashing = false;
        } else {
            // 浮空效果处理
            const currentTime = Date.now();
            const elapsedTime = currentTime - this.floatStartTime;
            
            // 检查浮空时间是否结束
            if (elapsedTime >= this.floatDuration) {
                this.isFloating = false;
                this.isFlashing = false;
                this.scrollSpeed = this.normalScrollSpeed;
                // 重置跳跃状态
                this.player.jumping = false;
                this.player.jumpCount = 0;
                this.player.velocityY = 0;
            } else {
                // 在浮空状态下，玩家保持当前高度并加速
                this.player.velocityY = 0;
                this.scrollSpeed = this.fastScrollSpeed;
                
                // 检查是否需要开始闪烁警告
                if (elapsedTime >= this.floatDuration - this.floatWarningTime) {
                    // 更新闪烁状态
                    if (currentTime - this.lastFlashTime >= this.flashInterval) {
                        this.isFlashing = !this.isFlashing;
                        this.lastFlashTime = currentTime;
                    }
                }
            }
        }
        
        // 检查是否落在木桩上
        let onStump = false;
        for (let stump of this.stumps) {
            const isFalling = this.player.velocityY > 0;
            const isAtStumpLevel = Math.abs((this.player.y + this.player.height) - stump.y) < 10;
            const hasHorizontalOverlap = (this.player.x + this.player.width >= stump.x - 5) && 
                                       (this.player.x <= stump.x + stump.width + 5);
            
            if (isFalling && isAtStumpLevel && hasHorizontalOverlap) {
                this.player.y = stump.y - this.player.height;
                this.player.velocityY = 0;
                this.player.jumping = false;
                this.player.jumpCount = 0;
                onStump = true;
                break;
            }
        }
        
        // 如果玩家掉出屏幕底部，游戏结束
        if (this.player.y > this.canvas.height) {
            this.endGame();
            return;
        }
        
        // 如果玩家贴近屏幕左边，推动玩家向前
        if (this.player.x < 50) {
            this.player.x = 50;
        }
        
        // 更新木桩位置
        for (let stump of this.stumps) {
            stump.x -= this.scrollSpeed;
        }
        
        // 移除超出屏幕的木桩
        this.stumps = this.stumps.filter(stump => stump.x + stump.width > 0);
        
        // 添加新的木桩
        const lastStump = this.stumps[this.stumps.length - 1];
        if (lastStump && lastStump.x < this.canvas.width - this.jumpDistances.single) {
            const pattern = this.generateStumpPattern();
            let currentX = lastStump.x + lastStump.width + pattern.gap;
            
            for (let i = 0; i < pattern.count; i++) {
                const stumpWidth = this.generateStumpWidth();
                this.stumps.push({
                    x: currentX,
                    y: this.canvas.height - this.stumpHeight,
                    width: stumpWidth,
                    height: this.stumpHeight
                });
                currentX += stumpWidth + pattern.gap;
            }
        }
        
        // 更新道具位置
        for (let item of this.items) {
            item.x -= this.scrollSpeed;
        }
        
        // 移除超出屏幕的道具
        this.items = this.items.filter(item => item.x + item.width > 0);
        
        // 检测道具碰撞
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (this.checkCollision(this.player, item)) {
                // 处理道具效果
                if (item.type === 'float') {
                    this.isFloating = true;
                    this.floatStartTime = Date.now();
                    this.totalFloatDuration = this.floatDuration;
                    this.isFlashing = false;
                    this.jumpKeyCount = 0;
                }
                // 移除已收集的道具
                this.items.splice(i, 1);
            }
        }
        
        // 更新云朵位置
        for (let cloud of this.clouds) {
            cloud.x -= this.scrollSpeed;
        }
        
        // 移除超出屏幕的云朵
        this.clouds = this.clouds.filter(cloud => cloud.x + cloud.width > 0);
        
        // 更新弹珠位置
        for (let i = this.marbles.length - 1; i >= 0; i--) {
            const marble = this.marbles[i];
            
            if (marble.isHorizontal) {
                marble.x -= (this.scrollSpeed + this.horizontalMarbleSpeed);
            } else {
                marble.x -= this.scrollSpeed;
                marble.y -= marble.speed;
            }
            
            // 检测弹珠碰撞,如果是在浮空状态，则不立即结束游戏，而是移除弹珠
            if (this.checkCollision(this.player, marble)) {
                if(this.isFloating){
                    this.marbles.splice(i, 1);
                } else {
                    this.endGame();
                    return;
                }
            }
            
            // 移除超出屏幕的弹珠
            if ((marble.isHorizontal && marble.x + marble.size < 0) || 
                (!marble.isHorizontal && marble.y + marble.size < 0)) {
                this.marbles.splice(i, 1);
            }
        }
        
        // 生成新道具
        const currentTime = Date.now();
        if (currentTime - this.lastItemSpawnTime >= this.itemSpawnInterval) {
            if (Math.random() < 0.3) {
                this.generateItem();
            }
            this.lastItemSpawnTime = currentTime;
        }
        
        // 生成新云朵
        if (currentTime - this.lastCloudSpawnTime >= this.cloudSpawnInterval) {
            if (Math.random() < 0.3) {
                this.generateCloud();
            }
            this.lastCloudSpawnTime = currentTime;
        }
        
        // 生成新弹珠
        if (currentTime - this.lastMarbleSpawnTime >= this.marbleSpawnInterval) {
            if (Math.random() < GAME_CONFIG.marble.spawnProbability) {
                // 根据分数决定是否生成水平弹珠
                const isHorizontal = this.score >= GAME_CONFIG.marble.scoreThresholds.horizontal;
                // 如果分数达到垂直弹珠阈值，则生成垂直弹珠
                const isVertical = this.score >= GAME_CONFIG.marble.scoreThresholds.vertical;
                
                if (isHorizontal || isVertical) {
                    this.generateMarble(isHorizontal);
                }
            }
            this.lastMarbleSpawnTime = currentTime;
        }
        
        // 更新分数
        this.score += GAME_CONFIG.game.scoreIncrement;
        this.scoreElement.textContent = this.score;
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制木桩
        this.ctx.fillStyle = '#8B4513';
        for (let stump of this.stumps) {
            this.ctx.fillRect(stump.x, stump.y, stump.width, stump.height);
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(stump.x, stump.y, stump.width, 5);
            this.ctx.fillStyle = '#8B4513';
        }
        
        // 绘制云朵
        for (let cloud of this.clouds) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            // 绘制云朵的每个部分
            const segmentWidth = cloud.width / cloud.segments;
            for (let i = 0; i < cloud.segments; i++) {
                const x = cloud.x + i * segmentWidth;
                const y = cloud.y + (i % 2 === 0 ? 0 : -cloud.height / 4);
                
                this.ctx.beginPath();
                this.ctx.arc(
                    x + segmentWidth / 2,
                    y + cloud.height / 2,
                    cloud.height / 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
        
        // 绘制道具
        for (let item of this.items) {
            // 绘制浮空道具
            // 绘制外圈光晕
            this.ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(
                item.x + item.width / 2,
                item.y + item.height / 2,
                item.width / 2 + 8,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // 绘制主体
            this.ctx.fillStyle = '#FFF9C4'; // 淡黄色
            this.ctx.beginPath();
            this.ctx.arc(
                item.x + item.width / 2,
                item.y + item.height / 2,
                item.width / 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // 绘制高光效果
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(
                item.x + item.width / 2 - 5,
                item.y + item.height / 2 - 5,
                item.width / 6,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // 绘制玩家
        if (this.isFloating) {
            if (this.isFlashing) {
                // 闪烁效果：根据时间交替显示不同颜色
                const currentTime = Date.now();
                if (currentTime - this.lastFlashTime < this.flashInterval / 2) {
                    this.ctx.fillStyle = '#FF0000'; // 红色
                } else {
                    this.ctx.fillStyle = '#FFFF00'; // 黄色
                }
            } else {
                this.ctx.fillStyle = '#00FF00'; // 正常浮空状态为绿色
            }
        } else {
            this.ctx.fillStyle = '#FF0000'; // 正常状态为红色
        }
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 绘制弹珠
        for (let marble of this.marbles) {
            this.ctx.fillStyle = '#000000'; // 黑色
            this.ctx.beginPath();
            this.ctx.arc(
                marble.x + marble.size / 2,
                marble.y + marble.size / 2,
                marble.size / 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // 添加高光效果
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(
                marble.x + marble.size / 3,
                marble.y + marble.size / 3,
                marble.size / 6,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    endGame() {
        this.isGameOver = true;
        this.gameOverMask.style.display = 'block';
        this.gameOver.style.display = 'block';
        
        // 获取历史最高分
        const highScore = parseInt(localStorage.getItem('highScore') || '0');
        
        // 更新最终得分显示
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = this.score;
        }
        
        // 更新最高分显示
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = highScore;
        }
        
        // 如果当前分数超过最高分，更新最高分
        if (this.score > highScore) {
            localStorage.setItem('highScore', this.score.toString());
            if (highScoreElement) {
                highScoreElement.textContent = this.score;
            }
        }
    }
    
    restart() {
        // 隐藏游戏结束界面
        this.gameOverMask.style.display = 'none';
        this.gameOver.style.display = 'none';
        this.pauseText.style.display = 'none';
        
        // 重置暂停按钮状态
        if (this.pauseButton) {
            this.pauseButton.textContent = '暂停';
            this.pauseButton.classList.remove('paused');
        }
        
        // 重置倒计时状态
        this.countdown = 3;
        this.countdownDiv.textContent = this.countdown;
        this.countdownContainer.style.display = 'block';
        this.isCountingDown = true;
        this.lastCountdownUpdate = performance.now();
        
        // 重置游戏状态
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.scrollSpeed = 0;
        this.player = {
            x: 100,
            y: 0,
            width: GAME_CONFIG.player.width,
            height: GAME_CONFIG.player.height,
            jumping: false,
            jumpCount: 0,
            velocityY: 0,
            gravity: GAME_CONFIG.player.gravity,
            jumpVelocity: GAME_CONFIG.player.jumpVelocity,
            maxJumpCount: GAME_CONFIG.player.maxJumpCount
        };
        
        // 清空游戏对象
        this.stumps = [];
        this.items = [];
        this.clouds = [];
        this.marbles = [];
        
        // 重新初始化木桩
        this.initStumps();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    generateItem() {
        // 从屏幕右侧生成道具
        const x = this.canvas.width; // 从屏幕最右边开始
        const y = Math.random() * (this.canvas.height / 2); // 在上半部分生成
        
        this.items.push({
            x: x,
            y: y,
            width: this.itemSize,
            height: this.itemSize,
            type: 'float' // 道具类型
        });
    }
    
    generateCloud() {
        const cloudType = this.cloudTypes[Math.floor(Math.random() * this.cloudTypes.length)];
        const y = Math.random() * (this.canvas.height / 2); // 在上半部分生成
        
        this.clouds.push({
            x: this.canvas.width,
            y: y,
            width: cloudType.width,
            height: cloudType.height,
            segments: cloudType.segments
        });
    }
    
    generateMarble(isHorizontal) {
        // 找到没有木桩的位置，且不在玩家后面
        let validPosition = null;
        let attempts = 0;
        const maxAttempts = 10; // 最大尝试次数
        
        while (!validPosition && attempts < maxAttempts) {
            // 随机选择一个位置，但确保在玩家前方
            const minX = this.player.x + this.player.width + 50; // 玩家后方50像素
            const maxX = this.canvas.width - this.marbleSize;
            
            // 对于垂直弹珠，只在屏幕右半部分生成
            let x;
            if (isHorizontal) {
                x = minX + Math.random() * (maxX - minX);
            } else {
                // 垂直弹珠只在右半部分生成
                const rightHalfStart = this.canvas.width / 2;
                x = rightHalfStart + Math.random() * (maxX - rightHalfStart);
            }
            
            // 检查这个位置是否与任何木桩重叠
            let isOverlapping = false;
            let stumpY = this.canvas.height - this.stumpHeight; // 默认木桩高度
            
            for (let stump of this.stumps) {
                if (x + this.marbleSize > stump.x && x < stump.x + stump.width) {
                    isOverlapping = true;
                    stumpY = stump.y; // 记录重叠木桩的Y坐标
                    break;
                }
            }
            
            if (!isOverlapping) {
                validPosition = { x, y: stumpY - this.marbleSize - 10 }; // 在木桩上方10像素处
            }
            
            attempts++;
        }
        
        // 如果找到有效位置，生成弹珠
        if (validPosition) {
            // 生成新的弹珠
            this.marbles.push({
                x: isHorizontal ? this.canvas.width : validPosition.x,
                y: validPosition.y,
                size: this.marbleSize,
                speed: isHorizontal ? this.horizontalMarbleSpeed : this.marbleSpeed,
                isHorizontal: isHorizontal
            });
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseText.style.display = this.isPaused ? 'block' : 'none';
        
        if (this.isPaused) {
            // 游戏暂停时，记录当前时间
            this.pauseStartTime = Date.now();
            
            // 如果正在浮空，计算剩余时间
            if (this.isFloating) {
                const elapsedTime = this.pauseStartTime - this.floatStartTime;
                this.floatRemainingTime = Math.max(0, this.totalFloatDuration - elapsedTime);
            }
            
            // 重置所有跳跃状态
            this.jumpKeyPressed = false;
            this.jumpKeyCount = 0;
            clearTimeout(this.jumpKeyTimer);
            this.player.jumping = false;
            this.player.jumpCount = 0;
            this.player.velocityY = 0;
        } else {
            // 游戏继续时，调整浮空开始时间
            if (this.isFloating) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.floatStartTime += pauseDuration;
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        // 如果是弹珠（圆形）与玩家（矩形）的碰撞
        if (obj2.size) { // 弹珠有 size 属性
            // 计算矩形中心点
            const rectCenterX = obj1.x + obj1.width / 2;
            const rectCenterY = obj1.y + obj1.height / 2;
            
            // 计算圆形中心点
            const circleCenterX = obj2.x + obj2.size / 2;
            const circleCenterY = obj2.y + obj2.size / 2;
            
            // 计算矩形上距离圆形最近的点
            const closestX = Math.max(obj1.x, Math.min(circleCenterX, obj1.x + obj1.width));
            const closestY = Math.max(obj1.y, Math.min(circleCenterY, obj1.y + obj1.height));
            
            // 计算最近点到圆心的距离
            const distanceX = circleCenterX - closestX;
            const distanceY = circleCenterY - closestY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // 如果距离小于圆的半径，则发生碰撞
            return distance < obj2.size / 2;
        }
        
        // 矩形与矩形的碰撞检测
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
}

// 确保在 DOM 加载完成后再初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new Game();
    window.gameInstance = game;
    
    // 定义跳跃处理函数
    const handleJump = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            const game = window.gameInstance;
            if (!game.isGameOver && !game.isPaused && !game.isCountingDown) {
                game.jump();
            }
        }
    };
    
    // 添加全局键盘事件监听
    document.addEventListener('keydown', handleJump);
    
    // 添加暂停按钮事件监听
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            const game = window.gameInstance;
            // 如果正在倒计时，不执行暂停操作
            if (game.isCountingDown) return;
            
            game.togglePause();
            if (game.isPaused) {
                pauseButton.textContent = '继续';
                pauseButton.classList.add('paused');
            } else {
                pauseButton.textContent = '暂停';
                pauseButton.classList.remove('paused');
            }
        });
    }
    
    // 添加重启按钮事件监听
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            const game = window.gameInstance;
            game.restart();
        });
    }
}); 