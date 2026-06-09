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
}, { threshold: 0, rootMargin: '0px 0px 120px 0px' });
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
  matModalImg.style.backgroundImage = "url('" + m.image + "')";
  matModalBody.innerHTML =
    (m.tag ? '<span class="mat-modal-tag' + (m.tagHot ? ' hot' : '') + '">' + m.tag + '</span>' : '') +
    '<h3 class="mat-modal-name">' + m.name + '</h3>' +
    '<p class="mat-modal-desc">' + m.description + '</p>' +
    '<div class="mat-modal-section">' +
      '<div class="mat-modal-section-title">Де використовується</div>' +
      '<ul class="mat-modal-list">' + m.usage.map(function(u) { return '<li>' + u + '</li>'; }).join('') + '</ul>' +
    '</div>' +
    '<div class="mat-modal-section">' +
      '<div class="mat-modal-section-title">Параметри обробки</div>' +
      '<div class="mat-modal-specs">' +
        '<div class="mat-modal-spec"><strong>Лазерна різка</strong>' + m.laser + '</div>' +
        '<div class="mat-modal-spec"><strong>Гнуття з ЧПУ</strong>' + m.bending + '</div>' +
        '<div class="mat-modal-spec"><strong>Зварювання</strong>' + m.welding + '</div>' +
        '<div class="mat-modal-spec"><strong>Вальцювання</strong>' + m.rolling + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mat-modal-cta">' +
      '<a href="/contact/" class="btn-p"><span>Замовити прорахунок</span>' +
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</a>' +
      '<a href="/services/" class="btn-g" style="border-color:rgba(44,44,42,.2);color:var(--anthracite)"><span>Усі послуги</span></a>' +
    '</div>';
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

document.querySelectorAll('.mat-card[data-material]').forEach(function(card) {
  card.addEventListener('click', function(e) {
    e.preventDefault();
    openMatModal(card.dataset.material);
  });
});
if (matModalClose) matModalClose.addEventListener('click', closeMatModal);
if (matModal) {
  matModal.addEventListener('click', function(e) {
    if (e.target === matModal) closeMatModal();
  });
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && matModal && matModal.classList.contains('open')) closeMatModal();
});

// ── VIDEO MODAL (YouTube lazy embed) ──
(function() {
  var cards = document.querySelectorAll('.video-card[data-yt]');
  var modal = document.getElementById('videoModal');
  var wrap = document.getElementById('videoModalWrap');
  var closeBtn = document.getElementById('videoModalClose');
  if (!cards.length || !modal || !wrap || !closeBtn) return;

  function open(youtubeId) {
    wrap.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + youtubeId + '?autoplay=1&rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    modal.hidden = false;
    requestAnimationFrame(function() { modal.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('is-open');
    setTimeout(function() {
      modal.hidden = true;
      wrap.innerHTML = '';
      document.body.style.overflow = '';
    }, 300);
  }

  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var id = card.dataset.yt;
      if (id) {
        open(id);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'video_play',
          video_id: id,
          page_path: window.location.pathname
        });
      }
    });
  });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function(e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();

// ── CONTACT FORM → Telegram (через Cloudflare Worker) ──
(function() {
  var forms = document.querySelectorAll('form.c-form');
  if (!forms.length) return;
  var WORKER_URL = 'https://leads-feroxlviv.prokopiv-andriy99.workers.dev/lead';

  function normalizeUaPhone(raw) {
    if (!raw) return null;
    var digits = String(raw).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('380')) return '+' + digits;
    if (digits.length === 10 && digits.startsWith('0')) return '+38' + digits;
    if (digits.length === 9) return '+380' + digits;
    return null;
  }

  function formatUaPhone(normalized) {
    if (!normalized || normalized.length !== 13) return normalized;
    return '+380 ' + normalized.slice(4, 6) + ' ' + normalized.slice(6, 9) + ' ' + normalized.slice(9);
  }

  forms.forEach(function(form) {
    var phoneInput = form.querySelector('[name=phone]');
    var nameInput = form.querySelector('[name=name]');
    var messageInput = form.querySelector('[name=message]');

    if (phoneInput) {
      phoneInput.setAttribute('placeholder', '+380 XX XXX XX XX');
      phoneInput.setAttribute('inputmode', 'tel');
    }

    function showFieldError(input, msg) {
      if (!input) return;
      input.classList.add('f-input-error');
      input.focus();
      var removeOnce = function() {
        input.classList.remove('f-input-error');
        input.removeEventListener('input', removeOnce);
      };
      input.addEventListener('input', removeOnce);
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var statusEl = form.querySelector('.c-form-status');
      if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.className = 'c-form-status';
        form.appendChild(statusEl);
      }
      var originalBtnText = btn ? btn.innerHTML : '';

      var name = (nameInput ? nameInput.value : '').trim();
      var phoneRaw = (phoneInput ? phoneInput.value : '').trim();
      var message = (messageInput ? messageInput.value : '').trim();

      if (name.length < 2) {
        statusEl.className = 'c-form-status error';
        statusEl.textContent = 'Будь ласка, вкажіть ім\'я.';
        showFieldError(nameInput);
        return;
      }
      var phoneNormalized = normalizeUaPhone(phoneRaw);
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

      if (btn) { btn.disabled = true; btn.innerHTML = '<span>Відправляємо...</span>'; }
      statusEl.className = 'c-form-status sending';
      statusEl.textContent = 'Відправляємо заявку...';

      var urlParams = new URLSearchParams(window.location.search);
      var serviceSelect = form.querySelector('[name=service]');
      var websiteInput = form.querySelector('[name=website]');
      var data = {
        name: name,
        phone: phoneNormalized,
        phoneDisplay: formatUaPhone(phoneNormalized),
        message: message,
        service: serviceSelect ? serviceSelect.value : '',
        website: websiteInput ? websiteInput.value : '',
        page: window.location.pathname,
        referrer: document.referrer || '',
        serviceFromUrl: urlParams.get('service') || '',
        ts: new Date().toISOString()
      };

      try {
        var res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var result = await res.json().catch(function() { return {}; });
        if (!res.ok) throw new Error(result.error || 'Server error');
        statusEl.className = 'c-form-status success';
        statusEl.textContent = '\u2713 \u0414\u044f\u043a\u0443\u0454\u043c\u043e! \u0417\u0430\u044f\u0432\u043a\u0430 \u043e\u0442\u0440\u0438\u043c\u0430\u043d\u0430 \u2014 \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u043c\u043e \u043f\u0440\u043e\u0442\u044f\u0433\u043e\u043c 15 \u0445\u0432\u0438\u043b\u0438\u043d.';
        form.reset();
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
        statusEl.innerHTML = '\u0412\u0438\u043d\u0438\u043a\u043b\u0430 \u043f\u043e\u043c\u0438\u043b\u043a\u0430. \u041d\u0430\u043f\u0438\u0448\u0456\u0442\u044c \u043d\u0430\u043c \u043f\u0440\u044f\u043c\u043e \u0432 <a href="https://t.me/feroxlviv" target="_blank" rel="noopener">Telegram</a> \u2014 \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u043c\u043e \u0448\u0432\u0438\u0434\u0448\u0435.';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
      }
    });
  });
})();

// ── ANALYTICS — track key CTA clicks ──
(function() {
  window.dataLayer = window.dataLayer || [];

  document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
    link.addEventListener('click', function() {
      window.dataLayer.push({
        event: 'phone_click',
        phone_location: link.closest('.nav') ? 'nav' : (link.closest('.mob-menu') ? 'mobile_menu' : 'other'),
        page_path: window.location.pathname
      });
    });
  });

  document.querySelectorAll('.btn-p, .nav-cta, .inline-cta-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window.dataLayer.push({
        event: 'cta_click',
        cta_text: (btn.textContent || '').trim().substring(0, 60),
        cta_destination: btn.getAttribute('href') || '',
        page_path: window.location.pathname
      });
    });
  });

  document.querySelectorAll('a[href^="/services/"]').forEach(function(link) {
    link.addEventListener('click', function() {
      window.dataLayer.push({
        event: 'service_card_click',
        service_path: link.getAttribute('href'),
        page_path: window.location.pathname
      });
    });
  });
})();

// ── TELEGRAM WIDGET ──
(function() {
  var widget = document.createElement('a');
  widget.href = 'https://t.me/feroxlviv';
  widget.target = '_blank';
  widget.rel = 'noopener noreferrer';
  widget.className = 'tg-widget';
  widget.setAttribute('aria-label', 'Написати в Telegram');
  widget.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.944 2.506a1.5 1.5 0 00-1.52-.225L2.55 9.375a1.5 1.5 0 00.09 2.79l4.36 1.453 1.56 5.074a1.5 1.5 0 002.495.603l2.193-2.193 4.142 3.057a1.5 1.5 0 002.35-1.005l2.25-15a1.5 1.5 0 00-.046-.648zm-3.538 14.34l-4.373-3.228a1 1 0 00-1.29.1l-1.164 1.163-.664-2.158 7.853-7.853a.25.25 0 01.354.354l-7.1 9.73 6.384-1.108z" fill="white"/></svg>';
  document.body.appendChild(widget);

  widget.style.opacity = '0';
  widget.style.pointerEvents = 'none';

  window.addEventListener('scroll', function() {
    var show = window.scrollY > 300;
    widget.style.opacity = show ? '1' : '0';
    widget.style.pointerEvents = show ? 'auto' : 'none';
  }, { passive: true });

  widget.addEventListener('click', function() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cta_click',
      cta_text: 'telegram_widget',
      cta_destination: 'https://t.me/feroxlviv',
      page_path: window.location.pathname
    });
  });
})();
