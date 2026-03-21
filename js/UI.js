/**
 * UI绘制模块
 * 处理游戏中的所有用户界面绘制
 */

/**
 * 绘制圆角矩形
 */
function roundRect(ctx, x, y, width, height, radius) {
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
 * 绘制按钮
 */
function drawButton(ctx, x, y, width, height, text, color, textColor = '#FFFFFF') {
  // 按钮背景
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();

  // 按钮边框
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 8);
  ctx.stroke();

  // 按钮文字
  ctx.fillStyle = textColor;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
}

/**
 * 绘制比赛比分面板
 */
function drawScorePanel(ctx, matchState, stageInfo, screenWidth, screenHeight = 812) {
  const { playerScore, aiScore, gamesWon, currentGame, currentServer } = matchState;

  // 比分面板背景
  const panelWidth = 280;
  const panelHeight = 90;
  const panelX = (screenWidth - panelWidth) / 2;
  // 从原先写死的 10 下移至屏幕 15% 处，避开系统状态栏刘海，也让开 AI 的球拍活动区
  const panelY = screenHeight * 0.15;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 12);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 12);
  ctx.stroke();

  // 阶段名称
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(stageInfo.name, screenWidth / 2, panelY + 18);

  // 玩家名称和分数
  ctx.fillStyle = '#33DD77';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('玩家', panelX + 20, panelY + 45);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(playerScore.toString(), panelX + 80, panelY + 50);

  // VS
  ctx.fillStyle = '#888888';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(':', screenWidth / 2, panelY + 48);

  // AI分数
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(aiScore.toString(), panelX + panelWidth - 80, panelY + 50);

  ctx.fillStyle = '#3377FF';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('AI', panelX + panelWidth - 20, panelY + 45);

  // 局数指示
  ctx.fillStyle = '#888888';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`第 ${currentGame} 局`, screenWidth / 2, panelY + 70);

  // 发球指示
  const serveColor = currentServer === 'player' ? '#33DD77' : '#3377FF';
  const serveText = currentServer === 'player' ? '玩家发球' : 'AI发球';
  ctx.fillStyle = serveColor;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(serveText, screenWidth / 2, panelY + 85);
}

/**
 * 绘制比赛进度（5局3胜）
 */
function drawMatchProgress(ctx, gamesWon, screenWidth, screenHeight) {
  const totalGames = 5;
  const gameWidth = 30;
  const gameSpacing = 10;
  const startX = (screenWidth - (totalGames * gameWidth + (totalGames - 1) * gameSpacing)) / 2;
  const y = screenHeight - 40;

  for (let i = 0; i < totalGames; i++) {
    const x = startX + i * (gameWidth + gameSpacing);
    const isWon = i < gamesWon.player;

    ctx.fillStyle = isWon ? '#33DD77' : 'rgba(255, 255, 255, 0.2)';
    roundRect(ctx, x, y, gameWidth, 20, 5);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, gameWidth, 20, 5);
    ctx.stroke();
  }
}

/**
 * 绘制晋级界面
 */
function drawAdvancementScreen(ctx, fromStage, toStage, screenWidth, screenHeight) {
  // 半透明背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  // 晋级面板
  const panelWidth = 320;
  const panelHeight = 280;
  const panelX = (screenWidth - panelWidth) / 2;
  const panelY = (screenHeight - panelHeight) / 2;

  // 面板背景
  ctx.fillStyle = 'rgba(30, 30, 60, 0.95)';
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('恭喜晋级！', screenWidth / 2, panelY + 50);

  // 晋级动画文字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px Arial';
  ctx.fillText(fromStage.name, screenWidth / 2, panelY + 90);
  ctx.fillText('→', screenWidth / 2, panelY + 115);
  ctx.fillStyle = '#33DD77';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(toStage.name, screenWidth / 2, panelY + 145);

  // AI难度提示
  ctx.fillStyle = '#FF6B6B';
  ctx.font = '14px Arial';
  ctx.fillText(`对手：${toStage.aiDifficulty >= 4 ? '更高难度！' : '难度提升'}`, screenWidth / 2, panelY + 175);

  // 继续按钮
  const btnY = panelY + panelHeight - 60;
  drawButton(ctx, panelX + 60, btnY, 200, 45, '继续挑战', '#33DD77');
}

/**
 * 绘制失败界面
 */
function drawGameOverScreen(ctx, stage, screenWidth, screenHeight) {
  // 半透明背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  // 面板
  const panelWidth = 320;
  const panelHeight = 250;
  const panelX = (screenWidth - panelWidth) / 2;
  const panelY = (screenHeight - panelHeight) / 2;

  ctx.fillStyle = 'rgba(60, 30, 30, 0.95)';
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();

  ctx.strokeStyle = '#FF6B6B';
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#FF6B6B';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('比赛结束', screenWidth / 2, panelY + 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText(`止步于：${stage.name}`, screenWidth / 2, panelY + 95);

  ctx.fillStyle = '#888888';
  ctx.font = '14px Arial';
  ctx.fillText('别灰心，继续练习！', screenWidth / 2, panelY + 130);

  // 重新开始按钮
  const btnY = panelY + panelHeight - 60;
  drawButton(ctx, panelX + 60, btnY, 200, 45, '重新开始', '#FF6B6B');
}

/**
 * 绘制冠军界面
 */
function drawChampionScreen(ctx, screenWidth, screenHeight) {
  // 半透明背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  // 面板
  const panelWidth = 340;
  const panelHeight = 300;
  const panelX = (screenWidth - panelWidth) / 2;
  const panelY = (screenHeight - panelHeight) / 2;

  ctx.fillStyle = 'rgba(50, 50, 30, 0.95)';
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();

  // 冠军标题
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 冠军 🏆', screenWidth / 2, panelY + 55);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText('恭喜你夺得乒乓球冠军！', screenWidth / 2, panelY + 100);

  ctx.fillStyle = '#33DD77';
  ctx.font = '16px Arial';
  ctx.fillText('你已经击败了所有对手', screenWidth / 2, panelY + 135);

  // 再来一局按钮
  const btnY = panelY + panelHeight - 60;
  drawButton(ctx, panelX + 45, btnY, 250, 45, '再来一局', '#FFD700');
}

/**
 * 绘制开始界面
 */
function drawStartScreen(ctx, screenWidth, screenHeight, tournament) {
  // 标题
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('乒乓球大师', screenWidth / 2, screenHeight * 0.25);

  // 副标题
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('奥运会风格乒乓球对战', screenWidth / 2, screenHeight * 0.25 + 35);

  // 开始按钮
  const btnWidth = 200;
  const btnHeight = 50;
  const btnX = (screenWidth - btnWidth) / 2;
  const btnY = screenHeight * 0.5;
  drawButton(ctx, btnX, btnY, btnWidth, btnHeight, '开始游戏', '#33DD77');

  // 游戏说明
  ctx.fillStyle = '#888888';
  ctx.font = '12px Arial';
  ctx.fillText('滑动屏幕控制球拍', screenWidth / 2, screenHeight * 0.65);
  ctx.fillText('5局3胜制，赢取晋级', screenWidth / 2, screenHeight * 0.65 + 20);
}

/**
 * 绘制得分动画
 */
function drawPointAnimation(ctx, particles, winner, screenWidth, screenHeight) {
  const text = winner === 'player' ? '+1' : 'AI +1';
  const color = winner === 'player' ? '#33DD77' : '#3377FF';

  particles.push({
    x: screenWidth / 2,
    y: screenHeight / 2,
    text: text,
    color: color,
    life: 1,
    vy: -50
  });
}

/**
 * 更新得分动画粒子
 */
function updatePointParticles(particles, deltaTime) {
  particles = particles.filter(p => {
    p.y += p.vy * deltaTime;
    p.life -= deltaTime * 0.8;
    return p.life > 0;
  });
  return particles;
}

/**
 * 绘制得分动画粒子
 */
function drawPointParticles(ctx, particles) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 20;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  });
}

module.exports = {
  roundRect,
  drawButton,
  drawScorePanel,
  drawMatchProgress,
  drawAdvancementScreen,
  drawGameOverScreen,
  drawChampionScreen,
  drawStartScreen,
  drawPointAnimation,
  updatePointParticles,
  drawPointParticles
};
