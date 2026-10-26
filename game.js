// Duck Fly Catcher - Game Engine
// Featuring the user's duck with dark crown, white neck, and brown speckled feathers.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const fliesCaughtEl = document.getElementById('flies-caught');
const comboEl = document.getElementById('combo');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('high-score');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');
const finalFliesEl = document.getElementById('finalFlies');
const finalComboEl = document.getElementById('finalCombo');
const newBestBadge = document.getElementById('newBestBadge');
const switchCharHeaderBtn = document.getElementById('switchCharHeaderBtn');
const duckOptionBtns = document.querySelectorAll('.duck-option');

let selectedCharacter = localStorage.getItem('duck_character') || 'speckles'; // 'speckles' | 'snowy'
let selectedHat = localStorage.getItem('duck_hat') || 'none'; // 'none' | 'tophat' | 'beanie' | 'sunglasses' | 'crown' | 'wizard'
const hatList = ['none', 'tophat', 'beanie', 'sunglasses', 'crown', 'wizard'];
const hatOptionBtns = document.querySelectorAll('.hat-option');

function setCharacter(charId) {
  selectedCharacter = charId;
  localStorage.setItem('duck_character', charId);
  duckOptionBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.character === charId);
  });
  if (switchCharHeaderBtn) {
    if (charId === 'snowy') {
      switchCharHeaderBtn.innerHTML = '🦢 Snowy';
      switchCharHeaderBtn.style.color = '#ffffff';
    } else {
      switchCharHeaderBtn.innerHTML = '🦆 Speckles';
      switchCharHeaderBtn.style.color = '#38bdf8';
    }
  }
}

function setHat(hatId) {
  selectedHat = hatId;
  localStorage.setItem('duck_hat', hatId);
  hatOptionBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.hat === hatId);
  });
}

function cycleHat() {
  const idx = hatList.indexOf(selectedHat);
  const next = hatList[(idx + 1) % hatList.length];
  setHat(next);
  playSound('quack');
}

duckOptionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setCharacter(btn.dataset.character);
    playSound('quack');
  });
});

if (switchCharHeaderBtn) {
  switchCharHeaderBtn.addEventListener('click', () => {
    const nextChar = selectedCharacter === 'speckles' ? 'snowy' : 'speckles';
    setCharacter(nextChar);
    playSound('quack');
  });
}

hatOptionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setHat(btn.dataset.hat);
    playSound('quack');
  });
});

// Restore saved selections on load
setCharacter(selectedCharacter);
setHat(selectedHat);

// Audio Context (Synthesized sound effects - zero external audio assets needed!)
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'snap') {
    // Sharp beak snap / click
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'catch') {
    // Satisfying chomp + cheerful chirp
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } else if (type === 'quack') {
    // Realistic duck quack sound using bandpass filtered harmonic waves!
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.2);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } else if (type === 'combo') {
    // High combo arpeggio
    [880, 1174, 1396].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + (idx + 1) * 0.08);
    });
  }
}

// Game State
let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
let score = 0;
let fliesCaught = 0;
let combo = 0;
let maxCombo = 0;
let timeLeft = 60;
let lastTimestamp = 0;
let highScore = parseInt(localStorage.getItem('duck_high_score') || '0', 10);
highScoreEl.textContent = highScore;

// Duck Model
const duck = {
  bodyX: 240,
  bodyY: 430,
  targetX: 480,
  targetY: 300,
  headX: 340,
  headY: 340,
  beakX: 380,
  beakY: 340,
  beakAngle: 0,
  isSnapping: false,
  snapProgress: 0,
  beakOpen: 0,
  quackTimer: 0
};

// Flies & Particles
let flies = [];
let particles = [];
let floatingTexts = [];

class Fly {
  constructor() {
    this.reset();
  }

  reset() {
    const side = Math.random() < 0.5 ? 0 : canvas.width;
    this.x = side === 0 ? -20 : canvas.width + 20;
    this.y = 80 + Math.random() * (canvas.height - 250);

    const rand = Math.random();
    if (rand < 0.65) {
      this.type = 'normal';
      this.points = 10;
      this.speed = 2.6 + Math.random() * 1.5;
      this.color = '#334155';
      this.size = 5;
    } else if (rand < 0.88) {
      this.type = 'speedy';
      this.points = 25;
      this.speed = 4.8 + Math.random() * 2.0;
      this.color = '#ef4444';
      this.size = 4;
    } else {
      this.type = 'golden';
      this.points = 50;
      this.speed = 3.5 + Math.random() * 1.5;
      this.color = '#facc15';
      this.size = 7;
    }

    this.angle = side === 0 ? Math.random() * 0.8 - 0.4 : Math.PI + Math.random() * 0.8 - 0.4;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.wingPhase = Math.random() * Math.PI * 2;
  }

  update() {
    this.angle += (Math.random() - 0.5) * 0.5;
    this.vx = 0.88 * this.vx + 0.12 * Math.cos(this.angle) * this.speed;
    this.vy = 0.88 * this.vy + 0.12 * Math.sin(this.angle) * this.speed;

    this.x += this.vx;
    this.y += this.vy;
    this.wingPhase += 0.8;

    // Boundaries
    if (this.x < 30 && this.vx < 0) this.vx *= -1;
    if (this.x > canvas.width - 30 && this.vx > 0) this.vx *= -1;
    if (this.y < 50 && this.vy < 0) this.vy *= -1;
    if (this.y > canvas.height - 160 && this.vy > 0) this.vy *= -1;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Wings
    const wingOffset = Math.sin(this.wingPhase) * 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, -wingOffset, 6, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, wingOffset, 6, 2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    if (this.type === 'golden') {
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const ang = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 4;
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.03;
    this.size = 2 + Math.random() * 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingScore {
  constructor(text, x, y, color) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 1.0;
  }

  update() {
    this.y -= 1.2;
    this.life -= 0.02;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = 'bold 20px Fredoka, sans-serif';
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

function spawnFlies() {
  flies = [];
  for (let i = 0; i < 8; i++) {
    flies.push(new Fly());
  }
}

// Mouse / Touch Controls
function updateTargetPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  duck.targetX = (clientX - rect.left) * scaleX;
  duck.targetY = (clientY - rect.top) * scaleY;
}

canvas.addEventListener('mousemove', (e) => {
  updateTargetPosition(e.clientX, e.clientY);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length > 0) {
    updateTargetPosition(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: false });

function triggerSnap() {
  if (gameState !== 'PLAYING') return;
  initAudio();

  if (!duck.isSnapping) {
    duck.isSnapping = true;
    duck.snapProgress = 0;
    duck.beakOpen = 1;

    // Check catch
    const snapRadius = 55;
    let caught = false;

    flies.forEach(fly => {
      const dist = Math.hypot(fly.x - duck.beakX, fly.y - duck.beakY);
      if (dist < snapRadius && !caught) {
        caught = true;
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        const multiplier = Math.min(combo, 5);
        const gained = fly.points * multiplier;
        score += gained;
        fliesCaught++;

        // Visual effects
        for (let i = 0; i < 12; i++) {
          particles.push(new Particle(fly.x, fly.y, fly.color));
          particles.push(new Particle(fly.x, fly.y, '#f5deb3')); // small feather bits
        }

        const label = multiplier > 1 ? `+${gained} (${multiplier}x Combo!)` : `+${gained}`;
        floatingTexts.push(new FloatingScore(label, fly.x, fly.y, fly.type === 'golden' ? '#facc15' : '#2ecc71'));

        if (combo % 5 === 0) {
          playSound('combo');
          playSound('quack');
        } else {
          playSound('catch');
        }

        fly.reset();
      }
    });

    if (!caught) {
      combo = 0;
      playSound('snap');
    }

    updateUI();
  }
}

canvas.addEventListener('mousedown', triggerSnap);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length > 0) {
    updateTargetPosition(e.touches[0].clientX, e.touches[0].clientY);
    triggerSnap();
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    triggerSnap();
  } else if (e.key === 'r' || e.key === 'R') {
    restartGame();
  } else if (e.key === 'c' || e.key === 'C') {
    const nextChar = selectedCharacter === 'speckles' ? 'snowy' : 'speckles';
    setCharacter(nextChar);
    playSound('quack');
  } else if (e.key === 'h' || e.key === 'H') {
    cycleHat();
  }
});

function startGame() {
  initAudio();
  gameState = 'PLAYING';
  score = 0;
  fliesCaught = 0;
  combo = 0;
  maxCombo = 0;
  timeLeft = 60;
  particles = [];
  floatingTexts = [];
  spawnFlies();
  updateUI();
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  newBestBadge.classList.add('hidden');
  playSound('quack');
}

function restartGame() {
  startGame();
}

function endGame() {
  gameState = 'GAMEOVER';
  finalScoreEl.textContent = score;
  finalFliesEl.textContent = fliesCaught;
  finalComboEl.textContent = `${maxCombo}x`;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('duck_high_score', highScore);
    highScoreEl.textContent = highScore;
    newBestBadge.classList.remove('hidden');
  }

  gameOverOverlay.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

function updateUI() {
  scoreEl.textContent = score;
  fliesCaughtEl.textContent = fliesCaught;
  comboEl.textContent = `${combo}x`;
  timerEl.textContent = `${Math.ceil(timeLeft)}s`;

  if (timeLeft <= 10) {
    timerEl.parentElement.classList.add('danger');
  } else {
    timerEl.parentElement.classList.remove('danger');
  }
}

function updateDuck(dt) {
  // Calculate neck position and reach towards target
  const neckBaseX = duck.bodyX + 45;
  const neckBaseY = duck.bodyY - 40;

  const dx = duck.targetX - neckBaseX;
  const dy = duck.targetY - neckBaseY;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  let reach = Math.min(Math.max(dist * 0.5, 70), 180);

  // Beak snap animation interpolation
  if (duck.isSnapping) {
    duck.snapProgress += dt * 8;
    if (duck.snapProgress >= 1.0) {
      duck.isSnapping = false;
      duck.snapProgress = 0;
      duck.beakOpen = 0;
    } else {
      // Mouth snaps wide open, then shuts tight
      duck.beakOpen = Math.sin(duck.snapProgress * Math.PI);
      reach += Math.sin(duck.snapProgress * Math.PI) * 28; // Neck lunges forward
    }
  }

  duck.headX = neckBaseX + Math.cos(angle) * reach;
  duck.headY = neckBaseY + Math.sin(angle) * reach;

  duck.beakAngle = angle;
  duck.beakX = duck.headX + Math.cos(angle) * 44;
  duck.beakY = duck.headY + Math.sin(angle) * 44;
}

function drawBackground() {
  // Night balcony sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#0a1128');
  skyGrad.addColorStop(0.65, '#1c2541');
  skyGrad.addColorStop(1, '#2c3e50');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Twinkling stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 73) % canvas.width;
    const sy = (i * 47) % (canvas.height * 0.55);
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Balcony railings (matching photo)
  ctx.strokeStyle = '#34495e';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, canvas.height - 280, canvas.width, 2);

  ctx.lineWidth = 4;
  for (let x = 40; x < canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 280);
    ctx.lineTo(x, canvas.height - 180);
    ctx.stroke();
  }

  // Balcony floor & cloth
  const floorGrad = ctx.createLinearGradient(0, canvas.height - 180, 0, canvas.height);
  floorGrad.addColorStop(0, '#d5dbdb');
  floorGrad.addColorStop(1, '#95a5a6');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 180);
  ctx.lineTo(canvas.width, canvas.height - 180);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fill();

  // Shadow under duck
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(duck.bodyX + 10, duck.bodyY + 70, 95, 24, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHat(headX, headY) {
  if (selectedHat === 'none') return;
  ctx.save();
  ctx.translate(headX, headY);

  if (selectedHat === 'tophat') {
    // Black Top Hat
    ctx.fillStyle = '#1a1a2e';
    // Brim
    ctx.beginPath();
    ctx.ellipse(0, -24, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cylinder
    ctx.fillRect(-16, -60, 32, 38);
    // Top
    ctx.beginPath();
    ctx.ellipse(0, -60, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Band
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-16, -38, 32, 5);

  } else if (selectedHat === 'beanie') {
    // Cozy Beanie
    ctx.fillStyle = '#e74c3c';
    // Cap dome
    ctx.beginPath();
    ctx.arc(0, -22, 26, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Brim fold
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(0, -22, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pom-pom
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -48, 8, 0, Math.PI * 2);
    ctx.fill();

  } else if (selectedHat === 'sunglasses') {
    // Cool Shades
    ctx.fillStyle = '#1a1a2e';
    // Bridge
    ctx.fillRect(-5, -4, 10, 3);
    // Left lens
    ctx.beginPath();
    ctx.ellipse(-14, -3, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right lens
    ctx.beginPath();
    ctx.ellipse(14, -3, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Lens glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-16, -5, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -5, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Arms
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-26, -3);
    ctx.lineTo(-32, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(26, -3);
    ctx.lineTo(32, 4);
    ctx.stroke();

  } else if (selectedHat === 'crown') {
    // Royal Crown
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1.5;
    // Crown body
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(-22, -38);
    ctx.lineTo(-12, -30);
    ctx.lineTo(0, -46);
    ctx.lineTo(12, -30);
    ctx.lineTo(22, -38);
    ctx.lineTo(22, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Base band
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(-22, -24, 44, 5);
    // Jewels
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(-12, -22, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -22, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (selectedHat === 'wizard') {
    // Wizard Hat
    ctx.fillStyle = '#2c3e8f';
    // Cone
    ctx.beginPath();
    ctx.moveTo(-26, -22);
    ctx.lineTo(0, -72);
    ctx.lineTo(26, -22);
    ctx.closePath();
    ctx.fill();
    // Brim
    ctx.fillStyle = '#1a2766';
    ctx.beginPath();
    ctx.ellipse(0, -22, 32, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stars on hat
    ctx.fillStyle = '#f1c40f';
    ctx.font = '10px sans-serif';
    ctx.fillText('★', -8, -42);
    ctx.fillText('✦', 6, -34);
    ctx.font = '7px sans-serif';
    ctx.fillText('★', -3, -54);
    // Moon
    ctx.font = '9px sans-serif';
    ctx.fillText('☽', 10, -50);
  }

  ctx.restore();
}

function drawDuck() {
  const neckBaseX = duck.bodyX + 45;
  const neckBaseY = duck.bodyY - 40;

  // 1. Orange Webbed Feet
  ctx.fillStyle = '#e67e22';
  ctx.strokeStyle = '#d35400';
  ctx.lineWidth = 2;

  // Back foot
  ctx.beginPath();
  ctx.moveTo(duck.bodyX - 25, duck.bodyY + 65);
  ctx.lineTo(duck.bodyX - 55, duck.bodyY + 82);
  ctx.lineTo(duck.bodyX - 10, duck.bodyY + 82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Front foot
  ctx.beginPath();
  ctx.moveTo(duck.bodyX + 15, duck.bodyY + 65);
  ctx.lineTo(duck.bodyX - 10, duck.bodyY + 82);
  ctx.lineTo(duck.bodyX + 42, duck.bodyY + 82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Duck Body
  ctx.save();
  if (selectedCharacter === 'snowy') {
    // White Duck: Pure snowy white body with subtle soft gray shading
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(duck.bodyX, duck.bodyY + 10, 90, 60, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tail feathers (White)
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(duck.bodyX - 85, duck.bodyY - 5);
    ctx.lineTo(duck.bodyX - 130, duck.bodyY - 20);
    ctx.lineTo(duck.bodyX - 90, duck.bodyY + 30);
    ctx.closePath();
    ctx.fill();

    // Distinctive dark feather patch on flank (from photo)
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.ellipse(duck.bodyX - 35, duck.bodyY + 25, 14, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(duck.bodyX - 18, duck.bodyY + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Soft feather contours
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    [
      {x: -50, y: 0}, {x: -25, y: -5}, {x: 0, y: 12}, {x: 20, y: 5}
    ].forEach(s => {
      ctx.beginPath();
      ctx.arc(duck.bodyX + s.x, duck.bodyY + s.y, 7, 0, Math.PI);
      ctx.stroke();
    });
  } else {
    // Speckles: Mottled brown with speckled pattern (from photo)
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(duck.bodyX, duck.bodyY + 10, 90, 60, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tail feathers (Dark brown)
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.moveTo(duck.bodyX - 85, duck.bodyY - 5);
    ctx.lineTo(duck.bodyX - 130, duck.bodyY - 20);
    ctx.lineTo(duck.bodyX - 90, duck.bodyY + 30);
    ctx.closePath();
    ctx.fill();

    // Speckled feather patterns on flank
    const speckles = [
      {x: -50, y: 0}, {x: -30, y: 15}, {x: -10, y: 30}, {x: 10, y: 20},
      {x: -40, y: -15}, {x: -20, y: -5}, {x: 0, y: 10}, {x: 20, y: 5},
      {x: -60, y: 10}, {x: -35, y: 25}, {x: -15, y: -20}, {x: 5, y: -10}
    ];
    ctx.strokeStyle = '#d7ba89';
    ctx.lineWidth = 2.5;
    speckles.forEach(s => {
      ctx.beginPath();
      ctx.arc(duck.bodyX + s.x, duck.bodyY + s.y, 7, 0, Math.PI);
      ctx.stroke();
    });

    // White breast & bib
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(duck.bodyX + 40, duck.bodyY - 10, 45, 45, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Neck (extending towards head)
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(neckBaseX, neckBaseY);
  ctx.lineTo(duck.headX, duck.headY);
  ctx.stroke();
  ctx.restore();

  // 4. Head & Crown
  ctx.save();
  ctx.translate(duck.headX, duck.headY);

  // White head base
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();

  if (selectedCharacter === 'speckles') {
    // Iconic Dark / Black-Green Mottled Crown Cap
    ctx.fillStyle = '#1c2833';
    ctx.beginPath();
    ctx.arc(0, -2, 26, Math.PI * 1.15, Math.PI * 1.95);
    ctx.closePath();
    ctx.fill();

    // Dark cap spots around crown
    ctx.fillStyle = '#2c3e50';
    for (let ox of [-14, -7, 0, 7, 14]) {
      ctx.beginPath();
      ctx.arc(ox, -12, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark spot behind eye
    ctx.beginPath();
    ctx.arc(4, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Snowy: Small subtle top crown fleck (matching photo)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(-2, -22, 6, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Duck Eye: Dark pupil with white gleam
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(8, -6, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(6.5, -7.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Beak (Upper and Lower mandible with snap mouth gap)
  ctx.rotate(duck.beakAngle);

  const gap = 16 * duck.beakOpen;

  if (selectedCharacter === 'snowy') {
    // Snowy's Beak: Dusky olive-yellow with dark smudge/mottling
    ctx.fillStyle = '#c5a059';
    ctx.strokeStyle = '#8c6d32';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18, -9 - gap / 2);
    ctx.lineTo(58, -3 - gap / 2);
    ctx.lineTo(58, 2 - gap / 2);
    ctx.lineTo(18, 5 - gap / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark smudge on bill (exact match to photo!)
    ctx.fillStyle = '#3a342a';
    ctx.beginPath();
    ctx.ellipse(38, -3 - gap / 2, 12, 4, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Bill tip nail
    ctx.fillStyle = '#26221c';
    ctx.beginPath();
    ctx.ellipse(54, -1 - gap / 2, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower bill
    ctx.fillStyle = '#b59247';
    ctx.beginPath();
    ctx.moveTo(18, 0 + gap / 2);
    ctx.lineTo(52, 2 + gap / 2);
    ctx.lineTo(52, 6 + gap / 2);
    ctx.lineTo(18, 6 + gap / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    // Speckles' Beak: Bright Yellow-Orange with black bean tip
    ctx.fillStyle = '#f39c12';
    ctx.strokeStyle = '#d68910';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18, -9 - gap / 2);
    ctx.lineTo(58, -3 - gap / 2);
    ctx.lineTo(58, 2 - gap / 2);
    ctx.lineTo(18, 5 - gap / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Beak nail / bean tip
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.ellipse(54, -1 - gap / 2, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower Bill
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(18, 0 + gap / 2);
    ctx.lineTo(52, 2 + gap / 2);
    ctx.lineTo(52, 6 + gap / 2);
    ctx.lineTo(18, 6 + gap / 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Draw the selected hat/accessory on the duck's head
  drawHat(duck.headX, duck.headY);

  // Crosshair guide at cursor
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(duck.targetX, duck.targetY, 9, 0, Math.PI * 2);
  ctx.moveTo(duck.targetX - 14, duck.targetY);
  ctx.lineTo(duck.targetX + 14, duck.targetY);
  ctx.moveTo(duck.targetX, duck.targetY - 14);
  ctx.lineTo(duck.targetX, duck.targetY + 14);
  ctx.stroke();
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  if (gameState === 'PLAYING') {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateUI();
      endGame();
    } else {
      updateUI();
    }

    flies.forEach(fly => fly.update());
    updateDuck(dt);

    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    floatingTexts.forEach(ft => ft.update());
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
  }

  // Draw Scene
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  flies.forEach(fly => fly.draw());
  drawDuck();
  particles.forEach(p => p.draw());
  floatingTexts.forEach(ft => ft.draw());

  requestAnimationFrame(gameLoop);
}

// Initial Fly spawn for title screen
spawnFlies();
requestAnimationFrame(gameLoop);
