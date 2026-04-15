// =============================================
// 特效管理器 - 处理视觉特效
// =============================================

class EffectsManager {
    constructor(scene) {
        this.scene = scene;
    }

    // 升龙火焰特效
    spawnRisingFlame(fighter) {
        for (let i = 0; i < 10; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!fighter || fighter.isDead) return;
                const fx = fighter.x + Phaser.Math.Between(-12, 12);
                const fy = fighter.y - Phaser.Math.Between(0, 60);
                const flame = this.scene.add.circle(fx, fy, Phaser.Math.Between(6, 16), 0xff7700, 0.85);
                this.scene.tweens.add({
                    targets: flame,
                    y: fy - 40,
                    alpha: 0,
                    scaleX: 1.5, scaleY: 1.5,
                    duration: 280,
                    onComplete: () => flame.destroy()
                });
            });
        }
    }

    // 命中火花特效
    spawnHitSpark(x, y, color, type) {
        const size = (type === ATTACK_TYPES.RISING || type === ATTACK_TYPES.AIR_KICK) ? 28 : 18;
        const spark = this.scene.add.circle(x, y, size, color, 0.9);
        this.scene.tweens.add({
            targets: spark,
            scale: 2.5, alpha: 0,
            duration: 220,
            ease: 'Power2',
            onComplete: () => spark.destroy()
        });

        // 星射线
        const count = (type === ATTACK_TYPES.RISING) ? 8 : 5;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist  = Phaser.Math.Between(25, 50);
            const star  = this.scene.add.circle(x, y, 3, color, 0.8);
            this.scene.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scale: 0,
                duration: 280,
                onComplete: () => star.destroy()
            });
        }
    }

    // 防御特效
    spawnBlockEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
            const dist  = Phaser.Math.Between(20, 45);
            const star  = this.scene.add.circle(x, y, 4, 0x88ccff, 0.9);
            this.scene.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scale: 0,
                duration: 280,
                onComplete: () => star.destroy()
            });
        }
    }

    // 伤害数字
    spawnDamageNumber(x, y, dmg, type, blocked) {
        const colorMap = {
            [ATTACK_TYPES.PUNCH]: '#ffdd44',
            [ATTACK_TYPES.KICK]: '#ff6633',
            [ATTACK_TYPES.RISING]: '#ff9900',
            [ATTACK_TYPES.AIR_PUNCH]: '#88ffee',
            [ATTACK_TYPES.AIR_KICK]: '#ff44aa',
        };
        const sizeMap  = {
            [ATTACK_TYPES.PUNCH]: '22px',
            [ATTACK_TYPES.KICK]: '28px',
            [ATTACK_TYPES.RISING]: '34px',
            [ATTACK_TYPES.AIR_PUNCH]: '24px',
            [ATTACK_TYPES.AIR_KICK]: '30px',
        };
        const color  = blocked ? '#aaaaaa' : (colorMap[type] || '#ffffff');
        const size   = blocked ? '18px' : (sizeMap[type] || '22px');
        const suffix = type === ATTACK_TYPES.RISING ? '!!!' : 
                      (type === ATTACK_TYPES.AIR_KICK ? '!!' : 
                      (type === ATTACK_TYPES.KICK ? '!' : ''));
        const label  = blocked ? `${dmg} BLOCK` : `${dmg}${suffix}`;

        const txt = this.scene.add.text(
            x + Phaser.Math.Between(-12, 12), y, label, {
                fontSize: size, fontStyle: 'bold',
                color, stroke: '#000000', strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.scene.tweens.add({
            targets: txt,
            y: y - 60, alpha: 0,
            scaleX: 1.4, scaleY: 1.4,
            duration: 750, ease: 'Power2',
            onComplete: () => txt.destroy()
        });
    }

    // 技能名称浮字
    spawnSkillName(x, y, type) {
        const name = ATTACK_NAMES[type];
        if (!name || type === ATTACK_TYPES.PUNCH || type === ATTACK_TYPES.KICK) return;
        const colorMap = { 
            [ATTACK_TYPES.RISING]: '#ff9900', 
            [ATTACK_TYPES.AIR_PUNCH]: '#88ffee', 
            [ATTACK_TYPES.AIR_KICK]: '#ff44aa' 
        };
        const txt = this.scene.add.text(x, y, name, {
            fontSize: '20px', fontStyle: 'bold',
            color: colorMap[type] || '#ffffff',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: txt,
            y: y - 30, alpha: 0,
            duration: 700, ease: 'Power2',
            onComplete: () => txt.destroy()
        });
    }

    // 受击动画
    playHitstunAnim(target, type) {
        const angle = type === ATTACK_TYPES.RISING ? target.facing * -25 : target.facing * -12;
        this.scene.tweens.add({
            targets: [target.torso, target.head],
            angle,
            duration: 80,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // KO 动画
    playKOAnimation(loser, onComplete) {
        this.scene.tweens.add({
            targets: loser.container,
            angle: loser.facing * -90,
            y: loser.y + 10,
            duration: 350, ease: 'Power2',
            onComplete: onComplete
        });
    }
}
