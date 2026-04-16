// =============================================
//  麻将翻牌攻击系统 - attacks.js
//  参考 GDD: 麻将翻牌攻击系统
// =============================================

// =============================================
//  麻将牌配置
// =============================================

// 麻将花色类型
const MAHJONG_SUIT = {
  WAN: 'wan',     // 万子
  TONG: 'tong',    // 筒子
  TIAO: 'tiao',    // 条子
  WIND: 'wind',    // 风牌（东南西北）
  DRAGON: 'dragon' // 箭牌（中发白）
};

// 麻将牌定义（简化版：每种2张 = 68张牌池）
const MAHJONG_DEFS = [
  // 万子 1-9 (2张)
  { id: '1wan', suit: MAHJONG_SUIT.WAN, value: 1, name: '一万', score: 10 },
  { id: '2wan', suit: MAHJONG_SUIT.WAN, value: 2, name: '二万', score: 10 },
  { id: '3wan', suit: MAHJONG_SUIT.WAN, value: 3, name: '三万', score: 15 },
  { id: '4wan', suit: MAHJONG_SUIT.WAN, value: 4, name: '四万', score: 20 },
  { id: '5wan', suit: MAHJONG_SUIT.WAN, value: 5, name: '五万', score: 25 },
  { id: '6wan', suit: MAHJONG_SUIT.WAN, value: 6, name: '六万', score: 30 },
  { id: '7wan', suit: MAHJONG_SUIT.WAN, value: 7, name: '七万', score: 35 },
  { id: '8wan', suit: MAHJONG_SUIT.WAN, value: 8, name: '八万', score: 40 },
  { id: '9wan', suit: MAHJONG_SUIT.WAN, value: 9, name: '九万', score: 50 },
  // 筒子 1-9 (2张)
  { id: '1tong', suit: MAHJONG_SUIT.TONG, value: 1, name: '一筒', score: 10 },
  { id: '2tong', suit: MAHJONG_SUIT.TONG, value: 2, name: '二筒', score: 10 },
  { id: '3tong', suit: MAHJONG_SUIT.TONG, value: 3, name: '三筒', score: 15 },
  { id: '4tong', suit: MAHJONG_SUIT.TONG, value: 4, name: '四筒', score: 20 },
  { id: '5tong', suit: MAHJONG_SUIT.TONG, value: 5, name: '五筒', score: 25 },
  { id: '6tong', suit: MAHJONG_SUIT.TONG, value: 6, name: '六筒', score: 30 },
  { id: '7tong', suit: MAHJONG_SUIT.TONG, value: 7, name: '七筒', score: 35 },
  { id: '8tong', suit: MAHJONG_SUIT.TONG, value: 8, name: '八筒', score: 40 },
  { id: '9tong', suit: MAHJONG_SUIT.TONG, value: 9, name: '九筒', score: 50 },
  // 条子 1-9 (2张)
  { id: '1tiao', suit: MAHJONG_SUIT.TIAO, value: 1, name: '一条', score: 10 },
  { id: '2tiao', suit: MAHJONG_SUIT.TIAO, value: 2, name: '二条', score: 10 },
  { id: '3tiao', suit: MAHJONG_SUIT.TIAO, value: 3, name: '三条', score: 15 },
  { id: '4tiao', suit: MAHJONG_SUIT.TIAO, value: 4, name: '四条', score: 20 },
  { id: '5tiao', suit: MAHJONG_SUIT.TIAO, value: 5, name: '五条', score: 25 },
  { id: '6tiao', suit: MAHJONG_SUIT.TIAO, value: 6, name: '六条', score: 30 },
  { id: '7tiao', suit: MAHJONG_SUIT.TIAO, value: 7, name: '七条', score: 35 },
  { id: '8tiao', suit: MAHJONG_SUIT.TIAO, value: 8, name: '八条', score: 40 },
  { id: '9tiao', suit: MAHJONG_SUIT.TIAO, value: 9, name: '九条', score: 50 },
  // 风牌 (2张)
  { id: 'dong', suit: MAHJONG_SUIT.WIND, value: 1, name: '东', score: 20 },
  { id: 'nan', suit: MAHJONG_SUIT.WIND, value: 2, name: '南', score: 20 },
  { id: 'xi', suit: MAHJONG_SUIT.WIND, value: 3, name: '西', score: 20 },
  { id: 'bei', suit: MAHJONG_SUIT.WIND, value: 4, name: '北', score: 20 },
  // 箭牌 (2张)
  { id: 'zhong', suit: MAHJONG_SUIT.DRAGON, value: 1, name: '中', score: 30 },
  { id: 'fa', suit: MAHJONG_SUIT.DRAGON, value: 2, name: '發', score: 30 },
  { id: 'bai', suit: MAHJONG_SUIT.DRAGON, value: 3, name: '白', score: 30 },
];

// 麻将牌颜色配置
const MAHJONG_COLORS = {
  [MAHJONG_SUIT.WAN]: 0xc41e3a,    // 红色 - 万子
  [MAHJONG_SUIT.TONG]: 0x1e3a5f,   // 蓝色 - 筒子
  [MAHJONG_SUIT.TIAO]: 0x228b22,   // 绿色 - 条子
  [MAHJONG_SUIT.WIND]: 0x4a0080,   // 紫色 - 风牌
  [MAHJONG_SUIT.DRAGON]: 0xc41e3a, // 红色 - 箭牌
};

// 牌型配置
const PATTERN_TYPES = {
  SINGLE: { name: '散牌', multiplier: 1.0 },
  PAIR: { name: '对子', multiplier: 1.5 },
  TWO_PAIRS: { name: '双对子', multiplier: 2.0 },
  THREE_PAIRS: { name: '三对子', multiplier: 3.0 },
  SINGLE_SEQUENCE: { name: '单顺子', multiplier: 2.0 },
  SINGLE_TRIPLET: { name: '单刻子', multiplier: 2.5 },
  SEQ_AND_PAIR: { name: '顺子对子', multiplier: 2.8 },
  TRIPLET_AND_PAIR: { name: '刻子对子', multiplier: 3.2 },
  DOUBLE_SEQUENCE: { name: '双顺子', multiplier: 3.5 },
  DOUBLE_TRIPLET: { name: '双刻子', multiplier: 4.0 },
  FULL_FLUSH: { name: '清一色', multiplier: 5.0 },
  PONG_PONG: { name: '碰碰胡', multiplier: 5.5 },
  TRIPLE_SEQUENCE: { name: '三顺子', multiplier: 6.0 },
  TRIPLE_TRIPLET: { name: '三刻子', multiplier: 7.0 },
  SEVEN_PAIRS: { name: '七对子', multiplier: 8.0 },
  THIRTEEN_ORPHANS: { name: '国士无双', multiplier: 10.0 },
  BIG_THREE_DRAGONS: { name: '大三元', multiplier: 12.0 },
  BIG_FOUR_WINDS: { name: '大四喜', multiplier: 12.0 },
};

// 连击配置
const COMBO_CONFIG = {
  2: { multiplier: 1.2, name: '2连击' },
  3: { multiplier: 1.5, name: '3连击' },
  4: { multiplier: 2.0, name: '4连击' },
  5: { multiplier: 2.5, name: '5连击+' },
};

// 翻牌位数量
const HAND_SIZE = 6;

// 麻将尺寸
const MJ_CARD_W = 50;
const MJ_CARD_H = 70;

// =============================================
//  牌池管理
// =============================================

class MahjongDeck {
  constructor() {
    this.cards = [];
    this.build();
  }

  build() {
    this.cards = [];
    for (const def of MAHJONG_DEFS) {
      this.cards.push({ ...def, uid: `${def.id}_1` });
      this.cards.push({ ...def, uid: `${def.id}_2` });
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(count) {
    const drawn = this.cards.splice(0, count);
    if (this.cards.length < count) {
      this.build();
    }
    return drawn;
  }
}

// =============================================
//  牌型识别引擎
// =============================================

class PatternRecognizer {
  constructor(cards) {
    this.cards = cards;
  }

  recognize() {
    const bySuit = this.groupBySuit();
    const special = this.checkSpecialPatterns(bySuit);
    if (special) return special;
    return this.findBestCombination(bySuit);
  }

  groupBySuit() {
    const groups = {
      [MAHJONG_SUIT.WAN]: [],
      [MAHJONG_SUIT.TONG]: [],
      [MAHJONG_SUIT.TIAO]: [],
      [MAHJONG_SUIT.WIND]: [],
      [MAHJONG_SUIT.DRAGON]: [],
    };
    for (const card of this.cards) {
      groups[card.suit].push(card);
    }
    return groups;
  }

  checkSpecialPatterns(bySuit) {
    // 七对子
    if (this.countAllPairs() >= 3) {
      return this.createResult(PATTERN_TYPES.SEVEN_PAIRS);
    }
    // 清一色
    for (const suit of [MAHJONG_SUIT.WAN, MAHJONG_SUIT.TONG, MAHJONG_SUIT.TIAO]) {
      if (bySuit[suit].length >= 6) {
        return this.createResult(PATTERN_TYPES.FULL_FLUSH);
      }
    }
    return null;
  }

  countAllPairs() {
    let pairs = 0;
    const used = new Set();
    for (let i = 0; i < this.cards.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < this.cards.length; j++) {
        if (used.has(j)) continue;
        if (this.cards[i].id === this.cards[j].id) {
          pairs++;
          used.add(i);
          used.add(j);
          break;
        }
      }
    }
    return pairs;
  }

  findBestCombination(bySuit) {
    const pairCount = this.countAllPairs();
    let totalTriplets = 0;
    let totalSequences = 0;

    for (const suit of [MAHJONG_SUIT.WAN, MAHJONG_SUIT.TONG, MAHJONG_SUIT.TIAO]) {
      if (this.findTriplet(bySuit[suit])) totalTriplets++;
      if (this.findSequence(bySuit[suit])) totalSequences++;
    }

    if (totalTriplets === 3) return this.createResult(PATTERN_TYPES.TRIPLE_TRIPLET);
    if (totalTriplets === 2) return this.createResult(PATTERN_TYPES.DOUBLE_TRIPLET);
    if (totalSequences === 3) return this.createResult(PATTERN_TYPES.TRIPLE_SEQUENCE);
    if (totalSequences === 2) return this.createResult(PATTERN_TYPES.DOUBLE_SEQUENCE);
    if (totalSequences === 1 && pairCount >= 1) return this.createResult(PATTERN_TYPES.SEQ_AND_PAIR);
    if (totalTriplets === 1 && pairCount >= 1) return this.createResult(PATTERN_TYPES.TRIPLET_AND_PAIR);
    if (totalTriplets === 1) return this.createResult(PATTERN_TYPES.SINGLE_TRIPLET);
    if (totalSequences === 1) return this.createResult(PATTERN_TYPES.SINGLE_SEQUENCE);
    if (pairCount === 3) return this.createResult(PATTERN_TYPES.THREE_PAIRS);
    if (pairCount === 2) return this.createResult(PATTERN_TYPES.TWO_PAIRS);
    if (pairCount === 1) return this.createResult(PATTERN_TYPES.PAIR);
    return this.createResult(PATTERN_TYPES.SINGLE);
  }

  findTriplet(cards) {
    for (let i = 0; i < cards.length - 2; i++) {
      for (let j = i + 1; j < cards.length - 1; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          if (cards[i].id === cards[j].id && cards[j].id === cards[k].id) {
            return [cards[i], cards[j], cards[k]];
          }
        }
      }
    }
    return null;
  }

  findSequence(cards) {
    const suitedCards = cards.filter(c =>
      c.suit !== MAHJONG_SUIT.WIND && c.suit !== MAHJONG_SUIT.DRAGON
    );
    suitedCards.sort((a, b) => a.value - b.value);
    for (let i = 0; i < suitedCards.length - 2; i++) {
      const c1 = suitedCards[i];
      const c2 = suitedCards[i + 1];
      const c3 = suitedCards[i + 2];
      if (c1.suit === c2.suit && c2.suit === c3.suit &&
          c1.value + 1 === c2.value && c2.value + 1 === c3.value) {
        return [c1, c2, c3];
      }
    }
    return null;
  }

  createResult(pattern) {
    const baseScore = this.cards.reduce((sum, card) => sum + card.score, 0);
    return { pattern, cards: this.cards, baseScore, multiplier: pattern.multiplier };
  }
}

// =============================================
//  麻将翻牌攻击系统 (用于 wuzhuzhu)
// =============================================

class MahjongAttackSystem {
  constructor(scene, config) {
    this.scene = scene;
    this.deck = new MahjongDeck();
    this.currentHand = [];
    this.dora = null;
    this.combo = 0;
    this.isAttacking = false;
    this.baseDamage = config?.baseDamage || 100;
    this.slotPositions = [];
    this.cardGraphics = [];
  }

  initUI(centerX, centerY) {
    const spacing = MJ_CARD_W + 15;
    const totalWidth = (HAND_SIZE - 1) * spacing;
    const startX = centerX - totalWidth / 2;
    this.slotPositions = [];
    for (let i = 0; i < HAND_SIZE; i++) {
      this.slotPositions.push({ x: startX + i * spacing, y: centerY });
    }
  }

  async startAttack(attacker, target) {
    if (this.isAttacking) return;
    this.isAttacking = true;

    this.initUI(CANVAS_W / 2, CANVAS_H / 2 - 50);
    this.currentHand = this.deck.draw(HAND_SIZE);
    this.dora = MAHJONG_DEFS[Math.floor(Math.random() * MAHJONG_DEFS.length)];

    await this.showFlipAnimation();

    const recognizer = new PatternRecognizer(this.currentHand);
    const result = recognizer.recognize();
    const damage = this.calculateDamage(result);

    await this.showDamageEffect(damage, result);
    this.scene.dealDamage(attacker, target, damage);
    await this.cleanupUI();

    this.isAttacking = false;
  }

  async showFlipAnimation() {
    const promises = [];
    for (let i = 0; i < HAND_SIZE; i++) {
      const pos = this.slotPositions[i];
      const card = this.currentHand[i];
      const cardBack = this.createCardBack(pos.x, pos.y);
      const delay = i * 150;
      promises.push(new Promise(resolve => {
        this.scene.time.delayedCall(delay, () => {
          this.flipCard(cardBack, card, pos.x, pos.y, resolve);
        });
      }));
    }
    await Promise.all(promises);
    await new Promise(resolve => this.scene.time.delayedCall(800, resolve));
  }

  createCardBack(x, y) {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a237e, 1);
    bg.fillRoundedRect(-MJ_CARD_W/2, -MJ_CARD_H/2, MJ_CARD_W, MJ_CARD_H, 6);
    bg.lineStyle(3, 0xffd700, 1);
    bg.strokeRoundedRect(-MJ_CARD_W/2, -MJ_CARD_H/2, MJ_CARD_W, MJ_CARD_H, 6);
    bg.lineStyle(1, 0xffd700, 0.5);
    bg.strokeCircle(0, 0, 15);
    container.add(bg);
    this.cardGraphics.push(container);
    return container;
  }

  flipCard(cardBack, card, x, y, callback) {
    this.scene.tweens.add({
      targets: cardBack,
      scaleX: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        cardBack.destroy();
        const cardFront = this.createCardFront(card, x, y);
        this.scene.tweens.add({
          targets: cardFront,
          scaleX: 1,
          duration: 150,
          ease: 'Power2',
          onComplete: callback
        });
      }
    });
  }

  createCardFront(card, x, y) {
    const container = this.scene.add.container(x, y);
    container.scaleX = 0;
    container._isMahjongCard = true;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0xFFFAF0, 1);
    bg.fillRoundedRect(-MJ_CARD_W/2, -MJ_CARD_H/2, MJ_CARD_W, MJ_CARD_H, 6);
    const borderColor = MAHJONG_COLORS[card.suit] || 0x333333;
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(-MJ_CARD_W/2, -MJ_CARD_H/2, MJ_CARD_W, MJ_CARD_H, 6);
    container.add(bg);

    const text = this.scene.add.text(0, -8, card.name, {
      fontSize: card.name.length > 2 ? '16px' : '20px',
      fontFamily: 'SimHei, Heiti, sans-serif',
      color: '#' + borderColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    container.add(text);

    const dot = this.scene.add.graphics();
    dot.fillStyle(borderColor, 1);
    dot.fillCircle(0, 18, 5);
    container.add(dot);

    if (this.dora && card.id === this.dora.id) {
      const doraMark = this.scene.add.text(MJ_CARD_W/2 - 8, -MJ_CARD_H/2 + 5, '宝', {
        fontSize: '12px', fontFamily: 'SimHei', color: '#ff0000', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      container.add(doraMark);
      this.scene.tweens.add({
        targets: container, alpha: 0.7, duration: 500, yoyo: true, repeat: -1
      });
    }

    this.cardGraphics.push(container);
    return container;
  }

  calculateDamage(result) {
    let damage = this.baseDamage;
    damage *= result.multiplier;
    for (const card of result.cards) {
      if (this.dora && card.id === this.dora.id) {
        damage += card.score * 2;
      }
    }
    if (this.combo >= 2) {
      const level = Math.min(this.combo, 5);
      const config = COMBO_CONFIG[level] || COMBO_CONFIG[5];
      damage *= config.multiplier;
    }
    this.combo++;
    return Math.floor(damage);
  }

  async showDamageEffect(damage, result) {
    const centerX = CANVAS_W / 2;
    const centerY = CANVAS_H / 2 - 80;

    const patternText = this.scene.add.text(centerX, centerY, `${result.pattern.name} x${result.multiplier}`, {
      fontSize: '24px', fontFamily: 'SimHei, sans-serif', color: '#ffd700',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0.5).setAlpha(0);

    const damageText = this.scene.add.text(centerX, centerY + 40, `${damage}`, {
      fontSize: '48px', fontFamily: 'Arial Black, sans-serif', color: '#ff4444',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: [patternText, damageText], alpha: 1, y: '-=20', duration: 300, ease: 'Power2'
    });

    if (this.combo >= 2) {
      const level = Math.min(this.combo, 5);
      const config = COMBO_CONFIG[level];
      const comboText = this.scene.add.text(centerX, centerY + 80, `${config.name} x${config.multiplier}`, {
        fontSize: '18px', fontFamily: 'SimHei, sans-serif', color: '#ff6600',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5, 0.5).setAlpha(0);
      this.scene.tweens.add({ targets: comboText, alpha: 1, duration: 200 });
      await new Promise(r => this.scene.time.delayedCall(1500, r));
      comboText.destroy();
    }

    await new Promise(r => this.scene.time.delayedCall(1000, r));
    patternText.destroy();
    damageText.destroy();
  }

  async cleanupUI() {
    for (const obj of this.cardGraphics) {
      this.scene.tweens.killTweensOf(obj);
      obj.destroy();
    }
    this.cardGraphics = [];
    await new Promise(r => this.scene.time.delayedCall(300, r));
  }

  resetCombo() {
    this.combo = 0;
  }
}

// =============================================
//  通用攻击系统 (用于其他RANGED角色)
// =============================================

class AttackSystem {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
  }

  createBullet(attacker, target, attack) {
    const container = this.scene.add.container(attacker.x, attacker.y);
    const bulletGraphics = this.scene.add.graphics();
    container.add(bulletGraphics);

    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const angle = Math.atan2(dy, dx);
    const speed = attack.projectileSpeed || 400;

    container.vx = Math.cos(angle) * speed;
    container.vy = Math.sin(angle) * speed;
    container.damage = attack.damage;
    container.attacker = attacker;
    container.target = target;
    container.life = 2.0;
    container.rotation = angle;

    // 判断是否为 wuzhuzhu，发射麻将子弹
    if (attacker.char.id === 'wuzhuzhu') {
      this.drawMahjongBullet(bulletGraphics, attack);
      container.isMahjong = true;
      container.rotationSpeed = (Math.random() - 0.5) * 8;
    } else {
      // 普通子弹
      bulletGraphics.fillStyle(0x000000, 1);
      bulletGraphics.fillRect(-6, -2, 12, 4);
    }

    this.scene.bullets.add(container);
  }

  drawMahjongBullet(graphics, attack) {
    const w = 36, h = 48;
    graphics.fillStyle(0xFFFAF0, 1);
    graphics.fillRoundedRect(-w/2, -h/2, w, h, 4);
    graphics.lineStyle(2, 0x2c1810, 1);
    graphics.strokeRoundedRect(-w/2, -h/2, w, h, 4);

    const def = MAHJONG_DEFS[Math.floor(Math.random() * MAHJONG_DEFS.length)];
    let color = '#2c1810';
    if (def.suit === MAHJONG_SUIT.WAN) color = '#c41e3a';
    else if (def.suit === MAHJONG_SUIT.TONG) color = '#1e3a5f';
    else if (def.suit === MAHJONG_SUIT.TIAO) color = '#228b22';
    else if (def.suit === MAHJONG_SUIT.WIND) color = '#4a0080';

    return { char: def.name, color };
  }
}

// =============================================
//  工具函数
// =============================================

function getMahjongDisplay(mahjongKey) {
  const def = MAHJONG_DEFS.find(d => d.id === mahjongKey);
  if (def) {
    return {
      name: def.name,
      color: '#' + (MAHJONG_COLORS[def.suit] || 0x333333).toString(16).padStart(6, '0')
    };
  }
  return { name: '?', color: '#333333' };
}

function getRandomMahjong() {
  const def = MAHJONG_DEFS[Math.floor(Math.random() * MAHJONG_DEFS.length)];
  return def.id;
}
