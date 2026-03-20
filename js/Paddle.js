/**
 * 乒乓球拍类
 */
class Paddle {
  /**
   * 创建球拍
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {boolean} isAI - 是否为AI球拍
   * @param {number} width - 球拍宽度
   * @param {number} height - 球拍高度
   */
  constructor(x, y, isAI = false, width = 100, height = 15) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 0;
    this.vx = 0; // 用于计算旋转效果
    this.maxSpeed = 600;
    this.isAI = isAI;
    this.targetX = x;

    // 颜色：玩家黄色，AI蓝色
    this.color = isAI ? '#3377FF' : '#FFDD33';
    this.glowColor = isAI ? 'rgba(51, 119, 255, 0.5)' : 'rgba(255, 221, 51, 0.7)';
  }

  /**
   * 更新球拍位置（玩家控制）- 丝滑跟随
   * @param {number} deltaTime - 时间增量（秒）
   * @param {number} targetX - 目标X坐标
   */
  update(deltaTime, targetX) {
    if (this.isAI) return;

    // 使用指数平滑插值实现丝滑移动
    // factor 越大移动越快（0.1 = 慢丝滑，0.5 = 快跟手）
    const smoothFactor = 0.15;
    const dx = targetX - this.x;
    this.x += dx * smoothFactor;

    // 边界约束
    const halfWidth = this.width / 2;
    this.x = Math.max(halfWidth, Math.min(gameState.screenWidth - halfWidth, this.x));

    // 更新 vx 用于旋转效果
    this.vx = dx * smoothFactor * 60;
  }

  /**
   * AI更新球拍位置
   * @param {number} deltaTime - 时间增量（秒）
   * @param {number} targetX - 目标X坐标
   * @param {number} maxSpeed - 最大移动速度
   */
  updateAI(deltaTime, targetX, maxSpeed) {
    if (!this.isAI) return;

    this.targetX = targetX;

    const dx = this.targetX - this.x;
    const speed = Math.min(Math.abs(dx) * 5, maxSpeed);
    this.vx = Math.sign(dx) * speed;

    this.x += this.vx * deltaTime;

    // 边界约束
    const halfWidth = this.width / 2;
    this.x = Math.max(halfWidth, Math.min(gameState.screenWidth - halfWidth, this.x));
  }

  /**
   * 绘制球拍
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  draw(ctx) {
    ctx.save();

    const x = this.x - this.width / 2;
    const y = this.y - this.height / 2;

    // 发光效果（增强可见性）
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 20;

    // 球拍主体（圆角矩形）
    ctx.fillStyle = this.color;
    this.roundRect(ctx, x, y, this.width, this.height, 6);
    ctx.fill();

    // 球拍边框（白色更明显）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 高光条
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x + 5, y + 2, this.width - 10, this.height / 3);

    ctx.restore();
  }

  /**
   * 绘制圆角矩形
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * 检测与乒乓球的碰撞
   * @param {Ball} ball - 乒乓球对象
   * @returns {number|null} 击中位置 (-1 ~ 1) 或 null（无碰撞）
   */
  checkCollision(ball) {
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2;
    const top = this.y - this.height / 2;
    const bottom = this.y + this.height / 2;

    // 找到圆心到矩形最近的一点
    const closestX = Math.max(left, Math.min(ball.x, right));
    const closestY = Math.max(top, Math.min(ball.y, bottom));

    // 计算距离
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball.radius) {
      // 计算击中位置 (-1 = 左边缘, 0 = 中心, 1 = 右边缘)
      const hitPosition = (ball.x - this.x) / (this.width / 2);
      return Math.max(-1, Math.min(1, hitPosition));
    }

    return null;
  }

  /**
   * 设置球拍位置
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 获取球拍边界
   */
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
      centerX: this.x,
      centerY: this.y
    };
  }
}

module.exports = { Paddle };
