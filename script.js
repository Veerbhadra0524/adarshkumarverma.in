/**
 * Evolution of a Saint - Performance & Legibility Optimized Engine
 * Includes Viewport Culling, Event Throttling, and Hard-Capped Particle Limits
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Canvas Context & Sizing
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: No transparency on main canvas
    let width, height;

    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // 2. State & Throttling
    const mouse = { x: -2000, y: -2000, active: false };
    let currentZone = 'veerbhadra';
    let jataStrikeActive = false;
    let jataStrikeProgress = 0;
    let sanjeevaniActive = false;
    let kodandaActive = false;
    let kodandaProgress = 0;
    let isFrozen = false;
    let scrollY = window.pageYOffset;

    // Throttle interaction events
    let ticking = false;
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }, { passive: true });

    window.addEventListener('scroll', () => {
        scrollY = window.pageYOffset;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // 3. Particle System (Optimized & Capped)
    const MAX_PARTICLES = 600;

    class Particle {
        constructor(type = 'ember') {
            this.type = type;
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 2 + 1;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.color = '#ff4500';
            this.targetX = null;
            this.targetY = null;
            this.dead = false;
        }

        update() {
            if (isFrozen) return;

            // Physics logic
            if (this.type === 'ember' || this.type === 'ash') {
                if (this.type === 'ember') {
                    this.vy -= 0.08;
                    this.vx += (Math.random() - 0.5) * 0.1;
                    this.color = '#ff4500';
                } else {
                    this.vy += 0.2; // Falling ash
                    this.vx *= 0.95;
                    this.color = '#333';
                    this.alpha *= 0.98;
                    if (this.alpha < 0.05) this.dead = true;
                }
            } else if (this.type === 'sanjeevani') {
                this.vx -= 2;
                this.color = '#00ffaa';
                if (this.x < -10) this.dead = true;
            } else if (this.type === 'ram') {
                this.color = '#ffcc66';
                if (this.targetX !== null) {
                    this.x += (this.targetX - this.x) * 0.05;
                    this.y += (this.targetY - this.y) * 0.05;
                    return; // Bypass normal physics for climax
                }
            }

            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.97;
            this.vy *= 0.97;

            // Boundary wrap
            if (this.type === 'ember') {
                if (this.y < -50) this.y = height + 10;
                if (this.x < -50) this.x = width;
                if (this.x > width + 50) this.x = 0;
            }
        }

        draw() {
            // VIEWPORT CULLING
            if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) return;

            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.globalCompositeOperation = (this.type === 'ember' || this.type === 'sanjeevani') ? 'lighter' : 'source-over';

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    let particles = Array.from({ length: 300 }, () => new Particle());

    // 4. VFX Orchestration
    const drawJataStrike = (progress) => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255, 69, 0, ${1 - progress})`;
        ctx.lineWidth = 15;
        ctx.beginPath();
        let cy = 0; let cx = width / 2;
        ctx.moveTo(cx, cy);
        while (cy < height) {
            cy += 30; cx += (Math.random() - 0.5) * 150;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
    };

    const drawKodandaBow = (progress) => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255, 204, 102, ${1 - progress})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height * 1.5, height * 0.8, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.restore();
    };

    // 5. Main Loop
    const loop = () => {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // Manage particle count
        if (sanjeevaniActive && particles.length < MAX_PARTICLES && Math.random() < 0.4) {
            particles.push(new Particle('sanjeevani'));
            particles[particles.length - 1].x = width + 20;
            particles[particles.length - 1].y = Math.random() * height;
        }

        // Collision logic
        if (sanjeevaniActive) {
            for (let i = 0; i < particles.length; i++) {
                if (particles[i].type === 'sanjeevani') {
                    for (let j = 0; j < particles.length; j++) {
                        if (particles[j].type === 'ember') {
                            const dx = particles[i].x - particles[j].x;
                            const dy = particles[i].y - particles[j].y;
                            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                                particles[j].type = 'ash';
                                particles[i].dead = true;
                            }
                        }
                    }
                }
            }
        }

        particles = particles.filter(p => !p.dead);
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        if (jataStrikeActive && jataStrikeProgress < 1) {
            drawJataStrike(jataStrikeProgress);
            jataStrikeProgress += 0.04;
        }

        if (kodandaActive && kodandaProgress < 1) {
            drawKodandaBow(kodandaProgress);
            kodandaProgress += 0.015;
            if (kodandaProgress > 0.6) isFrozen = true;
        }

        requestAnimationFrame(loop);
    };
    loop();

    // 6. Navigation Intersection Observers
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                const zone = entry.target.dataset.zone;
                if (zone) currentZone = zone;

                if (entry.target.id === 'jata-trigger' && !jataStrikeActive) {
                    jataStrikeActive = true;
                    for (let i = 0; i < 200; i++) {
                        const p = new Particle('ember');
                        p.x = width / 2; p.y = height / 3;
                        p.vx = (Math.random() - 0.5) * 12;
                        p.vy = (Math.random() - 0.5) * 12;
                        particles.push(p);
                    }
                }

                if (entry.target.id === 'sanjeevani-trigger') {
                    sanjeevaniActive = true;
                    document.documentElement.style.setProperty('--hriday-opacity', '1');
                }
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fragment').forEach(f => observer.observe(f));

    // Climax Logic
    const lotus = document.getElementById('final-lotus');
    const climaxObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !kodandaActive) {
            kodandaActive = true;
            setTimeout(() => {
                lotus.classList.add('bloom');
                particles.forEach(p => {
                    p.type = 'ram';
                    p.alpha = 0.8;
                });
                particles.forEach((p, i) => {
                    const row = Math.floor(i / 20);
                    const col = i % 20;
                    p.targetX = width / 2 + (col - 10) * 14;
                    p.targetY = height / 2 + (row - 10) * 14;
                });
            }, 2500);
        }
    }, { threshold: 0.7 });

    const footer = document.querySelector('.footer');
    if (footer) climaxObserver.observe(footer);

    // 7. Sacred UI Logic (Fissure & Jiva)
    const fissureMagma = document.getElementById('fissure-magma');
    const jivaCore = document.getElementById('jiva-core');
    const jivaAura = document.getElementById('jiva-aura');
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;

    if (isTouch) {
        document.body.classList.add('touch-device');
        if (jivaCore) jivaCore.style.display = 'none';
        if (jivaAura) jivaAura.style.display = 'none';
    }

    // Japa Layer Shuffle & Velocity Logic
    const japaContainer = document.getElementById('japa-container');
    const japaVeerbhadra = document.getElementById('japa-veerbhadra');
    const japaHanuman = document.getElementById('japa-hanuman');
    const japaRam = document.getElementById('japa-ram');

    if (japaContainer) {
        const layers = Array.from(japaContainer.children);
        // Shuffle DOM order for dual layers
        if (Math.random() > 0.5) {
            japaContainer.appendChild(layers[0]);
        }
    }

    // Smooth Cursor Physics (LERP)
    let auraX = 0, auraY = 0;
    let targetX = 0, targetY = 0;
    let magmaLerpHeight = 0; // NEW: Magma viscosity
    let hasMoved = false;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!hasMoved) {
            hasMoved = true;
            if (jivaCore) jivaCore.style.opacity = '1';
            if (jivaAura) jivaAura.style.opacity = '1';
            auraX = targetX;
            auraY = targetY;
        }
        if (jivaCore) jivaCore.style.transform = `translate(${targetX - 2}px, ${targetY - 2}px)`;
    }, { passive: true });

    // --- SACRED SIDEBAR ENGINE ---
    const sidebarTrigger = document.getElementById('sidebar-trigger');
    const sacredSidebar = document.getElementById('sacred-sidebar');
    const symbolContainers = document.querySelectorAll('.symbol-container');

    if (sidebarTrigger && sacredSidebar) {
        sidebarTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarTrigger.classList.toggle('active');
            sacredSidebar.classList.toggle('active');
        });

        // Symbol Click -> Scroll to Zone (Optional UX enhancement)
        symbolContainers.forEach(container => {
            container.addEventListener('click', () => {
                const zone = container.dataset.zone;
                const triggerId = zone === 'veerbhadra' ? 'jata-trigger' : zone === 'hanuman' ? 'sanjeevani-trigger' : 'kodanda-trigger';
                const target = document.getElementById(triggerId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    sidebarTrigger.classList.remove('active');
                    sacredSidebar.classList.remove('active');
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!sacredSidebar.contains(e.target) && !sidebarTrigger.contains(e.target)) {
                sidebarTrigger.classList.remove('active');
                sacredSidebar.classList.remove('active');
            }
        });
    }

    const updateSidebarInteractions = (mX, mY) => {
        if (!sacredSidebar) return;

        // 1. Proximity Hum Detect
        const rect = sacredSidebar.getBoundingClientRect();
        const sidebarVisibleX = sacredSidebar.classList.contains('active') ? rect.right : rect.left + 40; // Detection zone
        const dist = Math.abs(mX - sidebarVisibleX);

        if (dist < 100) {
            sacredSidebar.classList.add('near-jiva');
        } else {
            sacredSidebar.classList.remove('near-jiva');
        }

        // 2. Symbol Ignition Sync
        symbolContainers.forEach(container => {
            if (container.dataset.zone === currentZone) {
                container.classList.add('ignited');
            } else {
                container.classList.remove('ignited');
            }
        });
    };
    // ---------------------------------

    const updateSacredUI = () => {
        // Weighted Aura Follow (LERP)
        auraX += (targetX - auraX) * 0.08;
        auraY += (targetY - auraY) * 0.08;
        if (jivaAura) jivaAura.style.transform = `translate(${auraX - 15}px, ${auraY - 15}px)`;

        // Veerbhadra Fissure Progress
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = maxScroll <= 0 ? 0 : (window.scrollY / maxScroll) * 100;

        // Sync Current Zone to Body for CSS targeting
        document.body.setAttribute('data-zone', currentZone);

        // Internal Japa Parallax & Opacity (High Velocity)
        const japaDrift = window.scrollY * 0.2; // High velocity for periodic feel

        if (japaVeerbhadra) {
            japaVeerbhadra.style.opacity = currentZone === 'veerbhadra' ? '0.15' : '0';
            japaVeerbhadra.style.transform = `rotate(-5deg) translateY(${-japaDrift}px)`;
        }
        if (japaHanuman) {
            japaHanuman.style.opacity = currentZone === 'hanuman' ? '0.18' : '0';
            japaHanuman.style.transform = `translateY(${-japaDrift * 1.5}px)`;
        }
        if (japaRam) {
            japaRam.style.opacity = currentZone === 'ram' ? '0.25' : '0';
            // Supreme Stillness for Ram, but offset for variety
            japaRam.style.transform = `translateY(0)`;
        }

        if (fissureMagma) {
            // Apply Viscous LERP for molten realism
            const targetHeight = Math.max(1, scrollPercent);
            magmaLerpHeight += (targetHeight - magmaLerpHeight) * 0.15;
            fissureMagma.style.height = `${magmaLerpHeight}%`;

            // Zone-Responsive Fissure & Aura Styling
            if (currentZone === 'veerbhadra') {
                if (jivaAura) {
                    jivaAura.style.boxShadow = '0 0 15px #ff4500, 0 0 25px #8b0000';
                    jivaAura.style.background = 'rgba(255, 69, 0, 0.15)';
                }
            } else if (currentZone === 'hanuman') {
                if (jivaAura) {
                    jivaAura.style.boxShadow = '0 0 20px #ffb300, 0 0 30px #e65100';
                    jivaAura.style.background = 'rgba(255, 179, 0, 0.15)';
                }
            } else if (currentZone === 'ram') {
                if (jivaAura) {
                    jivaAura.style.boxShadow = '0 0 20px #fff, 0 0 40px #ffcc66';
                    jivaAura.style.background = 'rgba(255, 255, 255, 0.2)';
                }
            }
        }

        updateSidebarInteractions(targetX, targetY);

        requestAnimationFrame(updateSacredUI);
    };
    updateSacredUI();
});
