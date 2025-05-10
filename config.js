// 游戏基础配置
const GAME_CONFIG = {
    // 画布配置
    canvas: {
        width: 800,
        height: 400
    },
    
    // 游戏状态配置
    game: {
        normalScrollSpeed: 2,    // 正常卷动速度
        fastScrollSpeed: 10,     // 加速时的卷动速度（5倍）
        scoreIncrement: 1        // 每帧增加的分数
    },
    
    // 玩家配置
    player: {
        width: 30,
        height: 50,
        gravity: 0.5,
        jumpVelocity: -10,      // 基础跳跃速度
        maxJumpCount: 3         // 最大跳跃次数
    },
    
    // 木桩配置
    stump: {
        baseWidth: 40,          // 基础木桩宽度
        height: 20,
        minWidth: 40,           // 最小木桩宽度
        maxWidth: 120           // 最大木桩宽度
    },
    
    // 跳跃距离配置
    jumpDistances: {
        single: 80,             // 单次跳跃距离
        double: 160,            // 两次跳跃距离
        triple: 240             // 三次跳跃距离
    },
    
    // 连续木桩配置
    stumpPatterns: {
        easy: {
            gap: 60,            // 简单模式下的木桩间距
            minCount: 2,        // 最少连续木桩数
            maxCount: 4,        // 最多连续木桩数
            probability: 0.3    // 出现连续木桩的概率
        }
    },
    
    // 道具配置
    item: {
        size: 30,               // 道具大小
        spawnInterval: 3000,    // 道具生成间隔（毫秒）
        spawnProbability: 0.3   // 道具生成概率
    },
    
    // 浮空效果配置
    float: {
        duration: 8000,         // 基础浮空持续时间（毫秒）
        warningTime: 2000,      // 提前开始闪烁的时间（毫秒）
        flashInterval: 100      // 闪烁间隔（毫秒）
    },
    
    // 云朵配置
    cloud: {
        spawnInterval: 2000,    // 云朵生成间隔（毫秒）
        spawnProbability: 0.3,  // 云朵生成概率
        types: [
            { width: 60, height: 30, segments: 3 },  // 小云
            { width: 80, height: 40, segments: 4 },  // 中云
            { width: 100, height: 50, segments: 5 }  // 大云
        ]
    },
    
    // 弹珠配置
    marble: {
        size: 20,               // 弹珠直径
        spawnInterval: 800,     // 弹珠生成间隔（毫秒）
        spawnProbability: 0.5,  // 弹珠生成概率
        verticalSpeed: 3,       // 垂直弹珠上升速度
        horizontalSpeed: 2,     // 水平弹珠基础速度
        scoreThresholds: {
            vertical: 3000,     // 垂直弹珠出现所需分数
            horizontal: 5000    // 水平弹珠出现所需分数
        }
    }
}; 