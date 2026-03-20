/**
 * 乒乓球类
 */
class Ball {
  /**
   * 创建乒乓球
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.vx = 0;
    this.vy = 0;
    this.speed = 400;
    this.maxSpeed = 850;
    this.minSpeed = 300;
    this.spin = 0;
    this.lastHitBy = null; // 'player' | 'ai'

    // 拖尾效果
    this.trail = [];
    this.maxTrailLength = 8;

    // 颜色
    this.color = '#FF4444';
  }

  /**
   * 更新乒乓球位置
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 保存拖尾位置
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // 更新位置
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // 旋转效果（影响水平速度）
    this.vx += this.spin * deltaTime * 30;

    // 空气阻力
    this.vx *= 0.998;
    this.vy *= 0.998;
  }

  /**
   * 绘制乒乓球
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  draw(ctx) {
    ctx.save();

    // 绘制拖尾
    this.trail.forEach((point, index) => {
      const alpha = (index / this.trail.length) * 0.5;
      const trailRadius = this.radius * (index / this.trail.length) * 0.8;

      ctx.beginPath();
      ctx.arc(point.x, point.y, trailRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 150, 150, ${alpha})`;
      ctx.fill();
    });

    // 乒乓球主体（带阴影发光）
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    // 渐变填充
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.3, this.color);
    gradient.addColorStop(1, '#AA2222');

    ctx.fillStyle = gradient;
    ctx.fill();

    // 白色边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 球拍击球后的反弹
   * @param {Paddle} paddle - 击球的球拍
   * @param {number} hitPosition - 击中位置 (-1 ~ 1, 左边缘到右边缘)
   */
  bounceOffPaddle(paddle, hitPosition) {
    // 根据击中位置计算反弹角度
    const maxAngle = Math.PI / 3; // 最大60度
    const angle = hitPosition * maxAngle;

    // 确定垂直方向：反弹方向与来球方向相反
    const direction = this.vy > 0 ? -1 : 1;

    // 速度增加（每次击球加速3%，最高850）
    const newSpeed = Math.min(this.speed * 1.03, this.maxSpeed);
    this.speed = newSpeed;

    // 计算新速度向量
    this.vx = Math.sin(angle) * newSpeed + paddle.vx * 0.25;
    this.vy = direction * Math.cos(angle) * newSpeed;

    // 确保最小速度
    if (Math.abs(this.vy) < this.minSpeed * 0.5) {
      this.vy = direction * this.minSpeed * 0.5;
    }

    // 旋转效果（根据球拍运动方向）
    this.spin = paddle.vx * 0.002;

    // 记录最后击球者
    this.lastHitBy = paddle.isAI ? 'ai' : 'player';

    // 确保球在球拍外侧（防止穿透）
    const bounds = paddle.getBounds();
    if (this.vy < 0) {
      // 球向上飞，在球拍下方
      this.y = bounds.bottom + this.radius + 2;
    } else {
      // 球向下飞，在球拍上方
      this.y = bounds.top - this.radius - 2;
    }
  }

  /**
   * 边界反弹
   * @param {number} screenWidth - 屏幕宽度
   * @returns {string|null} 得分方或null（不计分，只限制位置）
   */
  bounceOffWalls(screenWidth) {
    const bounds = {
      left: 30,
      right: screenWidth - 30
    };

    // 球碰到两侧限制直行，不反弹，不丢分
    if (this.x - this.radius < bounds.left) {
      this.x = bounds.left + this.radius;
    } else if (this.x + this.radius > bounds.right) {
      this.x = bounds.right - this.radius;
    }
    return null;
  }

  /**
   * 设置发球
   * @param {string} server - 'player' | 'ai'
   * @param {number} angle - 发球角度（弧度）
   */
  serve(server, angle = 0) {
    const direction = server === 'player' ? -1 : 1;
    this.vx = Math.sin(angle) * this.speed * 0.5;
    this.vy = direction * this.speed;
    this.lastHitBy = server;
  }

  /**
   * 获取当前速度大小
   */
  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  /**
   * 重置球到初始位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 400;
    this.spin = 0;
    this.lastHitBy = null;
    this.trail = [];
  }

  /**
   * 检查球是否出界
   * @param {number} screenHeight - 屏幕高度
   * @returns {string|null} 得分方或null
   */
  checkOutOfBounds(screenHeight) {
    // 球完全越过球台底部（玩家未能接住）
    if (this.y - this.radius > screenHeight * 0.85 + 30) {
      return 'ai';
    }

    // 球完全越过球台顶部（AI未能接住）
    if (this.y + this.radius < screenHeight * 0.15 - 30) {
      return 'player';
    }

    return null;
  }
}

module.exports = { Ball };
