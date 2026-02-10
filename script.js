document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Night Sky initialized.");

    // Add initial class to body for pink background
    document.body.classList.add('initial');

    const startBtn = document.getElementById('start-btn');
    const initialScreen = document.getElementById('initial-screen');
    const container = document.getElementById('container');
    const canvas = document.getElementById('treeCanvas');
    const messageCard = document.getElementById('message-card');
    const typewriterElement = document.getElementById('typewriter');
    const counterElement = document.getElementById('counter-content');
    const backgroundMusic = document.getElementById('background-music');

    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');

    // Night Sky Configuration
    const CONFIG = {
        flowers: {
            count: 8,
            stemColor: '#2d5016',
            leafColor: '#4caf50',
            petalColors: ['#ff1744', '#ff5177', '#ff8a9a', '#ff6b9d']
        },
        constellation: {
            starCount: 40,
            rotationSpeed: 0.0005,
            centerX: 0,
            centerY: 0,
            radius: 250
        },
        hearts: {
            spawnInterval: 800,
            lifetime: 10000,
            riseSpeed: 1.5,
            colors: ['#ff1744', '#ff5177', '#ff8a9a', '#ff6b9d']
        },
        photos: {
            count: 33,
            folder: 'img/',
            fadeInterval: 8000
        },
        growthSpeed: 2.5
    };

    let width, height;
    let stars = [];
    let hearts = [];
    let flowers = [];
    let shootingStars = [];
    let rotationAngle = 0;
    let animationTime = 0;
    let skyActive = false;
    let currentPhotoIndex = 0;
    let photoElement = null;
    let photoQueue = [];
    let photoQueueIndex = 0;

    // Romantic messages
    const ROMANTIC_MESSAGES = [
        "Te amo más cada día ❤️",
        "Eres mi persona favorita 💕",
        "Contigo todo es mejor ✨",
        "Mi corazón es tuyo 💖",
        "Eres mi hogar 🏡",
        "Me haces tan feliz 😊"
    ];

    // Resize Canvas with DPR Support
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;

        // Ajustar el tamaño del buffer del canvas
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Ajustar el tamaño visual mediante CSS
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Escalar todo el contexto de dibujo
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        CONFIG.constellation.centerX = width / 2;
        CONFIG.constellation.centerY = height / 2;
        console.log(`Canvas resized to ${width}x${height} (DPR: ${dpr})`);
    }
    window.addEventListener('resize', resize);
    resize();

    // Event Listeners
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log("Start button clicked.");

            // Reproducir música de fondo (aprovecha la interacción del usuario)
            if (backgroundMusic) {
                backgroundMusic.volume = 0.5; // Volumen al 50%
                backgroundMusic.play().then(() => {
                    console.log("🎵 Música iniciada");
                }).catch(error => {
                    console.log("No se pudo reproducir la música:", error);
                });
            }

            startDropAnimation();
        });
    }

    // Use pointerdown for better mobile responsiveness
    canvas.addEventListener('pointerdown', (e) => {
        if (!skyActive) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check flowers first with slightly larger hitbox for mobile
        const mobileHitboxBonus = 15;
        for (let i = flowers.length - 1; i >= 0; i--) {
            const flower = flowers[i];
            const dx = clickX - (flower.x + (Math.sin(animationTime * flower.swaySpeed + flower.swayOffset) * 8));
            const dy = clickY - (flower.baseY - flower.currentHeight);
            if (Math.sqrt(dx * dx + dy * dy) < (flower.petalSize * 1.5 + mobileHitboxBonus)) {
                flower.onClick();
                showMessagePopup(ROMANTIC_MESSAGES[Math.floor(Math.random() * ROMANTIC_MESSAGES.length)]);
                return;
            }
        }

        // Check stars with slightly larger hitbox
        for (let i = stars.length - 1; i >= 0; i--) {
            const star = stars[i];
            const dx = clickX - star.x;
            const dy = clickY - star.y;
            if (Math.sqrt(dx * dx + dy * dy) < (star.size * 3 + mobileHitboxBonus)) {
                star.onClick();
                showMessagePopup(ROMANTIC_MESSAGES[Math.floor(Math.random() * ROMANTIC_MESSAGES.length)]);
                return;
            }
        }
    });

    // Drop Animation
    function startDropAnimation() {
        const heartRect = startBtn.getBoundingClientRect();
        const startX = heartRect.left + heartRect.width / 2;
        const startY = heartRect.top + heartRect.height / 2;

        initialScreen.style.opacity = '0';

        // Remove initial class to start background transition to black
        setTimeout(() => {
            document.body.classList.remove('initial');
        }, 100);

        setTimeout(() => {
            initialScreen.style.display = 'none';
            container.style.display = 'block';
            container.style.opacity = '1';
            animateDrop(startX, startY);
        }, 300);
    }

    function animateDrop(startX, startY) {
        const targetY = height;
        const GRAVITY = 9.8;
        const PIXELS_PER_METER = 100;
        const FPS = 60;
        const GRAVITY_PX = (GRAVITY * PIXELS_PER_METER) / (FPS * FPS);

        let currentY = startY;
        let velocityY = 0;
        let frameCount = 0;
        const morphDuration = 20;
        const dropStartFrame = morphDuration + 10;

        function drawDrop() {
            frameCount++;

            let shape = 'heart';
            let morphProgress = 0;

            if (frameCount <= morphDuration) {
                morphProgress = frameCount / morphDuration;
                shape = 'morphing-to-circle';
            } else if (frameCount <= dropStartFrame) {
                shape = 'circle';
                morphProgress = 1;
            } else {
                shape = 'dropping';
                morphProgress = Math.min((frameCount - dropStartFrame) / 15, 1);
                velocityY += GRAVITY_PX;
                currentY += velocityY;
            }

            ctx.clearRect(0, 0, width, height);

            if (velocityY > 5) {
                ctx.globalAlpha = 0.2;
                for (let i = 1; i <= 3; i++) {
                    const trailY = currentY - velocityY * i * 0.5;
                    ctx.fillStyle = '#ff3366';
                    ctx.beginPath();
                    ctx.arc(startX, trailY, 12 - i * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            ctx.save();
            ctx.translate(startX, currentY);

            const size = 40;
            ctx.fillStyle = '#ff3366';
            ctx.shadowColor = 'rgba(255, 51, 102, 0.5)';
            ctx.shadowBlur = 15;
            ctx.beginPath();

            if (shape === 'morphing-to-circle') {
                const circleAmount = morphProgress;
                if (circleAmount < 0.5) {
                    const s = size;
                    const topCurveHeight = s * 0.3 * (1 - circleAmount);
                    ctx.moveTo(0, topCurveHeight);
                    ctx.bezierCurveTo(0, 0, -s * (1 - circleAmount * 0.5), 0, -s * (1 - circleAmount * 0.3), topCurveHeight);
                    ctx.bezierCurveTo(-s * (1 - circleAmount * 0.3), (s + topCurveHeight) / 2, 0, s + topCurveHeight, 0, s * 1.2);
                    ctx.bezierCurveTo(0, s + topCurveHeight, s * (1 - circleAmount * 0.3), (s + topCurveHeight) / 2, s * (1 - circleAmount * 0.3), topCurveHeight);
                    ctx.bezierCurveTo(s * (1 - circleAmount * 0.5), 0, 0, 0, 0, topCurveHeight);
                } else {
                    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
                }
            } else if (shape === 'circle') {
                ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
            } else if (shape === 'dropping') {
                const dropFactor = morphProgress;
                const w = size * 0.8 * (1 - dropFactor * 0.2);
                const h = size * 0.8 * (1 + dropFactor * 0.8);
                ctx.arc(0, -h / 3, w / 2, 0, Math.PI, true);
                ctx.quadraticCurveTo(-w / 2, h / 2, 0, h);
                ctx.quadraticCurveTo(w / 2, h / 2, w / 2, -h / 3);
            }

            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            if (currentY < targetY) {
                requestAnimationFrame(drawDrop);
            } else {
                // Animación de salpicadura
                animateSplash(startX, targetY);
            }
        }

        drawDrop();
    }

    // Splash Animation
    function animateSplash(x, y) {
        const splashParticles = [];
        const particleCount = 20;

        // Create splash particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 8 + Math.random() * 6;
            splashParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Slight upward bias
                gravity: 0.5,
                life: 1,
                decay: 0.02,
                size: 4 + Math.random() * 6,
                color: '#ff3366'
            });
        }

        let splashFrame = 0;
        const maxSplashFrames = 50;

        function drawSplash() {
            splashFrame++;
            ctx.clearRect(0, 0, width, height);

            // Draw splash particles
            splashParticles.forEach(p => {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                if (p.life > 0) {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });

            if (splashFrame < maxSplashFrames) {
                requestAnimationFrame(drawSplash);
            } else {
                setTimeout(() => {
                    initNightSky();
                }, 200);
            }
        }

        drawSplash();
    }

    // Shooting Star Class
    class ShootingStar {
        constructor() {
            // Start from random position on top edge (upper half only)
            const side = Math.random() < 0.5 ? 'left' : 'right';

            if (side === 'left') {
                this.x = 0;
                this.y = Math.random() * (height / 2);
                this.angle = Math.random() * Math.PI / 4 + Math.PI / 6; // 30-75 degrees
            } else {
                this.x = width;
                this.y = Math.random() * (height / 2);
                this.angle = Math.PI - (Math.random() * Math.PI / 4 + Math.PI / 6); // 105-150 degrees
            }

            this.speed = 8 + Math.random() * 4; // Fast speed
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.trail = [];
            this.trailLength = 20;
            this.life = 1;
            this.decay = 0.015;
            this.size = 3 + Math.random() * 2;
        }

        update() {
            // Add current position to trail
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }

            // Move
            this.x += this.vx;
            this.y += this.vy;

            // Fade out
            this.life -= this.decay;
        }

        draw(ctx) {
            if (this.life <= 0) return;

            ctx.save();

            // Draw trail (light streak)
            if (this.trail.length > 1) {
                for (let i = 0; i < this.trail.length - 1; i++) {
                    const point = this.trail[i];
                    const nextPoint = this.trail[i + 1];
                    const alpha = (i / this.trail.length) * this.life;

                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    ctx.lineWidth = this.size * (i / this.trail.length) * 2;
                    ctx.lineCap = 'round';

                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(nextPoint.x, nextPoint.y);
                    ctx.stroke();
                }
            }

            // Draw bright head with glow
            ctx.globalAlpha = this.life;

            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(150, 180, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
            ctx.fill();

            // Core white dot
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        isExpired() {
            return this.life <= 0 || this.x < -50 || this.x > width + 50 || this.y > height + 50;
        }
    }

    // Rotating White Star Class
    class RotatingStar {
        constructor(angle, distance) {
            this.baseAngle = angle;
            this.distance = distance;
            this.size = 3 + Math.random() * 4; // Smaller for sparkles
            this.baseSize = this.size;
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.03 + Math.random() * 0.03;
            this.brightness = 0.6 + Math.random() * 0.4;
            this.clickAnimation = 0;
            this.glowIntensity = 0;
        }

        update(time, rotationAngle) {
            this.currentAngle = this.baseAngle + rotationAngle;
            this.x = CONFIG.constellation.centerX + Math.cos(this.currentAngle) * this.distance;
            this.y = CONFIG.constellation.centerY + Math.sin(this.currentAngle) * this.distance;

            // Twinkling effect
            const pulse = Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.5;
            this.size = this.baseSize * (1 + pulse);

            if (this.clickAnimation > 0) {
                this.clickAnimation++;
                this.glowIntensity = Math.sin(this.clickAnimation * 0.2) * 0.8;
                if (this.clickAnimation > 30) {
                    this.clickAnimation = 0;
                    this.glowIntensity = 0;
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.brightness;

            if (this.glowIntensity > 0) {
                ctx.shadowColor = 'rgba(255, 255, 255, 1)';
                ctx.shadowBlur = 25 * this.glowIntensity;
            }

            // Draw white sparkle star
            const sparkleSize = this.size;

            // Core bright white
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, sparkleSize * 2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, sparkleSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // 4-point star rays
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';

            const rayLength = sparkleSize * 3;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i + (Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x + Math.cos(angle) * rayLength,
                    this.y + Math.sin(angle) * rayLength
                );
                ctx.stroke();
            }

            ctx.restore();
        }

        containsPoint(x, y) {
            const dx = x - this.x;
            const dy = y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < this.size * 3;
        }

        onClick() {
            this.clickAnimation = 1;
        }
    }

    // Ascending Heart Class
    class AscendingHeart {
        constructor() {
            this.x = Math.random() * width;
            this.y = height + 50;
            this.targetY = -100;
            this.size = 15 + Math.random() * 15;
            this.speed = CONFIG.hearts.riseSpeed + Math.random() * 0.8;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = 0.03 + Math.random() * 0.02;
            this.color = CONFIG.hearts.colors[Math.floor(Math.random() * CONFIG.hearts.colors.length)];
            this.spawnTime = Date.now();
            this.opacity = 0;
            this.fadeInDuration = 500;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        }

        update() {
            const elapsed = Date.now() - this.spawnTime;

            // Fade in
            if (elapsed < this.fadeInDuration) {
                this.opacity = elapsed / this.fadeInDuration;
            }
            // Full opacity
            else if (elapsed < CONFIG.hearts.lifetime - 1000) {
                this.opacity = 1;
            }
            // Fade out
            else {
                const fadeOutProgress = (elapsed - (CONFIG.hearts.lifetime - 1000)) / 1000;
                this.opacity = 1 - fadeOutProgress;
            }

            this.y -= this.speed;
            this.wobble += this.wobbleSpeed;
            this.rotation += this.rotationSpeed;
        }

        draw(ctx) {
            const wobbleX = Math.sin(this.wobble) * 20;

            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x + wobbleX, this.y);
            ctx.rotate(this.rotation);

            const s = this.size;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
            gradient.addColorStop(0, this.adjustColor(this.color, 60));
            gradient.addColorStop(0.7, this.color);
            gradient.addColorStop(1, this.adjustColor(this.color, -30));

            ctx.fillStyle = gradient;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(0, s * 0.8);
            ctx.bezierCurveTo(-s * 0.6, s * 0.4, -s, s * 0.1, -s * 0.5, -s * 0.3);
            ctx.bezierCurveTo(-s * 0.3, -s * 0.5, -s * 0.1, -s * 0.5, 0, -s * 0.35);
            ctx.bezierCurveTo(s * 0.1, -s * 0.5, s * 0.3, -s * 0.5, s * 0.5, -s * 0.3);
            ctx.bezierCurveTo(s, s * 0.1, s * 0.6, s * 0.4, 0, s * 0.8);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        adjustColor(hex, amount) {
            const num = parseInt(hex.slice(1), 16);
            const r = Math.min(255, Math.max(0, (num >> 16) + amount));
            const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
            const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
            return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
        }

        isExpired() {
            return Date.now() - this.spawnTime > CONFIG.hearts.lifetime;
        }
    }

    // Flower Class
    class Flower {
        constructor(x, baseY, height, petalCount) {
            this.x = x;
            this.baseY = baseY;
            this.targetHeight = height;
            this.currentHeight = 0;
            this.petalCount = petalCount;
            this.petalSize = 10 + Math.random() * 8;
            this.petalColor = CONFIG.flowers.petalColors[Math.floor(Math.random() * CONFIG.flowers.petalColors.length)];
            this.swayOffset = Math.random() * Math.PI * 2;
            this.swaySpeed = 0.02 + Math.random() * 0.01;
            this.leaves = [];
            this.clickAnimation = 0;
            this.isVisible = true;

            const leafCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < leafCount; i++) {
                this.leaves.push({
                    heightRatio: 0.3 + Math.random() * 0.4,
                    side: Math.random() < 0.5 ? -1 : 1,
                    size: 8 + Math.random() * 6
                });
            }
        }

        grow() {
            if (this.currentHeight < this.targetHeight) {
                this.currentHeight += CONFIG.growthSpeed;
                return true;
            }
            return false;
        }

        update(time) {
            if (this.clickAnimation > 0) {
                this.clickAnimation++;
                if (this.clickAnimation < 15) {
                    this.petalSize *= 0.9;
                } else if (this.clickAnimation < 45) {
                    this.isVisible = false;
                } else if (this.clickAnimation < 60) {
                    this.isVisible = true;
                    this.petalSize += 1.5;
                } else {
                    this.clickAnimation = 0;
                }
            }
        }

        draw(ctx, time) {
            if (!this.isVisible) return;

            const sway = Math.sin(time * this.swaySpeed + this.swayOffset) * 8;
            const tipX = this.x + sway;
            const tipY = this.baseY - this.currentHeight;

            ctx.strokeStyle = CONFIG.flowers.stemColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(this.x, this.baseY);

            const cp1x = this.x + sway * 0.3;
            const cp1y = this.baseY - this.currentHeight * 0.3;
            const cp2x = this.x + sway * 0.7;
            const cp2y = this.baseY - this.currentHeight * 0.7;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tipX, tipY);
            ctx.stroke();

            this.leaves.forEach(leaf => {
                const leafY = this.baseY - this.currentHeight * leaf.heightRatio;
                const leafX = this.x + sway * leaf.heightRatio + leaf.side * 12;

                ctx.fillStyle = CONFIG.flowers.leafColor;
                ctx.beginPath();
                ctx.ellipse(leafX, leafY, leaf.size, leaf.size * 0.6, Math.PI / 4 * leaf.side, 0, Math.PI * 2);
                ctx.fill();
            });

            if (this.currentHeight >= this.targetHeight * 0.7) {
                const bloomProgress = Math.min((this.currentHeight - this.targetHeight * 0.7) / (this.targetHeight * 0.3), 1);
                const currentPetalSize = this.petalSize * bloomProgress;

                for (let i = 0; i < this.petalCount; i++) {
                    const angle = (Math.PI * 2 / this.petalCount) * i;
                    const petalX = tipX + Math.cos(angle) * currentPetalSize * 0.5;
                    const petalY = tipY + Math.sin(angle) * currentPetalSize * 0.5;

                    ctx.save();
                    ctx.translate(petalX, petalY);
                    ctx.rotate(angle);

                    const s = currentPetalSize;
                    const gradient = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s);
                    gradient.addColorStop(0, this.adjustColor(this.petalColor, 40));
                    gradient.addColorStop(0.6, this.petalColor);
                    gradient.addColorStop(1, this.adjustColor(this.petalColor, -30));

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(0, s * 0.8);
                    ctx.bezierCurveTo(-s * 0.6, s * 0.4, -s, s * 0.1, -s * 0.5, -s * 0.3);
                    ctx.bezierCurveTo(-s * 0.3, -s * 0.5, -s * 0.1, -s * 0.5, 0, -s * 0.35);
                    ctx.bezierCurveTo(s * 0.1, -s * 0.5, s * 0.3, -s * 0.5, s * 0.5, -s * 0.3);
                    ctx.bezierCurveTo(s, s * 0.1, s * 0.6, s * 0.4, 0, s * 0.8);
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }

                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(tipX, tipY, currentPetalSize * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        adjustColor(hex, amount) {
            const num = parseInt(hex.slice(1), 16);
            const r = Math.min(255, Math.max(0, (num >> 16) + amount));
            const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
            const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
            return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
        }

        containsPoint(x, y) {
            const sway = Math.sin(animationTime * this.swaySpeed + this.swayOffset) * 8;
            const tipX = this.x + sway;
            const tipY = this.baseY - this.currentHeight;
            const dx = x - tipX;
            const dy = y - tipY;
            return Math.sqrt(dx * dx + dy * dy) < this.petalSize * 1.5;
        }

        onClick() {
            if (this.clickAnimation === 0) {
                this.clickAnimation = 1;
            }
        }
    }

    // Photo Carousel
    function createPhotoCarousel() {
        photoElement = document.createElement('img');
        photoElement.id = 'photo-carousel';
        photoElement.style.cssText = `
            position: fixed;
            top: calc(75% - 120px);
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 85vw;
            max-height: 40vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3);
            border: 3px solid rgba(255, 255, 255, 0.5);
            opacity: 0;
            transition: opacity 1s ease-in-out;
            z-index: 1;
        `;

        container.appendChild(photoElement);

        // Initialize shuffled photo queue
        shufflePhotoQueue();

        // Start photo rotation
        showNextPhoto();
        setInterval(showNextPhoto, CONFIG.photos.fadeInterval);
    }

    // Shuffle photo queue (Fisher-Yates algorithm)
    function shufflePhotoQueue() {
        // Create array with numbers 1 to 33
        photoQueue = [];
        for (let i = 1; i <= CONFIG.photos.count; i++) {
            photoQueue.push(i);
        }

        // Shuffle the array
        for (let i = photoQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [photoQueue[i], photoQueue[j]] = [photoQueue[j], photoQueue[i]];
        }

        photoQueueIndex = 0;
        console.log('Photo queue shuffled:', photoQueue);
    }

    function showNextPhoto() {
        // Check if we need to reshuffle
        if (photoQueueIndex >= photoQueue.length) {
            console.log('All 33 photos shown! Reshuffling...');
            shufflePhotoQueue();
        }

        // Get next photo from shuffled queue
        currentPhotoIndex = photoQueue[photoQueueIndex];
        photoQueueIndex++;

        // Array of available animations
        const animations = ['fade', 'slide', 'kenburns', 'scalefade', 'crossfade', 'heart', 'bounce'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

        console.log(`Showing photo ${currentPhotoIndex} (${photoQueueIndex}/${CONFIG.photos.count}) with animation: ${randomAnimation}`);

        const newSrc = `${CONFIG.photos.folder}1 (${currentPhotoIndex}).jpeg`;

        // Execute selected animation
        switch (randomAnimation) {
            case 'fade':
                animateFade(newSrc);
                break;
            case 'slide':
                animateSlide(newSrc);
                break;
            case 'kenburns':
                animateKenBurns(newSrc);
                break;
            case 'scalefade':
                animateScaleFade(newSrc);
                break;
            case 'crossfade':
                animateCrossfade(newSrc);
                break;
            case 'heart':
                animateHeartReveal(newSrc);
                break;
            case 'bounce':
                animateBounce(newSrc);
                break;
        }
    }

    // Animation 1: Fade
    function animateFade(newSrc) {
        photoElement.style.transition = 'opacity 1s ease-in-out';
        photoElement.style.opacity = '0';

        setTimeout(() => {
            photoElement.src = newSrc;
            photoElement.onload = () => {
                photoElement.style.opacity = '1';
            };
        }, 1000);
    }

    // Animation 2: Slide (random direction)
    function animateSlide(newSrc) {
        const directions = ['translateX(-150%)', 'translateX(150%)', 'translateY(-150%)', 'translateY(150%)'];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];

        photoElement.style.transition = 'transform 0.8s ease-in-out, opacity 0.8s';
        photoElement.style.transform = `translate(-50%, -50%) ${randomDir}`;
        photoElement.style.opacity = '0';

        setTimeout(() => {
            photoElement.src = newSrc;
            photoElement.onload = () => {
                photoElement.style.transform = 'translate(-50%, -50%)';
                photoElement.style.opacity = '1';
            };
        }, 800);
    }

    // Animation 3: Ken Burns (zoom + pan)
    function animateKenBurns(newSrc) {
        photoElement.style.transition = 'opacity 1s';
        photoElement.style.opacity = '0';

        setTimeout(() => {
            photoElement.src = newSrc;
            photoElement.onload = () => {
                photoElement.style.opacity = '1';
                photoElement.style.transition = 'transform 8s ease-in-out';

                const scale = 1 + Math.random() * 0.2;
                const translateX = (Math.random() - 0.5) * 20;
                const translateY = (Math.random() - 0.5) * 20;

                photoElement.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;

                setTimeout(() => {
                    photoElement.style.transition = 'transform 0.5s';
                    photoElement.style.transform = 'translate(-50%, -50%) scale(1)';
                }, CONFIG.photos.fadeInterval - 1000);
            };
        }, 1000);
    }

    // Animation 4: Scale + Fade
    function animateScaleFade(newSrc) {
        photoElement.style.transition = 'transform 0.8s ease-out, opacity 0.8s';
        photoElement.style.transform = 'translate(-50%, -50%) scale(0.5)';
        photoElement.style.opacity = '0';

        setTimeout(() => {
            photoElement.src = newSrc;
            photoElement.onload = () => {
                photoElement.style.transform = 'translate(-50%, -50%) scale(1)';
                photoElement.style.opacity = '1';
            };
        }, 800);
    }

    // Animation 5: Crossfade (overlay)
    function animateCrossfade(newSrc) {
        const newPhoto = document.createElement('img');
        newPhoto.src = newSrc;
        newPhoto.style.cssText = photoElement.style.cssText;
        newPhoto.style.opacity = '0';
        newPhoto.style.zIndex = '2';

        container.appendChild(newPhoto);

        newPhoto.onload = () => {
            newPhoto.style.transition = 'opacity 1.5s ease-in-out';
            newPhoto.style.opacity = '1';

            setTimeout(() => {
                photoElement.src = newSrc;
                container.removeChild(newPhoto);
            }, 1500);
        };
    }

    // Animation 6: Heart Shape Reveal
    function animateHeartReveal(newSrc) {
        photoElement.style.transition = 'clip-path 1.2s ease-out, opacity 0.5s';
        photoElement.style.clipPath = 'circle(0% at 50% 50%)';
        photoElement.style.opacity = '0';

        setTimeout(() => {
            photoElement.src = newSrc;
            photoElement.onload = () => {
                photoElement.style.opacity = '1';
                photoElement.style.clipPath = 'circle(70% at 50% 50%)';

                setTimeout(() => {
                    photoElement.style.clipPath = 'none';
                }, 1200);
            };
        }, 500);
    }

    // Animation 7: Bounce
    function animateBounce(newSrc) {
        photoElement.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.6s';
        photoElement.style.transform = 'translate(-50%, -150%) scale(0.3)';
        photoElement.style.opacity = '0';

        setTimeout(() => {
            photoElement.src = newSrc;
            photoElement.onload = () => {
                photoElement.style.transform = 'translate(-50%, -50%) scale(1)';
                photoElement.style.opacity = '1';
            };
        }, 600);
    }

    // Initialize Night Sky
    function initNightSky() {
        console.log("=== INIT NIGHT SKY ===");

        // Create rotating constellation
        for (let i = 0; i < CONFIG.constellation.starCount; i++) {
            const angle = (Math.PI * 2 / CONFIG.constellation.starCount) * i;
            const distance = CONFIG.constellation.radius + (Math.random() - 0.5) * 80;
            stars.push(new RotatingStar(angle, distance));
        }

        // Create flowers
        const flowerSpacing = width / (CONFIG.flowers.count + 1);
        for (let i = 0; i < CONFIG.flowers.count; i++) {
            const x = flowerSpacing * (i + 1) + (Math.random() - 0.5) * 40;
            const flowerHeight = 120 + Math.random() * 100;
            const petalCount = 5 + Math.floor(Math.random() * 3);
            flowers.push(new Flower(x, height, flowerHeight, petalCount));
        }

        // Create photo carousel
        createPhotoCarousel();

        // Start heart spawning
        setInterval(() => {
            hearts.push(new AscendingHeart());
        }, CONFIG.hearts.spawnInterval);

        // Start shooting star spawning (every 3 seconds)
        setInterval(() => {
            shootingStars.push(new ShootingStar());
        }, 3000);

        skyActive = true;
        animateNightSky();
        showMessage();
    }

    // Animate Night Sky
    function animateNightSky() {
        animationTime += 0.01;
        rotationAngle += CONFIG.constellation.rotationSpeed;

        ctx.clearRect(0, 0, width, height);

        // Draw constellation connections
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < stars.length; i++) {
            const nextIndex = (i + 1) % stars.length;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[nextIndex].x, stars[nextIndex].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Update and draw stars
        stars.forEach(star => {
            star.update(animationTime, rotationAngle);
            star.draw(ctx);
        });

        // Update and draw shooting stars
        shootingStars = shootingStars.filter(star => !star.isExpired());
        shootingStars.forEach(star => {
            star.update();
            star.draw(ctx);
        });

        // Update and draw ascending hearts
        hearts = hearts.filter(heart => !heart.isExpired());
        hearts.forEach(heart => {
            heart.update();
            heart.draw(ctx);
        });

        // Grow and draw flowers
        flowers.forEach(flower => {
            flower.grow();
            flower.update(animationTime);
            flower.draw(ctx, animationTime);
        });

        requestAnimationFrame(animateNightSky);
    }

    // Message Popup
    function showMessagePopup(message) {
        let popup = document.createElement('div');
        popup.className = 'message-popup';
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => popup.classList.add('show'), 10);

        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 400);
        }, 2500);
    }

    // UI & Typewriter - Multiple messages in rotation
    const messages = [
        "Para el amor de mi vida: Si pudiera elegir un lugar seguro, sería a tu lado. Cuanto más tiempo estoy contigo, más te amo.",
        "Cada momento contigo es un regalo. Eres mi hogar, mi refugio, y la razón por la que sonrío cada día sin pensarlo.",
        "Tu amor es la melodía que llena mi vida de alegría. Cada día a tu lado es una nueva aventura que nunca quiero terminar.",
        "Contigo he descubierto que el amor verdadero existe. Gracias por ser mi compañera, mi mejor amiga, mi todo en este mundo.",
        "Eres la luz que ilumina mis días oscuros. Tu sonrisa es mi motivación diaria y tu abrazo mi lugar favorito en el universo.",
        "No imaginaba que alguien podría hacerme tan feliz. Gracias por existir, por amarme, y por elegirme cada día como tu pareja.",
        "En tus ojos encuentro paz, en tus brazos encuentro hogar. Eres el amor que siempre soñé pero nunca creí que encontraría.",
        "Cada segundo a tu lado vale más que mil vidas sin ti. Eres mi presente perfecto y mi futuro más hermoso imaginado.",
        "Tu risa es mi canción favorita, tu voz mi melodía preferida. Contigo he aprendido que el amor verdadero no es un cuento.",
        "Gracias por amarme en mis mejores y peores momentos. Eres mi inspiración, mi fuerza, y la razón por la que creo en nosotros.",
        "Contigo todo tiene sentido, todo es más bonito. Eres mi complemento perfecto y la mejor decisión que he tomado en mi vida.",
        "Eres mi persona favorita en todo el mundo. Contigo he encontrado un amor tan puro que me hace creer en los finales felices.",
        "Cada beso tuyo es una promesa de amor eterno. Cada abrazo es un recordatorio de que juntos podemos conquistar cualquier cosa.",
        "No necesito el paraíso porque ya lo encontré en tus brazos. Eres mi cielo, mi tierra, mi razón de ser más pura.",
        "Te amo más allá de las palabras, más profundo que el océano. Eres mi hoy, mi mañana, y todos mis siempres juntos."
    ];

    let currentMessageIndex = 0;
    let messageInterval = null;
    let counterStarted = false;

    function showMessage() {
        if (messageCard) messageCard.classList.add('visible');

        // Show first message
        typeMessage(messages[currentMessageIndex]);

        // Start rotating messages every 10 seconds
        messageInterval = setInterval(() => {
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
            typeMessage(messages[currentMessageIndex]);
        }, 10000); // 10 seconds
    }

    function typeMessage(message) {
        if (!typewriterElement) return;

        // Clear current text
        typewriterElement.textContent = '';

        let i = 0;
        function type() {
            if (typewriterElement && i < message.length) {
                typewriterElement.textContent += message.charAt(i);
                i++;
                setTimeout(type, 40);
            } else if (!counterStarted) {
                // Only start counter once, after first message
                counterStarted = true;
                updateCounter();
                setInterval(updateCounter, 1000);
            }
        }
        type();
    }

    // Counter
    const startDate = new Date('2025-07-06T22:15:00');

    function updateCounter() {
        if (!counterElement) return;

        const now = new Date();
        const diff = now - startDate;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        counterElement.innerHTML = `
            <span class="counter-value">${days} Días</span>
            <span class="counter-value">${hours} Hrs ${minutes} Min ${seconds} Seg</span>
        `;
    }

}); // End DOMContentLoaded
