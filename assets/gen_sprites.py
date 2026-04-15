"""
生成格斗游戏角色部件精灵图
P1: 红色系武士  P2: 蓝色系武士
每个部件单独一张透明背景PNG
"""
import math

try:
    from PIL import Image, ImageDraw, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("PIL not available, will use SVG fallback")

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def darken(rgb, factor=0.65):
    return tuple(int(c * factor) for c in rgb)

def lighten(rgb, factor=1.35):
    return tuple(min(255, int(c * factor)) for c in rgb)

# ─────────────────────────────────────────
# SVG 生成器（fallback，也是主要方案）
# ─────────────────────────────────────────

def make_head_svg(color_main, color_dark, color_band, skin, skin_dark, filename):
    w, h = 80, 80
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <radialGradient id="skinGrad" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="rgb{skin}"/>
      <stop offset="100%" stop-color="rgb{skin_dark}"/>
    </radialGradient>
    <radialGradient id="hairGrad" cx="50%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#444"/>
      <stop offset="100%" stop-color="#111"/>
    </radialGradient>
  </defs>
  <!-- 头发 -->
  <ellipse cx="40" cy="28" rx="28" ry="26" fill="url(#hairGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- 脸 -->
  <ellipse cx="40" cy="46" rx="25" ry="28" fill="url(#skinGrad)" stroke="rgb{skin_dark}" stroke-width="1.5"/>
  <!-- 头带 -->
  <rect x="13" y="30" width="54" height="10" rx="3" fill="rgb{color_band}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 眼睛左 -->
  <ellipse cx="29" cy="46" rx="5" ry="5.5" fill="white"/>
  <ellipse cx="29" cy="47" rx="3" ry="3.5" fill="#222"/>
  <ellipse cx="30" cy="46" rx="1" ry="1" fill="white"/>
  <!-- 眼睛右 -->
  <ellipse cx="51" cy="46" rx="5" ry="5.5" fill="white"/>
  <ellipse cx="51" cy="47" rx="3" ry="3.5" fill="#222"/>
  <ellipse cx="52" cy="46" rx="1" ry="1" fill="white"/>
  <!-- 眉毛（愤怒） -->
  <line x1="23" y1="38" x2="34" y2="41" stroke="#332200" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="57" y1="38" x2="46" y2="41" stroke="#332200" stroke-width="2.5" stroke-linecap="round"/>
  <!-- 嘴 -->
  <path d="M31 62 Q40 58 49 62" stroke="#884422" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- 鼻子 -->
  <path d="M38 52 Q40 58 42 52" stroke="rgb{skin_dark}" stroke-width="1.5" fill="none"/>
  <!-- 头带蝴蝶结尾 -->
  <path d="M67 33 Q74 28 72 38 Q68 34 67 38" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1"/>
</svg>'''
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"  ✓ {filename}")


def make_torso_svg(color_main, color_dark, color_light, skin, filename):
    w, h = 80, 90
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="torsoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb{color_light}"/>
      <stop offset="60%" stop-color="rgb{color_main}"/>
      <stop offset="100%" stop-color="rgb{color_dark}"/>
    </linearGradient>
  </defs>
  <!-- 主体 -->
  <rect x="8" y="5" width="64" height="75" rx="10" fill="url(#torsoGrad)" stroke="rgb{color_dark}" stroke-width="2"/>
  <!-- 衣领V形 -->
  <path d="M40 8 L28 28 L40 22 L52 28 Z" fill="rgb{skin}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 腰带 -->
  <rect x="8" y="68" width="64" height="12" rx="4" fill="white" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 腰带扣 -->
  <rect x="32" y="69" width="16" height="10" rx="2" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1"/>
  <!-- 肌肉线条 -->
  <line x1="40" y1="28" x2="40" y2="66" stroke="rgb{color_dark}" stroke-width="1.5" opacity="0.5"/>
  <path d="M18 35 Q40 42 62 35" stroke="rgb{color_dark}" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M18 50 Q40 57 62 50" stroke="rgb{color_dark}" stroke-width="1" fill="none" opacity="0.4"/>
  <!-- 护胸高光 -->
  <ellipse cx="28" cy="30" rx="8" ry="10" fill="rgb{color_light}" opacity="0.3"/>
  <ellipse cx="52" cy="30" rx="8" ry="10" fill="rgb{color_light}" opacity="0.3"/>
</svg>'''
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"  ✓ {filename}")


def make_arm_svg(color_main, color_dark, skin, skin_dark, filename, punching=False):
    w, h = 40, 90
    if not punching:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgb{skin}"/>
      <stop offset="100%" stop-color="rgb{skin_dark}"/>
    </linearGradient>
    <linearGradient id="sleeveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgb{color_main}"/>
      <stop offset="100%" stop-color="rgb{color_dark}"/>
    </linearGradient>
  </defs>
  <!-- 袖子（上臂） -->
  <rect x="8" y="2" width="24" height="38" rx="8" fill="url(#sleeveGrad)" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 前臂 -->
  <rect x="10" y="38" width="20" height="32" rx="6" fill="url(#armGrad)" stroke="rgb{skin_dark}" stroke-width="1.5"/>
  <!-- 护腕 -->
  <rect x="8" y="62" width="24" height="8" rx="3" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 拳头 -->
  <ellipse cx="20" cy="82" rx="12" ry="10" fill="url(#armGrad)" stroke="rgb{skin_dark}" stroke-width="2"/>
  <!-- 拳头指节 -->
  <line x1="11" y1="76" x2="11" y2="80" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="74" x2="16" y2="78" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="21" y1="74" x2="21" y2="78" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="26" y1="75" x2="26" y2="79" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
</svg>'''
    else:
        # 出拳状态 - 手臂水平伸出
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="90" height="{w}" viewBox="0 0 90 {w}">
  <defs>
    <linearGradient id="armGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgb{skin}"/>
      <stop offset="100%" stop-color="rgb{skin_dark}"/>
    </linearGradient>
    <linearGradient id="sleeveGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgb{color_main}"/>
      <stop offset="100%" stop-color="rgb{color_dark}"/>
    </linearGradient>
  </defs>
  <!-- 袖子 -->
  <rect x="2" y="8" width="38" height="24" rx="8" fill="url(#sleeveGrad2)" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 前臂 -->
  <rect x="38" y="10" width="32" height="20" rx="6" fill="url(#armGrad2)" stroke="rgb{skin_dark}" stroke-width="1.5"/>
  <!-- 护腕 -->
  <rect x="62" y="8" width="8" height="24" rx="3" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 拳头 -->
  <ellipse cx="78" cy="20" rx="10" ry="12" fill="url(#armGrad2)" stroke="rgb{skin_dark}" stroke-width="2"/>
  <line x1="72" y1="11" x2="76" y2="11" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="70" y1="16" x2="74" y2="16" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="70" y1="21" x2="74" y2="21" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="71" y1="26" x2="75" y2="26" stroke="rgb{skin_dark}" stroke-width="1.5" stroke-linecap="round"/>
</svg>'''
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"  ✓ {filename}")


def make_legs_svg(color_main, color_dark, color_light, skin, skin_dark, filename):
    w, h = 80, 80
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgb{color_light}"/>
      <stop offset="100%" stop-color="rgb{color_dark}"/>
    </linearGradient>
    <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#555"/>
      <stop offset="100%" stop-color="#111"/>
    </linearGradient>
  </defs>
  <!-- 左腿 -->
  <rect x="8" y="2" width="26" height="44" rx="8" fill="url(#legGrad)" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 右腿 -->
  <rect x="46" y="2" width="26" height="44" rx="8" fill="url(#legGrad)" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 护膝 左 -->
  <ellipse cx="21" cy="26" rx="10" ry="8" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 护膝 右 -->
  <ellipse cx="59" cy="26" rx="10" ry="8" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 左靴子 -->
  <rect x="6" y="46" width="30" height="20" rx="5" fill="url(#shoeGrad)" stroke="#111" stroke-width="1.5"/>
  <ellipse cx="21" cy="66" rx="17" ry="7" fill="url(#shoeGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- 右靴子 -->
  <rect x="44" y="46" width="30" height="20" rx="5" fill="url(#shoeGrad)" stroke="#111" stroke-width="1.5"/>
  <ellipse cx="59" cy="66" rx="17" ry="7" fill="url(#shoeGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- 靴子高光 -->
  <path d="M10 50 Q21 47 32 50" stroke="#888" stroke-width="1" fill="none" opacity="0.6"/>
  <path d="M48 50 Q59 47 70 50" stroke="#888" stroke-width="1" fill="none" opacity="0.6"/>
</svg>'''
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"  ✓ {filename}")


def make_kick_leg_svg(color_main, color_dark, color_light, skin, skin_dark, filename):
    w, h = 60, 100
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="klegGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgb{color_light}"/>
      <stop offset="100%" stop-color="rgb{color_dark}"/>
    </linearGradient>
    <linearGradient id="kshoeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#666"/>
      <stop offset="100%" stop-color="#111"/>
    </linearGradient>
  </defs>
  <!-- 大腿 -->
  <rect x="16" y="2" width="26" height="42" rx="10" fill="url(#klegGrad)" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 护膝 -->
  <ellipse cx="29" cy="26" rx="12" ry="9" fill="rgb{color_main}" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 小腿 -->
  <rect x="18" y="42" width="22" height="36" rx="7" fill="url(#klegGrad)" stroke="rgb{color_dark}" stroke-width="1.5"/>
  <!-- 踢出的靴子（水平） -->
  <rect x="10" y="74" width="46" height="18" rx="6" fill="url(#kshoeGrad)" stroke="#111" stroke-width="1.5"/>
  <ellipse cx="50" cy="83" rx="10" ry="9" fill="url(#kshoeGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- 靴子高光 -->
  <path d="M14 78 Q30 75 50 78" stroke="#888" stroke-width="1" fill="none" opacity="0.6"/>
</svg>'''
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"  ✓ {filename}")


# ── 生成两个角色 ──────────────────────────────
CHARS = {
    'p1': {
        'main':  (220, 40, 70),
        'dark':  (140, 20, 40),
        'light': (255, 100, 120),
        'band':  (220, 40, 70),
        'skin':  (240, 190, 150),
        'skin_d':(190, 140, 100),
        'dir':   'd:/lw/phaser/assets/p1',
    },
    'p2': {
        'main':  (40, 120, 240),
        'dark':  (20, 60, 160),
        'light': (100, 170, 255),
        'band':  (40, 120, 240),
        'skin':  (230, 180, 130),
        'skin_d':(175, 130, 90),
        'dir':   'd:/lw/phaser/assets/p2',
    },
}

import os
for pid, c in CHARS.items():
    d = c['dir']
    os.makedirs(d, exist_ok=True)
    print(f"\n生成 {pid.upper()} 角色精灵:")
    make_head_svg(c['main'], c['dark'], c['band'], c['skin'], c['skin_d'], f"{d}/head.svg")
    make_torso_svg(c['main'], c['dark'], c['light'], c['skin'], f"{d}/torso.svg")
    make_arm_svg(c['main'], c['dark'], c['skin'], c['skin_d'], f"{d}/arm.svg", punching=False)
    make_arm_svg(c['main'], c['dark'], c['skin'], c['skin_d'], f"{d}/arm_punch.svg", punching=True)
    make_legs_svg(c['main'], c['dark'], c['light'], c['skin'], c['skin_d'], f"{d}/legs.svg")
    make_kick_leg_svg(c['main'], c['dark'], c['light'], c['skin'], c['skin_d'], f"{d}/kick_leg.svg")

print("\n全部精灵 SVG 生成完毕！")
