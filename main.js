/* ══════════════════════════════════════════════
   THẢO TRÂN PORTFOLIO — main.js
   Bioluminescent canvas + scroll reveals + nav
══════════════════════════════════════════════ */

/* ─── NAV SCROLL BEHAVIOR ─── */
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* ─── SCROLL REVEAL ─── */
const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ─── GPA BAR ANIMATION ─── */
const gpaObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('animated'), 100);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.gpa-bar').forEach(bar => gpaObserver.observe(bar));


/* ─── BIOLUMINESCENT CANVAS ANIMATION (ĐÃ FIX LỖI) ─── */
(function initBioCanvas() {
  const canvas = document.getElementById('bioCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], connections = [], dnaNodes = [];
  let animId;

  // Khởi tạo mouse an toàn với giá trị số thay vì W/2 để tránh lỗi NaN
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  const COLORS = {
    node: 'rgba(94, 232, 200, ',
    nodeDim: 'rgba(61, 201, 169, ',
    line: 'rgba(94, 232, 200, ',
    pulse: 'rgba(180, 255, 240, ',
    dnaStrand: 'rgba(94, 232, 200, ',
    bg: '#050c0f',
  };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;

    // Cập nhật lại tâm chuột theo kích thước thật sau khi đã có W và H
    if (mouse.x === window.innerWidth / 2) {
      mouse.x = W / 2;
      mouse.y = H / 2;
    }

    if (!particles.length) initScene();
  }

  /* ── Floating bio-particles ── */
  class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : H + 10;
      this.r = Math.random() * 2.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.4 + 0.15);
      this.alpha = Math.random() * 0.5 + 0.15;
      this.life = Math.random();
      this.maxLife = Math.random() * 300 + 200;
      this.age = initial ? Math.floor(Math.random() * this.maxLife) : 0;
      this.glow = Math.random() > 0.7;
    }
    update() {
      this.x += this.vx + (mouse.x / W - 0.5) * 0.04;
      this.y += this.vy;
      this.age++;
      this.life = Math.sin((this.age / this.maxLife) * Math.PI);
      if (this.age > this.maxLife) this.reset();
    }
    draw() {
      const a = this.alpha * this.life;
      if (this.glow) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
        g.addColorStop(0, COLORS.pulse + (a * 0.8) + ')');
        g.addColorStop(1, COLORS.node + '0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.node + a + ')';
      ctx.fill();
    }
  }

  /* ── DNA double helix ── */
  class DNAHelix {
    constructor(x, speed) {
      this.x = x;
      this.t = Math.random() * Math.PI * 2;
      this.speed = speed || 0.008;
      this.amp = 60;
      this.freq = 0.018;
      this.nodeCount = 18;
      this.nodes = Array.from({ length: this.nodeCount }, (_, i) => i);
    }
    draw() {
      this.t += this.speed;
      const step = H / (this.nodeCount - 1);

      let prevA = null, prevB = null;
      this.nodes.forEach((_, i) => {
        const y = i * step;
        const phase = this.freq * y - this.t;
        const xA = this.x + Math.sin(phase) * this.amp;
        const xB = this.x - Math.sin(phase) * this.amp;
        const alpha = 0.15 + 0.1 * Math.sin(phase * 2 + this.t);

        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(xA, y);
          ctx.lineTo(xB, y);
          ctx.strokeStyle = COLORS.dnaStrand + (alpha * 0.5) + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          this._dot(xA, y, 2.5, alpha * 1.2);
          this._dot(xB, y, 2.5, alpha * 1.2);
        }

        if (prevA) {
          ctx.beginPath();
          ctx.moveTo(prevA.x, prevA.y);
          ctx.lineTo(xA, y);
          ctx.strokeStyle = COLORS.dnaStrand + (alpha * 0.6) + ')';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        if (prevB) {
          ctx.beginPath();
          ctx.moveTo(prevB.x, prevB.y);
          ctx.lineTo(xB, y);
          ctx.strokeStyle = COLORS.nodeDim + (alpha * 0.6) + ')';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        prevA = { x: xA, y };
        prevB = { x: xB, y };
      });
    }
    _dot(x, y, r, alpha) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, COLORS.node + alpha + ')');
      g.addColorStop(1, COLORS.node + '0)');
      ctx.beginPath();
      ctx.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.node + alpha + ')';
      ctx.fill();
    }
  }

  /* ── Network nodes ── */
  class NetNode {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.r = Math.random() * 3 + 1.5;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.pulse = 0;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += this.pulseSpeed;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;

      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        this.vx += dx / dist * 0.003;
        this.vy += dy / dist * 0.003;
      }
      const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
      if (speed > 0.5) { this.vx /= speed * 2; this.vy /= speed * 2; }
    }
    draw() {
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
      glow.addColorStop(0, COLORS.node + (a * 0.5) + ')');
      glow.addColorStop(1, COLORS.node + '0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.node + a + ')';
      ctx.fill();
    }
  }

  function drawConnections(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 140;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = COLORS.line + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function initScene() {
    particles = Array.from({ length: 60 }, () => new Particle());
    dnaNodes = [
      new DNAHelix(W * 0.12, 0.007),
      new DNAHelix(W * 0.88, 0.009),
    ];
    connections = Array.from({ length: 30 }, () => new NetNode());
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vignette.addColorStop(0, 'rgba(5,12,15,0)');
    vignette.addColorStop(1, 'rgba(5,12,15,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    dnaNodes.forEach(d => d.draw());
    drawConnections(connections);
    connections.forEach(n => { n.update(); n.draw(); });
    particles.forEach(p => { p.update(); p.draw(); });

    animId = requestAnimationFrame(render);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    render();
  });

  window.addEventListener('mousemove', e => {
    // Lấy tọa độ chuột chuẩn xác theo bounding box của canvas
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  resize();
  render();

  /* ─── LIGHTBOX IMAGE VIEWER ─── */
  (function initLightbox() {
    // 1. Tự động tạo cấu trúc HTML cho Lightbox đỡ phải sửa file index.html
    const modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
    <button class="lightbox-modal__close" aria-label="Close">&times;</button>
    <img class="lightbox-modal__img" src="" alt="Zoomed view">
  `;
    document.body.appendChild(modal);

    const modalImg = modal.querySelector('.lightbox-modal__img');
    const closeBtn = modal.querySelector('.lightbox-modal__close');

    // 2. Gom tất cả các KHUNG CHỨA vàẢNH trong portfolio của ông
    // Thay vì chỉ chọn thẻ img, ta chọn cả thẻ bọc bên ngoài để bấm trúng chỗ nào cũng zoom được
    const targetSelectors = [
      '.about__photo-wrap',
      '.honor-item__media',
      '.activity-card__img-wrap'
    ];

    const containers = document.querySelectorAll(targetSelectors.join(', '));

    // 3. Gán sự kiện click cho toàn bộ khung chứa ảnh
    containers.forEach(container => {
      // Thêm hiệu ứng chuột zoom cho cả khung để người dùng biết là bấm được
      container.style.cursor = 'zoom-in';

      container.addEventListener('click', () => {
        const img = container.querySelector('img');
        if (!img) return;

        // Nếu ảnh đang bị lỗi (bị ẩn display: none) thì không cho zoom để tránh hiện modal trống
        if (img.style.display === 'none') {
          console.warn("Ảnh này đang bị lỗi đường dẫn hoặc chưa có file nên không thể phóng to!");
          return;
        }

        const src = img.getAttribute('src');
        if (!src) return;

        modalImg.setAttribute('src', src);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Khóa cuộn trang khi đang xem ảnh
      });
    });

    // 4. Đóng lại khi bấm nút X hoặc bấm ra ngoài màn hình đen
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Mở lại cuộn trang
      setTimeout(() => modalImg.setAttribute('src', ''), 400); // Xóa src ảnh cũ khi ẩn xong
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(); // Chỉ đóng khi click trúng màn hình nền
    });

    // 5. Thêm phím ESC trên bàn phím để đóng cho chuyên nghiệp
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  })();
})();