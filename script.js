// PetMatch Playground Engine

// Global State & Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let soundEnabled = true;
let selectedToyType = 'ball';
let audioCtx = null;

// Adjust Canvas Resolution
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Web Audio Sound Synthesizer ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'bark') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    } else if (type === 'meow') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(750, now + 0.15);
        osc.frequency.linearRampToValueAtTime(350, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'squeak') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'pop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }
}

// --- Toy Definitions ---
const TOY_DATA = {
    ball: { emoji: '🎾', bounce: 0.75, favBy: 'dog' },
    bone: { emoji: '🦴', bounce: 0.3, favBy: 'dog' },
    duck: { emoji: '🦆', bounce: 0.5, favBy: 'dog' },
    yarn: { emoji: '🧶', bounce: 0.6, favBy: 'cat' },
    feather: { emoji: '🪶', bounce: 0.2, favBy: 'cat' },
    mouse: { emoji: '🐭', bounce: 0.4, favBy: 'cat' },
    treat: { emoji: '🥩', bounce: 0.3, favBy: 'both' }
};

// --- Entities Array ---
const toys = [];
const particles = [];

// Particle Engine
class Particle {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.vy = -1.5 - Math.random();
        this.vx = (Math.random() - 0.5) * 1.5;
        this.alpha = 1;
        this.life = 40 + Math.random() * 20;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 1 / this.life;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.font = '16px sans-serif';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// Toy Class
class Toy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const config = TOY_DATA[type] || TOY_DATA.ball;
        this.emoji = config.emoji;
        this.bounce = config.bounce;
        this.favBy = config.favBy;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = -4 - Math.random() * 4;
        this.radius = 16;
        this.rotation = 0;
        this.vRot = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.vy += 0.3; // Gravity
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.vRot;

        // Friction
        this.vx *= 0.98;

        // Bounce Floor
        if (this.y + this.radius > canvas.height - 10) {
            this.y = canvas.height - 10 - this.radius;
            this.vy = -this.vy * this.bounce;
            if (Math.abs(this.vy) < 1) this.vy = 0;
            if (Math.abs(this.vy) > 2) playSound('squeak');
        }

        // Walls
        if (this.x - this.radius < 10) {
            this.x = 10 + this.radius;
            this.vx = -this.vx * 0.8;
        }
        if (this.x + this.radius > canvas.width - 10) {
            this.x = canvas.width - 10 - this.radius;
            this.vx = -this.vx * 0.8;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

// Pet Class
class Pet {
    constructor(type, name, x, y, primaryColor, secondaryColor) {
        this.type = type; // 'dog' or 'cat'
        this.name = name;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.vx = 0;
        this.vy = 0;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.joy = 30;
        this.status = 'Wandering peacefully';
        this.facing = 1; // 1 right, -1 left
        this.tailAngle = 0;
        this.animTimer = 0;
        this.playingToy = null;
    }

    update() {
        this.animTimer += 0.1;
        this.tailAngle = Math.sin(this.animTimer * 2) * 0.4;

        // Find nearest matching toy or any toy
        let targetToy = null;
        let minDist = 9999;

        toys.forEach(toy => {
            const dist = Math.hypot(toy.x - this.x, toy.y - this.y);
            if (dist < minDist) {
                if (toy.favBy === this.type || toy.favBy === 'both' || Math.random() < 0.3) {
                    minDist = dist;
                    targetToy = toy;
                }
            }
        });

        if (targetToy) {
            this.targetX = targetToy.x;
            this.targetY = targetToy.y;
            this.status = `Chasing ${TOY_DATA[targetToy.type]?.emoji || 'toy'}!`;

            // Play Interaction
            if (minDist < 30) {
                this.joy = Math.min(100, this.joy + 0.4);
                targetToy.vx += (Math.random() - 0.5) * 4;
                targetToy.vy -= 1 + Math.random() * 2;

                if (Math.random() < 0.05) {
                    playSound(this.type === 'dog' ? 'bark' : 'meow');
                    particles.push(new Particle(this.x, this.y - 20, this.type === 'dog' ? '❤️' : '✨'));
                }
            }
        } else {
            // Idle wander
            if (Math.random() < 0.02) {
                this.targetX = 50 + Math.random() * (canvas.width - 100);
                this.targetY = canvas.height - 35;
                this.status = 'Looking for toys...';
            }
        }

        // Move towards target
        const dx = this.targetX - this.x;
        const speed = this.type === 'dog' ? 3.5 : 4.0;

        if (Math.abs(dx) > 5) {
            this.vx = Math.sign(dx) * speed;
            this.facing = Math.sign(dx);
        } else {
            this.vx = 0;
        }

        this.x += this.vx;

        // Floor constraint
        this.y = canvas.height - 35;

        // Update Status UI
        this.updateUI();
    }

    updateUI() {
        if (this.type === 'dog') {
            document.getElementById('dogJoyFill').style.width = `${this.joy}%`;
            document.getElementById('dogJoyText').innerText = `Joy: ${Math.floor(this.joy)}%`;
            document.getElementById('dogStatus').innerText = this.status;
        } else {
            document.getElementById('catJoyFill').style.width = `${this.joy}%`;
            document.getElementById('catJoyText').innerText = `Joy: ${Math.floor(this.joy)}%`;
            document.getElementById('catStatus').innerText = this.status;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1);

        if (this.type === 'dog') {
            // --- DRAW DOG (Buddy) ---
            // Tail
            ctx.strokeStyle = this.primaryColor;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-18, -10);
            ctx.quadraticCurveTo(-28, -25 + Math.sin(this.animTimer * 5) * 8, -22, -30);
            ctx.stroke();

            // Body
            ctx.fillStyle = this.primaryColor;
            ctx.beginPath();
            ctx.ellipse(0, -10, 22, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.beginPath();
            ctx.arc(16, -22, 14, 0, Math.PI * 2);
            ctx.fill();

            // Floppy Ear
            ctx.fillStyle = this.secondaryColor;
            ctx.beginPath();
            ctx.ellipse(10, -20, 5, 11, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Eyes & Snout
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.arc(20, -24, 2.5, 0, Math.PI * 2); // Eye
            ctx.arc(26, -20, 3, 0, Math.PI * 2);   // Nose
            ctx.fill();

            // Happy Tongue
            ctx.fillStyle = '#FF7B7B';
            ctx.beginPath();
            ctx.arc(23, -15, 3, 0, Math.PI);
            ctx.fill();

            // Legs
            ctx.fillStyle = this.secondaryColor;
            const legBounce = Math.sin(this.animTimer * 6) * (this.vx !== 0 ? 4 : 0);
            ctx.fillRect(-12, -2, 6, 12 + legBounce);
            ctx.fillRect(-2, -2, 6, 12 - legBounce);
            ctx.fillRect(8, -2, 6, 12 + legBounce);
            ctx.fillRect(16, -2, 6, 12 - legBounce);

        } else {
            // --- DRAW CAT (Milo) ---
            // Tail
            ctx.strokeStyle = this.secondaryColor;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-16, -10);
            ctx.quadraticCurveTo(-26, -30 + Math.sin(this.animTimer * 3) * 6, -18, -32);
            ctx.stroke();

            // Body
            ctx.fillStyle = this.primaryColor;
            ctx.beginPath();
            ctx.ellipse(0, -10, 18, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.beginPath();
            ctx.arc(14, -22, 11, 0, Math.PI * 2);
            ctx.fill();

            // Pointy Ears
            ctx.fillStyle = this.secondaryColor;
            ctx.beginPath();
            ctx.moveTo(10, -28); ctx.lineTo(13, -37); ctx.lineTo(17, -29); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(17, -28); ctx.lineTo(21, -36); ctx.lineTo(24, -27); ctx.fill();

            // Bright Eyes
            ctx.fillStyle = '#A8E6CF';
            ctx.beginPath();
            ctx.arc(17, -23, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.arc(17, -23, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Whiskers
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(22, -20); ctx.lineTo(30, -22);
            ctx.moveTo(22, -19); ctx.lineTo(29, -17);
            ctx.stroke();

            // Legs
            ctx.fillStyle = this.primaryColor;
            const legBounce = Math.sin(this.animTimer * 7) * (this.vx !== 0 ? 3 : 0);
            ctx.fillRect(-10, -2, 5, 12 + legBounce);
            ctx.fillRect(-2, -2, 5, 12 - legBounce);
            ctx.fillRect(8, -2, 5, 12 + legBounce);
            ctx.fillRect(14, -2, 5, 12 - legBounce);
        }

        ctx.restore();
    }
}

// Instantiate Pets
const dog = new Pet('dog', 'Buddy', 120, 0, '#E09F3E', '#9E5A23');
const cat = new Pet('cat', 'Milo', 400, 0, '#313A70', '#C9888F');

// --- User Interaction Listeners ---

// Canvas Click to Spawn Selected Toy
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    toys.push(new Toy(x, y, selectedToyType));
    playSound('pop');

    particles.push(new Particle(x, y - 10, '✨'));

    // Hide overlay hint on first drop
    document.getElementById('canvasHint').style.opacity = '0';
});

// Toy Selection Buttons
document.querySelectorAll('.toy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.toy-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        selectedToyType = targetBtn.dataset.toy;
    });
});

// Treat Bag Action Button
document.getElementById('treatBtn').addEventListener('click', () => {
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const rx = 100 + Math.random() * (canvas.width - 200);
            toys.push(new Toy(rx, 40, 'treat'));
            playSound('pop');
        }, i * 120);
    }
});

// Clear Playground
document.getElementById('clearBtn').addEventListener('click', () => {
    toys.length = 0;
    particles.length = 0;
    dog.joy = 30;
    cat.joy = 30;
});

// Mute Toggle
document.getElementById('soundToggleBtn').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('soundIcon').innerText = soundEnabled ? '🔊' : '🔇';
    document.getElementById('soundToggleBtn').contents = soundEnabled ? 'Sound On' : 'Sound Off';
});

// --- Main Game Loop ---
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grass Floor Detail
    ctx.fillStyle = '#C2E0B4';
    ctx.fillRect(0, canvas.height - 12, canvas.width, 12);

    // Update & Draw Toys
    for (let i = toys.length - 1; i >= 0; i--) {
        toys[i].update();
        toys[i].draw();
    }

    // Update & Draw Pets
    dog.update();
    dog.draw();

    cat.update();
    cat.draw();

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(animate);
}

// Start Game Loop
animate();
