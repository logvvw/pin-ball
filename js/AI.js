/**
 * AI控制类
 * 实现5级难度的人工智能对手
 */
class AI {
  /**
   * 创建AI控制器
   * @param {Paddle} paddle - AI控制的球拍
   * @param {number} difficulty - 难度等级 1-5
   */
  constructor(paddle, difficulty = 1) {
    this.paddle = paddle;
    this.setDifficulty(difficulty);

    this.targetX = paddle.x;
    this.reactionTimer = 0;
    this.predictionTimer = 0;

    // AI状态
    this.state = 'idle'; // idle, tracking, predicting
    this.fakeDirection = 0; // 假动作方向
  }

  /**
   * 设置AI难度
   * @param {number} level - 难度等级 1-5
   */
  setDifficulty(level) {
    this.difficulty = level;

    // AI难度配置
    const configs = {
      1: { // 业余选手
        speed: 180,
        reactionTime: 0.25,
        accuracy: 0.25,
        predictEnabled: false,
        errorRange: 60,
        name: '业余选手'
      },
      2: { // 业余高手
        speed: 280,
        reactionTime: 0.18,
        accuracy: 0.45,
        predictEnabled: false,
        errorRange: 40,
        name: '业余高手'
      },
      3: { // 半职业选手
        speed: 380,
        reactionTime: 0.12,
        accuracy: 0.65,
        predictEnabled: true,
        errorRange: 25,
        name: '半职业选手'
      },
      4: { // 职业选手
        speed: 500,
        reactionTime: 0.08,
        accuracy: 0.82,
        predictEnabled: true,
        errorRange: 15,
        name: '职业选手'
      },
      5: { // 奥运冠军
        speed: 650,
        reactionTime: 0.05,
        accuracy: 0.95,
        predictEnabled: true,
        errorRange: 8,
        name: '奥运冠军'
      }
    };

    this.config = configs[level] || configs[1];
    this.paddle.maxSpeed = this.config.speed;
  }

  /**
   * 更新AI
   * @param {number} deltaTime - 时间增量（秒）
   * @param {Ball} ball - 乒乓球
   * @param {boolean} isServeTurn - 是否轮到AI发球
   * @param {number} screenWidth - 屏幕宽度
   */
  update(deltaTime, ball, isServeTurn = false, screenWidth = 375) {
    if (isServeTurn) {
      this.updateForServe(deltaTime, ball, screenWidth);
      return;
    }

    // 反应延迟
    this.reactionTimer -= deltaTime;
    if (this.reactionTimer > 0) {
      return;
    }

    // 预测更新
    if (this.config.predictEnabled) {
      this.predictionTimer -= deltaTime;
      if (this.predictionTimer <= 0) {
        this.updatePrediction(ball, screenWidth);
        this.predictionTimer = 0.05; // 每50ms更新一次预测
      }
    } else {
      // 简单追踪
      this.targetX = ball.x + ball.vx * 0.1;
    }

    // 添加误差
    const error = (1 - this.config.accuracy) * (Math.random() - 0.5) * this.config.errorRange;
    this.targetX += error;

    // 移动球拍
    this.movePaddle(deltaTime, screenWidth);
  }

  /**
   * 更新预测（高级AI用）
   * @param {Ball} ball - 乒乓球
   * @param {number} screenWidth - 屏幕宽度
   */
  updatePrediction(ball, screenWidth) {
    // 只在球朝AI方向飞时预测
    if (ball.vy > 0) {
      this.targetX = this.predictLandingPoint(ball, screenWidth);
    } else {
      // 球远离AI，简单追踪中心
      this.targetX = screenWidth / 2 + ball.vx * 0.2;
    }
  }

  /**
   * 预测球的落点
   * @param {Ball} ball - 乒乓球
   * @param {number} screenWidth - 屏幕宽度
   * @returns {number} 预测的X坐标
   */
  predictLandingPoint(ball, screenWidth) {
    let simX = ball.x;
    let simY = ball.y;
    let simVx = ball.vx;
    let simVy = ball.vy;

    const paddleY = this.paddle.y - this.paddle.height / 2;
    const dt = 0.016; // 时间步长
    const bounds = {
      left: 30 + ball.radius,
      right: screenWidth - 30 - ball.radius
    };

    // 模拟球运动直到到达AI球拍Y坐标
    while (simY > paddleY && simVy < 0) {
      simX += simVx * dt;
      simY += simVy * dt;

      // 左右边界反弹
      if (simX < bounds.left) {
        simVx = Math.abs(simVx) * 0.9;
        simX = bounds.left;
      } else if (simX > bounds.right) {
        simVx = -Math.abs(simVx) * 0.9;
        simX = bounds.right;
      }
    }

    return simX;
  }

  /**
   * 移动球拍到目标位置
   * @param {number} deltaTime - 时间增量
   * @param {number} screenWidth - 屏幕宽度
   */
  movePaddle(deltaTime, screenWidth) {
    const dx = this.targetX - this.paddle.x;

    // 计算移动速度
    const speed = Math.min(Math.abs(dx) * 5, this.config.speed);
    const direction = Math.sign(dx);

    this.paddle.vx = direction * speed;
    this.paddle.x += this.paddle.vx * deltaTime;

    // 边界约束
    const halfWidth = this.paddle.width / 2;
    this.paddle.x = Math.max(halfWidth, Math.min(screenWidth - halfWidth, this.paddle.x));
  }

  /**
   * 发球时的AI更新
   * @param {number} deltaTime - 时间增量
   * @param {Ball} ball - 乒乓球
   * @param {number} screenWidth - 屏幕宽度
   */
  updateForServe(deltaTime, ball, screenWidth) {
    // AI发球：移动到发球位置，然后发射
    const serveX = screenWidth / 2;
    const dx = serveX - this.paddle.x;

    if (Math.abs(dx) > 5) {
      const speed = Math.min(Math.abs(dx) * 3, this.config.speed * 0.5);
      this.paddle.vx = Math.sign(dx) * speed;
      this.paddle.x += this.paddle.vx * deltaTime;
    }
  }

  /**
   * 生成发球
   * @param {Ball} ball - 乒乓球
   * @returns {Object} 发球参数 { angle, speed, fake }
   */
  generateServe(ball) {
    const patterns = [
      // 直球
      () => ({
        angle: 0,
        speed: this.config.speed * 0.9,
        fake: false
      }),
      // 右斜线
      () => ({
        angle: 0.2 + Math.random() * 0.15,
        speed: this.config.speed,
        fake: false
      }),
      // 左斜线
      () => ({
        angle: -(0.2 + Math.random() * 0.15),
        speed: this.config.speed,
        fake: false
      }),
      // 短球
      () => ({
        angle: (Math.random() - 0.5) * 0.3,
        speed: this.config.speed * 0.7,
        fake: false
      })
    ];

    // 高难度AI有30%概率使用假动作
    let pattern;
    if (this.difficulty >= 4 && Math.random() < 0.3) {
      // 假动作：先做要往某方向发的动作，然后改变
      pattern = patterns[Math.floor(Math.random() * 2)]();
      pattern.fake = true;
    } else {
      pattern = patterns[Math.floor(Math.random() * patterns.length)]();
    }

    // 返回函数执行结果（pattern已经是对象，不是函数）
    return pattern;
  }

  /**
   * 触发反应延迟
   */
  triggerReactionDelay() {
    const variance = this.config.reactionTime * 0.5;
    this.reactionTimer = this.config.reactionTime + (Math.random() - 0.5) * variance;
  }

  /**
   * 获取AI名称
   */
  getName() {
    return this.config.name;
  }

  /**
   * 获取当前难度等级
   */
  getDifficulty() {
    return this.difficulty;
  }
}

module.exports = { AI };
