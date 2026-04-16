// =============================================
//  Phaser 擂台对战 - 支持角色选择传入
//  攻击系统已抽取到 attacks.js
// =============================================

const CANVAS_W = 600;
const CANVAS_H = 600;

// 擂台参数
const ARENA_X = 50;
const ARENA_Y = 60;
const ARENA_SIZE = 500;

// 血条尺寸
const HP_BAR_W = 140;
const HP_BAR_H = 14;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // 自动遍历所有角色的图片并预加载
    Object.values(CHARACTERS).forEach(char => {
      if (char.image) {
        this.load.image(`char_img_${char.id}`, char.image);
      }
    });
  }

  init(data) {
    // 接收角色选择
    this.playerCharId = data.playerChar || 'swift';
    this.cpuCharId = data.cpuChar || 'tank';
    this.gameMode = data.mode || 'pve';
  }

  create() {
    // 获取角色配置
    const char1 = getCharacter(this.playerCharId);
    const char2 = getCharacter(this.cpuCharId);

    this.char1 = char1;
    this.char2 = char2;

    // ---------- 背景 ----------
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    // ---------- 擂台 ----------
    const arena = this.add.graphics();
    arena.fillStyle(0xffffff, 0.4); 
    arena.fillRect(ARENA_X, ARENA_Y, ARENA_SIZE, ARENA_SIZE);
    arena.lineStyle(3, 0xffffff, 0.8);
    arena.strokeRect(ARENA_X, ARENA_Y, ARENA_SIZE, ARENA_SIZE);

    // ---------- 标题 ----------
    this.add.text(CANVAS_W / 2, 50, `${char1.name} VS ${char2.name}`, {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5, 0.5);

    // 返回菜单按钮
    this.createMenuButton();

    // ---------- 血量初始化 ----------
    this.hp1 = char1.maxHp;
    this.hp2 = char2.maxHp;

    // ---------- 创建玩家 ----------
    this.player1 = this.createPlayer(
      ARENA_X + ARENA_SIZE * 0.3,
      ARENA_Y + ARENA_SIZE * 0.5,
      char1,
      'P',
      true
    );

    this.player2 = this.createPlayer(
      ARENA_X + ARENA_SIZE * 0.7,
      ARENA_Y + ARENA_SIZE * 0.5,
      char2,
      'C',
      this.gameMode === 'pvp'
    );

    // 赋予随机初速度
    this.setRandomVelocity(this.player1, char1.speed);
    this.setRandomVelocity(this.player2, char2.speed);

    // ---------- 攻击冷却 ----------
    this.player1.attackCooldown = 0;
    this.player2.attackCooldown = 0;

    // 疾风连击计数
    this.player1.comboStacks = 0;
    this.player2.comboStacks = 0;
    this.player1.comboTimer = 0;
    this.player2.comboTimer = 0;

    // 影刃冲锋状态
    this.player1.isCharging = false;
    this.player2.isCharging = false;

    // ---------- 血条 UI ----------
    this.createHpUI();

    // ---------- 碰撞冷却 ----------
    this.collisionCooldown = 0;

    // ---------- 伤害数字 ----------
    this.damageTexts = [];

    // ---------- 子弹组 ----------
    this.bullets = this.add.group();

    // ---------- 初始化攻击系统 ----------
    this.attackSystem = new AttackSystem(this, {
      arenaX: ARENA_X,
      arenaY: ARENA_Y,
      arenaSize: ARENA_SIZE
    });
    
    // ---------- 麻将翻牌攻击系统 (wuzhuzhu专用) ----------
    this.mahjongAttackSystem = new MahjongAttackSystem(this, {
      baseDamage: 100
    });

    // ---------- 游戏结束状态 ----------
    this.gameOver = false;
  }

  createMenuButton() {
    const button = this.add.container(40, 30);

    const text = this.add.text(0, 0, '← 菜单', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#666666',
    }).setOrigin(0.5, 0.5);

    button.add(text);
    button.setSize(60, 25);
    button.setInteractive();

    button.on('pointerover', () => {
      text.setColor('#333333');
      this.game.canvas.style.cursor = 'pointer';
    });

    button.on('pointerout', () => {
      text.setColor('#666666');
      this.game.canvas.style.cursor = 'default';
    });

    button.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  createPlayer(x, y, char, label, isPlayer) {
    const container = this.add.container(x, y);

    const body = this.add.image(0, 0, `char_img_${char.id}`);
    body.setDisplaySize(char.size, char.size);

    const nameText = this.add.text(0, -char.size / 2 - 12, char.name, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5);

    container.add([body, nameText]);

    container.vx = 0;
    container.vy = 0;
    container.char = char;
    container.bodyGraphics = body; 
    container.isPlayer = isPlayer;

    return container;
  }

  setRandomVelocity(player, speed) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    player.vx = Math.cos(angle) * speed;
    player.vy = Math.sin(angle) * speed;
  }

  createHpUI() {
    const y = CANVAS_H - 70;

    this.hpBarBg1 = this.add.graphics();
    this.hpBarFill1 = this.add.graphics();
    this.hpLabel1 = this.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.hpBarBg2 = this.add.graphics();
    this.hpBarFill2 = this.add.graphics();
    this.hpLabel2 = this.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.nameLabel1 = this.add.text(CANVAS_W / 2 - HP_BAR_W - 30, y, 
      `${this.char1.name} (你)`, {
      fontSize: '13px', color: '#' + this.char1.fillColor.toString(16).padStart(6, '0'), 
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    this.nameLabel2 = this.add.text(CANVAS_W / 2 + HP_BAR_W + 30, y, 
      `(电脑) ${this.char2.name}`, {
      fontSize: '13px', color: '#' + this.char2.fillColor.toString(16).padStart(6, '0'), 
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.attackInfo1 = this.add.text(CANVAS_W / 2 - HP_BAR_W - 30, y + 18, 
      `⚔ ${this.char1.attack.name}`, {
      fontSize: '10px', color: '#666666', fontFamily: 'Arial'
    }).setOrigin(1, 0.5);

    this.attackInfo2 = this.add.text(CANVAS_W / 2 + HP_BAR_W + 30, y + 18, 
      `${this.char2.attack.name} ⚔`, {
      fontSize: '10px', color: '#666666', fontFamily: 'Arial'
    }).setOrigin(0, 0.5);

    this.drawHpBars();
  }

  drawHpBars() {
    const y = CANVAS_H - 70;

    const x1 = CANVAS_W / 2 - 20;
    this.hpBarBg1.clear();
    this.hpBarBg1.fillStyle(0xdddddd, 1);
    this.hpBarBg1.fillRect(x1 - HP_BAR_W, y - HP_BAR_H / 2, HP_BAR_W, HP_BAR_H);
    this.hpBarBg1.lineStyle(1, 0xaaaaaa, 1);
    this.hpBarBg1.strokeRect(x1 - HP_BAR_W, y - HP_BAR_H / 2, HP_BAR_W, HP_BAR_H);

    const ratio1 = Math.max(0, this.hp1 / this.char1.maxHp);
    const w1 = HP_BAR_W * ratio1;
    this.hpBarFill1.clear();
    this.hpBarFill1.fillStyle(this.char1.fillColor, 1);
    this.hpBarFill1.fillRect(x1 - w1, y - HP_BAR_H / 2, w1, HP_BAR_H);

    this.hpLabel1.setPosition(x1 - HP_BAR_W / 2, y);
    this.hpLabel1.setText(`${Math.ceil(this.hp1)} / ${this.char1.maxHp}`);

    const x2 = CANVAS_W / 2 + 20;
    this.hpBarBg2.clear();
    this.hpBarBg2.fillStyle(0xdddddd, 1);
    this.hpBarBg2.fillRect(x2, y - HP_BAR_H / 2, HP_BAR_W, HP_BAR_H);
    this.hpBarBg2.lineStyle(1, 0xaaaaaa, 1);
    this.hpBarBg2.strokeRect(x2, y - HP_BAR_H / 2, HP_BAR_W, HP_BAR_H);

    const ratio2 = Math.max(0, this.hp2 / this.char2.maxHp);
    const w2 = HP_BAR_W * ratio2;
    this.hpBarFill2.clear();
    this.hpBarFill2.fillStyle(this.char2.fillColor, 1);
    this.hpBarFill2.fillRect(x2, y - HP_BAR_H / 2, w2, HP_BAR_H);

    this.hpLabel2.setPosition(x2 + HP_BAR_W / 2, y);
    this.hpLabel2.setText(`${Math.ceil(this.hp2)} / ${this.char2.maxHp}`);
  }

  update(time, delta) {
    if (this.gameOver) return;

    const dt = delta / 1000;

    // 冷却更新
    if (this.collisionCooldown > 0) this.collisionCooldown -= dt;
    if (this.player1.attackCooldown > 0) this.player1.attackCooldown -= dt;
    if (this.player2.attackCooldown > 0) this.player2.attackCooldown -= dt;

    // 连击计时器
    if (this.player1.comboTimer > 0) {
      this.player1.comboTimer -= dt;
      if (this.player1.comboTimer <= 0) this.player1.comboStacks = 0;
    }
    if (this.player2.comboTimer > 0) {
      this.player2.comboTimer -= dt;
      if (this.player2.comboTimer <= 0) this.player2.comboStacks = 0;
    }

    // 电脑AI
    this.updateAI(dt);

    // 移动
    this.movePlayer(this.player1, dt);
    this.movePlayer(this.player2, dt);

    // 更新子弹
    this.updateBullets(dt);

    // 碰撞检测
    this.checkPlayerCollision();

    // 攻击检测
    this.checkAttack(this.player1, this.player2, dt);
    this.checkAttack(this.player2, this.player1, dt);

    // 更新伤害数字
    this.updateDamageTexts(dt);

    // 更新血条
    this.drawHpBars();

    // 检查游戏结束
    this.checkGameOver();
  }

  updateAI(dt) {
    const cpu = this.player2;
    const player = this.player1;
    const char = cpu.char;

    const dx = player.x - cpu.x;
    const dy = player.y - cpu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 影刃冲锋逻辑
    if (char.attack.type === ATTACK_TYPE.CHARGE && !cpu.isCharging && cpu.attackCooldown <= 0) {
      if (dist > 80 && dist < char.attack.range) {
        cpu.isCharging = true;
        const angle = Math.atan2(dy, dx);
        cpu.vx = Math.cos(angle) * char.speed;
        cpu.vy = Math.sin(angle) * char.speed;
        cpu.attackCooldown = char.attack.cooldown;
        return;
      }
    }

    // 神射保持距离
    if (char.attack.type === ATTACK_TYPE.RANGED) {
      const optimal = char.attack.distanceBonus?.optimalDistance || 150;
      if (dist < optimal - 50) {
        cpu.vx = -Math.sign(dx) * char.speed * 0.8;
        cpu.vy = -Math.sign(dy) * char.speed * 0.8;
      } else if (dist > optimal + 50) {
        cpu.vx = Math.sign(dx) * char.speed * 0.6;
        cpu.vy = Math.sign(dy) * char.speed * 0.6;
      }
      return;
    }

    // 其他角色：随机游走
    if (Math.random() < 0.02) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      cpu.vx = Math.cos(angle) * char.speed;
      cpu.vy = Math.sin(angle) * char.speed;
    }
  }

  movePlayer(player, dt) {
    const char = player.char;
    let speed = char.speed;

    if (player.isCharging && char.attack.type === ATTACK_TYPE.CHARGE) {
      speed *= char.attack.speedMultiplier;
    }

    const vx = player.vx / char.speed * speed;
    const vy = player.vy / char.speed * speed;

    player.x += vx * dt;
    player.y += vy * dt;

    const left = ARENA_X + char.size / 2;
    const right = ARENA_X + ARENA_SIZE - char.size / 2;
    const top = ARENA_Y + char.size / 2;
    const bottom = ARENA_Y + ARENA_SIZE - char.size / 2;

    if (player.x <= left) {
      player.x = left;
      player.vx = Math.abs(player.vx);
      if (player.isCharging) player.isCharging = false;
    } else if (player.x >= right) {
      player.x = right;
      player.vx = -Math.abs(player.vx);
      if (player.isCharging) player.isCharging = false;
    }

    if (player.y <= top) {
      player.y = top;
      player.vy = Math.abs(player.vy);
      if (player.isCharging) player.isCharging = false;
    } else if (player.y >= bottom) {
      player.y = bottom;
      player.vy = -Math.abs(player.vy);
      if (player.isCharging) player.isCharging = false;
    }
  }

  checkPlayerCollision() {
    if (this.collisionCooldown > 0) return;

    const p1 = this.player1;
    const p2 = this.player2;
    const char1 = p1.char;
    const char2 = p2.char;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const overlapX = (char1.size + char2.size) / 2 - Math.abs(dx);
    const overlapY = (char1.size + char2.size) / 2 - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      // 铁壁反伤（被动）
      if (char1.attack.type === ATTACK_TYPE.AURA && char1.attack.passive) {
        const reflect = char1.attack.damage * char1.attack.passive.reflectPercent;
        this.dealDamage(p2, p1, reflect, true);
      }
      if (char2.attack.type === ATTACK_TYPE.AURA && char2.attack.passive) {
        const reflect = char2.attack.damage * char2.attack.passive.reflectPercent;
        this.dealDamage(p1, p2, reflect, true);
      }

      // 分离 + 速度交换
      if (overlapX < overlapY) {
        const sep = overlapX / 2 + 1;
        p1.x -= Math.sign(dx) * sep;
        p2.x += Math.sign(dx) * sep;
        const tmp = p1.vx; p1.vx = p2.vx; p2.vx = tmp;
      } else {
        const sep = overlapY / 2 + 1;
        p1.y -= Math.sign(dy) * sep;
        p2.y += Math.sign(dy) * sep;
        const tmp = p1.vy; p1.vy = p2.vy; p2.vy = tmp;
      }

      // 影刃冲锋撞击伤害
      if (p1.isCharging && char1.attack.type === ATTACK_TYPE.CHARGE) {
        this.dealDamage(p1, p2, char1.attack.damage);
        p1.isCharging = false;
      }
      if (p2.isCharging && char2.attack.type === ATTACK_TYPE.CHARGE) {
        this.dealDamage(p2, p1, char2.attack.damage);
        p2.isCharging = false;
      }

      this.collisionCooldown = 0.15;
    }
  }

  checkAttack(attacker, target, dt) {
    if (attacker.attackCooldown > 0) return;

    const attack = attacker.char.attack;
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    switch (attack.type) {
      case ATTACK_TYPE.MELEE:
        if (dist <= attack.range) {
          let damage = attack.damage;
          if (attack.combo) {
            damage += attack.combo.bonusPerStack * attacker.comboStacks;
            attacker.comboStacks = Math.min(attacker.comboStacks + 1, attack.combo.maxStacks);
            attacker.comboTimer = 1.5;
          }
          this.dealDamage(attacker, target, damage);
          attacker.attackCooldown = attack.cooldown;
        }
        break;

      case ATTACK_TYPE.AURA:
        if (dist <= attack.range) {
          this.dealDamage(attacker, target, attack.damage);
          attacker.attackCooldown = attack.cooldown;
        }
        break;

      case ATTACK_TYPE.CHARGE:
        // 冲锋在碰撞时处理
        break;

      case ATTACK_TYPE.RANGED:
        // wuzhuzhu使用麻将翻牌系统
        if (attacker.char.id === 'wuzhuzhu') {
          this.mahjongAttackSystem.startAttack(attacker, target);
        } else {
          // 其他远程角色使用普通子弹
          this.attackSystem.createBullet(attacker, target, attack);
        }
        attacker.attackCooldown = attack.cooldown;
        break;
    }
  }

  updateBullets(dt) {
    this.bullets.getChildren().forEach(bullet => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      
      // 麻将子弹旋转效果
      if (bullet.isMahjong) {
        bullet.rotation += bullet.rotationSpeed * dt;
      }

      // 碰撞检测：子弹与目标
      const dx = bullet.target.x - bullet.x;
      const dy = bullet.target.y - bullet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bullet.target.char.size / 2) {
        let finalDamage = bullet.damage;
        if (bullet.attacker.char.attack.distanceBonus) {
          const launchDx = bullet.x - bullet.attacker.x;
          const launchDy = bullet.y - bullet.attacker.y;
          const traveled = Math.sqrt(launchDx * launchDx + launchDy * launchDy);
          const bonusRatio = Math.min(traveled / bullet.attacker.char.attack.distanceBonus.optimalDistance, 1);
          finalDamage += bullet.attacker.char.attack.distanceBonus.maxBonus * bonusRatio;
        }

        this.dealDamage(bullet.attacker, bullet.target, finalDamage);
        bullet.destroy();
        return;
      }

      // 越界或生存时间结束
      if (bullet.life <= 0 || 
          bullet.x < ARENA_X || bullet.x > ARENA_X + ARENA_SIZE ||
          bullet.y < ARENA_Y || bullet.y > ARENA_Y + ARENA_SIZE) {
        bullet.destroy();
      }
    });
  }

  dealDamage(attacker, target, damage, isReflect = false) {
    if (target === this.player1) {
      this.hp1 = Math.max(0, this.hp1 - damage);
    } else {
      this.hp2 = Math.max(0, this.hp2 - damage);
    }

    this.showDamageNumber(target.x, target.y - target.char.size / 2, Math.ceil(damage), isReflect);
    this.flashPlayer(target);
  }

  showDamageNumber(x, y, damage, isReflect) {
    const color = isReflect ? '#ff8800' : '#ff0000';
    const prefix = isReflect ? '↻ ' : '';
    const text = this.add.text(x, y, prefix + damage, {
      fontSize: '16px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: color,
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5);

    this.damageTexts.push({
      text: text,
      life: 0.8,
      vy: -40
    });
  }

  flashPlayer(player) {
    player.bodyGraphics.setTint(0xffffff);

    this.time.delayedCall(80, () => {
      player.bodyGraphics.clearTint();
    });
  }

  updateDamageTexts(dt) {
    this.damageTexts = this.damageTexts.filter(d => {
      d.life -= dt;
      d.text.y += d.vy * dt;
      d.text.alpha = d.life / 0.8;
      if (d.life <= 0) {
        d.text.destroy();
        return false;
      }
      return true;
    });
  }

  checkGameOver() {
    if (this.hp1 <= 0 || this.hp2 <= 0) {
      this.gameOver = true;
      const winner = this.hp1 > 0 ? this.char1.name : this.char2.name;
      const isPlayerWin = this.hp1 > 0;

      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.7);
      overlay.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const resultText = isPlayerWin ? '🎉 胜利！' : '💀 失败';
      const color = isPlayerWin ? '#22c55e' : '#e94f3d';

      this.add.text(CANVAS_W / 2, 280, resultText, {
        fontSize: '48px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        color: color,
      }).setOrigin(0.5, 0.5);

      this.add.text(CANVAS_W / 2, 340, `${winner} 获胜`, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5);

      this.createRestartButton();
    }
  }

  createRestartButton() {
    const button = this.add.container(CANVAS_W / 2, 420);

    const bg = this.add.graphics();
    bg.fillStyle(0x3d9be9, 1);
    bg.fillRoundedRect(-80, -25, 160, 50, 8);
    bg.lineStyle(2, 0x1a5fa8, 1);
    bg.strokeRoundedRect(-80, -25, 160, 50, 8);

    const text = this.add.text(0, 0, '再来一局', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    button.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-80, -25, 160, 50);
    button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5db9f9, 1);
      bg.fillRoundedRect(-80, -25, 160, 50, 8);
      this.game.canvas.style.cursor = 'pointer';
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3d9be9, 1);
      bg.fillRoundedRect(-80, -25, 160, 50, 8);
      this.game.canvas.style.cursor = 'default';
    });

    button.on('pointerdown', () => {
      this.scene.start('CharacterSelectScene', { mode: 'pve' });
    });
  }
}

// =============================================
//  Phaser 配置 - 三个场景
// =============================================
const config = {
  type: Phaser.AUTO,
  width: CANVAS_W,
  height: CANVAS_H,
  transparent: true,
  scene: [MenuScene, CharacterSelectScene, GameScene],
  parent: document.body,
  antialias: true,
  pixelArt: false,
  roundPixels: true,
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  resolution: window.devicePixelRatio || 1,
};

new Phaser.Game(config);
