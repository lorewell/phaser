// =============================================
// UI 管理器 - 处理游戏界面
// =============================================

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.ui_p1hp = null;
        this.ui_p2hp = null;
        this.ui_p1rage = null;
        this.ui_p2rage = null;
        this.timerText = null;
        this.scoreText = null;
        this.roundText = null;
        this.p1marks = [];
        this.p2marks = [];
    }

    // 创建所有 UI
    create() {
        const cx   = GAME_CONFIG.width / 2;
        const barW = 340, barH = 26, gap = 55;

        this.ui_p1hp = this._makeBar(cx - gap - barW, 18, barW, barH, COLORS.P1, 'left');
        this.ui_p2hp = this._makeBar(cx + gap,        18, barW, barH, COLORS.P2, 'right');

        this.scene.add.text(cx - gap - barW - 8, 18 + barH / 2, 'P1', { fontSize: '20px', fontStyle: 'bold', color: '#ff3355' }).setOrigin(1, 0.5);
        this.scene.add.text(cx + gap + barW + 8, 18 + barH / 2, 'P2', { fontSize: '20px', fontStyle: 'bold', color: '#3388ff' }).setOrigin(0, 0.5);

        this.timerText = this.scene.add.text(cx, 22, '60', {
            fontSize: '38px', fontStyle: 'bold',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5, 0);

        this.scoreText = this.scene.add.text(cx, 8, '0  -  0', {
            fontSize: '18px', fontStyle: 'bold',
            color: '#ffcc00', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.roundText = this.scene.add.text(cx, 64, `ROUND 1`, {
            fontSize: '15px', color: '#aaaaaa'
        }).setOrigin(0.5, 0);

        this.p1marks = this._makeWinMarks(28,                      18, 'left',  COLORS.P1);
        this.p2marks = this._makeWinMarks(GAME_CONFIG.width - 28,  18, 'right', COLORS.P2);

        const rageY = GAME_CONFIG.height - 38;
        this.ui_p1rage = this._makeRageBar(28,                            rageY, 280, 16, 0xffaa00, 'P1 怒气', 'left');
        this.ui_p2rage = this._makeRageBar(GAME_CONFIG.width - 28 - 280,  rageY, 280, 16, 0xffaa00, 'P2 怒气', 'right');

        this.scene.add.text(cx, GAME_CONFIG.height - 18,
            'P1: WASD移动 · J拳 · W+J升龙拳 · K踢 · F防御 · 空中J飞拳 · 空中K飞脚    P2: 方向键 · Num1拳 · ↑+Num1升龙 · Num2踢 · Num0防御', {
            fontSize: '10px', color: '#665588', align: 'center'
        }).setOrigin(0.5, 1);
    }

    _makeBar(x, y, w, h, color, align) {
        const con = this.scene.add.container(x, y);
        const bg  = this.scene.add.graphics();
        bg.fillStyle(0x111111, 0.85);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(2, 0x444444, 0.9);
        bg.strokeRoundedRect(0, 0, w, h, 4);
        con.add(bg);

        const warnFill = this.scene.add.graphics();
        con.add(warnFill);
        const fill = this.scene.add.graphics();
        fill.fillStyle(color, 1);
        fill.fillRoundedRect(2, 2, w - 4, h - 4, 2);
        con.add(fill);

        const txt = this.scene.add.text(
            align === 'left' ? 8 : w - 8, h / 2, '100',
            { fontSize: '13px', fontStyle: 'bold', color: '#ffffff' }
        ).setOrigin(align === 'left' ? 0 : 1, 0.5);
        con.add(txt);

        return { con, fill, warnFill, txt, w, h, color, align, val: 100 };
    }

    _makeRageBar(x, y, w, h, color, label, align) {
        const con = this.scene.add.container(x, y);
        const bg  = this.scene.add.graphics();
        bg.fillStyle(0x111111, 0.7);
        bg.fillRoundedRect(0, 0, w, h, 3);
        con.add(bg);
        const fill = this.scene.add.graphics();
        con.add(fill);
        const lbl = this.scene.add.text(align === 'left' ? 0 : w, -14, label, {
            fontSize: '12px', color: '#ffcc00'
        }).setOrigin(align === 'left' ? 0 : 1, 1);
        con.add(lbl);
        return { con, fill, w, h, color, val: 0 };
    }

    _makeWinMarks(x, y, align, color) {
        const marks = [];
        for (let i = 0; i < 2; i++) {
            const mx = align === 'left' ? x + i * 22 : x - i * 22;
            const m  = this.scene.add.circle(mx, y + 42, 7, 0x222222);
            m.setStrokeStyle(2, 0x555555);
            marks.push({ circle: m, color });
        }
        return marks;
    }

    // 刷新 UI
    refresh(fighter1, fighter2) {
        this._updateBar(this.ui_p1hp,   fighter1.health);
        this._updateBar(this.ui_p2hp,   fighter2.health);
        this._updateRageBar(this.ui_p1rage, fighter1.rage);
        this._updateRageBar(this.ui_p2rage, fighter2.rage);
    }

    _updateBar(bar, val) {
        const pct = val / 100;
        const fw  = Math.max(0, (bar.w - 4) * pct);
        bar.fill.clear(); bar.warnFill.clear();
        bar.fill.fillStyle(pct > 0.3 ? bar.color : 0xff2200, 1);
        if (bar.align === 'right') bar.fill.fillRoundedRect(bar.w - 2 - fw, 2, fw, bar.h - 4, 2);
        else                       bar.fill.fillRoundedRect(2, 2, fw, bar.h - 4, 2);
        bar.txt.setText(Math.ceil(val).toString());
    }

    _updateRageBar(bar, val) {
        const fw = Math.max(0, (bar.w - 4) * (val / 100));
        bar.fill.clear();
        bar.fill.fillStyle(val >= 100 ? 0xffffff : bar.color, val >= 100 ? 0.85 : 1);
        bar.fill.fillRoundedRect(2, 2, fw, bar.h - 4, 2);
    }

    // 更新回合显示
    updateRound(round) {
        this.roundText.setText(`ROUND ${round}`);
    }

    // 更新计时器
    updateTimer(timeLeft) {
        this.timerText.setText(timeLeft.toString());
        if (timeLeft <= 10) this.timerText.setColor('#ff4444');
        else this.timerText.setColor('#ffffff');
    }

    // 更新胜利标记
    updateWinMarks(scores) {
        this.p1marks.forEach((m, i) => m.circle.setFillStyle(i < scores.p1 ? m.color : 0x222222));
        this.p2marks.forEach((m, i) => m.circle.setFillStyle(i < scores.p2 ? m.color : 0x222222));
        this.scoreText.setText(`${scores.p1}  -  ${scores.p2}`);
    }

    // 重置计时器颜色
    resetTimerColor() {
        this.timerText.setColor('#ffffff');
    }
}
