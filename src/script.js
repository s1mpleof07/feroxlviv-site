// ── NAV SCROLL ──
const nav = document.getElementById('nav');
if (nav && !nav.classList.contains('always-light')) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 60);
  }, { passive: true });
}

// ── MOBILE MENU ──
const burger = document.getElementById('burger');
const mob = document.getElementById('mobMenu');
const mobClose = document.getElementById('mobClose');
let mobOpen = false;
function toggleMenu(v) {
  mobOpen = v;
  if (mob) mob.classList.toggle('open', mobOpen);
  if (burger) burger.setAttribute('aria-expanded', mobOpen);
  document.body.style.overflow = mobOpen ? 'hidden' : '';
}
if (burger) burger.addEventListener('click', () => toggleMenu(!mobOpen));
if (mobClose) mobClose.addEventListener('click', () => toggleMenu(false));
if (mob) mob.querySelectorAll('a:not(.mob-trigger)').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

// ── MOBILE SUBMENU TOGGLE ──
document.querySelectorAll('.mob-menu .has-sub').forEach(li => {
  const trigger = li.querySelector('.mob-trigger');
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      li.classList.toggle('open');
    });
  }
});

// ── SCROLL REVEAL ──
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── FORM ──
document.querySelectorAll('form[data-form="contact"]').forEach(form => {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const fields = this.querySelectorAll('[required]');
    let valid = true;
    fields.forEach(f => { if (!f.value.trim()) valid = false; });
    if (!valid) {
      alert("Будь ласка, заповніть обов'язкові поля.");
      return;
    }
    const okEl = this.querySelector('.f-ok');
    if (okEl) okEl.style.display = 'block';
    this.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
  });
});

// ── SMOOTH ANCHOR ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── REPEATING LASER SCANS ON HERO ──
const heroLaser = document.querySelector('.hero-laser');
if (heroLaser) {
  setInterval(() => {
    heroLaser.style.animation = 'none';
    void heroLaser.offsetWidth;
    heroLaser.style.animation = 'laserScan 4s ease-in-out forwards';
  }, 14000);
}
const phLaser = document.querySelector('.ph-laser');
if (phLaser) {
  setInterval(() => {
    phLaser.style.animation = 'none';
    void phLaser.offsetWidth;
    phLaser.style.animation = 'laserScan 3s ease-in-out forwards';
  }, 12000);
}

// ── MATERIAL MODAL ──
const matModal = document.getElementById('matModal');
const matModalImg = document.getElementById('matModalImg');
const matModalBody = document.getElementById('matModalBody');
const matModalClose = document.getElementById('matModalClose');
const matDataEl = document.getElementById('matData');
let matData = [];
if (matDataEl) {
  try { matData = JSON.parse(matDataEl.textContent); } catch (e) { matData = []; }
}

function openMatModal(slug) {
  const m = matData.find(x => x.slug === slug);
  if (!m || !matModal) return;
  matModalImg.style.backgroundImage = `url('${m.image}')`;
  matModalBody.innerHTML = `
    ${m.tag ? `<span class="mat-modal-tag${m.tagHot ? ' hot' : ''}">${m.tag}</span>` : ''}
    <h3 class="mat-modal-name">${m.name}</h3>
    <p class="mat-modal-desc">${m.description}</p>
    <div class="mat-modal-section">
      <div class="mat-modal-section-title">Де використовується</div>
      <ul class="mat-modal-list">${m.usage.map(u => `<li>${u}</li>`).join('')}</ul>
    </div>
    <div class="mat-modal-section">
      <div class="mat-modal-section-title">Параметри обробки</div>
      <div class="mat-modal-specs">
        <div class="mat-modal-spec"><strong>Лазерна різка</strong>${m.laser}</div>
        <div class="mat-modal-spec"><strong>Гнуття з ЧПУ</strong>${m.bending}</div>
        <div class="mat-modal-spec"><strong>Зварювання</strong>${m.welding}</div>
        <div class="mat-modal-spec"><strong>Вальцювання</strong>${m.rolling}</div>
      </div>
    </div>
    <div class="mat-modal-cta">
      <a href="/contact/" class="btn-p"><span>Замовити прорахунок</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="/services/" class="btn-g" style="border-color:rgba(44,44,42,.2);color:var(--anthracite)"><span>Усі послуги</span></a>
    </div>
  `;
  matModal.classList.add('open');
  matModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMatModal() {
  if (!matModal) return;
  matModal.classList.remove('open');
  matModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('.mat-card[data-material]').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    openMatModal(card.dataset.material);
  });
});
if (matModalClose) matModalClose.addEventListener('click', closeMatModal);
if (matModal) {
  matModal.addEventListener('click', (e) => {
    if (e.target === matModal) closeMatModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && matModal && matModal.classList.contains('open')) closeMatModal();
});
