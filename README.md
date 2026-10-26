# 🦆 Duck Fly Catcher

An interactive arcade game starring the iconic dark-capped, brown-speckled domestic duck! Help the duck stretch its neck and snap buzzing flies out of the air.

Playable directly in your **web browser** or as a native **Python** desktop game.

---

## 🎮 Play in Browser (Live Demo)
Play immediately without installing anything:
👉 **[Play Duck Fly Catcher Online](https://mbscoder.github.io/duck-fly-catcher/)**

---

## 💻 Play Locally with Python

### Requirements
- **Python 3.8+** (Built-in standard libraries only; no `pip install` required!)

### How to Run
```bash
# Clone the repository
git clone https://github.com/MBSCODER/duck-fly-catcher.git
cd duck-fly-catcher

# Run the native Python game
python app.py

# Or launch the web version in your browser
python app.py --web
```

---

## 🎯 Gameplay & Features

- **Realistic Duck Mechanics**:
  - The duck stretches its neck and follows your cursor or touch.
  - Left-Click / Spacebar makes the duck snap its yellow-orange bill open and shut with an audible quack/chomp!
- **Flies Variety**:
  - 🪰 **Common Housefly** (10 pts): Standard wandering flight.
  - 🔴 **Speedy Fly** (25 pts): Fast zig-zag darting flight.
  - ✨ **Golden Dragonfly** (50 pts): High-value shimmering flyer.
- **Combo System**:
  - Catch flies in rapid succession without missing snaps to build up a **5x Combo Multiplier**!
- **Audio & Visual Effects**:
  - Procedural Web Audio API sound effects (authentic duck quacks, fly buzzing, snap bites, and combo chimes).
  - Floating score numbers, particle bursts, and high score tracking with `localStorage`.

---

## 🕹️ Controls

| Action | Control |
| :--- | :--- |
| **Aim Duck's Neck** | Move Mouse / Drag Touch |
| **Snap Bill / Catch Fly** | Left-Click / Tap / Spacebar |
| **Restart Game** | Press `R` or Click "Play Again" |

---

## 🌟 Inspired by Real Ducks
This game was crafted in homage to the real duo: the dark-capped brown mottled duck with the bright yellow bill and its white feathered friend!
