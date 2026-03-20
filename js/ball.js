/**
 * 小球类
 * 处理小球的运动和碰撞
 */
class Ball {
  /**
   * 创建一个小球
   * @param {number} x - 初始X坐标
   * @param {number} y - 初始Y坐标
   * @param {number} radius - 小球半径
   * @param {number} speed - 初始速度大小
   * @param {string} color - 小球颜色
   */
  constructor(x, y, radius, speed, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.originalRadius = radius;
    
    // 拖尾效果
    this.trail = [];
    this.maxTrailLength = 5;

    // 随机方向
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;



    // 确保速度不会太小
    const minSpeed = speed * 0.5;
    if (Math.abs(this.vx) < minSpeed) this.vx = minSpeed * (this.vx >= 0 ? 1 : -1);
    if (Math.abs(this.vy) < minSpeed) this.vy = minSpeed * (this.vy >= 0 ? 1 : -1);
    
    // 碰撞计数
    this.collisionCount = 0;
  }

  /**
   * 更新小球位置
   * @param {number} deltaTime - 时间增量（毫秒）
   */
  update(deltaTime) {
    // 将毫秒转换为秒
    const dt = deltaTime / 1000;
    
    // 保存拖尾位置
    this.trail.push({ x: this.x, y: this.y, alpha: 0.6 });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    this.x += this.vx * dt; // 直接使用 dt，确保速度单位是 像素/秒
    this.y += this.vy * dt;
    
    // 脉冲效果
    this.radius = this.originalRadius + Math.sin(Date.now() * 0.005) * 2;
  }

  /**
   * 绘制小球
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  draw(ctx) {
    // 绘制拖尾
    this.trail.forEach((point, index) => {
      const alpha = point.alpha * (index / this.trail.length);
      const trailRadius = this.radius * (index / this.trail.length) * 0.8;
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, trailRadius, 0, Math.PI * 2);
      // 确保颜色格式正确处理
      let trailColor = this.color;
      if (trailColor.startsWith('#')) {
        // 十六进制颜色转rgba
        const hex = trailColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        trailColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else if (trailColor.startsWith('rgb')) {
        trailColor = trailColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      }
      ctx.fillStyle = trailColor;
      ctx.fill();
    });

    // 绘制小球主体
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
    // 确保渐变颜色格式正确
    let endColor = this.color;
    if (endColor.startsWith('#')) {
      const hex = endColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      endColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
    } else if (endColor.startsWith('rgb')) {
      endColor = endColor.replace(')', ', 0.6)').replace('rgb', 'rgba');
    }
    
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, endColor);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 发光边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 添加高光效果
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
  }
}

/**
 * 生成随机颜色
 * @returns {string} 随机颜色（明亮的颜色）
 */
function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B500', '#FF6F61', '#6B5B95', '#88B04B',
    '#F7CAC9', '#92A8D1', '#955251', '#B565A7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = { Ball, getRandomColor };