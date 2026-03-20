/**
 * 比赛规则引擎
 * 处理乒乓球比赛的计分、局数、换发球等规则
 */
class Match {
  constructor() {
    this.reset();
  }

  /**
   * 重置比赛
   */
  reset() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.gamesWon = { player: 0, ai: 0 };
    this.currentGame = 1;
    this.serveCount = 0; // 当前发球方连续发球次数
    this.currentServer = 'player'; // 'player' | 'ai'
    this.totalServes = 0; // 总发球次数（用于判断换发）
    this.isGamePoint = false;
    this.isMatchPoint = false;
    this.deuceTimes = 0; // 平分次数
  }

  /**
   * 添加得分
   * @param {string} winner - 'player' | 'ai'
   */
  addPoint(winner) {
    if (winner === 'player') {
      this.playerScore++;
    } else {
      this.aiScore++;
    }

    // 检查是否在平分状态（10:10）
    if (this.playerScore >= 10 && this.aiScore >= 10) {
      this.deuceTimes++;
      // 平分后每次换发
      this.currentServer = this.currentServer === 'player' ? 'ai' : 'player';
      this.serveCount = 0;
    } else {
      // 检查是否需要换发（每方连续发2次后换发）
      this.totalServes++;
      if (this.totalServes % 2 === 0) {
        this.serveCount++;
        if (this.serveCount >= 2) {
          this.currentServer = this.currentServer === 'player' ? 'ai' : 'player';
          this.serveCount = 0;
        }
      }
    }

    // 更新局点和赛点状态
    this.updatePointStatus();

    // 检查本局是否结束
    return this.checkGameEnd();
  }

  /**
   * 更新局点和赛点状态
   */
  updatePointStatus() {
    const leadingScore = Math.max(this.playerScore, this.aiScore);
    const scoreDiff = Math.abs(this.playerScore - this.aiScore);

    // 赛点检查（赢得比赛的最后一次机会）
    const gamesNeededToWin = 3; // 5局3胜
    const playerGamesAhead = this.gamesWon.player - this.gamesWon.ai;

    if (this.gamesWon.player === gamesNeededToWin - 1 && playerGamesAhead >= 0) {
      // 玩家再赢一局就赢得比赛
      if ((this.playerScore >= 11 || (this.playerScore >= 10 && this.aiScore >= 10)) && scoreDiff >= 2) {
        this.isMatchPoint = true;
      }
    } else if (this.gamesWon.ai === gamesNeededToWin - 1 && playerGamesAhead <= 0) {
      // AI再赢一局就赢得比赛
      if ((this.aiScore >= 11 || (this.playerScore >= 10 && this.aiScore >= 10)) && scoreDiff >= 2) {
        this.isMatchPoint = true;
      }
    }

    // 局点检查（赢得本局的最后一次机会）
    if (leadingScore >= 10) {
      this.isGamePoint = true;
    }
  }

  /**
   * 检查本局是否结束
   * @returns {Object|null} { gameWinner, matchWinner, nextServer } 或 null
   */
  checkGameEnd() {
    const scoreDiff = Math.abs(this.playerScore - this.aiScore);
    const leadingScore = Math.max(this.playerScore, this.aiScore);
    const gamesNeededToWin = 3;

    // 11分制，领先2分获胜
    if (leadingScore >= 11 && scoreDiff >= 2) {
      return this.endGame();
    }

    return null;
  }

  /**
   * 结束本局
   * @returns {Object} { gameWinner, matchWinner, nextServer }
   */
  endGame() {
    const winner = this.playerScore > this.aiScore ? 'player' : 'ai';
    this.gamesWon[winner]++;

    const result = {
      gameWinner: winner,
      nextServer: this.currentServer
    };

    // 检查是否赢得整场比赛（5局3胜）
    if (this.gamesWon[winner] >= 3) {
      result.matchWinner = winner;
      return result;
    }

    // 重置本局比分，准备下一局
    this.playerScore = 0;
    this.aiScore = 0;
    this.currentGame++;
    this.serveCount = 0;
    this.totalServes = 0;
    this.isGamePoint = false;
    this.isMatchPoint = false;
    this.deuceTimes = 0;

    return result;
  }

  /**
   * 开始新的一局
   * @param {string} firstServer - 首先发球的一方
   */
  startNewGame(firstServer) {
    this.playerScore = 0;
    this.aiScore = 0;
    this.serveCount = 0;
    this.totalServes = 0;
    this.isGamePoint = false;
    this.isMatchPoint = false;
    this.deuceTimes = 0;
    this.currentServer = firstServer;
  }

  /**
   * 获取当前发球剩余次数
   */
  getServeRemaining() {
    return 2 - this.serveCount;
  }

  /**
   * 获取比赛状态
   */
  getState() {
    return {
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      gamesWon: { ...this.gamesWon },
      currentGame: this.currentGame,
      currentServer: this.currentServer,
      isGamePoint: this.isGamePoint,
      isMatchPoint: this.isMatchPoint,
      serveRemaining: this.getServeRemaining(),
      deuceTimes: this.deuceTimes
    };
  }

  /**
   * 获取当前比赛阶段信息
   */
  getStageInfo() {
    const stages = [
      { name: '热身赛', difficulty: 1, requiredWins: 1 },
      { name: '16强', difficulty: 2, requiredWins: 3 },
      { name: '8强', difficulty: 3, requiredWins: 3 },
      { name: '4强', difficulty: 4, requiredWins: 3 },
      { name: '决赛', difficulty: 5, requiredWins: 3 }
    ];
    return stages[0]; // 从热身赛开始
  }
}

/**
 * 赛事管理器
 * 管理整个淘汰赛进程
 */
class Tournament {
  constructor() {
    this.currentRound = 0; // 0: 热身赛, 1: 16强, 2: 8强, 3: 4强, 4: 决赛
    this.rounds = [
      { name: '热身赛', aiDifficulty: 1, gamesToWin: 1 },
      { name: '16强赛', aiDifficulty: 2, gamesToWin: 3 },
      { name: '8强赛', aiDifficulty: 3, gamesToWin: 3 },
      { name: '半决赛', aiDifficulty: 4, gamesToWin: 3 },
      { name: '决赛', aiDifficulty: 5, gamesToWin: 3 }
    ];
    this.isPlayerChampion = false;
    this.hasLost = false;
  }

  /**
   * 获取当前回合信息
   */
  getCurrentRound() {
    return this.rounds[this.currentRound];
  }

  /**
   * 玩家获胜，进入下一轮
   */
  advanceToNextRound() {
    if (this.currentRound < this.rounds.length - 1) {
      this.currentRound++;
      return true;
    }
    this.isPlayerChampion = true;
    return false;
  }

  /**
   * 玩家失败
   */
  playerLost() {
    this.hasLost = true;
  }

  /**
   * 获取当前难度等级
   */
  getCurrentDifficulty() {
    return this.rounds[this.currentRound].aiDifficulty;
  }

  /**
   * 是否是决赛
   */
  isFinal() {
    return this.currentRound === this.rounds.length - 1;
  }

  /**
   * 是否已经结束
   */
  isEnded() {
    return this.isPlayerChampion || this.hasLost;
  }

  /**
   * 重置赛事
   */
  reset() {
    this.currentRound = 0;
    this.isPlayerChampion = false;
    this.hasLost = false;
  }
}

module.exports = { Match, Tournament };
