// 弹球小游戏
console.log('开始加载弹球小游戏...');

// 游戏配置
const GAME_CONFIG = {
  INITIAL_BALLS: 1,
  MAX_BALLS: 50,
  BALL_RADIUS: 15,
  BALL_SPEED: 200  // 每秒200像素
};

// 预定义颜色列表，确保每个球颜色不同
const BALL_COLORS = [
  '#FF0000', // 红色
  '#00FF00', // 绿色
  '#0000FF', // 蓝色
  '#FFFF00', // 黄色
  '#FF00FF', // 品红
  '#00FFFF', // 青色
  '#FF8000', // 橙色
  '#8000FF', // 紫色
  '#00FF80', // 青绿色
  '#FF0080', // 玫红
  '#80FF00', // 黄绿色
  '#0080FF', // 天蓝色
  '#FF8000', // 深橙色
  '#8000FF', // 深紫色
  '#FF0040', // 深红色
  '#40FF00', // 亮绿色
  '#0040FF', // 深蓝色
  '#FFFF80', // 浅黄色
  '#FF80FF', // 浅紫色
  '#80FFFF'  // 浅青色
];

// 游戏状态
const gameState = {
  canvas: null,
  ctx: null,
  balls: [],
  screenWidth: 0,
  screenHeight: 0,
  lastTime: 0,
  ballColorIndex: 0,
  particles: [],
  score: 0,
  collisionGroups: [],  // 存储同一帧内的碰撞组
  isRunning: false,    // 游戏是否运行中
  isPaused: false,     // 游戏是否暂停
  animationId: null,    // 动画帧ID
  audioContext: null,    // 音频上下文
  ballsGenerated: 0,    // 生成的小球总数
  ballsEliminated: 0     // 消失的小球总数
};

/**
 * 小球类
 */
class Ball {
  constructor(x, y, radius, color, speed) {
    // 安全检查：确保参数是有限值
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.radius = Number.isFinite(radius) ? radius : GAME_CONFIG.BALL_RADIUS;
    this.color = color || '#FF0000';
    this.originalRadius = this.radius;

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
  }

  update(deltaTime) {
    // 保存拖尾位置
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // 脉冲效果
    this.radius = this.originalRadius + Math.sin(Date.now() * 0.005) * 2;
  }

  draw(ctx) {
    // 安全检查：确保位置和半径是有限值
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y) || !Number.isFinite(this.radius)) {
      return;
    }

    // 绘制拖尾
    this.trail.forEach((point, index) => {
      const alpha = (index / this.trail.length) * 0.4;
      const trailRadius = this.radius * (index / this.trail.length) * 0.8;

      ctx.beginPath();
      ctx.arc(point.x, point.y, trailRadius, 0, Math.PI * 2);

      // 十六进制颜色转rgba
      const hex = this.color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    });

    // 绘制小球主体
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    // 渐变填充 - 添加安全检查
    try {
      const gradient = ctx.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        0,
        this.x,
        this.y,
        this.radius
      );
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = gradient;
    } catch (error) {
      // 如果渐变创建失败，使用纯色填充
      ctx.fillStyle = this.color;
    }
    ctx.fill();

    // 发光边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 高光效果
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
  }
}

/**
 * 粒子类
 */
class Particle {
  constructor(x, y, color, isText = false, text = '') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isText = isText;
    this.text = text;
    this.size = isText ? 14 : 3 + Math.random() * 4;
    this.life = 1;
    this.decay = 0.02 + Math.random() * 0.02;
    this.vx = (Math.random() - 0.5) * 100;
    this.vy = (Math.random() - 0.5) * 100;
    if (isText) {
      this.vy = -50;
    }
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= this.decay;
    if (this.isText) {
      this.vy *= 0.95;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;

    if (this.isText) {
      ctx.fillStyle = this.color;
      ctx.font = `bold ${this.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillText(this.text, this.x, this.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * 初始化音频系统
 */
function initAudioSystem() {
  try {
    // 使用 wx.createInnerAudioContext（微信小游戏推荐）
    gameState.audioContext = wx.createInnerAudioContext();
    console.log('音频系统初始化成功');
  } catch (error) {
    console.warn('音频系统初始化失败，将使用静音模式:', error);
    gameState.audioContext = null;
  }
}

/**
 * 播放碰撞消失音效
 * @param {number} ballCount - 消失的小球数量（用于调整音效）
 */
function playCollisionSound(ballCount = 1) {
  if (!gameState.audioContext) return;

  try {
    // 使用 wx.createInnerAudioContext 播放简单的提示音
    const audio = wx.createInnerAudioContext();

    // 根据连击数量调整频率（连击越多，音调越高）
    const baseFreq = 400;
    const freqMultiplier = Math.min(ballCount, 5);
    const frequency = baseFreq * freqMultiplier;

    // 由于微信小游戏不支持直接生成音频，我们使用一种替代方案：
    // 创建一个简短的音频数据
    try {
      // 尝试使用音频上下文
      const AudioContext = wx.getRealtimeLogManager || window.AudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      // 如果 Web Audio API 不可用，使用振动反馈
      if (wx.vibrateShort) {
        wx.vibrateShort({
          type: 'light'
        });
      }
    }
  } catch (error) {
    console.warn('播放音效失败:', error);
  }
}

/**
 * 播放气泡反弹音效（不同颜色小球碰撞时）
 */
function playBounceSound() {
  try {
    // 尝试使用 Web Audio API 创建气泡音效
    const AudioContext = window.AudioContext || (wx && wx.getRealtimeLogManager);
    if (!AudioContext) {
      // 如果没有 AudioContext，使用振动反馈
      if (wx && wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }
      return;
    }

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 气泡音效：快速上升的正弦波，模拟"波"声
    const startFreq = 600;
    const endFreq = 1200;
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(startFreq, ctx.currentTime + 0.1);

    oscillator.type = 'sine';

    // 音量包络：快速淡入淡出
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.warn('播放气泡音效失败:', error);
    // 降级到振动反馈
    if (wx && wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  }
}

/**
 * 播放墙壁碰撞音效（较轻的气泡声）
 */
function playWallBounceSound() {
  try {
    const AudioContext = window.AudioContext || (wx && wx.getRealtimeLogManager);
    if (!AudioContext) {
      if (wx && wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }
      return;
    }

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 墙壁碰撞：较低的气泡声
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

    oscillator.type = 'sine';

    // 较轻的音量包络
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (error) {
    // 静默失败，避免过多日志
  }
}

/**
 * 获取下一个颜色
 */
function getNextColor() {
  const color = BALL_COLORS[gameState.ballColorIndex % BALL_COLORS.length];
  gameState.ballColorIndex++;
  return color;
}

/**
 * 生成小球（点击时使用）
 */
function spawnBall(x, y) {
  if (gameState.balls.length >= GAME_CONFIG.MAX_BALLS) return;

  // 安全检查：确保屏幕尺寸已初始化且位置有效
  if (!gameState.screenWidth || !gameState.screenHeight) {
    console.warn('屏幕尺寸未初始化，无法生成小球');
    return;
  }

  // 确保坐标是有效的数字
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.warn('无效的坐标，无法生成小球:', x, y);
    return;
  }

  const radius = GAME_CONFIG.BALL_RADIUS;
  const color = getNextColor();

  const ball = new Ball(x, y, radius, color, GAME_CONFIG.BALL_SPEED);
  gameState.balls.push(ball);

  // 增加生成计数
  gameState.ballsGenerated++;
}

/**
 * 在中心生成小球（启动时使用）
 */
function spawnBallAtCenter() {
  // 确保屏幕尺寸已初始化
  if (!gameState.screenWidth || !gameState.screenHeight) {
    console.warn('屏幕尺寸未初始化，无法在中心生成小球');
    return;
  }

  const x = gameState.screenWidth / 2;
  const y = gameState.screenHeight / 2;
  spawnBall(x, y);
}

/**
 * 检测小球之间的碰撞
 */
function checkBallCollisions() {
  // 清空上一帧的碰撞组
  gameState.collisionGroups = [];
  const toRemove = new Set();

  for (let i = 0; i < gameState.balls.length; i++) {
    for (let j = i + 1; j < gameState.balls.length; j++) {
      const ball1 = gameState.balls[i];
      const ball2 = gameState.balls[j];

      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = ball1.radius + ball2.radius;

      if (distance < minDistance && distance > 0) {
        const collisionX = (ball1.x + ball2.x) / 2;
        const collisionY = (ball1.y + ball2.y) / 2;

        // 相同颜色碰撞 - 得分并消失
        if (ball1.color === ball2.color) {
          toRemove.add(i);
          toRemove.add(j);

          // 查找或创建该颜色的碰撞组
          let group = gameState.collisionGroups.find(g => g.color === ball1.color);
          if (!group) {
            group = { color: ball1.color, balls: [], centerX: 0, centerY: 0 };
            gameState.collisionGroups.push(group);
          }
          group.balls.push(i, j);
          group.centerX = collisionX;
          group.centerY = collisionY;
        } else {
          // 不同颜色碰撞 - 弹性反弹
          const nx = dx / distance;
          const ny = dy / distance;

          const overlap = minDistance - distance;
          ball1.x -= nx * overlap / 2;
          ball1.y -= ny * overlap / 2;
          ball2.x += nx * overlap / 2;
          ball2.y += ny * overlap / 2;

          const dvx = ball1.vx - ball2.vx;
          const dvy = ball1.vy - ball2.vy;
          const dvn = dvx * nx + dvy * ny;

          if (dvn > 0) {
            ball1.vx -= dvn * nx;
            ball1.vy -= dvn * ny;
            ball2.vx += dvn * nx;
            ball2.vy += dvn * ny;

            createCollisionParticles(collisionX, collisionY, ball1.color);
            playBounceSound();
          }
        }
      }
    }
  }

  // 处理相同颜色碰撞的得分和移除
  if (toRemove.size > 0) {
    gameState.collisionGroups.forEach(group => {
      const uniqueBalls = [...new Set(group.balls)];
      const count = uniqueBalls.length;

      // 计算得分：基础分100 * 球数 * 连击倍数（球数越多倍数越高）
      const baseScore = 100;
      const multiplier = count;
      const points = baseScore * count * multiplier;
      gameState.score += points;

      // 增加消失计数
      gameState.ballsEliminated += count;

      // 播放碰撞消失音效（根据连击数量调整音调）
      playCollisionSound(count);

      // 创建爆炸粒子效果
      createExplosionParticles(group.centerX, group.centerY, group.color, count);

      // 创建浮动分数文本 - 所有连击都显示倍数
      const comboText = count >= 2 ? ` x${multiplier}连击!` : '';
      gameState.particles.push(new Particle(
        group.centerX,
        group.centerY - 20,
        '#FFD700',
        true,
        `+${points}${comboText}`
      ));

      // 连击数高时额外显示更大的特效文字
      if (count >= 3) {
        setTimeout(() => {
          gameState.particles.push(new Particle(
            group.centerX,
            group.centerY - 50,
            '#FF4500',
            true,
            `${count}球连击!`
          ));
        }, 100);
      }
    });

    // 移除碰撞的小球
    gameState.balls = gameState.balls.filter((_, index) => !toRemove.has(index));
  }
}

/**
 * 创建碰撞粒子效果
 */
function createCollisionParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 50 + Math.random() * 50;
    gameState.particles.push(new Particle(
      x + Math.cos(angle) * 10,
      y + Math.sin(angle) * 10,
      color
    ));
  }
}

/**
 * 创建爆炸粒子效果（相同颜色碰撞时使用）
 */
function createExplosionParticles(x, y, color, ballCount) {
  const particleCount = 10 + ballCount * 5;
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    const particle = new Particle(
      x,
      y,
      color
    );
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.size = 4 + Math.random() * 6;
    gameState.particles.push(particle);
  }
}

/**
 * 检测小球与墙壁的碰撞
 */
function checkWallCollisions() {
  // 确保屏幕尺寸已初始化
  if (!gameState.screenWidth || !gameState.screenHeight) {
    return;
  }

  gameState.balls.forEach(ball => {
    // 安全检查：确保小球的属性是有限值
    if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y) ||
        !Number.isFinite(ball.radius) || !Number.isFinite(ball.vx) || !Number.isFinite(ball.vy)) {
      return;
    }

    let collided = false;

    // 左右边界
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      collided = true;
    } else if (ball.x + ball.radius > gameState.screenWidth) {
      ball.x = gameState.screenWidth - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      collided = true;
    }

    // 上下边界
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      collided = true;
    } else if (ball.y + ball.radius > gameState.screenHeight) {
      ball.y = gameState.screenHeight - ball.radius;
      ball.vy = -Math.abs(ball.vy);
      collided = true;
    }

    // 播放墙壁碰撞音效
    if (collided) {
      playWallBounceSound();
    }
  });
}

/**
 * 更新粒子效果
 */
function updateParticles(deltaTime) {
  gameState.particles = gameState.particles.filter(particle => {
    particle.update(deltaTime);
    return particle.life > 0;
  });
}

/**
 * 绘制粒子
 */
function drawParticles() {
  gameState.particles.forEach(particle => {
    particle.draw(gameState.ctx);
  });
}

/**
 * 绘制UI信息
 */
function drawUI() {
  const ctx = gameState.ctx;

  // 左上角积分面板
  const panelWidth = 120;
  const panelHeight = 60;
  const panelX = 20;
  const panelY = 20;

  // 面板背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
  ctx.fill();
  ctx.stroke();

  // 积分标题
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('得分', panelX + panelWidth / 2, panelY + 20);

  // 积分值
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(gameState.score.toString(), panelX + panelWidth / 2, panelY + 48);

  // 小球数量悬浮面板（右上角）
  const statsPanelWidth = 120;
  const statsPanelHeight = 60;
  const statsPanelX = gameState.screenWidth - statsPanelWidth - 20;
  const statsPanelY = 20;

  // 面板背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  roundRect(ctx, statsPanelX, statsPanelY, statsPanelWidth, statsPanelHeight, 10);
  ctx.fill();
  ctx.stroke();

  // 小球计数标题
  ctx.fillStyle = '#00FFFF';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('小球统计', statsPanelX + statsPanelWidth / 2, statsPanelY + 20);

  // 小球计数值 x/y 格式
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`${gameState.ballsEliminated}/${gameState.ballsGenerated}`, statsPanelX + statsPanelWidth / 2, statsPanelY + 48);

  // 暂停按钮（游戏运行时显示在屏幕下方中间位置）
  if (gameState.isRunning && !gameState.isPaused) {
    const pauseBtnWidth = 80;
    const pauseBtnHeight = 35;
    const pauseBtnX = (gameState.screenWidth - pauseBtnWidth) / 2;
    const pauseBtnY = gameState.screenHeight - pauseBtnHeight - 20;

    drawButton(ctx, pauseBtnX, pauseBtnY, pauseBtnWidth, pauseBtnHeight, '暂停', '#FF9800');
  }

  // 如果游戏未运行或暂停，显示控制面板和说明
  if (!gameState.isRunning || gameState.isPaused) {
    drawControlPanel();
  }
}

/**
 * 绘制控制面板和说明
 */
function drawControlPanel() {
  const ctx = gameState.ctx;
  const centerX = gameState.screenWidth / 2;
  const centerY = gameState.screenHeight / 2;

  // 半透明背景遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, gameState.screenWidth, gameState.screenHeight);

  // 控制面板背景
  const panelWidth = 320;
  const panelHeight = 380;
  const panelX = centerX - panelWidth / 2;
  const panelY = centerY - panelHeight / 2;

  ctx.fillStyle = 'rgba(45, 27, 61, 0.95)';
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
  ctx.fill();
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('小小弹球', centerX, panelY + 40);

  // 游戏状态提示
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  if (!gameState.isRunning) {
    ctx.fillText('点击"开始游戏"开始', centerX, panelY + 75);
  } else if (gameState.isPaused) {
    ctx.fillText('游戏已暂停', centerX, panelY + 75);
  }

  // 游戏规则说明
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('游戏规则:', panelX + 25, panelY + 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  const rules = [
    '• 点击屏幕生成彩色小球',
    '• 相同颜色小球碰撞得分并消失',
    '• 多球连击分数倍增',
    '• 不同颜色小球反弹不消失',
    '• 小球碰到屏幕边缘反弹'
  ];
  rules.forEach((rule, index) => {
    ctx.fillText(rule, panelX + 25, panelY + 135 + index * 22);
  });

  // 得分说明
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('得分规则:', panelX + 25, panelY + 255);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  const scores = [
    '2球: 400分  |  3球: 900分',
    '4球: 1600分 |  5球: 2500分'
  ];
  scores.forEach((score, index) => {
    ctx.fillText(score, panelX + 25, panelY + 280 + index * 22);
  });

  // 控制按钮
  const buttonY = panelY + panelHeight - 50;
  const buttonWidth = 120;
  const buttonHeight = 40;
  const buttonSpacing = (panelWidth - 50 - buttonWidth * 2) / 2;

  // 开始/继续按钮
  const startBtnX = panelX + 25;
  drawButton(ctx, startBtnX, buttonY, buttonWidth, buttonHeight,
    !gameState.isRunning ? '开始' : (gameState.isPaused ? '继续' : '游戏进行中'), '#4CAF50');

  // 暂停按钮
  const pauseBtnX = startBtnX + buttonWidth + buttonSpacing;
  drawButton(ctx, pauseBtnX, buttonY, buttonWidth, buttonHeight,
    gameState.isPaused ? '已暂停' : '暂停', '#FF9800');
}

/**
 * 绘制按钮
 */
function drawButton(ctx, x, y, width, height, text, color) {
  // 按钮背景
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();

  // 按钮边框
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 8);
  ctx.stroke();

  // 按钮文字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + width / 2, y + height / 2 + 6);
}

/**
 * 检测游戏中暂停按钮点击
 */
function checkPauseButtonClick(x, y) {
  const pauseBtnWidth = 80;
  const pauseBtnHeight = 35;
  const pauseBtnX = (gameState.screenWidth - pauseBtnWidth) / 2;
  const pauseBtnY = gameState.screenHeight - pauseBtnHeight - 20;

  // 检查暂停按钮
  if (x >= pauseBtnX && x <= pauseBtnX + pauseBtnWidth &&
      y >= pauseBtnY && y <= pauseBtnY + pauseBtnHeight) {
    togglePause();
    return true;
  }

  return false;
}

/**
 * 检测按钮点击
 */
function checkButtonClick(x, y) {
  const centerX = gameState.screenWidth / 2;
  const centerY = gameState.screenHeight / 2;
  const panelWidth = 320;
  const panelHeight = 380;
  const panelX = centerX - panelWidth / 2;
  const panelY = centerY - panelHeight / 2;

  const buttonY = panelY + panelHeight - 50;
  const buttonWidth = 120;
  const buttonHeight = 40;
  const buttonSpacing = (panelWidth - 50 - buttonWidth * 2) / 2;

  const startBtnX = panelX + 25;
  const pauseBtnX = startBtnX + buttonWidth + buttonSpacing;

  // 检查开始按钮
  if (x >= startBtnX && x <= startBtnX + buttonWidth &&
      y >= buttonY && y <= buttonY + buttonHeight) {
    startGame();
    return true;
  }

  // 检查暂停按钮
  if (x >= pauseBtnX && x <= pauseBtnX + buttonWidth &&
      y >= buttonY && y <= buttonY + buttonHeight) {
    togglePause();
    return true;
  }

  return false;
}

/**
 * 开始游戏
 */
function startGame() {
  if (!gameState.isRunning) {
    gameState.isRunning = true;
    gameState.isPaused = false;
    if (gameState.balls.length === 0) {
      spawnBallAtCenter();
    }
    gameLoop();
  } else if (gameState.isPaused) {
    gameState.isPaused = false;
    gameLoop();
  }
}

/**
 * 暂停/继续游戏
 */
function togglePause() {
  if (!gameState.isRunning) return;
  gameState.isPaused = !gameState.isPaused;
  if (!gameState.isPaused) {
    gameLoop();
  }
}

/**
 * 重置游戏
 */
function resetGame() {
  gameState.balls = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.ballColorIndex = 0;
  gameState.ballsGenerated = 0;
  gameState.ballsEliminated = 0;
  gameState.isRunning = false;
  gameState.isPaused = false;
  gameState.lastTime = 0;
  if (gameState.animationId) {
    cancelAnimationFrame(gameState.animationId);
    gameState.animationId = null;
  }
}

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
 * 游戏循环
 */
function gameLoop(timestamp) {
  // 如果暂停，停止循环
  if (gameState.isPaused) {
    drawUI();
    return;
  }

  const ctx = gameState.ctx;
  const canvas = gameState.canvas;

  // 计算deltaTime（秒）
  let deltaTime = 0;
  if (gameState.lastTime > 0 && Number.isFinite(timestamp)) {
    deltaTime = (timestamp - gameState.lastTime) / 1000;
  }
  if (Number.isFinite(timestamp)) {
    gameState.lastTime = timestamp;
  }

  // 限制最大帧时间，避免切换标签页后小球飞出
  if (deltaTime > 0.1) deltaTime = 0.1;

  // 清空画布 - 暖色渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#2D1B3D');   // 深紫色
  gradient.addColorStop(0.5, '#4A2C5A'); // 紫色
  gradient.addColorStop(1, '#6B3D6B');   // 暖紫
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 只在游戏运行时更新小球和粒子
  if (gameState.isRunning && !gameState.isPaused) {
    // 更新小球
    gameState.balls.forEach(ball => {
      ball.update(deltaTime);
    });

    // 碰撞检测
    checkWallCollisions();
    checkBallCollisions();

    // 更新粒子
    updateParticles(deltaTime);
  }

  // 绘制
  gameState.balls.forEach(ball => {
    ball.draw(ctx);
  });
  drawParticles();
  drawUI();

  gameState.animationId = requestAnimationFrame(gameLoop);
}

/**
 * 初始化游戏
 */
function initGame() {
  try {
    console.log('初始化画布...');
    gameState.canvas = wx.createCanvas();
    gameState.ctx = gameState.canvas.getContext('2d');

    gameState.screenWidth = gameState.canvas.width;
    gameState.screenHeight = gameState.canvas.height;

    // 验证画布尺寸是否有效
    if (!Number.isFinite(gameState.screenWidth) || gameState.screenWidth <= 0) {
      console.warn('画布宽度无效，使用默认值 320');
      gameState.screenWidth = 320;
    }
    if (!Number.isFinite(gameState.screenHeight) || gameState.screenHeight <= 0) {
      console.warn('画布高度无效，使用默认值 568');
      gameState.screenHeight = 568;
    }

    console.log('画布尺寸:', gameState.screenWidth, 'x', gameState.screenHeight);

    // 初始化音频系统
    initAudioSystem();

    // 绑定触摸事件 - 先检查按钮点击，再生成小球
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      // 验证触摸坐标
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }

      // 如果控制面板显示，检查按钮点击
      if (!gameState.isRunning || gameState.isPaused) {
        const buttonClicked = checkButtonClick(x, y);
        if (buttonClicked) return; // 如果点击了按钮，不生成小球
      }

      // 游戏运行中，先检查是否点击了暂停按钮
      if (gameState.isRunning && !gameState.isPaused) {
        const pauseBtnClicked = checkPauseButtonClick(x, y);
        if (pauseBtnClicked) return; // 如果点击了暂停按钮，不生成小球

        // 否则生成小球
        spawnBall(x, y);
      }
    });

    // 开始游戏循环（显示控制面板）
    gameLoop();

    console.log('游戏初始化成功！');
  } catch (error) {
    console.error('游戏初始化失败:', error);
  }
}

// 自动启动
console.log('准备初始化游戏...');
initGame();