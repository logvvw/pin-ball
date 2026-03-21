/**
 * 乒乓球桌绘制类
 */
class Table {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.lineColor = '#FFFFFF';
    this.tableColor = '#1B5E20';
    this.tableHighlight = '#2E7D32';

    // 动态适配屏幕的球桌尺寸比例
    this.margin = this.width * 0.04; // 稍微变小一点，让球桌尽可能的宽
    this.tableTop = this.height * 0.08;
    this.tableBottom = this.height * 0.92;
    this.tableHeight = this.tableBottom - this.tableTop;
    this.centerY = this.height / 2;
  }

  /**
   * 绘制球台
   */
  draw(ctx) {
    this.drawBackground(ctx);
    this.drawSurface(ctx);
    this.drawLines(ctx);
    this.drawNet(ctx);
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制球台表面
   */
  drawSurface(ctx) {
    // 球台底色
    const gradient = ctx.createLinearGradient(0, this.tableTop, 0, this.tableBottom);
    gradient.addColorStop(0, this.tableColor);
    gradient.addColorStop(0.3, this.tableHighlight);
    gradient.addColorStop(0.7, this.tableHighlight);
    gradient.addColorStop(1, this.tableColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(this.margin, this.tableTop, this.width - this.margin * 2, this.tableHeight);

    // 球台边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.margin, this.tableTop, this.width - this.margin * 2, this.tableHeight);

    // 内边框装饰
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    const innerMargin = Math.max(4, this.width * 0.02);
    ctx.strokeRect(
      this.margin + innerMargin,
      this.tableTop + innerMargin,
      this.width - this.margin * 2 - innerMargin * 2,
      this.tableHeight - innerMargin * 2
    );
  }

  /**
   * 绘制球台线条
   */
  drawLines(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    // 中线（穿过球网）
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(this.margin, this.centerY);
    ctx.lineTo(this.width - this.margin, this.centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 发球线（两侧各一条）
    const serveLineY1 = this.tableTop + this.tableHeight * 0.25;
    const serveLineY2 = this.tableTop + this.tableHeight * 0.75;

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';

    // 上方发球线
    ctx.beginPath();
    ctx.moveTo(this.margin, serveLineY1);
    ctx.lineTo(this.width - this.margin, serveLineY1);
    ctx.stroke();

    // 下方发球线
    ctx.beginPath();
    ctx.moveTo(this.margin, serveLineY2);
    ctx.lineTo(this.width - this.margin, serveLineY2);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * 绘制球网
   */
  drawNet(ctx) {
    const netHeight = 20;
    const netTop = this.centerY - netHeight / 2;
    const extendedMargin = Math.max(0, this.margin - 8); // 球网比球桌稍宽

    // 球网支架
    ctx.fillStyle = '#666666';
    ctx.fillRect(extendedMargin, netTop, this.width - extendedMargin * 2, netHeight);

    // 球网网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    // 垂直网格线
    for (let x = this.margin; x < this.width - this.margin; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, netTop + 2);
      ctx.lineTo(x, netTop + netHeight - 2);
      ctx.stroke();
    }

    // 水平网格线
    for (let y = netTop + 4; y < netTop + netHeight - 2; y += 4) {
      ctx.beginPath();
      ctx.moveTo(this.margin, y);
      ctx.lineTo(this.width - this.margin, y);
      ctx.stroke();
    }

    // 球网上沿白线
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(extendedMargin, netTop);
    ctx.lineTo(this.width - extendedMargin, netTop);
    ctx.stroke();
  }

  /**
   * 获取球台边界
   */
  getBounds() {
    return {
      left: this.margin,
      right: this.width - this.margin,
      top: this.tableTop,
      bottom: this.tableBottom,
      centerY: this.centerY
    };
  }
}

module.exports = { Table };
