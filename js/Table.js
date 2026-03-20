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
    const margin = 30;
    const tableTop = this.height * 0.15;
    const tableHeight = this.height * 0.7;

    // 球台底色
    const gradient = ctx.createLinearGradient(0, tableTop, 0, tableTop + tableHeight);
    gradient.addColorStop(0, this.tableColor);
    gradient.addColorStop(0.3, this.tableHighlight);
    gradient.addColorStop(0.7, this.tableHighlight);
    gradient.addColorStop(1, this.tableColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(margin, tableTop, this.width - margin * 2, tableHeight);

    // 球台边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(margin, tableTop, this.width - margin * 2, tableHeight);

    // 内边框装饰
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    const innerMargin = 8;
    ctx.strokeRect(
      margin + innerMargin,
      tableTop + innerMargin,
      this.width - margin * 2 - innerMargin * 2,
      tableHeight - innerMargin * 2
    );
  }

  /**
   * 绘制球台线条
   */
  drawLines(ctx) {
    const margin = 30;
    const centerY = this.height / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    // 中线（穿过球网）
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(this.width - margin, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 发球线（两侧各一条）
    const serveLineY1 = this.height * 0.15 + (this.height * 0.7) * 0.25;
    const serveLineY2 = this.height * 0.15 + (this.height * 0.7) * 0.75;

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';

    // 上方发球线
    ctx.beginPath();
    ctx.moveTo(margin, serveLineY1);
    ctx.lineTo(this.width - margin, serveLineY1);
    ctx.stroke();

    // 下方发球线
    ctx.beginPath();
    ctx.moveTo(margin, serveLineY2);
    ctx.lineTo(this.width - margin, serveLineY2);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * 绘制球网
   */
  drawNet(ctx) {
    const centerY = this.height / 2;
    const netHeight = 20;
    const netTop = centerY - netHeight / 2;

    // 球网支架
    ctx.fillStyle = '#666666';
    ctx.fillRect(25, netTop, this.width - 50, netHeight);

    // 球网网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    // 垂直网格线
    for (let x = 30; x < this.width - 30; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, netTop + 2);
      ctx.lineTo(x, netTop + netHeight - 2);
      ctx.stroke();
    }

    // 水平网格线
    for (let y = netTop + 4; y < netTop + netHeight - 2; y += 4) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(this.width - 30, y);
      ctx.stroke();
    }

    // 球网上沿白线
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(25, netTop);
    ctx.lineTo(this.width - 25, netTop);
    ctx.stroke();
  }

  /**
   * 获取球台边界
   */
  getBounds() {
    const margin = 30;
    return {
      left: margin,
      right: this.width - margin,
      top: this.height * 0.15,
      bottom: this.height * 0.85,
      centerY: this.height / 2
    };
  }
}

module.exports = { Table };
