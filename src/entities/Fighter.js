// =============================================
// Fighter 角色类
// =============================================

class Fighter {
    constructor(scene, x, y, color, playerId) {
        this.scene    = scene;
        this.color    = color;
        this.playerId = playerId;
        this.facing   = playerId === PLAYER_IDS.P1 ? 1 : -1;

        this.health       = 100;
        this.rage         = 0;
        this.isHit        = false;
        this.isDead       = false;
        this.isBlocking   = false;
        this.attackState  = ATTACK_STATES.IDLE;
        this.attackType   = null;
        this.hitRegistered = false;

        // 创建物理容器
        this.container = scene.add.container(x, y);
        scene.physics.world.enable(this.container);
        this.container.body.setSize(40, 80);
        this.container.body.setOffset(-20, -80);
        this.container.body.setCollideWorldBounds(true);
        this.container.fighter = this;

        this._buildParts();
    }

    _buildParts() {
        const pid = this.playerId; // 'p1' or 'p2'

        // ── 腿部（双腿静止图，默认可见）──
        this.legsImg = this.scene.add.image(0, -8, `${pid}_legs`);
        this.legsImg.setDisplaySize(70, 65);

        // 身体
        this.torso = this.scene.add.image(0, -52, `${pid}_torso`);
        this.torso.setDisplaySize(60, 72);

        // 头部
        this.head = this.scene.add.image(0, -88, `${pid}_head`);
        this.head.setDisplaySize(58, 58);

        // 手臂容器（待机状态用 arm.svg）
        this.armContainer = this.scene.add.container(22 * this.facing, -55);
        this.armImg = this.scene.add.image(0, 0, `${pid}_arm`);
        this.armImg.setDisplaySize(32, 72);
        this.armContainer.add(this.armImg);

        // 踢腿容器（用 kick_leg.svg，默认隐藏）
        this.kickLeg = this.scene.add.container(14 * this.facing, -15);
        this.kickLegImg = this.scene.add.image(0, 0, `${pid}_kick_leg`);
        this.kickLegImg.setDisplaySize(48, 80);
        this.kickLeg.add(this.kickLegImg);
        this.kickLeg.setVisible(false);

        // 受击闪光（保留原有逻辑）
        this.hitFlash = this.scene.add.rectangle(0, -40, 44, 88, 0xffffff, 0);

        // 镜像朝向（P2 初始面朝左）
        if (this.facing === -1) {
            this.legsImg.setFlipX(true);
            this.torso.setFlipX(true);
            this.head.setFlipX(true);
            this.armImg.setFlipX(true);
            this.kickLegImg.setFlipX(true);
        }

        this.container.add([
            this.legsImg,
            this.torso,
            this.hitFlash,
            this.kickLeg,
            this.armContainer,
            this.head,
        ]);

        // 兼容旧代码中对 legLeft/legRight 的引用（部分地方需要）
        this.legLeft  = this.legsImg;
        this.legRight = this.legsImg;
    }

    _darken(color) {
        const r = ((color >> 16) & 0xff) * 0.6 | 0;
        const g = ((color >> 8)  & 0xff) * 0.6 | 0;
        const b = (color         & 0xff) * 0.6 | 0;
        return (r << 16) | (g << 8) | b;
    }

    updateFacing(facing) {
        if (this.facing === facing) return;
        this.facing = facing;
        this.armContainer.x = 22 * facing;
        this.kickLeg.x      = 14 * facing;
        // 精灵图水平翻转
        const flip = facing === -1;
        this.legsImg.setFlipX(flip);
        this.torso.setFlipX(flip);
        this.head.setFlipX(flip);
        this.armImg.setFlipX(flip);
        this.kickLegImg.setFlipX(flip);
    }

    setBlockVisual(blocking) {
        this.isBlocking = blocking;
        const tint = blocking ? COLORS.BLOCK_TINT : COLORS.NORMAL_TINT;
        this.torso.setTint(tint);
        this.legsImg.setTint(tint);
        this.armImg.setTint(tint);
    }

    showHitFlash() {
        this.hitFlash.setFillStyle(0xffffff, 0.75);
        this.scene.time.delayedCall(80, () => this.hitFlash.setFillStyle(0xffffff, 0));
    }

    get x()    { return this.container.x; }
    get y()    { return this.container.y; }
    get body() { return this.container.body; }

    isOnGround() { return this.body.touching.down; }

    // 重置角色状态
    reset(x, y) {
        this.container.x = x;
        this.container.y = y;
        this.container.angle = 0;
        this.body.setVelocity(0, 0);
        this.health = 100;
        this.rage = 0;
        this.isHit = false;
        this.isDead = false;
        this.isBlocking = false;
        this.attackState = ATTACK_STATES.IDLE;
        this.attackType = null;
        this.hitRegistered = false;
        this.torso.clearTint();
        this.legsImg.clearTint();
        this.armImg.clearTint();
    }

    // 重置姿势
    resetPose() {
        this.armContainer.x = 22 * this.facing;
        this.armContainer.y = -55;
        this.armContainer.angle = 0;
        this.armImg.setScale(1, 1);  // 重置横向伸展
        this.kickLeg.x = 14 * this.facing;
        this.kickLeg.y = -15;
        this.kickLeg.angle = 0;
        this.kickLeg.setVisible(false);
        this.kickLegImg.setScale(1, 1);  // 重置横向伸展
        this.legsImg.setVisible(true);
    }
}
