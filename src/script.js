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

// ── VIDEO MODAL (YouTube lazy embed) ──
(function() {
  const cards = document.querySelectorAll('.video-card[data-yt]');
  const modal = document.getElementById('videoModal');
  const wrap = document.getElementById('videoModalWrap');
  const closeBtn = document.getElementById('videoModalClose');
  if (!cards.length || !modal || !wrap || !closeBtn) return;

  function open(youtubeId) {
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('is-open');
    setTimeout(() => {
      modal.hidden = true;
      wrap.innerHTML = '';
      document.body.style.overflow = '';
    }, 300);
  }

  cards.forEach(card => card.addEventListener('click', () => {
    const id = card.dataset.yt;
    if (id) {
      open(id);
      // Analytics event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'video_play',
        video_id: id,
        page_path: window.location.pathname
      });
    }
  }));
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();

// ── CONTACT FORM → Telegram (через Cloudflare Worker) ──
(function() {
  const forms = document.querySelectorAll('form.c-form');
  if (!forms.length) return;
  const WORKER_URL = 'https://leads-feroxlviv.prokopiv-andriy99.workers.dev/lead';

  // Normalize UA phone to +380XXXXXXXXX format. Returns null if invalid.
  function normalizeUaPhone(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    // 380XXXXXXXXX (12 digits)
    if (digits.length === 12 && digits.startsWith('380')) return '+' + digits;
    // 0XXXXXXXXX (10 digits, leading zero)
    if (digits.length === 10 && digits.startsWith('0')) return '+38' + digits;
    // XXXXXXXXX (9 digits, without leading zero)
    if (digits.length === 9) return '+380' + digits;
    return null;
  }

  // Format phone for display: +380 67 123 4567
  function formatUaPhone(normalized) {
    if (!normalized || normalized.length !== 13) return normalized;
    return `+380 ${normalized.slice(4, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
  }

  forms.forEach(form => {
    const phoneInput = form.querySelector('[name=phone]');
    const nameInput = form.querySelector('[name=name]');
    const messageInput = form.querySelector('[name=message]');

    // Auto-format phone on input (visual hint without forcing)
    if (phoneInput) {
      phoneInput.setAttribute('placeholder', '+380 XX XXX XX XX');
      phoneInput.setAttribute('inputmode', 'tel');
    }

    function showFieldError(input, msg) {
      if (!input) return;
      input.classList.add('f-input-error');
      input.focus();
      // Remove error on next input
      const removeOnce = () => { input.classList.remove('f-input-error'); input.removeEventListener('input', removeOnce); };
      input.addEventListener('input', removeOnce);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const statusEl = form.querySelector('.c-form-status') || (() => {
        const el = document.createElement('div');
        el.className = 'c-form-status';
        form.appendChild(el);
        return el;
      })();
      const originalBtnText = btn ? btn.innerHTML : '';

      // ── VALIDATION ──
      const name = (nameInput?.value || '').trim();
      const phoneRaw = (phoneInput?.value || '').trim();
      const message = (messageInput?.value || '').trim();

      if (name.length < 2) {
        statusEl.className = 'c-form-status error';
        statusEl.textContent = 'Будь ласка, вкажіть ім\'я.';
        showFieldError(nameInput);
        return;
      }
      const phoneNormalized = normalizeUaPhone(phoneRaw);
      if (!phoneNormalized) {
        statusEl.className = 'c-form-status error';
        statusEl.textContent = 'Невірний номер телефону. Введіть український номер у форматі +380 XX XXX XX XX.';
        showFieldError(phoneInput);
        return;
      }
      if (message.length < 10) {
        statusEl.className = 'c-form-status error';
        statusEl.textContent = 'Будь ласка, опишіть проект детальніше (хоча б одне речення).';
        showFieldError(messageInput);
        return;
      }

      // Disable form, show progress
      if (btn) { btn.disabled = true; btn.innerHTML = '<span>Відправляємо...</span>'; }
      statusEl.className = 'c-form-status sending';
      statusEl.textContent = 'Відправляємо заявку...';

      // ── COLLECT DATA ──
      // Source tracking:
      // - page: where the form is now (usually /contact/)
      // - referrer: where the user came from before this page (the actual interest)
      // - serviceFromUrl: ?service=xxx query param (set by "Замовити" buttons on service pages)
      const urlParams = new URLSearchParams(window.location.search);
      const data = {
        name: name,
        phone: phoneNormalized,
        phoneDisplay: formatUaPhone(phoneNormalized),
        message: message,
        service: form.querySelector('[name=service]')?.value || '',
        website: form.querySelector('[name=website]')?.value || '',
        page: window.location.pathname,
        referrer: document.referrer || '',
        serviceFromUrl: urlParams.get('service') || '',
        ts: new Date().toISOString()
      };

      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error || 'Server error');
        statusEl.className = 'c-form-status success';
        statusEl.textContent = '✓ Дякуємо! Заявка отримана — відповімо протягом 15 хвилин.';
        form.reset();
        // Analytics — conversion event
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'lead_submit',
          service: data.service || 'not-specified',
          service_from_url: data.serviceFromUrl || '',
          page_path: window.location.pathname,
          referrer_path: data.referrer || ''
        });
      } catch (err) {
        console.error('Form submit error:', err);
        statusEl.className = 'c-form-status error';
        statusEl.innerHTML = 'Виникла помилка. Напишіть нам прямо в <a href="https://t.me/feroxlviv" target="_blank" rel="noopener">Telegram</a> — відповімо швидше.';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
      }
    });
  });
})();

// ── ANALYTICS — track key CTA clicks ──
(function() {
  window.dataLayer = window.dataLayer || [];

  // Phone clicks (nav + mobile + footer + any tel: link)
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      window.dataLayer.push({
        event: 'phone_click',
        phone_location: link.closest('.nav') ? 'nav' : (link.closest('.mob-menu') ? 'mobile_menu' : 'other'),
        page_path: window.location.pathname
      });
    });
  });

  // CTA button clicks (всі "Отримати прорахунок" / "Замовити" і подібні)
  document.querySelectorAll('.btn-p, .nav-cta, .inline-cta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.dataLayer.push({
        event: 'cta_click',
        cta_text: (btn.textContent || '').trim().substring(0, 60),
        cta_destination: btn.getAttribute('href') || '',
        page_path: window.location.pathname
      });
    });
  });

  // Service card clicks on home (strip + material cards leading to /services/)
  document.querySelectorAll('a[href^="/services/"]').forEach(link => {
    link.addEventListener('click', () => {
      window.dataLayer.push({
        event: 'service_card_click',
        service_path: link.getAttribute('href'),
        page_path: window.location.pathname
      });
    });
  });
})();

/* ── TELEGRAM WIDGET ── */
.tg-widget {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 999;
  width: 56px;
  height: 56px;
  background: #229ED9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(34,158,217,.45);
  transition: opacity .3s, transform .3s;
  animation: tgPulse 2.5s ease-in-out infinite;
}
.tg-widget:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 28px rgba(34,158,217,.6);
}
@keyframes tgPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(34,158,217,.45); }
  50% { box-shadow: 0 4px 32px rgba(34,158,217,.75), 0 0 0 8px rgba(34,158,217,.15); }
}
