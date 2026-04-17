// ===== Landing Page — RailAssist AI =====
// Particle system, scroll reveals, route animation, page transition

(function () {
  'use strict';

  // ===== Particle Canvas =====
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;
  let mouseX = 0, mouseY = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.hue = Math.random() * 60 + 10; // warm tones
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Subtle mouse influence
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        this.x -= dx * 0.002;
        this.y -= dy * 0.002;
      }

      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.opacity})`;
      ctx.fill();
    }
  }

  function initParticles() {
    const count = Math.min(80, Math.floor(window.innerWidth / 15));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animFrame = requestAnimationFrame(animateParticles);
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  initParticles();
  animateParticles();

  // ===== Scroll-based Feature Card Reveal =====
  const featureCards = document.querySelectorAll('.feature-card');
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger the animation
        const card = entry.target;
        const idx = Array.from(featureCards).indexOf(card);
        setTimeout(() => {
          card.classList.add('visible');
        }, idx * 120);
        observer.unobserve(card);
      }
    });
  }, observerOptions);

  featureCards.forEach(card => observer.observe(card));

  // ===== Route Line Animation =====
  const routeSection = document.querySelector('.route-section');
  if (routeSection) {
    const routeGlow = routeSection.querySelector('.route-line-glow');
    const routeTrain = routeSection.querySelector('.route-train');

    const routeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            routeGlow?.classList.add('animate');
            routeTrain?.classList.add('animate');
          }, 400);
          routeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    routeObserver.observe(routeSection);
  }

  // ===== Smooth Scroll for Nav Links =====
  document.querySelectorAll('.landing-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Page Transition (Launch Button) =====
  function launchApp() {
    const landing = document.querySelector('.landing-page');
    const transitionOverlay = document.querySelector('.page-transition');
    const circle = transitionOverlay?.querySelector('.transition-circle');

    if (!landing || !circle) return;

    // Start circle expansion
    circle.classList.add('expand');

    // After circle reaches peak, fade out landing
    setTimeout(() => {
      landing.classList.add('exit');
    }, 400);

    // Remove landing from DOM after animation
    setTimeout(() => {
      landing.remove();
      transitionOverlay.remove();
      cancelAnimationFrame(animFrame);
      // Re-enable body scroll for chat
      document.body.style.overflow = '';
    }, 1200);
  }

  // Attach to all launch buttons
  document.querySelectorAll('[data-action="launch"]').forEach(btn => {
    btn.addEventListener('click', launchApp);
  });

  // ===== Parallax subtle effect on hero =====
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      heroContent.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  // ===== Animate stat numbers (count up) =====
  const statNumbers = document.querySelectorAll('.stat-number');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();

        function animate(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out quart
          const eased = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(eased * target);
          el.textContent = current.toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => statObserver.observe(el));
})();
