// =============================================
// 回合管理器 - 处理回合逻辑
// =============================================

class RoundManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = {
            round: 1,
            scores: { p1: 0, p2: 0 },
            timeLeft: GAME_CONFIG.roundTime,
            isRoundActive: false,
            isGameOver: false
        };
        this.timerEvent = null;
        this.onRoundStart = null;
        this.onRoundEnd = null;
        this.onGameEnd = null;
    }

    // 初始化
    init(callbacks) {
        this.onRoundStart = callbacks.onRoundStart;
        this.onRoundEnd = callbacks.onRoundEnd;
        this.onGameEnd = callbacks.onGameEnd;
    }

    // 显示回合开始
    showRoundStart() {
        const cx = GAME_CONFIG.width / 2, cy = GAME_CONFIG.height / 2;

        const roundBanner = this.scene.add.text(cx, cy - 40, `ROUND  ${this.gameState.round}`, {
            fontSize: '40px', fontStyle: 'bold',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);

        const fightText = this.scene.add.text(cx, cy + 30, 'FIGHT!', {
            fontSize: '72px', fontStyle: 'bold',
            color: '#ff0000', stroke: '#ffffff', strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0).setScale(0.4);

        this.scene.tweens.add({
            targets: roundBanner, alpha: 1, duration: 300,
            onComplete: () => {
                this.scene.time.delayedCall(500, () => {
                    this.scene.tweens.add({
                        targets: fightText, alpha: 1, scale: 1, duration: 250, ease: 'Back.Out',
                        onComplete: () => {
                            this.scene.time.delayedCall(600, () => {
                                this.scene.tweens.add({
                                    targets: [roundBanner, fightText], alpha: 0, duration: 300,
                                    onComplete: () => {
                                        roundBanner.destroy(); fightText.destroy();
                                        this.gameState.isRoundActive = true;
                                        this.startTimer();
                                        if (this.onRoundStart) this.onRoundStart();
                                    }
                                });
                            });
                        }
                    });
                });
            }
        });
    }

    // 启动计时器
    startTimer() {
        if (this.timerEvent) this.timerEvent.remove();
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000, callback: this.tickTimer, callbackScope: this, loop: true
        });
    }

    // 计时器滴答
    tickTimer() {
        if (!this.gameState.isRoundActive || this.gameState.isGameOver) return;
        this.gameState.timeLeft--;
        if (this.onRoundEnd) this.onRoundEnd('timer', this.gameState.timeLeft);
        if (this.gameState.timeLeft <= 0) this.endRoundByTime();
    }

    // 时间结束判定
    endRoundByTime() {
        this.gameState.isRoundActive = false;
        const hp1 = this.scene.fighter1.health;
        const hp2 = this.scene.fighter2.health;
        let winner = null;
        if (hp1 > hp2) {
            this.gameState.scores.p1++;
            winner = 'p1';
            this.showRoundResult('P1 WIN!', false);
        } else if (hp2 > hp1) {
            this.gameState.scores.p2++;
            winner = 'p2';
            this.showRoundResult('P2 WIN!', false);
        } else {
            this.showRoundResult('DRAW!', false);
        }
        if (this.onRoundEnd) this.onRoundEnd('timeup', winner);
    }

    // KO 判定
    triggerKO(loser, winner) {
        if (loser.isDead) return;
        loser.isDead = true;
        this.gameState.isRoundActive = false;

        this.scene.effectsManager.playKOAnimation(loser, () => {
            this.gameState.scores[winner.playerId]++;
            if (this.onRoundEnd) this.onRoundEnd('ko', winner.playerId);
            this.showRoundResult(`${winner.playerId === PLAYER_IDS.P1 ? 'P1' : 'P2'} KO WIN!`, true);
        });
    }

    // 显示回合结果
    showRoundResult(text, isKO) {
        const cx = GAME_CONFIG.width / 2, cy = GAME_CONFIG.height / 2;
        if (isKO) {
            const ko = this.scene.add.text(cx, cy - 30, 'K.O.', {
                fontSize: '90px', fontStyle: 'bold',
                color: '#ff0000', stroke: '#ffffff', strokeThickness: 6
            }).setOrigin(0.5).setScale(0.3);
            this.scene.tweens.add({ targets: ko, scale: 1, duration: 220, ease: 'Back.Out' });
        }
        const result = this.scene.add.text(cx, cy + (isKO ? 50 : 0), text, {
            fontSize: isKO ? '42px' : '64px', fontStyle: 'bold',
            color: '#ffff00', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: result, alpha: 1, duration: 200,
            onComplete: () => {
                this.scene.time.delayedCall(1800, () => { 
                    result.destroy(); 
                    this.checkNextStep(); 
                });
            }
        });
    }

    // 检查下一步
    checkNextStep() {
        const s = this.gameState.scores;
        if (s.p1 >= GAME_CONFIG.winsNeeded) {
            this.endGame('P1 VICTORY!');
        } else if (s.p2 >= GAME_CONFIG.winsNeeded) {
            this.endGame('P2 VICTORY!');
        } else {
            this.nextRound();
        }
    }

    // 下一回合
    nextRound() {
        this.gameState.round++;
        this.gameState.timeLeft = GAME_CONFIG.roundTime;
        if (this.timerEvent) this.timerEvent.remove();
        // 重置角色
        this.scene.resetFighter(this.scene.fighter1, 200);
        this.scene.resetFighter(this.scene.fighter2, GAME_CONFIG.width - 200);
        if (this.onRoundStart) this.onRoundStart('reset');
        this.showRoundStart();
    }

    // 结束游戏
    endGame(winnerText) {
        this.gameState.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove();

        const cx = GAME_CONFIG.width / 2, cy = GAME_CONFIG.height / 2;
        this.scene.add.rectangle(cx, cy, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.82);

        const victory = this.scene.add.text(cx, cy - 60, winnerText, {
            fontSize: '72px', fontStyle: 'bold',
            color: '#ffff00', stroke: '#ff0000', strokeThickness: 7
        }).setOrigin(0.5).setAlpha(0);
        this.scene.tweens.add({ targets: victory, alpha: 1, scale: 1.05, yoyo: true, duration: 400, repeat: -1 });

        const restart = this.scene.add.text(cx, cy + 60, '按  R  重新开始', {
            fontSize: '30px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        this.scene.tweens.add({ targets: restart, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

        this.scene.input.keyboard.once('keydown-R', () => {
            this.scene.scene.restart();
        });

        if (this.onGameEnd) this.onGameEnd(winnerText);
    }

    // 获取游戏状态
    getState() {
        return { ...this.gameState };
    }

    // 检查回合是否活跃
    isRoundActive() {
        return this.gameState.isRoundActive;
    }

    // 检查游戏是否结束
    isGameOver() {
        return this.gameState.isGameOver;
    }
}
