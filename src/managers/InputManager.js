// =============================================
// 输入管理器 - 处理键盘输入
// =============================================

class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keysP1 = null;
        this.keysP2 = null;
        this.attackCallbacks = {};
    }

    // 初始化输入
    init() {
        this.setupP1Keys();
        this.setupP2Keys();
        this.setupAttackListeners();
    }

    // P1 按键配置 (WASD + J/K/F)
    setupP1Keys() {
        this.keysP1 = {
            left:  this.scene.input.keyboard.addKey('A'),
            right: this.scene.input.keyboard.addKey('D'),
            up:    this.scene.input.keyboard.addKey('W'),
            down:  this.scene.input.keyboard.addKey('S'),
            punch: this.scene.input.keyboard.addKey('J'),
            kick:  this.scene.input.keyboard.addKey('K'),
            block: this.scene.input.keyboard.addKey('F'),
        };
    }

    // P2 按键配置 (方向键 + 小键盘)
    setupP2Keys() {
        this.keysP2 = {
            left:  this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up:    this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down:  this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            punch: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
            kick:  this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
            block: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO),
        };
    }

    // 设置攻击监听
    setupAttackListeners() {
        // P1 攻击键
        this.scene.input.keyboard.on('keydown-J', () => {
            if (this.attackCallbacks.onP1Punch) {
                this.attackCallbacks.onP1Punch();
            }
        });
        this.scene.input.keyboard.on('keydown-K', () => {
            if (this.attackCallbacks.onP1Kick) {
                this.attackCallbacks.onP1Kick();
            }
        });

        // P2 攻击键
        this.scene.input.keyboard.on('keydown-NUMPAD_ONE', () => {
            if (this.attackCallbacks.onP2Punch) {
                this.attackCallbacks.onP2Punch();
            }
        });
        this.scene.input.keyboard.on('keydown-NUMPAD_TWO', () => {
            if (this.attackCallbacks.onP2Kick) {
                this.attackCallbacks.onP2Kick();
            }
        });
    }

    // 注册攻击回调
    onAttack(callbacks) {
        this.attackCallbacks = { ...this.attackCallbacks, ...callbacks };
    }

    // 获取 P1 按键状态
    getP1Keys() {
        return this.keysP1;
    }

    // 获取 P2 按键状态
    getP2Keys() {
        return this.keysP2;
    }

    // 解析攻击类型
    /**
     * 根据当前状态决定实际触发的技能：
     *  - 地面 + 拳键 + 上键 → 升龙拳
     *  - 地面 + 拳键         → 普通拳
     *  - 地面 + 踢键         → 普通踢
     *  - 空中 + 拳键         → 飞拳
     *  - 空中 + 踢键         → 飞脚
     */
    resolveAttack(fighter, key, keys) {
        if (fighter.attackState !== ATTACK_STATES.IDLE || fighter.isHit) return null;
        const onGround = fighter.isOnGround();

        let type;
        if (key === ATTACK_TYPES.PUNCH) {
            if (onGround && keys.up.isDown) {
                type = ATTACK_TYPES.RISING;      // 升龙拳
            } else if (onGround) {
                type = ATTACK_TYPES.PUNCH;       // 普通拳
            } else {
                type = ATTACK_TYPES.AIR_PUNCH;   // 飞拳
            }
        } else { // kick
            if (onGround) {
                type = ATTACK_TYPES.KICK;        // 普通踢
            } else {
                type = ATTACK_TYPES.AIR_KICK;    // 飞脚
            }
        }
        return type;
    }

    // 处理移动
    processMovement(fighter, keys) {
        const body     = fighter.body;
        const onGround = fighter.isOnGround();
        const canMove  = fighter.attackState === ATTACK_STATES.IDLE && !fighter.isHit;

        if (keys.left.isDown && canMove) {
            body.setVelocityX(-GAME_CONFIG.playerSpeed);
        } else if (keys.right.isDown && canMove) {
            body.setVelocityX(GAME_CONFIG.playerSpeed);
        } else if (!fighter.isHit && fighter.attackType !== ATTACK_TYPES.RISING) {
            body.setVelocityX(body.velocity.x * 0.78);
        }

        if (keys.up.isDown && onGround && canMove) {
            body.setVelocityY(GAME_CONFIG.jumpForce);
        }

        // 防御只在地面
        const wantBlock = keys.block.isDown && onGround && canMove;
        fighter.setBlockVisual(wantBlock);
    }
}
