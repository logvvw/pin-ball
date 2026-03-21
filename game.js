/**
 * 乒乓球对打游戏 - 主逻辑
 * 玩家与AI对战，5局3胜，晋级制
 */
console.log('加载乒乓球游戏...');

// 引入模块
const { Ball } = require('./js/Ball.js');
const { Paddle } = require('./js/Paddle.js');
const { Table } = require('./js/Table.js');
const { Match, Tournament } = require('./js/Match.js');
const { AI } = require('./js/AI.js');
const {
  drawScorePanel,
  drawMatchProgress,
  drawStartScreen,
  drawAdvancementScreen,
  drawGameOverScreen,
  drawChampionScreen,
  drawPointAnimation,
  updatePointParticles,
  drawPointParticles
} = require('./js/UI.js');

// ==================== 游戏配置 ====================
const GAME_CONFIG = {
  INITIAL_BALLS: 1,
  BALL_RADIUS: 10,
  BALL_SPEED: 400,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 15,
  SERVE_DELAY: 1000, // 发球延迟（毫秒）
  POINT_DELAY: 1500 // 得分后暂停时间
};

// ==================== 游戏状态 ====================
const gameState = {
  canvas: null,
  ctx: null,
  screenWidth: 0,
  screenHeight: 0,
  lastTime: 0,
  isRunning: false,
  isPaused: false,

  // 游戏阶段: 'start', 'playing', 'point_scored', 'game_end', 'advancement', 'game_over', 'champion'
  gamePhase: 'start',

  // 游戏对象
  ball: null,
  playerPaddle: null,
  aiPaddle: null,
  ai: null,
  table: null,
  match: null,
  tournament: null,

  // 触摸追踪
  touchStartX: 0,
  touchCurrentX: 0,
  touchMoveX: 0,
  touchStartPaddleX: 0, // 触摸开始时球拍的位置
  isTouching: false,

  // 粒子效果
  particles: [],
  pointParticles: [],

  // 计时器
  serveTimer: 0,
  pointTimer: 0,

  // 动画ID
  animationId: null
};

// ==================== 初始化 ====================
function initGame() {
  try {
    console.log('initGame starting, current gamePhase:', gameState.gamePhase);

    console.log('初始化画布...');
    gameState.canvas = wx.createCanvas();
    console.log('Canvas created:', gameState.canvas);
    gameState.ctx = gameState.canvas.getContext('2d');

    // 引入高清屏适配：从系统拿到 dpr 和屏幕宽高
    const sysInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: gameState.canvas.width, windowHeight: gameState.canvas.height, pixelRatio: 1 };
    gameState.dpr = sysInfo.pixelRatio || 2;
    
    // 设置物理像素
    gameState.canvas.width = sysInfo.windowWidth * gameState.dpr;
    gameState.canvas.height = sysInfo.windowHeight * gameState.dpr;

    // 设置逻辑像素供游戏体系内使用
    gameState.screenWidth = sysInfo.windowWidth;
    gameState.screenHeight = sysInfo.windowHeight;

    console.log('逻辑尺寸:', gameState.screenWidth, 'x', gameState.screenHeight, 'DPR:', gameState.dpr);

    // 初始化游戏对象
    initGameObjects();

    console.log('initGameObjects completed, gamePhase:', gameState.gamePhase);

    // 绑定触摸事件
    bindTouchEvents();

    // 启动游戏循环
    console.log('Starting game loop...');
    if (gameState.canvas && gameState.canvas.requestAnimationFrame) {
      console.log('Using canvas.requestAnimationFrame');
      gameState.animationId = gameState.canvas.requestAnimationFrame(gameLoop);
    } else {
      console.log('canvas.requestAnimationFrame not available, using setInterval fallback');
      gameState.animationId = setInterval(() => {
        gameLoop(Date.now());
      }, 16);
    }

    console.log('游戏初始化成功！');
    console.log('Final gamePhase:', gameState.gamePhase);
  } catch (error) {
    console.error('游戏初始化失败:', error);
  }
}

/**
 * 初始化游戏对象
 */
function initGameObjects() {
  const { screenWidth, screenHeight } = gameState;

  // 球台
  gameState.table = new Table(screenWidth, screenHeight);

  // 玩家球拍（底部）适配扩大的球桌
  const playerY = screenHeight * 0.92;
  gameState.playerPaddle = new Paddle(screenWidth / 2, playerY, false, GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT);
  gameState.touchCurrentX = screenWidth / 2; // 确保初始目标位置正确，防止开局跳动

  // AI球拍（顶部）适配扩大的球桌
  const aiY = screenHeight * 0.08;
  gameState.aiPaddle = new Paddle(screenWidth / 2, aiY, true, GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT);

  // AI控制器
  gameState.ai = new AI(gameState.aiPaddle, 1);

  // 乒乓球
  gameState.ball = new Ball(screenWidth / 2, screenHeight / 2);

  // 比赛规则引擎
  gameState.match = new Match();

  // 赛事管理器
  gameState.tournament = new Tournament();

  // 设置AI难度
  gameState.ai.setDifficulty(gameState.tournament.getCurrentDifficulty());
}

// ==================== 触摸事件 ====================
function bindTouchEvents() {
  const canvas = gameState.canvas;

  // 获取触摸X坐标
  function getTouchX(e) {
    // 优先使用 touches[0]
    if (e.touches && e.touches.length > 0) {
      return e.touches[0].clientX;
    }
    // 其次使用 changedTouches[0]
    if (e.changedTouches && e.changedTouches.length > 0) {
      return e.changedTouches[0].clientX;
    }
    // 回退到其他属性
    if (e.clientX !== undefined) {
      return e.clientX;
    }
    return e.x || 0;
  }

  // 处理触摸开始 - 记录初始位置用于拖动
  function handleTouchStart(e) {
    const x = getTouchX(e);
    gameState.touchStartX = x;
    gameState.touchStartPaddleX = gameState.playerPaddle.x; // 记录触摸开始时球拍的位置（用于相对移动）
    gameState.touchCurrentX = gameState.touchStartPaddleX; // 设置目标为当前球拍位置，防止因绝对坐标发生跳跃（点击闪烁效应）
    gameState.touchMoveX = x;
    gameState.isTouching = true;

    // 只在开始界面启动游戏
    if (gameState.gamePhase === 'start') {
      startMatch();
    }
  }

  // 处理触摸移动 - 使用相对移动
  function handleTouchMove(e) {
    const x = getTouchX(e);
    // 计算相对于触摸开始位置的偏移
    const deltaX = x - gameState.touchStartX;
    // 设置目标位置为：触摸开始时球拍位置 + 手指偏移
    gameState.touchCurrentX = gameState.touchStartPaddleX + deltaX;
    gameState.touchMoveX = x;
    gameState.isTouching = true;
  }

  // 处理触摸结束
  function handleTouchEnd() {
    gameState.isTouching = false;
  }

  // 使用 wx 全局触摸事件（微信小游戏标准方式）
  wx.onTouchStart(handleTouchStart);
  wx.onTouchMove(handleTouchMove);
  wx.onTouchEnd(handleTouchEnd);

  // 同时绑定 canvas 的触摸事件作为后备
  if (canvas && canvas.addEventListener) {
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
  }
}

/**
 * 处理点击事件
 */
function handleClick() {
  try {
    // 只在开始界面时响应点击，启动游戏
    if (gameState.gamePhase === 'start') {
      startMatch();
    }
  } catch (err) {
    console.error('Error in handleClick:', err);
  }
}

// ==================== 游戏流程控制 ====================
/**
 * 开始比赛
 */
function startMatch() {
  gameState.match.reset();
  gameState.match.startNewGame('player');
  gameState.tournament.reset();

  resetBallForServe(gameState.match.currentServer);

  gameState.gamePhase = 'playing';
  gameState.serveTimer = GAME_CONFIG.SERVE_DELAY;
}

/**
 * 继续下一轮
 */
function continueToNextRound() {
  gameState.match.reset();
  gameState.match.startNewGame('player');

  resetBallForServe(gameState.match.currentServer);

  gameState.gamePhase = 'playing';
  gameState.serveTimer = GAME_CONFIG.SERVE_DELAY;
}

/**
 * 重新开始游戏
 */
function restartGame() {
  gameState.tournament.reset();
  initGameObjects();

  gameState.particles = [];
  gameState.pointParticles = [];

  gameState.gamePhase = 'start';
}

/**
 * 重置球准备发球
 */
function resetBallForServe(server) {
  const { screenWidth, screenHeight } = gameState;

  if (server === 'player') {
    gameState.ball.reset(screenWidth / 2, screenHeight * 0.75);
  } else {
    gameState.ball.reset(screenWidth / 2, screenHeight * 0.25);
  }

  gameState.ball.speed = GAME_CONFIG.BALL_SPEED;
}

/**
 * 执行发球
 */
function performServe() {
  const server = gameState.match.currentServer;
  const aiConfig = gameState.ai.generateServe(gameState.ball);

  // AI发球时，先把球放到AI球拍位置
  if (server === 'ai') {
    gameState.ball.reset(gameState.aiPaddle.x, gameState.aiPaddle.y + gameState.aiPaddle.height / 2 + gameState.ball.radius + 2);
  }

  gameState.ball.serve(server, aiConfig.angle);

  // 设置AI反应延迟
  gameState.ai.triggerReactionDelay();
}

/**
 * 处理得分
 */
function handlePoint(winner) {
  const result = gameState.match.addPoint(winner);

  // 添加得分动画
  drawPointAnimation(gameState.ctx, gameState.pointParticles, winner, gameState.screenWidth, gameState.screenHeight);

  // 播放音效
  playPointSound(winner);

  // 如果比赛还未结束（result 为 null），继续下一分
  if (!result) {
    resetBallForServe(gameState.match.currentServer);
    gameState.gamePhase = 'playing';
    gameState.serveTimer = GAME_CONFIG.SERVE_DELAY;
    return;
  }

  if (result.matchWinner) {
    // 比赛结束
    if (result.matchWinner === 'player') {
      // 玩家赢得整场比赛
      if (gameState.tournament.advanceToNextRound()) {
        // 还有下一轮
        gameState.gamePhase = 'advancement';
      } else {
        // 玩家获得冠军
        gameState.gamePhase = 'champion';
      }
    } else {
      // AI赢得比赛
      gameState.gamePhase = 'game_over';
    }
  } else if (result.gameWinner) {
    // 本局结束，开始新局
    gameState.match.startNewGame(result.nextServer);
    resetBallForServe(result.nextServer);
    gameState.gamePhase = 'playing';
    gameState.serveTimer = GAME_CONFIG.SERVE_DELAY;
  } else {
    // 继续比赛，下一分
    resetBallForServe(gameState.match.currentServer);
    gameState.gamePhase = 'playing';
    gameState.serveTimer = GAME_CONFIG.SERVE_DELAY;
  }

  gameState.pointTimer = GAME_CONFIG.POINT_DELAY;
}

// ==================== 更新逻辑 ====================
/**
 * 游戏主循环更新
 */
function update(deltaTime) {
  if (gameState.gamePhase === 'start') {
    return;
  }

  if (gameState.gamePhase === 'playing') {
    // 发球延迟期间，玩家仍然可以移动球拍
    if (gameState.serveTimer > 0) {
      gameState.serveTimer -= deltaTime * 1000;
      if (gameState.serveTimer <= 0) {
        performServe();
      }
      // 不 return，继续处理玩家输入
    } else {
      // 非发球延迟期间，更新乒乓球和AI
      gameState.ball.update(deltaTime);
      const collisionResult = checkCollisions();
      if (collisionResult) {
        handlePoint(collisionResult);
      }

      // 检测出界
      const outResult = gameState.ball.checkOutOfBounds(gameState.screenHeight);
      if (outResult) {
        handlePoint(outResult);
      }
    }

    // 移除 isTouching = true 的限制，允许在手指放开后，球拍继续平滑移动到最后确定的 targetX
    if (gameState.playerPaddle && gameState.touchCurrentX !== undefined) {
      gameState.playerPaddle.update(deltaTime, gameState.touchCurrentX, gameState.screenWidth);
    }

    // 更新AI
    const isServeTurn = gameState.serveTimer > 0;
    gameState.ai.update(deltaTime, gameState.ball, isServeTurn && gameState.match.currentServer === 'ai', gameState.screenWidth);
  }

  // 更新粒子
  gameState.particles = updatePointParticles(gameState.particles, deltaTime);
  gameState.pointParticles = updatePointParticles(gameState.pointParticles, deltaTime);
}

/**
 * 检测碰撞
 * @returns {string|null} 得分方或null
 */
function checkCollisions() {
  const { ball, playerPaddle, aiPaddle, screenWidth } = gameState;

  // 检测玩家球拍碰撞
  const playerHit = playerPaddle.checkCollision(ball);
  if (playerHit !== null && ball.vy > 0) {
    ball.bounceOffPaddle(playerPaddle, playerHit);
    playHitSound();
  }

  // 检测AI球拍碰撞
  const aiHit = aiPaddle.checkCollision(ball);
  if (aiHit !== null && ball.vy < 0) {
    ball.bounceOffPaddle(aiPaddle, aiHit);
    playHitSound();
  }

  // 检测左右边界 - 球碰到两侧判定丢分
  return ball.bounceOffWalls(screenWidth);
}

// ==================== 渲染 ====================
/**
 * 渲染游戏
 */
function render() {
  const { ctx, canvas, dpr, screenWidth, screenHeight } = gameState;

  // 使用 setTransform 重置变换，再清空，最后 scale 适配 Retina 屏
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (dpr) {
    ctx.scale(dpr, dpr);
  }

  switch (gameState.gamePhase) {
    case 'start':
      renderStartScreen();
      break;

    case 'playing':
      renderGameplay();
      break;

    case 'point_scored':
      renderGameplay();
      break;

    case 'advancement':
      renderGameplay();
      renderAdvancementScreen();
      break;

    case 'game_over':
      renderGameplay();
      renderGameOverScreen();
      break;

    case 'champion':
      renderGameplay();
      renderChampionScreen();
      break;

    default:
      renderStartScreen();
      break;
  }
}

/**
 * 渲染开始界面
 */
function renderStartScreen() {
  const { ctx, screenWidth, screenHeight } = gameState;

  // 背景
  const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  drawStartScreen(ctx, screenWidth, screenHeight, gameState.tournament);
}

/**
 * 渲染游戏画面
 */
function renderGameplay() {
  const { ctx, screenWidth, screenHeight } = gameState;

  // 绘制球台
  gameState.table.draw(ctx);

  // 绘制球
  gameState.ball.draw(ctx);

  // 绘制球拍
  gameState.playerPaddle.draw(ctx);
  gameState.aiPaddle.draw(ctx);

  // 绘制得分粒子
  drawPointParticles(ctx, gameState.pointParticles);

  // 绘制比分面板
  drawScorePanel(ctx, gameState.match.getState(), gameState.tournament.getCurrentRound(), screenWidth, screenHeight);

  // 绘制比赛进度
  drawMatchProgress(ctx, gameState.match.gamesWon, screenWidth, screenHeight);

  // 绘制AI名称和难度
  ctx.fillStyle = '#888888';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`${gameState.ai.getName()} (难度${gameState.ai.getDifficulty()})`, 20, 30);
}

/**
 * 渲染晋级界面
 */
function renderAdvancementScreen() {
  const { ctx, screenWidth, screenHeight } = gameState;
  const currentStage = gameState.tournament.getCurrentRound();
  const nextRound = gameState.tournament.currentRound + 1;

  if (nextRound < gameState.tournament.rounds.length) {
    const nextStage = gameState.tournament.rounds[nextRound];
    drawAdvancementScreen(ctx, currentStage, nextStage, screenWidth, screenHeight);
  }
}

/**
 * 渲染游戏结束界面
 */
function renderGameOverScreen() {
  const { ctx, screenWidth, screenHeight } = gameState;
  drawGameOverScreen(ctx, gameState.tournament.getCurrentRound(), screenWidth, screenHeight);
}

/**
 * 渲染冠军界面
 */
function renderChampionScreen() {
  const { ctx, screenWidth, screenHeight } = gameState;
  drawChampionScreen(ctx, screenWidth, screenHeight);
}

// ==================== 音效 ====================
/**
 * 播放击球音效
 */
function playHitSound() {
  try {
    if (wx && wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  } catch (e) { }
}

/**
 * 播放得分音效
 */
function playPointSound(winner) {
  try {
    if (wx && wx.vibrateShort) {
      wx.vibrateShort({ type: 'medium' });
    }
  } catch (e) { }
}

// ==================== 游戏循环 ====================
function gameLoop(timestamp) {
  // 计算deltaTime（秒）
  let deltaTime = 0;
  if (gameState.lastTime > 0 && Number.isFinite(timestamp)) {
    deltaTime = (timestamp - gameState.lastTime) / 1000;
  }
  if (Number.isFinite(timestamp)) {
    gameState.lastTime = timestamp;
  }

  // 限制最大帧时间
  if (deltaTime > 0.1) deltaTime = 0.1;

  // 更新
  update(deltaTime);

  // 渲染
  render();

  // 继续循环 - 由初始化时设置的 requestAnimationFrame 或 setInterval 驱动
}

// ==================== 启动游戏 ====================
console.log('准备初始化乒乓球游戏...');
initGame();
