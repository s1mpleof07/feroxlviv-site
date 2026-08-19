// FEROX LVIV — Static site generator
const fs = require('fs');
const path = require('path');

const SRC = __dirname + '/src';
const OUT = __dirname + '/build';

// Дата збірки і дата останньої правки магазину (каталог + картки товарів).
// Оновлюй SHOP_UPDATED, коли міняєш ціни, товари чи вміст сторінок виробів —
// Google використовує lastmod як сигнал, що сторінку варто перечитати.
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const SHOP_UPDATED = '2026-08-10';
const CONTENT = __dirname + '/content';

// ════════════════════════════════════════════════════════
// CONTENT LOADER — reads from /content/ JSON files
// ════════════════════════════════════════════════════════
function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, file), 'utf8'));
}
function loadDir(dirName) {
  const dir = path.join(CONTENT, dirName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => loadJson(path.join(dirName, f)))
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

const site = loadJson('site.json');
const IMG = loadJson('images.json');
const whyUs = site.whyUs || [];
const materials = loadDir('materials');
const services = loadDir('services').sort((a, b) => parseInt(a.num) - parseInt(b.num));
const projects = loadDir('projects');
const blogPosts = loadDir('blog').sort((a, b) => new Date(b.date) - new Date(a.date));
const pages = {
  about: loadJson('pages/about.json'),
  process: loadJson('pages/process.json'),
  contact: loadJson('pages/contact.json')
};

// SVG icons (not edited via CMS — design constants)
const whyIcons = {
  clock: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  warehouse: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10l9-6 9 6v10H3V10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 14h8M8 17h8M8 11h8" stroke="currentColor" stroke-width="1.5"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h18M7 15h3" stroke="currentColor" stroke-width="1.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" stroke-width="1.5"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 8l9 5 9-5M12 13v8" stroke="currentColor" stroke-width="1.5"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h11v9H3V7zM14 11h5l2 3v2h-7v-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="7" cy="18" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="18" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  tools: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 7l3-3 3 3-3 3M14 7l-9 9v3h3l9-9M14 7l-3 3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12l4-4 3 3 3-3 4 4-4 4-3-3-3 3-4-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
};


// ════════════════════════════════════════════════════════
// SHARED HTML PARTS
// ════════════════════════════════════════════════════════
function head(title, desc, keywords, canonical) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${keywords}">
<meta name="robots" content="index, follow">
<meta name="author" content="FEROX LVIV">
<link rel="canonical" href="https://feroxlviv.com.ua${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://feroxlviv.com.ua${canonical}">
<meta property="og:locale" content="uk_UA">
<meta property="og:site_name" content="FEROX LVIV">
<meta property="og:image" content="https://feroxlviv.com.ua/og-cover.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="https://feroxlviv.com.ua/og-cover.jpg">
<meta name="theme-color" content="#2C2C2A">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css?v=${Date.now()}">
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ProfessionalService"],
  "@id": "https://feroxlviv.com.ua/#business",
  "name": "FEROX LVIV",
  "alternateName": "Ферокс Львів",
  "description": "Виготовлення дизайн-об'єктів з кортенової сталі та послуги металообробки у Львові: лазерна різка, гнуття з ЧПУ, зварювання, Hardox. Для архітекторів, девелоперів та виробничих компаній.",
  "url": "https://feroxlviv.com.ua",
  "telephone": "+380630194013",
  "email": "feroxlviv.business@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Львів",
    "addressRegion": "Львівська область",
    "addressCountry": "UA"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 49.8397,
    "longitude": 24.0297
  },
  "areaServed": [
    {"@type": "City", "name": "Львів"},
    {"@type": "City", "name": "Київ"},
    {"@type": "Country", "name": "Україна"}
  ],
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "09:00",
    "closes": "18:00"
  }],
  "priceRange": "$$",
  "currenciesAccepted": "UAH",
  "paymentAccepted": "Готівка, безготівковий розрахунок",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Послуги FEROX LVIV",
    "itemListElement": [
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Дизайн-об'єкти з кортену", "url": "https://feroxlviv.com.ua/services/corten/"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Лазерна різка металу", "url": "https://feroxlviv.com.ua/services/laser-cutting/"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Гнуття металу з ЧПУ", "url": "https://feroxlviv.com.ua/services/cnc-bending/"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Зварювання та вальцювання", "url": "https://feroxlviv.com.ua/services/welding/"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Hardox — броньова сталь", "url": "https://feroxlviv.com.ua/services/hardox/"}}
    ]
  },
  "sameAs": [
    "https://t.me/feroxlviv",
    "https://www.instagram.com/ferox.studio.ua/"
  ],
  "knowsAbout": ["кортенова сталь", "COR-TEN", "лазерна різка металу", "гнуття металу", "зварювання", "Hardox", "металообробка", "архітектурний метал"]
})}</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KR9LWFWB');</script>
<!-- End Google Tag Manager -->
<!-- Google tag (gtag.js) - Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18181494131"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-18181494131');
</script>
<!-- End Google tag -->
<!-- Microsoft Clarity -->
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","wx4d8dddun");</script>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KR9LWFWB" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<a href="https://t.me/feroxlviv" class="tg-sticky" target="_blank" rel="noopener" aria-label="Написати нам у Telegram">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21.8 2.2L1.4 10c-1.4.6-1.4 1.4-.2 1.7l5.2 1.6 2 6.3c.3.8.5 1.1 1 1.1.5 0 .7-.2 1-.6l2.5-2.5 5.2 3.8c1 .5 1.6.3 1.9-.9l3.4-16c.4-1.6-.6-2.3-1.6-1.3z" fill="currentColor"/></svg>
  <span class="tg-sticky-label">Telegram</span>
</a>`;
}

function nav(active = '') {
  const link = (href, label, slug) =>
    `<li><a href="${href}"${active === slug ? ' class="active"' : ''}>${label}<span class="ext-ind" aria-hidden="true"></span></a></li>`;
  const servicesItems = services.map(s =>
    `<a href="/services/${s.slug}/"><strong>${s.titleShort}</strong><small>${s.tags.slice(0,3).join(' · ')}</small></a>${s.slug === 'corten' ? '<a href="/architects/" style="padding-left:20px;color:var(--corten);border-left:2px solid var(--corten);margin-left:4px"><strong>↳ Для архітекторів</strong><small>Каталог, зразки, 3D-підтримка</small></a>' : ''}`
  ).join('');
  return `<nav id="nav" role="navigation" aria-label="Головна навігація">
  <a href="/" class="nav-logo" aria-label="FEROX LVIV — головна">
    <svg class="nav-logo-svg" viewBox="0 0 230 62" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="0" y="5" width="2.5" height="52" fill="#a0522d"/>
      <text x="14" y="44" font-family="Georgia,'Times New Roman',serif" font-size="32" font-weight="700" fill="currentColor" letter-spacing="4">FEROX</text>
      <text x="15" y="58" font-family="'DM Sans','Trebuchet MS',Arial,sans-serif" font-size="10" fill="#a0522d" letter-spacing="9">LVIV</text>
    </svg>
  </a>
  <ul class="nav-links">
    <li>
      <a href="/services/"${active === 'services' ? ' class="active"' : ''}>Послуги
        <svg class="caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <div class="dropdown" role="menu">
        <a href="/services/"><strong>Усі послуги</strong><small>Огляд напрямків роботи</small></a>
        ${servicesItems}
      </div>
    </li>
    ${link('/viroby/', 'Вироби', 'viroby')}
    ${link('/blog/', 'Блог', 'blog')}
    ${link('/about/', 'Про нас', 'about')}
    ${link('/process/', 'Як ми працюємо', 'process')}
    ${link('/contact/', 'Контакт', 'contact')}
  </ul>
  ${site.contacts.phone ? `<a href="tel:${site.contacts.phone.replace(/\s/g, '')}" class="nav-phone" aria-label="Зателефонувати ${site.contacts.phone}">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="nav-phone-text">${site.contacts.phone}</span>
  </a>` : ''}
  <a href="/contact/" class="nav-cta"><span>Отримати розрахунок</span></a>
  <button class="burger" id="burger" aria-label="Меню" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</nav>

<div class="mob-menu" id="mobMenu" role="dialog" aria-modal="true" aria-label="Навігація">
  <button class="mob-close" id="mobClose" aria-label="Закрити меню">✕</button>
  <div class="mob-section${active === 'services' ? ' open' : ''} has-sub">
    <a class="mob-trigger" href="/services/">Послуги <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></a>
    <div class="mob-sub">
      <a href="/services/">Усі послуги</a>
      ${services.map(s => `<a href="/services/${s.slug}/">${s.titleShort}</a>`).join('')}
    </div>
  </div>
  <a href="/viroby/"${active === 'viroby' ? ' class="active"' : ''}>Вироби</a>
  <a href="/blog/"${active === 'blog' ? ' class="active"' : ''}>Блог</a>
  <a href="/architects/"${active === 'architects' ? ' class="active"' : ''}>Для архітекторів</a>
  <a href="/about/"${active === 'about' ? ' class="active"' : ''}>Про нас</a>
  <a href="/process/"${active === 'process' ? ' class="active"' : ''}>Як ми працюємо</a>
  <a href="/contact/"${active === 'contact' ? ' class="active"' : ''}>Контакт</a>
  ${site.contacts.phone ? `<a href="tel:${site.contacts.phone.replace(/\s/g, '')}" class="mob-phone">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>${site.contacts.phone}</span>
  </a>` : ''}
</div>`;
}

function decoSvg(type) {
  if (type === 'corten') {
    // Concentric corten patina rings
    return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="cg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#A0522D" stop-opacity=".4"/>
          <stop offset="60%" stop-color="#A0522D" stop-opacity=".15"/>
          <stop offset="100%" stop-color="#A0522D" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="450" cy="300" r="280" fill="url(#cg1)"/>
      <g stroke="#D4956A" fill="none" opacity=".4">
        <circle cx="450" cy="300" r="80" stroke-width=".5"/>
        <circle cx="450" cy="300" r="140" stroke-width=".5" stroke-dasharray="2 6"/>
        <circle cx="450" cy="300" r="200" stroke-width=".5"/>
        <circle cx="450" cy="300" r="260" stroke-width=".5" stroke-dasharray="3 12"/>
      </g>
      <g fill="#A0522D" opacity=".5">
        <circle cx="450" cy="220" r="3"/>
        <circle cx="530" cy="300" r="3"/>
        <circle cx="450" cy="380" r="3"/>
        <circle cx="370" cy="300" r="3"/>
      </g>
    </svg>`;
  }
  if (type === 'laser') {
    // Laser cut perforation grid
    return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#A0522D" stop-opacity="0"/>
          <stop offset="50%" stop-color="#D4956A" stop-opacity=".9"/>
          <stop offset="100%" stop-color="#A0522D" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g fill="#D4956A" opacity=".3">
        ${Array.from({length: 8}, (_, r) =>
          Array.from({length: 8}, (_, c) =>
            `<circle cx="${320 + c * 32}" cy="${170 + r * 32}" r="${1.5 + (c % 3) * 0.5}"/>`
          ).join('')
        ).join('')}
      </g>
      <line x1="320" y1="300" x2="600" y2="300" stroke="url(#lg1)" stroke-width="1.5">
        <animate attributeName="y1" values="170;430;170" dur="6s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="170;430;170" dur="6s" repeatCount="indefinite"/>
      </line>
      <line x1="500" y1="100" x2="500" y2="500" stroke="#A0522D" stroke-width=".5" stroke-dasharray="2 4" opacity=".4"/>
    </svg>`;
  }
  if (type === 'bending') {
    // Bent metal sheet — all in right half, no text labels
    return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <g stroke="#D4956A" fill="none" opacity=".5" stroke-linejoin="round">
        <path d="M 350 130 L 500 130 L 560 230 L 560 370 L 500 470 L 350 470 Z" stroke-width="1"/>
        <path d="M 380 160 L 480 160 L 530 240 L 530 360 L 480 440 L 380 440 Z" stroke-width=".5" stroke-dasharray="3 6"/>
        <path d="M 410 190 L 460 190 L 500 250 L 500 350 L 460 410 L 410 410 Z" stroke-width=".5" opacity=".7"/>
      </g>
      <g stroke="#A0522D" fill="none" opacity=".35">
        <circle cx="350" cy="130" r="3" fill="#D4956A"/>
        <circle cx="500" cy="130" r="3" fill="#D4956A"/>
        <circle cx="560" cy="230" r="3" fill="#D4956A"/>
        <circle cx="560" cy="370" r="3" fill="#D4956A"/>
        <circle cx="500" cy="470" r="3" fill="#D4956A"/>
        <circle cx="350" cy="470" r="3" fill="#D4956A"/>
        <path d="M 540 230 Q 560 230 560 250" stroke-width=".5"/>
        <path d="M 540 370 Q 560 370 560 350" stroke-width=".5"/>
      </g>
    </svg>`;
  }
  if (type === 'welding') {
    // Weld arc spark
    return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="wg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFE4B5" stop-opacity=".8"/>
          <stop offset="30%" stop-color="#D4956A" stop-opacity=".5"/>
          <stop offset="100%" stop-color="#A0522D" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="470" cy="300" r="120" fill="url(#wg1)"/>
      <g stroke="#D4956A" fill="none" opacity=".5" stroke-linecap="round">
        <line x1="470" y1="200" x2="470" y2="170" stroke-width="1"/>
        <line x1="470" y1="430" x2="470" y2="400" stroke-width="1"/>
        <line x1="370" y1="300" x2="340" y2="300" stroke-width="1"/>
        <line x1="600" y1="300" x2="570" y2="300" stroke-width="1"/>
        <line x1="400" y1="230" x2="380" y2="210" stroke-width=".5"/>
        <line x1="540" y1="230" x2="560" y2="210" stroke-width=".5"/>
        <line x1="400" y1="370" x2="380" y2="390" stroke-width=".5"/>
        <line x1="540" y1="370" x2="560" y2="390" stroke-width=".5"/>
      </g>
      <circle cx="470" cy="300" r="6" fill="#FFE4B5" opacity=".9">
        <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>`;
  }
  // default — abstract metal grid for non-service pages
  return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
    <g stroke="#D4956A" fill="none" opacity=".25">
      <line x1="350" y1="100" x2="600" y2="100" stroke-width=".5"/>
      <line x1="380" y1="200" x2="600" y2="200" stroke-width=".5"/>
      <line x1="350" y1="300" x2="600" y2="300" stroke-width=".5"/>
      <line x1="400" y1="400" x2="600" y2="400" stroke-width=".5"/>
      <line x1="370" y1="500" x2="600" y2="500" stroke-width=".5"/>
      <line x1="470" y1="50" x2="470" y2="550" stroke-width=".5" stroke-dasharray="2 8"/>
      <line x1="540" y1="50" x2="540" y2="550" stroke-width=".5" stroke-dasharray="2 8" opacity=".5"/>
    </g>
    <circle cx="470" cy="300" r="60" stroke="#A0522D" fill="none" opacity=".4" stroke-width=".5"/>
    <circle cx="470" cy="300" r="100" stroke="#A0522D" fill="none" opacity=".25" stroke-width=".5" stroke-dasharray="3 8"/>
  </svg>`;
}

function pageHeader(crumbs, h1, sub, deco, bgImage, label) {
  return `<section class="ph${bgImage ? ' ph-with-bg' : ''}">
  ${bgImage ? `<div class="ph-photo" aria-hidden="true"></div>` : ''}
  <div class="ph-bg" aria-hidden="true"></div>
  <div class="ph-bg-warm" aria-hidden="true"></div>
  <div class="ph-grid" aria-hidden="true"></div>
  <div class="ph-vline" aria-hidden="true"></div>
  <nav class="crumbs" aria-label="Хлібні крихти">
    ${crumbs.map((c, i) => i === crumbs.length - 1
      ? `<span>${c.label}</span>`
      : `<a href="${c.href}">${c.label}</a><span class="crumbs-sep">/</span>`
    ).join('')}
  </nav>
  ${label ? `<p class="ph-label" style="position:relative;z-index:1;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--corten);margin:24px 0 16px">${label}</p>` : ''}
  <h1 class="ph-h1">${h1}</h1>
  ${sub ? `<p class="ph-sub">${sub}</p>` : ''}
</section>`;
}

function inlineCTA(label, h, sub, btnText, btnHref) {
  return `<section class="inline-cta">
  <div class="inline-cta-text reveal">
    <p class="inline-cta-label">${label}</p>
    <h2 class="inline-cta-h">${h}</h2>
    ${sub ? `<p class="inline-cta-sub">${sub}</p>` : ''}
  </div>
  <a href="${btnHref}" class="btn-p inline-cta-btn reveal">
    <span>${btnText}</span>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </a>
</section>`;
}

function contactForm(prefill = '') {
  const opts = [
    ['', 'Оберіть послугу'],
    ['corten', 'Дизайн-об\'єкт з кортену'],
    ['laser', 'Лазерна різка металу'],
    ['bending', 'Гнуття з ЧПУ'],
    ['welding', 'Зварювання / вальцювання'],
    ['other', 'Інше / декілька послуг']
  ].map(([v, l]) => `<option value="${v}"${v === prefill ? ' selected' : ''}>${l}</option>`).join('');
  return `<form class="c-form reveal" data-form="contact" novalidate aria-label="Форма замовлення прорахунку">
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
      <div class="f-row">
        <div class="f-group"><label class="f-label" for="fname">Ваше ім'я *</label><input class="f-input" type="text" id="fname" name="name" placeholder="Андрій" required autocomplete="name"></div>
        <div class="f-group"><label class="f-label" for="fphone">Телефон *</label><input class="f-input" type="tel" id="fphone" name="phone" placeholder="+380 xx xxx xx xx" required autocomplete="tel"></div>
      </div>
      <div class="f-group"><label class="f-label" for="fservice">Послуга</label>
        <select class="f-sel" id="fservice" name="service">${opts}</select>
      </div>
      <div class="f-group"><label class="f-label" for="fmsg">Опис проекту *</label>
        <textarea class="f-ta" id="fmsg" name="message" required placeholder="Опишіть що потрібно зробити: матеріал, розміри, кількість, терміни..."></textarea>
      </div>
      <button type="submit" class="btn-dark"><span>Надіслати заявку</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>`;
}

function contactSection(prefillService = '', titleH = 'Розкажіть<br>про ваш<br><em>проект.</em>') {
  return `<section id="contact">
  <div class="contact-grid">
    <div class="reveal">
      <p class="s-label">Зв'яжіться з нами</p>
      <h2 class="c-title">${titleH}</h2>
      <p class="c-desc">Ми відповімо протягом 15 хвилин у робочий час і підготуємо детальний розрахунок. У випадку дизайн-проекту з кортену термін опрацювання — до 24 годин.</p>
      <div class="c-details">
        <div class="c-detail"><span class="c-dlabel">Telegram</span><a href="https://t.me/feroxlviv" class="c-dval">@feroxlviv</a></div>
        <div class="c-detail"><span class="c-dlabel">Instagram</span><a href="https://www.instagram.com/ferox.studio.ua/" class="c-dval">@ferox.studio.ua</a></div>
        <div class="c-detail"><span class="c-dlabel">Місто</span><span class="c-dval">Львів, Україна</span></div>
        <div class="c-detail"><span class="c-dlabel">Графік</span><span class="c-dval">Пн–Пт, 9:00–18:00</span></div>
      </div>
    </div>
    ${contactForm(prefillService)}
  </div>
</section>`;
}

function footer() {
  return `<footer role="contentinfo">
  <div class="ft-top">
    <div>
      <div class="ft-logo"><span class="ft-bar"></span>FEROX LVIV</div>
      <p class="ft-tag">Металеві дизайн-рішення та металообробка у Львові. Кортен, лазерна різка, гнуття, зварювання.</p>
    </div>
    <div class="ft-col">
      <div class="ft-col-t">Послуги</div>
      <ul>
        ${services.map(s => `<li><a href="/services/${s.slug}/">${s.titleShort}</a></li>${s.slug === 'corten' ? '<li><a href="/architects/" style="color:var(--corten)">↳ Для архітекторів</a></li>' : ''}`).join('')}
      </ul>
    </div>
    <div class="ft-col">
      <div class="ft-col-t">Компанія</div>
      <ul>
        <li><a href="/about/">Про нас</a></li>
        <li><a href="/viroby/">Вироби</a></li>
        <li><a href="/process/">Як ми працюємо</a></li>
        <li><a href="/contact/">Контакт</a></li>
      </ul>
    </div>
    <div class="ft-col">
      <div class="ft-col-t">Соціальні мережі</div>
      <ul>
        <li><a href="https://www.instagram.com/ferox.studio.ua/">Instagram</a></li>
        <li><a href="https://t.me/feroxlviv">Telegram</a></li>
        <li><a href="https://pinterest.com/feroxlviv">Pinterest</a></li>
      </ul>
    </div>
  </div>
  <div class="ft-bot">
    <p class="ft-copy">© 2026 FEROX LVIV. Всі права захищені.</p>
    <nav class="ft-seo-links" aria-label="Послуги">
      <a href="/services/laser-cutting/">Лазерна різка металу Львів</a>
      <a href="/services/corten/">Кортен купити Львів</a>
      <a href="/services/bending/">Гнуття металу ЧПУ</a>
      <a href="/services/welding/">Зварювання Львів</a>
      <a href="/services/">Металообробка Львів</a>
    </nav>
  </div>
</footer>

<!-- Video modal (lazy YouTube embed) -->
<div class="video-modal" id="videoModal" hidden aria-hidden="true" role="dialog" aria-label="Відеоплеєр">
  <button class="video-modal-close" id="videoModalClose" aria-label="Закрити відео">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>
  <div class="video-modal-wrap" id="videoModalWrap"></div>
</div>

<script src="/script.js?v=4" defer></script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════
// PAGES
// ════════════════════════════════════════════════════════

// ── HOME ──
function homePage() {
  return head(
    site.seo.defaultTitle,
    site.seo.defaultDesc,
    site.seo.defaultKeywords,
    '/'
  ) + nav('') + `
<section class="hero" aria-label="Головний блок FEROX LVIV">

  <!-- ── Фотобекграунд ──────────────────────────────── -->
  <div class="hero-photo-wrap" aria-hidden="true">
    <picture>
      <source srcset="/uploads/hero-bg.webp" type="image/webp">
      <img src="/uploads/hero-bg.jpg" class="hero-photo-real" alt="Кортеновий олень — арт-об'єкт із сталі COR-TEN, виробництво FEROX LVIV" loading="eager" fetchpriority="high" decoding="async">
    </picture>
    <div class="hero-photo-overlay"></div>
  </div>
  <div class="hero-accent-line" aria-hidden="true"></div>
  <div class="hero-vline" aria-hidden="true"></div>

  <!-- ── Контент ──────────────────────────────────── -->
  <div class="hero-inner">
    <p class="hero-label">${site.hero.label}</p>
    <h1 class="hero-h1">${site.hero.h1}</h1>
    <p class="hero-sub">${site.hero.sub}</p>
    <div class="hero-btns">
      <a href="${site.hero.ctaSecondary.href}" class="btn-p btn-hero" data-event="cta_click" data-label="hero_catalog">
        <span>${site.hero.ctaSecondary.label}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="${site.hero.ctaPrimary.href}" class="btn-g btn-hero-2" data-event="cta_click" data-label="hero_quote">
        <span>${site.hero.ctaPrimary.label}</span>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.6 3.4h10.8v9.2H2.6z" stroke="currentColor" stroke-width="1.3"/><path d="M5.2 6.4h5.6M5.2 9.2h3.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      </a>
    </div>
    <p class="hero-hint">${site.hero.ctaSecondary.text || 'Каталог виробів'} — з цінами та розмірами</p>
  </div>

  <!-- ── B2B показники ─────────────────────────────── -->
  <div class="hero-stats" aria-label="Умови роботи">
    <div class="hero-stat">
      <span class="hero-stat-n">24<em>г</em></span>
      <span class="hero-stat-l">Комерційна пропозиція</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-n">7–14<em> д</em></span>
      <span class="hero-stat-l">Термін виготовлення</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-n">ПДВ</span>
      <span class="hero-stat-l">Офіційний платник</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-n">5.0<em>★</em></span>
      <span class="hero-stat-l">Рейтинг Google</span>
    </div>
  </div>

  <!-- ── Соціальні ─────────────────────────────────── -->
  <div class="hero-soc">
    <a href="https://www.instagram.com/ferox.studio.ua/" target="_blank" rel="noopener">Instagram</a>
    <a href="https://t.me/feroxlviv" target="_blank" rel="noopener">Telegram</a>
    <a href="https://pinterest.com/feroxlviv" target="_blank" rel="noopener">Pinterest</a>
  </div>

</section>

<div class="strip" role="complementary" aria-label="Напрямки роботи">
  <a href="/services/corten/" class="strip-i"><span class="strip-dot"></span><span>Кортен та дизайн</span><span class="strip-arrow" aria-hidden="true">→</span></a>
  <a href="/services/laser-cutting/" class="strip-i"><span class="strip-dot"></span><span>Лазерна різка</span><span class="strip-arrow" aria-hidden="true">→</span></a>
  <a href="/services/cnc-bending/" class="strip-i"><span class="strip-dot"></span><span>Гнуття з ЧПУ</span><span class="strip-arrow" aria-hidden="true">→</span></a>
  <a href="/services/welding/" class="strip-i"><span class="strip-dot"></span><span>Зварювання</span><span class="strip-arrow" aria-hidden="true">→</span></a>
  <a href="/services/welding/" class="strip-i"><span class="strip-dot"></span><span>Вальцювання</span><span class="strip-arrow" aria-hidden="true">→</span></a>
</div>

<section class="cat-section">
  <div class="cat-head reveal">
    <div>
      <p class="s-label">Каталог виробів</p>
      <h2 class="s-title">Що ми<br><em>виготовляємо.</em></h2>
    </div>
    <p class="cat-head-desc">Від декоративних арт-об'єктів до промислових конструкцій — 15 категорій у трьох металах. Нижче кілька напрямків, решта у каталозі.</p>
  </div>
  <div class="cat-grid" id="catGrid">
    <a href="/viroby/?cat=kashpo" class="cat-card reveal" data-cat="corten">
      <div class="cat-card-img" style="background-image:url('/uploads/cat-kashpo-rectangle.webp')"></div>
      <div class="cat-card-body">
        <span class="cat-card-tag">Кортен · Ландшафт</span>
        <h3 class="cat-card-title">Кашпо та клумби</h3>
        <p class="cat-card-desc">Об'ємні та плоскі форми для саду і тераси. Природна патина з часом.</p>
        <span class="cat-card-cta">Дивитись вироби →</span>
      </div>
    </a>
    <a href="/viroby/?cat=decor" class="cat-card reveal" data-cat="corten">
      <div class="cat-card-img" style="background-image:url('/uploads/cat-sculpture-deer.webp')"></div>
      <div class="cat-card-body">
        <span class="cat-card-tag">Кортен · Арт-об'єкт</span>
        <h3 class="cat-card-title">Скульптури та арт-об'єкти</h3>
        <p class="cat-card-desc">Унікальні дизайн-об'єкти з кортену для екстер'єру та публічних просторів.</p>
        <span class="cat-card-cta">Дивитись вироби →</span>
      </div>
    </a>
    <a href="/viroby/?cat=facade" class="cat-card reveal" data-cat="corten">
      <div class="cat-card-img" style="background-image:url('/uploads/entrance.webp')"></div>
      <div class="cat-card-body">
        <span class="cat-card-tag">Кортен · Фасад</span>
        <h3 class="cat-card-title">Вхідні групи та фасадні елементи</h3>
        <p class="cat-card-desc">Металеві панелі, декоративні екрани, архітектурні акценти для ЖК і комерційних будівель.</p>
        <span class="cat-card-cta">Дивитись вироби →</span>
      </div>
    </a>
    <a href="/viroby/?cat=light" class="cat-card reveal" data-cat="corten">
      <div class="cat-card-img" style="background-image:url('/uploads/cat-light-wall.webp')"></div>
      <div class="cat-card-body">
        <span class="cat-card-tag">Кортен · Освітлення</span>
        <h3 class="cat-card-title">Вуличні світильники</h3>
        <p class="cat-card-desc">Настінні та підвісні садові світильники з кортену. Тепле LED-світло і природня патина.</p>
        <span class="cat-card-cta">Дивитись вироби →</span>
      </div>
    </a>
    <a href="/viroby/?cat=sign" class="cat-card reveal" data-cat="stainless">
      <div class="cat-card-img" style="background-image:url('/uploads/brendova-tablichka.webp')"></div>
      <div class="cat-card-body">
        <span class="cat-card-tag">Нержавійка · Брендинг</span>
        <h3 class="cat-card-title">Вивіски та таблички</h3>
        <p class="cat-card-desc">Брендові таблички, адресні знаки, логотипи. Дзеркальна або матова поверхня.</p>
        <span class="cat-card-cta">Дивитись вироби →</span>
      </div>
    </a>
    <a href="/viroby/" class="cat-more reveal">
      <span class="cat-more-top">
        <span class="cat-more-n">+10</span>
        <span class="cat-more-lb">категорій</span>
      </span>
      <span class="cat-more-mid">
        <span class="cat-more-t">Увесь каталог<br>виробів</span>
        <span class="cat-more-d">Кашпо, мангали, фонтани, ламелі, облицювання кортеном, стелажі, пам'ятники та інше — з розмірами й оформленням замовлення.</span>
      </span>
      <span class="cat-more-cta">Дивитись каталог
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </a>
  </div>
  <div class="cat-metals reveal">
    <span class="cat-metals-lb">Дивитись у металі</span>
    <a href="/viroby/?metal=corten"><i style="background:#A0522D"></i>Кортен</a>
    <a href="/viroby/?metal=stainless"><i style="background:#9FA4A8"></i>Нержавійка</a>
    <a href="/viroby/?metal=steel"><i style="background:#3A3A37"></i>Чорна сталь</a>
  </div>
  <p class="cat-rest reveal"><span>Також виготовляємо:</span> <a href="/viroby/fontany/">Фонтани та водні об'єкти</a> <a href="/viroby/pamiatky/">Пам'ятники та меморіальні плити</a> <a href="/viroby/bordyury/">Бордюри та кромки клумб</a> <a href="/viroby/interior/">Декор та арт-панелі для інтер'єру</a> <a href="/viroby/qr-horeca/">QR-таблички та брендинг ресторанів</a> <a href="/viroby/mebli/">Металеві меблі та каркаси</a> <a href="/viroby/detali/">Деталі та заготовки на замовлення</a> <a href="/viroby/parkan/">Паркани та огородження</a> <a href="/viroby/mangal/">Мангали та грилі</a> <a href="/viroby/stelazh/">Стелажі для дров</a></p>
</section>

<section id="about">
  <div class="about-grid">
    <div class="reveal">
      <p class="s-label">${site.about.label}</p>
      <h2 class="s-title">${site.about.title}</h2>
      <p class="about-desc">${site.about.sectionText}</p>
      <blockquote class="about-quote">Кожен виріб — це рішення конкретного завдання.<br>Ми не робимо типового.</blockquote>
    </div>
    <div class="about-stats reveal">
      ${site.about.valueProps.map(v => `<div class="a-stat"><div class="a-stat-n">${v.num}</div><div class="a-stat-t">${v.label}</div></div>`).join('')}
    </div>
  </div>
</section>

<section id="services">
  <div class="reveal">
    <p class="s-label">Що ми робимо</p>
    <h2 class="s-title">П&apos;ять послуг.<br><em>Один стандарт якості.</em></h2>
  </div>
  <div class="srv-grid">
    ${services.filter(s => s.slug !== 'hardox').map((s, i) => `<a class="srv-card${i === 0 ? ' srv-dark' : ''} reveal" href="/services/${s.slug}/">
      <div class="srv-num">${s.num}</div>
      <h3 class="srv-title">${s.title}</h3>
      <p class="srv-desc">${s.desc}</p>
      <div class="srv-tags">${s.tags.map(t => `<span class="srv-tag">${t}</span>`).join('')}</div>
      <span class="srv-arrow" aria-hidden="true">↗</span>
    </a>`).join('')}
  </div>

  ${(() => { const h = services.find(s => s.slug === 'hardox'); return `
  <a href="/services/${h.slug}/" class="hardox-card reveal">
    <div class="hardox-bg" style="background-image:url('${h.bgImage}')"></div>
    <div class="hardox-overlay"></div>
    <div class="hardox-content">
      <div class="hardox-tag-row">
        <span class="hardox-num">${h.num}</span>
        <span class="hardox-badge">Оборонна сталь</span>
      </div>
      <h3 class="hardox-title">${h.title}</h3>
      <p class="hardox-desc">${h.desc}</p>
      <div class="hardox-meta">
        <div class="hardox-spec"><span class="hardox-spec-n">400–600</span><span class="hardox-spec-l">HB твердість</span></div>
        <div class="hardox-spec"><span class="hardox-spec-n">12мм</span><span class="hardox-spec-l">лазерна різка</span></div>
        <div class="hardox-spec"><span class="hardox-spec-n">SSAB</span><span class="hardox-spec-l">оригінал</span></div>
      </div>
      <span class="hardox-cta">Дізнатися більше <span aria-hidden="true">↗</span></span>
    </div>
  </a>
  `; })()}
</section>

<div class="corten-feat">
  <div class="reveal">
    <p class="s-label">Матеріал</p>
    <h2 class="s-title cf-title">Кортен — сталь<br>яка <em>живе.</em></h2>
    <p class="cf-text">Атмосферостійка сталь COR-TEN утворює на поверхні захисний шар іржі, який зупиняє подальшу корозію. Не потребує фарбування. Набуває унікального характеру з часом.</p>
    <a href="/services/corten/" class="cf-link">Більше про кортен <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
  </div>
  <div class="cf-grid reveal">
    ${(site.cortenCategories || []).map(c => `<a href="/services/corten/" class="cf-box${c.image ? ' cf-box-img' : ''}"${c.image ? ` style="background-image:linear-gradient(180deg,rgba(21,20,15,.3) 0%,rgba(21,20,15,.85) 100%),url('${c.image}');background-size:cover;background-position:center"` : ''} aria-label="${c.title} — дизайн з кортену"><span>${c.title}</span></a>`).join('')}
  </div>
</div>


<section class="fw-wrap">
  <div class="reveal">
    <p class="s-label">Для кого</p>
    <h2 class="s-title">Ми знаємо<br><em>ваш бізнес.</em></h2>
  </div>
  <div class="fw-grid">
    ${[
      ['Архітектори та дизайнери', 'Ексклюзивні матеріали та виготовлення під ваш проект. Розуміємо мову дизайну.'],
      ['Девелопери та ЖК', 'Металеві арт-об\'єкти для лобі, огорожі, фасадні рішення — все що підкреслює клас об\'єкту.'],
      ['Ландшафтні дизайнери', 'Кашпо, водні об\'єкти, декоративні екрани з кортену. Матеріал для тих, хто думає на роки.'],
      ['Готелі та ресторани', 'Брендові елементи з металу, вивіски, декор інтер\'єру. Унікальні речі що запам\'ятовуються.'],
      ['Виробничі компанії', 'Лазерна різка, гнуття, зварювання для деталей і конструкцій. Від прототипу до серії.'],
      ['Муніципалітети', 'Лавки, урни, навіси, малі архітектурні форми. Досвід з тендерами Prozorro.Продажі.']
    ].map(([t, d], i) => `<article class="fw-card reveal"><div class="fw-n" aria-hidden="true">0${i+1}</div><h3 class="fw-title">${t}</h3><p class="fw-desc">${d}</p></article>`).join('')}
  </div>
</section>

<a href="/architects/" class="arch-banner reveal" aria-label="Сторінка для архітекторів та дизайнерів">
  <div class="arch-banner-bg" aria-hidden="true">
    <div class="arch-banner-ov"></div>
  </div>
  <div class="arch-banner-body">
    <p class="arch-banner-label">Для архітекторів та дизайнерів</p>
    <h2 class="arch-banner-h">Є окремий набір<br>інструментів для вас.</h2>
    <ul class="arch-banner-list">
      <li>Безкоштовна перевірка креслень DWG/DXF</li>
      <li>Текстури Corten 4K для Corona / Lumion</li>
      <li>Таймлайн патини для показу замовнику</li>
      <li>Box зразків матеріалу — безкоштовна відправка</li>
    </ul>
  </div>
  <div class="arch-banner-cta">
    <span>Детальніше</span>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" stroke="currentColor" stroke-width="1"/>
      <path d="M15 20h10M21 16l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</a>

<section class="why-section">
    <div class="reveal">
      <p class="s-label">Чому ми</p>
      <h2 class="s-title" style="color:var(--white)">Вісім причин<br>працювати з <em>FEROX.</em></h2>
    </div>
    <div class="reveal why-head-right">
      <p class="why-head-text">Ми не намагаємось бути найдешевшими. Ми пропонуємо чесну якість, передбачувані терміни і повну відповідальність за результат — від першого ескізу до здачі готового виробу.</p>
    </div>
  </div>
  <div class="why-grid">
    ${whyUs.map(w => `<article class="why-card reveal">
      <div class="why-icon">${whyIcons[w.icon]}</div>
      <h3 class="why-label">${w.title}</h3>
      <div class="why-desc">${w.desc}</div>
    </article>`).join('')}
  </div>
</section>

${inlineCTA(
  'Готові обговорити проект?',
  'Розкажіть про ваше завдання —<br>отримаєте <em>розрахунок за 15 хв.</em>',
  'Безкоштовна консультація. Без зобов\'язань. Тільки конкретика по матеріалах, термінах і ціні.',
  'Залишити заявку',
  '/contact/'
)}

<section class="mat-wrap">
  <div class="mat-head">
    <div class="reveal">
      <p class="s-label">Метали та прокат</p>
      <h2 class="s-title">З чим ми<br><em>працюємо.</em></h2>
    </div>
    <div class="reveal mat-head-right">
      <p class="mat-head-text">П'ять типів металу для різних завдань. Від атмосферостійкого кортену для дизайну — до броньової Hardox-сталі для оборонки. Кожен з власним характером і сферою застосування.</p>
      <div class="mat-head-stats">
        <div class="mat-stat"><div class="mat-stat-n">5</div><div class="mat-stat-l">типів металу</div></div>
        <div class="mat-stat"><div class="mat-stat-n">20мм</div><div class="mat-stat-l">макс. товщина</div></div>
      </div>
    </div>
  </div>
  <div class="mat-grid">
    ${materials.map(m => `<article class="mat-card reveal" data-material="${m.slug}">
      <div class="mat-img" style="background-image:url('${m.image}')"></div>
      <div class="mat-body">
        <div class="mat-name">${m.name}${m.tag ? ` <span class="mat-tag${m.tagHot ? ' mat-tag-hot' : ''}">${m.tag}</span>` : ''}</div>
        <div class="mat-desc">${m.short}</div>
        <div class="mat-spec">${m.spec}</div>
        <div class="mat-more">Натисніть щоб дізнатися більше →</div>
      </div>
    </article>`).join('')}
  </div>
</section>

<div class="mat-modal" id="matModal" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="mat-modal-inner" id="matModalInner">
    <button class="mat-modal-close" id="matModalClose" aria-label="Закрити">✕</button>
    <div class="mat-modal-img" id="matModalImg"></div>
    <div class="mat-modal-body" id="matModalBody"></div>
  </div>
</div>

<script id="matData" type="application/json">${JSON.stringify(materials)}</script>

` + footer();
}

// ── SERVICE PAGE ──
const SERVICE_FAQ = {
  'corten': [
    { q: 'Скільки коштує виріб з кортену у Львові?', a: 'Вартість залежить від складності, розміру та товщини листа. Кашпо простої форми починається від 3 000–5 000 грн, великі арт-об\'єкти — від 15 000 грн. Розрахунок безкоштовний і займає до 15 хвилин.' },
    { q: 'Як довго формується патина на кортенові?', a: 'В умовах Львова та України патина стабілізується за 1–3 роки залежно від місця розміщення. Перші місяці колір нерівномірний — це нормально. Через рік поверхня вирівнюється і набуває характерного теракотового відтінку.' },
    { q: 'Чи потрібне фарбування кортену?', a: 'Ні. Це головна перевага матеріалу — захисна патина утворюється природно і замінює фарбу. Кортен не потребує жодного обслуговування протягом десятків років.' },
    { q: 'Чи підходить кортен для вулиці взимку?', a: 'Так. Кортен чудово переносить мороз, сніг і перепади температур. Він використовується в скандинавських країнах де умови значно суворіші ніж в Україні.' },
    { q: 'Який мінімальний термін виготовлення?', a: 'Типові вироби — кашпо, огорожі, таблички — виготовляємо за 7–14 робочих днів. Складні арт-об\'єкти і великі фасадні панелі — до 6 тижнів.' }
  ],
  'laser-cutting': [
    { q: 'Яка максимальна товщина металу для лазерної різки?', a: 'Залежить від матеріалу: сталь — до 20 мм, алюміній — до 10 мм, нержавійка — до 12 мм. Оптимальна якість різу — до 8–10 мм.' },
    { q: 'Яка точність лазерної різки?', a: 'Точність ±0,1 мм. Це дозволяє виготовляти деталі з чистим краєм без додаткової обробки — одразу до складання або зварювання.' },
    { q: 'Скільки коштує лазерна різка металу у Львові?', a: 'Вартість залежить від товщини матеріалу і довжини різу. Для розрахунку надішліть DXF-файл або ескіз — прорахуємо вартість протягом 15 хвилин.' },
    { q: 'Які матеріали можна різати лазером?', a: 'Чорна сталь, нержавійка, алюміній, кортен, Hardox. Не ріжемо мідь, латунь, оцинковку (через шкідливі випари) і матеріали з відбивним покриттям.' }
  ],
  'cnc-bending': [
    { q: 'Яка точність гнуття з ЧПУ?', a: 'Точність кута ±0,5°. Для більшості архітектурних і промислових задач цього достатньо щоб деталі збирались без підгонки.' },
    { q: 'Яка максимальна товщина металу для гнуття?', a: 'До 10 мм для сталі, до 6 мм для нержавійки та алюмінію. Максимальна довжина гнуття — 3000 мм.' },
    { q: 'Чи можете зігнути деталь після лазерної різки?', a: 'Так — це стандартний ланцюжок: лазерна різка → гнуття → зварювання. Ми виконуємо всі три операції в одному місці, що скорочує терміни і виключає транспортні ризики.' },
    { q: 'Який мінімальний радіус гнуття?', a: 'Залежить від товщини матеріалу. Як правило, мінімальний внутрішній радіус = 1×товщина листа. Наш конструктор розрахує оптимальні параметри для вашого завдання.' }
  ],
  'welding': [
    { q: 'Які методи зварювання ви використовуєте?', a: 'Аргонодугове (TIG) — для нержавійки та алюмінію, напівавтомат (MIG/MAG) — для чорної сталі та кортену, ручне дугове — для важких конструкцій. Вибір методу залежить від матеріалу і вимог до шву.' },
    { q: 'Чи даєте гарантію на зварні шви?', a: 'Так, гарантія на конструкційну цілісність зварних швів. Документально підтверджуємо параметри зварювання для відповідальних конструкцій.' },
    { q: 'Чи зварюєте кортенову сталь?', a: 'Так, але це вимагає спеціальних електродів і дроту що витримують атмосферний вплив — щоб шов старів так само як основний метал і не виділявся на патині.' },
    { q: 'Чи можете вальцювати труби і профілі?', a: 'Так, вальцюємо листи і профілі для виготовлення циліндричних і конічних елементів. Мінімальний діаметр кола залежить від товщини матеріалу.' }
  ],
  'hardox': [
    { q: 'Що таке сталь Hardox і чим вона відрізняється від звичайної?', a: 'Hardox — це зносостійка броньова сталь від шведського виробника SSAB з твердістю 400–600 HB (звичайна конструкційна сталь — 120–180 HB). Вона у 3–5 разів міцніша і використовується там де важлива стійкість до ударів, зносу і пробиття.' },
    { q: 'Де купити Hardox у Львові?', a: 'FEROX LVIV постачає і обробляє листи Hardox 400, 450, 500 і 600 у Львові. Лазерна різка, гнуття і зварювання Hardox — на власному виробництві.' },
    { q: 'Яка товщина листів Hardox доступна?', a: 'Від 4 мм до 80 мм залежно від марки. Найчастіше замовляють Hardox 400 товщиною 6–20 мм для захисних конструкцій і Hardox 500 для деталей що зазнають інтенсивного зносу.' },
    { q: 'Чи працюєте з оборонними підприємствами?', a: 'Так, надаємо послуги обробки броньових сталей для підприємств оборонно-промислового комплексу. Для деталей запиту звертайтесь через форму або Telegram.' }
  ]
};

function faqBlock(slug) {
  const faqs = SERVICE_FAQ[slug];
  if (!faqs) return '';
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {"@type": "Answer", "text": f.a}
    }))
  });
  return `<section style="background:var(--bone);padding:80px 5vw">
  <script type="application/ld+json">${schema}<\/script>
  <div class="reveal" style="margin-bottom:48px">
    <p class="s-label">Часті питання</p>
    <h2 class="s-title">Відповіді на<br><em>ваші питання.</em></h2>
  </div>
  <div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">
    ${faqs.map((f, i) => `<details class="faq-item reveal" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <summary class="faq-q" itemprop="name">
        <span class="faq-num">0${i+1}</span>
        <span>${f.q}</span>
        <span class="faq-icon" aria-hidden="true"></span>
      </summary>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">${f.a}</p>
      </div>
    </details>`).join('')}
  </div>
</section>`;
}

function servicePage(s) {
  const otherServices = services.filter(x => x.slug !== s.slug);
  return head(s.metaTitle, s.metaDesc, s.keywords, `/services/${s.slug}/`) +
    nav('services') +
    pageHeader(
      [{ href: '/', label: 'Головна' }, { href: '/services/', label: 'Послуги' }, { label: s.titleShort }],
      s.titleH1,
      s.desc,
      s.deco,
      s.bgImage
    ) + `
<section>
  <div class="col2">
    <div class="reveal"><p>${s.intro[0]}</p></div>
    <div class="reveal"><p>${s.intro[1] || ''}</p></div>
  </div>
</section>

<section style="padding-top:0">
  <div class="reveal">
    <p class="s-label">Що ми пропонуємо</p>
    <h2 class="s-title">Шість причин<br>обрати <em>нас.</em></h2>
  </div>
  <div class="feat-grid">
    ${s.features.map(f => `<article class="feat reveal">
      <div class="feat-n">${f.n}</div>
      <h3 class="feat-t">${f.t}</h3>
      <p class="feat-d">${f.d}</p>
    </article>`).join('')}
  </div>
</section>

<section class="dark-section" style="padding:100px 5vw">
  <div class="reveal">
    <p class="s-label">Технічні характеристики</p>
    <h2 class="s-title" style="color:var(--white)">Що ми <em>можемо.</em></h2>
  </div>
  <div class="spec-table reveal" style="margin-top:50px;position:relative;z-index:1">
    ${s.spec.map(r => `<div class="spec-row">
      <div class="spec-k">${r.k}</div>
      <div class="spec-v">${r.v}</div>
    </div>`).join('')}
  </div>
</section>

<section>
  <div class="reveal">
    <p class="s-label">Типи виробів</p>
    <h2 class="s-title">${s.typesTitle}</h2>
  </div>
  <div style="margin-top:50px;display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--border)">
    ${s.types.map(t => `<div class="reveal" style="background:var(--bone);padding:24px 28px;font-size:14px;color:var(--anthracite);display:flex;align-items:center;gap:14px">
      <span style="width:6px;height:6px;background:var(--corten);border-radius:50%;flex-shrink:0"></span>
      <span>${t}</span>
    </div>`).join('')}
  </div>
</section>

<section class="gallery-wrap">
  <div class="reveal">
    <p class="s-label">Галерея виробів</p>
    <h2 class="s-title">Приклади <em>наших робіт.</em></h2>
    <p style="margin-top:18px;font-size:15px;color:var(--steel);line-height:1.7;font-weight:300;max-width:560px">Реалізовані проекти у напрямку «${s.titleShort.toLowerCase()}». Натисніть на фото щоб переглянути деталі.</p>
  </div>
  <div class="gallery-grid">
    ${(s.gallery || []).map((g, i) => `<a href="/portfolio/" class="gallery-item reveal${i === 0 ? ' gallery-item-wide' : ''}">
      <div class="gallery-img" style="background-image:url('${g.img}')"></div>
      <div class="gallery-overlay"></div>
      <div class="gallery-content">
        <p class="gallery-tag">${g.tag}</p>
        <h3 class="gallery-title">${g.title}</h3>
      </div>
    </a>`).join('')}
  </div>
</section>

${(s.video && s.video.youtubeId) ? `
<section class="video-section">
  <button class="video-card reveal" type="button" data-yt="${s.video.youtubeId}" aria-label="Подивитися відео: ${s.video.title || 'процес виробництва'}">
    <div class="video-thumb" style="background-image:url('${s.video.thumbnail || `https://i.ytimg.com/vi/${s.video.youtubeId}/maxresdefault.jpg`}')"></div>
    <div class="video-gradient"></div>
    <div class="video-content">
      <div class="video-play-circle" aria-hidden="true">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,.9)" stroke-width="2" fill="rgba(160,82,45,.3)"/>
          <path d="M32 26v28l22-14z" fill="#fff"/>
        </svg>
      </div>
      <div class="video-meta">
        <p class="video-label">Дивіться як ми працюємо</p>
        <h2 class="video-title">${s.video.title || 'Процес виробництва'}</h2>
      </div>
    </div>
  </button>
</section>
` : ''}

<section class="seo-section">
  <div class="reveal seo-content">
    <p class="s-label">${(s.seo && s.seo.label) || 'Детальніше про послугу'}</p>
    <h2 class="s-title" style="margin-bottom:32px">${(s.seo && s.seo.title) || s.titleShort}<br><em>${(s.seo && s.seo.titleAccent) || 'у Львові.'}</em></h2>
    <div class="seo-text">${(s.seo && s.seo.text) || ''}</div>
  </div>
</section>

${faqBlock(s.slug)}

${inlineCTA(
  'Готові замовити',
  'Опишіть проект — отримайте<br><em>розрахунок за 15 хв.</em>',
  'Безкоштовна консультація з конструктором. Точна ціна, терміни, технічні деталі.',
  'Замовити розрахунок',
  `/contact/?service=${s.slug}`
)}

<section style="background:var(--white)">
  <div class="reveal">
    <p class="s-label">Інші послуги</p>
    <h2 class="s-title">Подивіться <em>що ще</em><br>ми робимо.</h2>
  </div>
  <div class="srv-grid">
    ${otherServices.map((os, i) => `<a class="srv-card${i === 0 ? ' srv-dark' : ''} reveal" href="/services/${os.slug}/">
      <div class="srv-num">${os.num}</div>
      <h3 class="srv-title">${os.title}</h3>
      <p class="srv-desc">${os.desc}</p>
      <div class="srv-tags">${os.tags.slice(0,4).map(t => `<span class="srv-tag">${t}</span>`).join('')}</div>
      <span class="srv-arrow" aria-hidden="true">↗</span>
    </a>`).join('')}
  </div>
</section>
` + footer();
}

// ── SERVICES INDEX ──
function servicesIndex() {
  return head(
    'Послуги | FEROX LVIV — металообробка та дизайн з кортену у Львові',
    'Повний цикл металообробки у Львові: дизайн з кортену, лазерна різка, гнуття з ЧПУ, зварювання, вальцювання. Виробництво у Львові.',
    'послуги металообробки Львів, лазерна різка, гнуття, зварювання, кортен',
    '/services/'
  ) + nav('services') +
  pageHeader(
    [{ href: '/', label: 'Головна' }, { label: 'Послуги' }],
    'Повний цикл<br>металообробки.<br><em>В одному місці.</em>',
    'Чотири напрямки роботи з металом: від дизайн-об\'єктів з кортену до промислових деталей. Власне виробництво у Львові.'
  ) + `
<section style="padding-top:80px">
  <div class="srv-grid">
    ${services.map((s, i) => `<a class="srv-card${i % 2 === 0 ? ' srv-dark' : ''} reveal" href="/services/${s.slug}/">
      <div class="srv-num">${s.num}</div>
      <h3 class="srv-title">${s.title}</h3>
      <p class="srv-desc">${s.desc}</p>
      <div class="srv-tags">${s.tags.map(t => `<span class="srv-tag">${t}</span>`).join('')}</div>
      <span class="srv-arrow" aria-hidden="true">↗</span>
    </a>`).join('')}
  </div>
</section>

${inlineCTA(
  'Не знаєте з чого почати?',
  'Опишіть завдання — ми <em>підкажемо</em><br>оптимальне рішення.',
  'Безкоштовна консультація. Допоможемо обрати матеріал, технологію і підрахувати орієнтовну ціну.',
  'Отримати консультацію',
  '/contact/'
)}

` + footer();
}

// ── PORTFOLIO INDEX ──
function portfolioIndex() {
  return head(
    'Проекти | FEROX LVIV — кейси з металообробки',
    'Реалізовані проекти FEROX LVIV: дизайн-об\'єкти з кортену, металоконструкції, фасадні рішення. Кейси з фото та деталями.',
    'проекти металообробка, кейси кортен, металеві конструкції портфоліо',
    '/portfolio/'
  ) + nav('portfolio') +
  pageHeader(
    [{ href: '/', label: 'Головна' }, { label: 'Проекти' }],
    'Метал у дії.<br><em>Реалізовані проекти.</em>',
    'Вибрані роботи нашого виробництва: від дизайн-об\'єктів з кортену до промислових конструкцій. Кожен кейс — окрема історія матеріалу і рішення.'
  ) + `
<section style="padding-top:80px">
  <div class="port-grid">
    ${projects.map(p => `<a class="port-item${p.wide ? ' port-wide' : ''} reveal" href="/portfolio/${p.slug}/">
      <div class="port-inner">
        <div class="port-bg" aria-hidden="true" style="background-image:image-set(url('${p.image.replace(/\.(png|jpg|jpeg)$/i,".webp")}') type('image/webp'),url('${p.image}') type('image/jpeg'))"></div>
        <div class="port-ov" aria-hidden="true"></div>
        <div class="port-c">
          <p class="port-tag">${p.tag}</p>
          <h3 class="port-title">${p.title}</h3>
        </div>
      </div>
    </a>`).join('')}
  </div>
</section>

${inlineCTA(
  'Хочете бути наступним?',
  'Розкажіть про <em>свій проект</em> —<br>покажемо як це втілити в металі.',
  'Кожен проект починається з розмови. Ми любимо складні завдання і нестандартні рішення.',
  'Обговорити проект',
  '/contact/'
)}

` + footer();
}

// ── PROJECT PAGE ──
function projectPage(p) {
  const others = projects.filter(x => x.slug !== p.slug).slice(0, 3);
  return head(
    `${p.title} | Проект FEROX LVIV`,
    `${p.title} — реалізований проект FEROX LVIV. ${p.tag}. Виробництво у Львові.`,
    `${p.title}, проект металообробки, ${p.tag}`,
    `/portfolio/${p.slug}/`
  ) + nav('portfolio') +
  pageHeader(
    [{ href: '/', label: 'Головна' }, { href: '/portfolio/', label: 'Проекти' }, { label: p.title }],
    p.title,
    p.tag
  ) + `
<section>
  <div class="project-hero reveal" style="background-image:url('${p.image}')">
    <div class="project-hero-overlay"></div>
    <div class="project-hero-content">
      <p class="project-hero-tag">${p.tag}</p>
      <h2 class="project-hero-title">${p.title}</h2>
    </div>
  </div>

  <div class="col2">
    <div class="reveal">
      <p class="s-label">Завдання</p>
      <p>Замовник звернувся до нас з ідеєю створити унікальний об'єкт з металу, що поєднував би функціональність і виразний дизайн. Потрібно було реалізувати концепцію з урахуванням специфіки матеріалу і умов експлуатації.</p>
      <p>Особлива увага приділялась довговічності — об'єкт має зберігати естетику і функціональність протягом десятиліть, не вимагаючи постійного обслуговування.</p>
    </div>
    <div class="reveal">
      <p class="s-label">Рішення</p>
      <p>Ми обрали кортен — атмосферостійку сталь, яка з часом утворює унікальну захисну патину. Розробили креслення, погодили з замовником, і виготовили на власному виробництві у Львові.</p>
      <p>Використали лазерну різку для точних деталей, гнуття з ЧПУ для конструктивних елементів і зварювання TIG для чистих швів. Все під одним дахом.</p>
    </div>
  </div>
</section>

${inlineCTA(
  'Аналогічний проект?',
  'Розкажіть деталі —<br>ми <em>зробимо ще краще.</em>',
  'Кожен проект унікальний. Готові обговорити ваше завдання і запропонувати оптимальне рішення.',
  'Замовити подібне',
  '/contact/'
)}


<section style="background:var(--white)">
  <div class="reveal">
    <p class="s-label">Інші проекти</p>
    <h2 class="s-title">Подивіться що <em>ще</em><br>ми зробили.</h2>
  </div>
  <div class="port-grid" style="grid-template-columns:repeat(3,1fr)">
    ${others.map(op => `<a class="port-item reveal" href="/portfolio/${op.slug}/">
      <div class="port-inner">
        <div class="port-bg" aria-hidden="true" style="background-image:image-set(url('${op.image.replace(/\.(png|jpg|jpeg)$/i,".webp")}') type('image/webp'),url('${op.image}') type('image/jpeg'))"></div>
        <div class="port-ov" aria-hidden="true"></div>
        <div class="port-c">
          <p class="port-tag">${op.tag}</p>
          <h3 class="port-title">${op.title}</h3>
        </div>
      </div>
    </a>`).join('')}
  </div>
</section>
` + footer();
}

// ── ABOUT ──
function aboutPage() {
  const p = pages.about;
  return head(
    p.metaTitle,
    p.metaDesc,
    p.keywords,
    '/about/'
  ) + nav('about') +
  pageHeader(
    [{ href: '/', label: 'Головна' }, { label: 'Про нас' }],
    p.hero.h1,
    p.hero.sub,
    null,
    null,
    p.hero.label
  ) + `
<section>
  <div class="reveal">
    <p class="s-label">${p.story.label}</p>
    <h2 class="s-title" style="margin-bottom:40px">${p.story.title}</h2>
  </div>
  <div class="col2" style="gap:60px">
    ${p.story.paragraphs.map(text => `<div class="reveal">
      <p style="font-size:15px;line-height:1.85;color:var(--steel);font-weight:300">${text}</p>
    </div>`).join('')}
  </div>
</section>

<section class="dark-section" style="padding:100px 5vw">
  <div class="reveal">
    <p class="s-label">Наші цінності</p>
    <h2 class="s-title" style="color:var(--white)">На чому <em>стоїмо.</em></h2>
  </div>
  <div style="margin-top:60px;display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(160,82,45,.15);position:relative;z-index:1">
    ${p.values.map(v => `<div class="reveal" style="background:rgba(255,255,255,.02);padding:40px 36px;transition:all .4s;border:1px solid rgba(255,255,255,.04)">
      <div style="font-family:'Playfair Display',serif;font-size:48px;font-weight:900;color:var(--corten);line-height:1;margin-bottom:18px">${v.num}</div>
      <h3 style="font-family:'Playfair Display',serif;font-size:22px;color:var(--white);margin-bottom:14px;font-weight:700">${v.title}</h3>
      <p style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.75;font-weight:300">${v.desc}</p>
    </div>`).join('')}
  </div>
</section>

${inlineCTA(
  'Хочете працювати з нами?',
  'Перший крок — <em>розмова.</em><br>Розкажіть про завдання.',
  'Безкоштовна консультація. Допоможемо обрати матеріал, технологію і підрахувати ціну.',
  'Зв\'язатися з нами',
  '/contact/'
)}

` + footer();
}

// ── PROCESS ──
function processPage() {
  const p = pages.process;
  return head(
    p.metaTitle,
    p.metaDesc,
    p.keywords,
    '/process/'
  ) + nav('process') +
  pageHeader(
    [{ href: '/', label: 'Головна' }, { label: 'Як ми працюємо' }],
    p.hero.h1,
    p.hero.sub,
    null,
    null,
    p.hero.label
  ) + `
<section style="padding-top:80px">
  <div class="proc-steps">
    ${p.steps.map(step => `<div class="proc-step reveal">
      <div class="proc-num"><span>${step.num}</span></div>
      <h3 class="proc-title">${step.title}</h3>
      <p class="proc-desc">${step.desc}</p>
    </div>`).join('')}
  </div>
</section>

<section class="dark-section" style="padding:100px 5vw">
  <div class="reveal">
    <p class="s-label">Що ви отримуєте</p>
    <h2 class="s-title" style="color:var(--white)">Прозорість на<br><em>кожному етапі.</em></h2>
  </div>
  <div style="margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:1px;position:relative;z-index:1">
    ${[
      ['Швидку відповідь', 'До 15 хвилин у робочий час на будь-який запит. Не пропустимо.'],
      ['Технічну документацію', 'Креслення, специфікації, технічні характеристики — все для вашого архіву.'],
      ['Фіксовану ціну', 'Без сюрпризів і додаткових нарахувань. Що погодили — те і платите.'],
      ['Контроль виробництва', 'Фото прогресу на кожному ключовому етапі. Можете приїхати на виробництво.'],
      ['Гарантію якості', 'На матеріал, виготовлення і зварні шви. Документально.'],
      ['Постпродажну підтримку', 'Питання після здачі — на зв\'язку. Допоможемо з обслуговуванням.']
    ].map(([t, d]) => `<div class="reveal" style="background:rgba(255,255,255,.03);padding:32px;border:1px solid rgba(255,255,255,.06);transition:all .4s">
      <div style="font-family:'Playfair Display',serif;font-size:18px;color:var(--white);margin-bottom:10px;font-weight:700">${t}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.45);line-height:1.7;font-weight:300">${d}</div>
    </div>`).join('')}
  </div>
</section>

${inlineCTA(
  'Готові почати?',
  'Залиште заявку —<br>відповімо <em>протягом 15 хвилин.</em>',
  'Перший етап — безкоштовний. Розберемо завдання, запропонуємо рішення.',
  'Залишити заявку',
  '/contact/'
)}

` + footer();
}

// ── CONTACT ──
function contactPage() {
  const p = pages.contact;
  const channelIcons = {
    telegram: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#229ED9"/><path d="M22.96 10.04L20.4 22.16c-.2.84-.68 1.04-1.36.64l-3.76-2.76-1.8 1.72c-.2.2-.36.36-.76.36l.28-3.84 7.04-6.36c.32-.28-.04-.44-.48-.16l-8.72 5.44-3.76-1.16c-.84-.24-.84-.84.16-1.24l14.68-5.64c.68-.24 1.28.16 1.04 1.24z" fill="#fff"/></svg>',
    instagram: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="ig-grad-c" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FED576"/><stop offset="20%" stop-color="#F47133"/><stop offset="40%" stop-color="#BC3081"/><stop offset="80%" stop-color="#4C63D2"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#ig-grad-c)"/><rect x="8" y="8" width="16" height="16" rx="5" stroke="#fff" stroke-width="1.8" fill="none"/><circle cx="16" cy="16" r="3.6" stroke="#fff" stroke-width="1.8" fill="none"/><circle cx="21" cy="11" r="1.1" fill="#fff"/></svg>',
    pinterest: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#E60023"/><path d="M16 6c-5.52 0-10 4.48-10 10 0 4.24 2.64 7.84 6.36 9.32-.08-.8-.16-2 .04-2.88.16-.76 1.16-4.92 1.16-4.92s-.32-.6-.32-1.48c0-1.4.8-2.44 1.8-2.44.84 0 1.24.64 1.24 1.4 0 .84-.56 2.12-.84 3.32-.24 1 .48 1.8 1.48 1.8 1.76 0 3.12-1.88 3.12-4.6 0-2.4-1.72-4.08-4.16-4.08-2.84 0-4.52 2.12-4.52 4.32 0 .84.32 1.76.76 2.28.08.12.08.16.08.24-.08.32-.24 1-.28 1.16-.04.16-.16.24-.32.16-1.16-.52-1.84-2.2-1.84-3.6 0-2.92 2.12-5.6 6.12-5.6 3.2 0 5.72 2.28 5.72 5.36 0 3.2-2 5.76-4.8 5.76-.92 0-1.84-.48-2.12-1.04l-.6 2.2c-.2.84-.76 1.88-1.16 2.52.84.24 1.76.4 2.72.4 5.52 0 10-4.48 10-10s-4.48-10-10-10z" fill="#fff"/></svg>',
    mail: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#A0522D"/><path d="M8 11l8 6 8-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="8" y="10" width="16" height="12" rx="1.5" stroke="#fff" stroke-width="1.8" fill="none"/></svg>'
  };
  return head(
    p.metaTitle,
    p.metaDesc,
    p.keywords,
    '/contact/'
  ) + nav('contact').replace('id="nav"', 'id="nav" class="always-light"') + `
<section style="padding-top:120px;padding-bottom:0">
  <div class="crumbs" style="color:var(--steel);margin-bottom:30px;display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.1em;text-transform:uppercase">
    <a href="/" style="color:var(--corten)">Головна</a><span style="color:var(--corten)">/</span><span>Контакт</span>
  </div>
</section>

${contactSection('', p.hero.title).replace('<section id="contact">', '<section id="contact" style="padding-top:0">')}

<section class="qc-wrap">
  <div class="reveal" style="text-align:center;margin-bottom:50px">
    <p class="s-label" style="justify-content:center;display:flex">Швидкі контакти</p>
    <h2 class="s-title" style="text-align:center">Як вам <em>зручно.</em></h2>
    <p style="font-size:15px;color:var(--steel);max-width:520px;margin:18px auto 0;line-height:1.7;font-weight:300">${p.hero.sub}</p>
  </div>
  <div class="qc-grid">
    ${p.channels.map(c => `<a href="${c.url}" class="qc-card reveal"${c.url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>
      <div class="qc-icon qc-icon-${c.icon}">${channelIcons[c.icon] || ''}</div>
      <div class="qc-body">
        <div class="qc-name">${c.name}</div>
        <div class="qc-handle">${c.handle}</div>
        <div class="qc-desc">${c.desc}</div>
      </div>
      <span class="qc-arrow" aria-hidden="true">↗</span>
    </a>`).join('')}
  </div>
</section>


<section class="gmap-section">
  <div class="gmap-inner reveal">
    <div class="gmap-map">
      <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2573.4!2d24.0308715!3d49.8395669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xadeda1de440983c9:0xde677f2b89b98b1c!2sFerox%20Lviv!5e0!3m2!1suk!2sua!4v1!5m2!1suk!2sua" width="100%" height="100%" style="border:0;display:block" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="FEROX LVIV на Google Maps"></iframe>
    </div>
    <div class="gmap-card">
      <div class="gmap-logo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#a0522d"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>
        <span>FEROX LVIV</span>
      </div>
      <div class="gmap-rating">
        <span class="gmap-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        <a href="https://www.google.com/maps?cid=16025917623992159004" target="_blank" rel="noopener" class="gmap-review-count">5.0 · 2 відгуки · Google</a>
      </div>
      <div class="gmap-details">
        <div class="gmap-detail-row">
          <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 2C6.69 2 4 4.69 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.31-2.69-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" fill="currentColor"/></svg>
          <span>площа Міцкевича, 10, Львів</span>
        </div>
        <div class="gmap-detail-row">
          <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" fill="currentColor"/></svg>
          <a href="tel:+380630194013" class="gmap-phone">${site.contacts.phone}</a>
        </div>
        <div class="gmap-detail-row">
          <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" fill="currentColor"/></svg>
          <span>Пн&#8211;Пт, 09:00&#8211;18:00</span>
        </div>
        <div class="gmap-detail-row">
          <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" fill="currentColor"/></svg>
          <a href="https://feroxlviv.com.ua" class="gmap-phone">feroxlviv.com.ua</a>
        </div>
      </div>
      <div class="gmap-actions">
        <a href="https://www.google.com/maps/dir/?api=1&destination=49.8395669,24.0308715" target="_blank" rel="noopener" class="gmap-btn gmap-btn-primary">&#9655; Маршрут</a>
        <a href="https://www.google.com/maps?cid=16025917623992159004&hl=uk&actiontype=WriteReview" target="_blank" rel="noopener" class="gmap-btn gmap-btn-outline">&#9733; Залишити відгук</a>
      </div>
      <a href="https://www.google.com/maps/place/Ferox+Lviv/@49.8395669,24.0308715,17z" target="_blank" rel="noopener" class="gmap-open">Відкрити в Google Maps &#8599;</a>
    </div>
  </div>
</section>
` + footer();
}

// ════════════════════════════════════════════════════════
// BUILD
// ════════════════════════════════════════════════════════
function writeFile(p, content) {
  const full = path.join(OUT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('  ✓', p);
}

// ════════════════════════════════════════════════════════
// BLOG
// ════════════════════════════════════════════════════════

function blogListPage() {
  const formatDate = (iso) => {
    const d = new Date(iso);
    const months = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  return head(
    'Блог FEROX LVIV — статті про метал, кортен і архітектуру',
    'Корисні статті про металообробку, кортенову сталь, дизайн-об\'єкти та тренди в архітектурі. Досвід команди FEROX LVIV.',
    'блог металообробка, кортен статті, архітектура метал',
    '/blog/'
  ) + nav('blog') +
  pageHeader(
    [{ href: '/', label: 'Головна' }, { label: 'Блог' }],
    'Знання та<br><em>досвід.</em>',
    'Статті про матеріали, технології та дизайн з металу — від команди FEROX LVIV.',
    null, null, 'Блог'
  ) + `
<section style="padding-top:60px">
  ${blogPosts.length === 0 ? '<p style="color:var(--steel);text-align:center;padding:60px 0">Статті незабаром з\'являться.</p>' : `
  <div class="blog-grid">
    ${blogPosts.map(post => `<article class="blog-card reveal">
      ${post.image ? `<a href="/blog/${post.slug}/" class="blog-card-img" style="background-image:url('${post.image}')"></a>` : `<a href="/blog/${post.slug}/" class="blog-card-img blog-card-img-placeholder"></a>`}
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-tag">${post.category || 'Стаття'}</span>
          <span class="blog-date">${formatDate(post.date)}</span>
          ${post.readTime ? `<span class="blog-read">${post.readTime} хв читання</span>` : ''}
        </div>
        <h2 class="blog-card-title"><a href="/blog/${post.slug}/">${post.title}</a></h2>
        <p class="blog-card-excerpt">${post.excerpt || ''}</p>
        <a href="/blog/${post.slug}/" class="blog-card-link">Читати далі
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
    </article>`).join('')}
  </div>`}
</section>

${inlineCTA(
  'Маєте питання про матеріали?',
  'Проконсультуємо<br>безкоштовно. <em>Відповідь за 15 хв.</em>',
  'Наш конструктор допоможе обрати матеріал і технологію для вашого проекту.',
  'Отримати консультацію',
  '/contact/'
)}
` + footer();
}

function blogPostPage(post) {
  const formatDate = (iso) => {
    const d = new Date(iso);
    const months = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  const otherPosts = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  return head(
    post.metaTitle || `${post.title} | FEROX LVIV`,
    post.metaDesc || post.excerpt || '',
    post.keywords || `${post.category}, FEROX LVIV, металообробка Львів`,
    `/blog/${post.slug}/`
  ) + nav('blog') +
  `<section class="ph">
  <div class="ph-bg" aria-hidden="true"></div>
  <div class="ph-bg-warm" aria-hidden="true"></div>
  <div class="ph-grid" aria-hidden="true"></div>
  <div class="ph-vline" aria-hidden="true"></div>
  <nav class="crumbs" aria-label="Хлібні крихти">
    <a href="/">Головна</a><span class="crumbs-sep">/</span>
    <a href="/blog/">Блог</a><span class="crumbs-sep">/</span>
    <span>${post.title}</span>
  </nav>
  <p class="ph-label" style="position:relative;z-index:1;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--corten);margin:24px 0 16px">${post.category || 'Стаття'}</p>
  <h1 class="ph-h1" style="max-width:800px">${post.title}</h1>
  <div class="blog-post-meta" style="position:relative;z-index:1;display:flex;gap:20px;margin-top:20px;font-size:13px;color:rgba(255,255,255,.5)">
    <span>${formatDate(post.date)}</span>
    ${post.readTime ? `<span>${post.readTime} хв читання</span>` : ''}
    <span>Команда FEROX LVIV</span>
  </div>
</section>

<section style="padding-top:60px;padding-bottom:80px">
  <div style="display:grid;grid-template-columns:1fr 320px;gap:80px;align-items:start">
    <article class="blog-post-content reveal">
      ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px;margin-bottom:40px">` : ''}
      ${post.content || ''}
    </article>
    <aside style="position:sticky;top:100px">
      <div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:28px;margin-bottom:28px">
        <p style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--corten);margin-bottom:16px">Про матеріал</p>
        <p style="font-size:14px;color:var(--steel);line-height:1.7;margin-bottom:20px">Маєте питання щодо кортену або іншого матеріалу для вашого проекту?</p>
        <a href="/contact/" class="btn-p" style="width:100%;text-align:center;display:block;padding:12px;font-size:13px">Отримати консультацію</a>
      </div>
      <div style="background:var(--white);border:1px solid var(--border);border-radius:4px;padding:28px">
        <p style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--corten);margin-bottom:16px">Наші послуги</p>
        ${services.slice(0,4).map(s => `<a href="/services/${s.slug}/" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);color:var(--anthracite);font-size:14px;text-decoration:none;transition:color .25s">
          <span style="font-size:10px;color:var(--corten)">0${s.num}</span>
          <span>${s.titleShort}</span>
        </a>`).join('')}
      </div>
    </aside>
  </div>
</section>

${otherPosts.length > 0 ? `<section style="background:var(--bone);padding:80px 5vw">
  <div class="reveal" style="margin-bottom:40px">
    <p class="s-label">Читайте також</p>
    <h2 class="s-title">Інші <em>статті.</em></h2>
  </div>
  <div class="blog-grid">
    ${otherPosts.map(p => `<article class="blog-card reveal">
      <a href="/blog/${p.slug}/" class="blog-card-img blog-card-img-placeholder"></a>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-tag">${p.category || 'Стаття'}</span>
          <span class="blog-date">${formatDate(p.date)}</span>
        </div>
        <h3 class="blog-card-title"><a href="/blog/${p.slug}/">${p.title}</a></h3>
        <a href="/blog/${p.slug}/" class="blog-card-link">Читати
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
    </article>`).join('')}
  </div>
</section>` : ''}

${inlineCTA(
  'Є питання по проекту?',
  'Описуйте завдання —<br><em>відповімо за 15 хвилин.</em>',
  'Безкоштовна консультація. Підберемо матеріал і розрахуємо вартість.',
  'Замовити розрахунок',
  '/contact/'
)}
` + footer();
}

// ── ARCHITECTS LANDING PAGE ──────────────────────────────────
function architectPage() {
  return head(
    'FEROX LVIV для архітекторів | Кортен під авторський проект',
    'Виготовляємо кортен-об\'єкти точно за специфікацією архітектора. Безкоштовна перевірка креслень, текстури 4K для рендеру, зразки матеріалу. Виробництво у Львові.',
    'кортен для архітекторів, COR-TEN дизайн, архітектурний метал Львів, металеві арт-об\'єкти, фасадні касети кортен, дизайн інтер\'єр кортен',
    '/architects/'
  ) + nav('') + `

<!-- ═══ HERO ════════════════════════════════════════════════ -->
<section class="arch-hero">
  <div class="arch-hero-bg" aria-hidden="true">
    <picture>
      <source srcset="/uploads/hero-bg.webp" type="image/webp">
      <img src="/uploads/hero-bg.jpg" class="arch-hero-img" alt="Арт-скульптура з кортенової сталі у преміальному інтер'єрі — FEROX LVIV" loading="eager" fetchpriority="high" decoding="async">
    </picture>
    <div class="arch-hero-ov"></div>
    <div class="arch-hero-line"></div>
  </div>

  <div class="arch-hero-body">
    <p class="arch-hero-label">Для архітекторів та дизайнерів</p>
    <h1 class="arch-h1">Метал,<br>що прикрашає<br><em>простір.</em></h1>
    <p class="arch-hero-sub">Кортен-об'єкти під авторський проект. Ми перевіряємо креслення, консультуємо по матеріалу — і виготовляємо так, щоб результат збігся з рендером.</p>
    <div class="arch-hero-btns">
      <a href="#catalog" class="btn-p">
        <span>Отримати каталог і зразки</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="#patina" class="btn-g"><span>Як виглядає кортен через рік?</span></a>
    </div>
  </div>

  <div class="arch-trust-bar">
    <div class="arch-trust-item">
      <span class="arch-trust-n">Free</span>
      <span class="arch-trust-l">Перевірка креслень</span>
    </div>
    <div class="arch-trust-item">
      <span class="arch-trust-n">3D</span>
      <span class="arch-trust-l">Підтримка в проекті</span>
    </div>
    <div class="arch-trust-item">
      <span class="arch-trust-n">NDA</span>
      <span class="arch-trust-l">Конфіденційність</span>
    </div>
    <div class="arch-trust-item">
      <span class="arch-trust-n">Box</span>
      <span class="arch-trust-l">Зразки матеріалу</span>
    </div>
  </div>
</section>

<!-- ═══ 3 ПРИЧИНИ ═══════════════════════════════════════════ -->
<section class="arch-why">
  <div class="arch-why-head reveal">
    <p class="s-label">Чому обирають нас</p>
    <h2 class="s-title">Ми говоримо<br><em>вашою мовою.</em></h2>
  </div>
  <div class="arch-why-grid">
    <div class="arch-why-card reveal">
      <div class="arch-why-num">01</div>
      <h3 class="arch-why-t">Технічний супровід безкоштовно</h3>
      <p class="arch-why-d">Наш конструктор перевіряє ваші DWG/DXF-файли до запуску у виробництво. Розраховуємо радіус гнуття, товщину листа, вузли кріплення — щоб проект не розвалився на монтажі.</p>
    </div>
    <div class="arch-why-card reveal">
      <div class="arch-why-num">02</div>
      <h3 class="arch-why-t">Точно як у рендері</h3>
      <p class="arch-why-d">Виготовляємо за погодженими кресленнями з відхиленням ±1 мм для лазерної різки. Жодних «ну приблизно так» — результат збігається з тим, що ви показали замовнику.</p>
    </div>
    <div class="arch-why-card reveal">
      <div class="arch-why-num">03</div>
      <h3 class="arch-why-t">Захищаємо ваш авторитет</h3>
      <p class="arch-why-d">Якщо на монтажі щось не сходиться — вирішуємо за свій рахунок. Ваш клієнт не дізнається. Нам важливо, щоб ви рекомендували нас наступним замовникам.</p>
    </div>
  </div>
</section>

<!-- ═══ ТАЙМЛАЙН ПАТИНИ ══════════════════════════════════════ -->
<section class="patina-section" id="patina">
  <div class="patina-head reveal">
    <p class="s-label">Важливо знати</p>
    <h2 class="s-title" style="color:var(--white)">Як кортен<br><em>дозріває.</em></h2>
    <p class="patina-intro">Кортен з цеху виглядає як звичайна сталь. Це нормально — патина формується на повітрі після монтажу. Покажіть це замовнику заздалегідь, щоб уникнути непорозумінь.</p>
  </div>

  <div class="patina-widget reveal">
    <div class="pw-meta">
      <span class="pw-stage" id="pw-stage">Чистий метал · з заводу</span>
      <div class="pw-swatch-row">
        <div id="pw-dot" class="pw-dot" style="background:#989696"></div>
        <span class="pw-dn">COR-TEN A · 4 мм</span>
      </div>
    </div>
    <div class="patina-sc">
      <div class="patina-cw"><canvas id="patina-cv"></canvas></div>
    </div>
    <input type="range" id="patina-rng" min="0" max="100" value="0" step="1" class="pw-range">
    <div class="pw-labels">
      <span>З заводу</span><span>1 рік</span><span>5+ років</span>
    </div>
    <div class="pw-specs">
      <div class="pw-spec"><div class="pw-sl">Матеріал</div><div class="pw-sv">COR-TEN A</div></div>
      <div class="pw-spec"><div class="pw-sl">Товщина</div><div class="pw-sv">4 мм</div></div>
      <div class="pw-spec"><div class="pw-sl">Обробка</div><div class="pw-sv">Лазерне гравіювання</div></div>
      <div class="pw-spec"><div class="pw-sl">Патина</div><div class="pw-sv" id="pw-patina">Не сформована</div></div>
    </div>
  </div>

  <script>
  (function(){
    var W=640,H=190,RX=5;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var cv=document.getElementById('patina-cv');
    if(!cv)return;
    cv.width=W*dpr;cv.height=H*dpr;

    /* ── Color stops ─────────────────────────────── */
    var STOPS=[
      {v:0,  rgb:[152,150,146]},{v:14, rgb:[111,74,58]},{v:28, rgb:[139,79,51]},
      {v:42, rgb:[160,82,45]}, {v:57, rgb:[141,65,36]},{v:71, rgb:[115,53,33]},
      {v:85, rgb:[94,46,30]},  {v:100,rgb:[80,36,22]}
    ];
    function getBase(v){
      for(var i=0;i<STOPS.length-1;i++){
        var a=STOPS[i],b=STOPS[i+1];
        if(v<=b.v){var t=(v-a.v)/(b.v-a.v);
          return[Math.round(a.rgb[0]+(b.rgb[0]-a.rgb[0])*t),
                 Math.round(a.rgb[1]+(b.rgb[1]-a.rgb[1])*t),
                 Math.round(a.rgb[2]+(b.rgb[2]-a.rgb[2])*t)];}
      }
      return STOPS[STOPS.length-1].rgb.slice();
    }

    /* ── Noise helpers ───────────────────────────── */
    function mkRng(s){var x=s>>>0;return function(){x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
    function gn1(y){
      var h1=Math.sin(y*.22+2.718)*43758.545,h2=Math.sin(y*.06+1.618)*31337.1;
      return((h1-Math.floor(h1))*.65+(h2-Math.floor(h2))*.35)*2-1;
    }
    function oNoise(x,y,s){
      var n=0;
      n+=Math.sin(x*.016+y*.011+s)*.45;
      n+=Math.sin(x*.011+y*.024+s*1.4)*.28;
      n+=Math.sin(x*.038+y*.028+s*.9+n)*.20;
      n+=Math.sin(x*.065+y*.052+s*1.9)*.14;
      n+=Math.sin(x*.10 +y*.082+s*2.3)*.09;
      n+=Math.sin(x*.18 +y*.14 +s*1.1)*.05;
      return Math.max(-1,Math.min(1,n/1.21));
    }

    /* ── Clip helper ─────────────────────────────── */
    function clipRound(ctx){
      ctx.beginPath();
      ctx.moveTo(RX,0);ctx.lineTo(W-RX,0);ctx.arcTo(W,0,W,RX,RX);
      ctx.lineTo(W,H-RX);ctx.arcTo(W,H,W-RX,H,RX);
      ctx.lineTo(RX,H);ctx.arcTo(0,H,0,H-RX,RX);
      ctx.lineTo(0,RX);ctx.arcTo(0,0,RX,0,RX);
      ctx.closePath();ctx.clip();
    }

    /* ── OFFSCREEN TEXTURE — grey base (#808080) ──
       overlay blend: grey=neutral, dark<128=darken-warm,
       light>128=lighten-warm — preserves hue of corten base ── */
    var texEl=document.createElement('canvas');
    texEl.width=W*dpr;texEl.height=H*dpr;
    var tctx=texEl.getContext('2d');
    tctx.scale(dpr,dpr);

    function buildTexture(){
      /* Grey neutral base — overlay(128,any)=any → no change */
      tctx.fillStyle='#808080';
      tctx.fillRect(0,0,W,H);

      /* Horizontal grain: lighter/darker grey lines on grey base */
      for(var y=0;y<H;y++){
        var n=gn1(y);
        var al=Math.abs(n)*.22;if(al<.016)continue;
        var col=n>0?255:0; /* white or black over grey */
        tctx.fillStyle='rgba('+col+','+col+','+col+','+al.toFixed(3)+')';
        tctx.fillRect(0,y,W,1);
      }

      /* Organic blobs — opaque grey values (48–210) for strong overlay */
      var ST=6;
      for(var py=0;py<H;py+=ST){for(var px=0;px<W;px+=ST){
        var n=oNoise(px,py,7.31);var abs=Math.abs(n);
        if(abs<.07)continue;
        var al=(abs-.07)*.65;if(al<.02)continue;
        var col=n>0?255:0;
        tctx.fillStyle='rgba('+col+','+col+','+col+','+Math.min(.55,al).toFixed(3)+')';
        tctx.fillRect(px,py,ST,ST);
      }}

      /* Flow marks — dark grey over grey = very dark → strong overlay darkening */
      var rndF=mkRng(77);
      for(var i=0;i<9;i++){
        var fx=rndF()*W,fw=rndF()*5+1.5,fa=rndF()*.18;
        if(fa<.015)continue;
        var fgr=tctx.createLinearGradient(0,0,0,H);
        fgr.addColorStop(0,'rgba(0,0,0,0)');
        fgr.addColorStop(.2+rndF()*.1,'rgba(0,0,0,'+(fa*.6).toFixed(3)+')');
        fgr.addColorStop(.65+rndF()*.1,'rgba(0,0,0,'+fa.toFixed(3)+')');
        fgr.addColorStop(1,'rgba(0,0,0,'+(fa*.2).toFixed(3)+')');
        tctx.fillStyle=fgr;tctx.fillRect(fx-fw/2,0,fw,H);
      }

      /* Fine specks — strong white/black over grey */
      var rnd2=mkRng(137);
      for(var i=0;i<450;i++){
        var fx=rnd2()*W,fy=rnd2()*H,fs=rnd2()*2.5+.6;
        var brt=rnd2()>.5,al=rnd2()*.14+.04;
        var col=brt?255:0;
        tctx.fillStyle='rgba('+col+','+col+','+col+','+al.toFixed(3)+')';
        tctx.fillRect(fx,fy,fs,fs);
      }

      /* Edge vignette — dark over grey → below-128 → overlay darkens plate */
      var vgr=tctx.createLinearGradient(0,0,0,H);
      vgr.addColorStop(0,'rgba(0,0,0,.44)');
      vgr.addColorStop(.08,'rgba(0,0,0,0)');
      vgr.addColorStop(.92,'rgba(0,0,0,0)');
      vgr.addColorStop(1,'rgba(0,0,0,.55)');
      tctx.fillStyle=vgr;tctx.fillRect(0,0,W,H);

      /* Left edge light */
      var lgr=tctx.createLinearGradient(0,0,W*.13,0);
      lgr.addColorStop(0,'rgba(255,255,255,.14)');
      lgr.addColorStop(1,'rgba(255,255,255,0)');
      tctx.fillStyle=lgr;tctx.fillRect(0,0,W*.13,H);

      /* Top rim */
      tctx.fillStyle='rgba(255,255,255,.18)';
      tctx.fillRect(0,0,W,1.5);
    }

    /* ── OFFSCREEN CELLULAR (v>62) — dark on transparent ── */
    var cellEl=document.createElement('canvas');
    cellEl.width=W*dpr;cellEl.height=H*dpr;
    var cctx=cellEl.getContext('2d');
    cctx.scale(dpr,dpr);

    function buildCell(){
      var CS=5;
      for(var py=0;py<H;py+=CS){for(var px=0;px<W;px+=CS){
        var n0=oNoise(px,py,4.71),nx=oNoise(px+CS,py,4.71),ny=oNoise(px,py+CS,4.71);
        var edge=Math.max(Math.abs(n0-nx),Math.abs(n0-ny));
        if(edge<.08)continue;
        var al=(edge-.08)*3.2*.45;if(al<.01)continue;
        cctx.fillStyle='rgba(0,0,0,'+Math.min(.48,al).toFixed(3)+')';
        cctx.fillRect(px,py,CS,CS);
      }}
    }

    /* ── DRAW: only GPU ops per frame ────────────── */
    function draw(v){
      var ctx=cv.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var rgb=getBase(v);
      var wm=Math.min(1,v/20);
      var cellBlend=Math.max(0,(v-62)/38);

      ctx.save();
      clipRound(ctx);

      /* 1. Base color fill */
      ctx.fillStyle='rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
      ctx.fillRect(0,0,W,H);

      /* 2. Metallic sheen at v=0 (cheap gradient) */
      if(wm<1){
        var a=(1-wm)*.09;
        var sh=ctx.createLinearGradient(0,0,W,0);
        sh.addColorStop(0,'rgba(255,255,255,0)');
        sh.addColorStop(.38,'rgba(255,255,255,'+a.toFixed(3)+')');
        sh.addColorStop(.65,'rgba(255,255,255,'+(a*.45).toFixed(3)+')');
        sh.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=sh;ctx.fillRect(0,0,W,H);
      }

      /* 3. OVERLAY texture — grey base preserves warm hue of corten base */
      /*    overlay(128)=neutral, overlay(dark)=darken-warm, overlay(light)=lighten-warm */
      if(wm>0){
        ctx.globalCompositeOperation='overlay';
        ctx.globalAlpha=Math.min(1,wm*1.08);
        ctx.drawImage(texEl,0,0,W,H);
        ctx.globalAlpha=1;
        ctx.globalCompositeOperation='source-over';
      }

      /* 4. Cellular pattern (source-over — dark edges on warm base) */
      if(cellBlend>.01){
        ctx.globalAlpha=cellBlend;
        ctx.drawImage(cellEl,0,0,W,H);
        ctx.globalAlpha=1;
      }

      /* 5. Laser-cut text: erase to transparent (concrete shows through) */
      ctx.globalCompositeOperation='destination-out';
      ctx.font='400 23px "DM Sans",Arial,sans-serif';
      try{ctx.letterSpacing='2.5px';}catch(e){}
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(0,0,0,1)';
      ctx.fillText('feroxlviv.com.ua',W/2,H/2+1);
      ctx.globalCompositeOperation='source-over';

      ctx.restore();
    }

    /* ── Labels ──────────────────────────────────── */
    var LBL=[
      ['Чистий метал \xb7 з заводу','Не сформована'],
      ['Початок окислення \xb7 2\u20134 тижні','Початкова'],
      ['Перша патина \xb7 1\u20132 місяці','Рання'],
      ['Активна патина \xb7 3\u20136 місяців','Активна'],
      ['Стабілізація \xb7 6\u201312 місяців','Стабілізується'],
      ['Зріла патина \xb7 1\u20133 роки','Зріла'],
      ['Стара патина \xb7 5+ років','Стара'],
      ['Стара патина \xb7 5+ років','Стара']
    ];

    /* ── RAF throttle ────────────────────────────── */
    var pending=false,curV=0;
    function upd(v){
      curV=v;
      if(pending)return;
      pending=true;
      requestAnimationFrame(function(){
        pending=false;
        draw(curV);
        var c=getBase(curV);
        var dot=document.getElementById('pw-dot');
        var stg=document.getElementById('pw-stage');
        var pat=document.getElementById('pw-patina');
        if(dot)dot.style.background='rgb('+c[0]+','+c[1]+','+c[2]+')';
        var s=Math.min(7,Math.floor(curV/100*8));
        if(stg)stg.textContent=LBL[s][0];
        if(pat)pat.textContent=LBL[s][1];
      });
    }

    var rng=document.getElementById('patina-rng');
    if(rng)rng.addEventListener('input',function(){upd(+this.value);});

    /* ── Init: heavy loops once, then draw ───────── */
    function init(){buildTexture();buildCell();upd(0);}
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(init);}
    else{setTimeout(init,400);}
  })();
  </script>

  <div class="patina-note reveal">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <p>Якщо проект передбачає кортен поруч зі світлою плиткою або фасадом — ми проектуємо приховані водовідвідні лотки або пропонуємо обробку лаком-фіксатором патини. Деталі — у каталозі.</p>
  </div>
</section>

<!-- ═══ ЩО ВХОДИТЬ У КАТАЛОГ ════════════════════════════════ -->
<section class="arch-catalog-section">
  <div class="reveal">
    <p class="s-label">Що ви отримаєте</p>
    <h2 class="s-title">Набір інструментів<br><em>для архітектора.</em></h2>
  </div>
  <div class="arch-catalog-grid reveal">
    <div class="arch-cat-item">
      <div class="arch-cat-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" stroke-width="1.5"/></svg>
      </div>
      <h3 class="arch-cat-t">PDF-каталог виробів</h3>
      <p class="arch-cat-d">Преміальний документ, який можна показати замовнику. Матеріал, технології, приклади застосування, вузли кріплення.</p>
    </div>
    <div class="arch-cat-item">
      <div class="arch-cat-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 9h18M9 3v18" stroke="currentColor" stroke-width="1.5"/></svg>
      </div>
      <h3 class="arch-cat-t">Текстури Corten 4K</h3>
      <p class="arch-cat-d">Seamless-текстури для 3ds Max, Corona/Vray, Lumion. Три стадії патини — для реалістичного рендеру без пошуку по стокам.</p>
    </div>
    <div class="arch-cat-item">
      <div class="arch-cat-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <h3 class="arch-cat-t">Таймлайн патини</h3>
      <p class="arch-cat-d">Гайд «День 1 → Рік 2» з реальними фото та поясненнями для замовника. Знімає 80% питань ще до монтажу.</p>
    </div>
    <div class="arch-cat-item">
      <div class="arch-cat-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM1 10h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>
      <h3 class="arch-cat-t">Box зразків матеріалу</h3>
      <p class="arch-cat-d">Три плашки кортену: свіжа, рання патина, зріла. Безкоштовна відправка — щоб замовник потримав матеріал у руках до ухвалення рішення.</p>
    </div>
  </div>
</section>

<!-- ═══ ФОРМА — ОТРИМАТИ КАТАЛОГ ═════════════════════════════ -->
<section class="arch-lead" id="catalog">
  <div class="arch-lead-grid">
    <div class="arch-lead-text reveal">
      <p class="s-label" style="color:var(--corten-l)">Отримати безкоштовно</p>
      <h2 class="arch-lead-h">Каталог, текстури<br>і зразки матеріалу.</h2>
      <ul class="arch-lead-list">
        <li>PDF-каталог виробів FEROX з технічними вузлами</li>
        <li>Текстури Corten 4K для Corona / Vray / Lumion</li>
        <li>Таймлайн патини для показу замовнику</li>
        <li>Box зразків — безкоштовна відправка по Україні</li>
      </ul>
      <p class="arch-lead-note">Надішлемо в Telegram протягом 2 годин у робочий час.</p>
    </div>
    <form class="arch-form c-form reveal" data-form="contact" novalidate aria-label="Форма для архітекторів">
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
      <input type="hidden" name="service" value="arch-catalog">
      <input type="hidden" name="message" value="Запит на каталог і зразки матеріалу. Сторінка для архітекторів.">
      <div class="f-group">
        <label class="f-label" for="arch-type">Що вас цікавить</label>
        <select class="f-input" id="arch-type" name="arch_type" style="appearance:none;background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path d=%22M2 4l4 4 4-4%22 stroke=%22%23a0522d%22 stroke-width=%221.4%22 fill=%22none%22/></svg>');background-repeat:no-repeat;background-position:right 14px center">
          <option value="">Оберіть тип запиту</option>
          <option value="catalog">PDF-каталог і зразки матеріалу</option>
          <option value="textures">Текстури Corten 4K для рендеру</option>
          <option value="consult">Технічна консультація по проекту</option>
          <option value="partner">Партнерська / агентська програма</option>
          <option value="other">Інше</option>
        </select>
      </div>
      <div class="f-group">
        <label class="f-label" for="arch-name">Ваше ім'я *</label>
        <input class="f-input" type="text" id="arch-name" name="name" placeholder="Ім'я та прізвище" required autocomplete="name">
      </div>
      <div class="f-group">
        <label class="f-label" for="arch-phone">Телефон або Telegram *</label>
        <input class="f-input" type="tel" id="arch-phone" name="phone" placeholder="+380 xx xxx xx xx" required autocomplete="tel">
      </div>
      <div class="f-group">
        <label class="f-label" for="arch-studio">Студія або Instagram</label>
        <input class="f-input" type="text" id="arch-studio" placeholder="@yourstudio або Студія XYZ">
      </div>
      <button type="submit" class="btn-dark" style="width:100%;justify-content:center">
        <span>Отримати каталог і зразки</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>
  </div>
</section>

<!-- ═══ ПАРТНЕРСЬКА ПРОГРАМА ══════════════════════════════════ -->
<section class="arch-partner">
  <div class="arch-partner-inner">
    <div class="reveal">
      <p class="s-label" style="color:rgba(255,255,255,.5)">Для постійних партнерів</p>
      <h2 class="s-title" style="color:var(--white)">Агентська<br><em>програма.</em></h2>
      <p class="arch-partner-d">Якщо ви закладаєте вироби FEROX у специфікацію проекту — отримуєте фіксовану агентську винагороду після оплати замовником. Умови та деталі — в особистій розмові.</p>
    </div>
    <a href="/contact/" class="btn-p arch-partner-btn reveal">
      <span>Обговорити умови співпраці</span>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</section>

${inlineCTA(
  'Є питання по проекту?',
  'Надішліть DWG або опишіть ідею —<br><em>відповімо за 2 години.</em>',
  'Безкоштовна перевірка креслень. Підберемо матеріал і товщину під ваше завдання.',
  'Надіслати запит',
  '/contact/'
)}
` + footer();
}

// ══════════════════════════════════════════════════════════════
// CATALOG DATA — ВИРОБИ З МЕТАЛУ
// ══════════════════════════════════════════════════════════════
const catalogProducts = [
  {
    slug: 'kashpo',
    title: 'Кашпо та клумби',
    titleH1: 'Кашпо та клумби<br><em>з кортену.</em>',
    sub: 'Ландшафтний дизайн',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-kashpo-rectangle.webp',
    desc: "Об'ємні та плоскі форми для саду і тераси. Природна патина без обслуговування.",
    descFull: "Кашпо та клумби з кортенової сталі — один з найпопулярніших виробів для ландшафтного дизайну. Атмосферостійка сталь COR-TEN формує захисну патину теплого коричнево-рудого кольору і більше не потребує жодного обслуговування або покриття.",
    descExtra: "Виготовляємо кашпо будь-якої форми і розміру — від компактних настільних підставок до великих об'ємних клумб для публічних просторів. Повністю водонепроникне зварювання, дренажні отвори за потребою.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A / COR-TEN B'},
      {k:'Товщина', v:'2–4 мм'},
      {k:'Обробка', v:'Лазерна різка + зварювання TIG'},
      {k:'Покриття', v:'Без покриття, природна патина'},
      {k:'Призначення', v:'Вулиця, тераса, інтер\'єр'},
      {k:'Термін виготовлення', v:'7–14 робочих днів'},
    ],
    gallery: ['/uploads/cat-kashpo-rectangle.webp','/uploads/cat-kashpo-round.webp','/uploads/cat-kashpo-modular.webp'],
    related: ['bordyury','fontany','skulptury'],
  },
  {
    slug: 'skulptury',
    title: 'Скульптури та арт-об\'єкти',
    titleH1: 'Скульптури та<br><em>арт-об\'єкти.</em>',
    sub: 'Архітектурний акцент',
    type: 'sculpture', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-sculpture-deer.webp',
    desc: "Геометричні фігури, абстракції, об'ємні композиції для публічних просторів і приватних садів.",
    descFull: "Скульптури та арт-об'єкти з кортенової сталі — унікальний спосіб зробити простір особливим. Геометричні фігури тварин, абстрактні форми, великі інсталяції — кожен виріб є результатом точного лазерного розкрою та ручного складання.",
    descExtra: "Виготовляємо за вашим ескізом або 3D-моделлю. Можемо допомогти з розробкою дизайну від ідеї до готового креслення. Кортен з роками набуває глибшого кольору — кожен об'єкт 'живе' разом з простором навколо.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A'},
      {k:'Товщина', v:'2–8 мм (залежно від форми)'},
      {k:'Обробка', v:'Лазерна різка + зварювання + шліфування швів'},
      {k:'Покриття', v:'Без покриття або матовий лак (опціонально)'},
      {k:'Розміри', v:'Від 30 см до 3+ м заввишки'},
      {k:'Термін', v:'14–30 робочих днів'},
    ],
    gallery: ['/uploads/cat-sculpture-deer.webp','/uploads/corten-olen-skulptura.webp','/uploads/lobby-art.webp'],
    related: ['kashpo','fasady','pamiatky'],
  },
  {
    slug: 'fasady',
    title: 'Вхідні групи та фасади',
    titleH1: 'Вхідні групи та<br><em>фасадні елементи.</em>',
    sub: 'Архітектурна металопластика',
    type: 'facade', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/entrance.webp',
    desc: "Декоративні панелі, огорожі, вхідні групи для ЖК і комерційних будівель.",
    descFull: "Фасадні елементи та вхідні групи з кортену — архітектурне рішення, що підкреслює клас будівлі. Декоративні облицювальні панелі, козирки, стелі, вхідні портали — все виготовляється під конкретний проект.",
    descExtra: "Маємо досвід роботи з девелоперами та архітектурними бюро. Приймаємо файли у форматах DXF, DWG, PDF. Можемо підготувати 3D-візуалізацію перед виробництвом.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A / Нержавійка AISI 304'},
      {k:'Товщина', v:'2–6 мм'},
      {k:'Формат файлів', v:'DXF, DWG, PDF, STEP'},
      {k:'Монтаж', v:'Готові до монтажу елементи'},
      {k:'Проекти', v:'ЖК, офісні будівлі, HoReCa'},
      {k:'Термін', v:'За погодженням'},
    ],
    gallery: ['/uploads/entrance.webp','/uploads/cat-fasad-lameli.webp','/uploads/lobby-iko.webp'],
    related: ['ekrany','skulptury','vyviska'],
  },
  {
    slug: 'vyviska',
    title: 'Вивіски та таблички',
    titleH1: 'Вивіски та<br><em>таблички.</em>',
    sub: 'Брендинг і навігація',
    type: 'sign', metal: 'stainless', metalLabel: 'Нержавійка',
    img: '/uploads/brendova-tablichka.webp',
    desc: "Брендові таблички, адресні знаки, навігаційні системи. Дзеркальна або матова поверхня.",
    descFull: "Вивіски та таблички з нержавіючої сталі — вибір компаній, яким важлива якість і довговічність. Дзеркальна полірована або сатинована поверхня AISI 304 не тьмяніє роками, легко миється і зберігає вигляд при будь-якій погоді.",
    descExtra: "Виготовляємо від простих адресних табличок до складних навігаційних систем для великих об'єктів. Лазерне гравіювання, об'ємні букви, підсвітлення — підберемо оптимальне рішення для вашого завдання.",
    specs: [
      {k:'Матеріал', v:'Нержавійка AISI 304 / AISI 316'},
      {k:'Поверхня', v:'Дзеркальна, матова, сатинована'},
      {k:'Товщина', v:'1–3 мм'},
      {k:'Гравіювання', v:'Лазерне, хімічне, механічне'},
      {k:'Кріплення', v:'Стійки-дистанційники або скотч'},
      {k:'Термін', v:'5–10 робочих днів'},
    ],
    gallery: ['/uploads/brendova-tablichka.webp','/uploads/lobby-art.webp','/uploads/lobby-iko.webp'],
    related: ['qr-horeca','interior','vyviska'],
  },
  {
    slug: 'fontany',
    title: 'Фонтани та водні об\'єкти',
    titleH1: 'Фонтани та<br><em>водні об\'єкти.</em>',
    sub: 'Ландшафтний дизайн',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/fontan-corten.webp',
    desc: "Архітектурні водні елементи з атмосферостійкої сталі для вулиці і лобі.",
    descFull: "Фонтани і водні об'єкти з кортену — ефектний акцент для будь-якого простору. Кортен ідеально поєднується з водою: природна патина навколо мокрих поверхонь набуває особливої глибини і краси.",
    descExtra: "Виготовляємо монолітні чаші, модульні конструкції, водоспади. Передбачаємо технічні отвори для насосів і трубопроводу. Можемо працювати разом із замовниками ландшафтних компаній та архітекторів.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A'},
      {k:'Зварювання', v:'TIG, повністю водонепроникне'},
      {k:'Товщина', v:'3–5 мм'},
      {k:'Покриття', v:'Внутрішнє епоксидне + зовнішня патина'},
      {k:'Комплектація', v:'Без насосу або з насосом'},
      {k:'Термін', v:'14–21 робочий день'},
    ],
    gallery: ['/uploads/fontan-corten.webp','/uploads/kashpo-pryvatnyi-budynok.webp','/uploads/corten-zrazok.webp'],
    related: ['kashpo','skulptury','bordyury'],
  },
  {
    slug: 'interior',
    title: 'Декор для інтер\'єру',
    titleH1: 'Декор та панелі<br><em>для інтер\'єру.</em>',
    sub: 'Дизайн інтер\'єрів',
    type: 'interior', metal: 'stainless', metalLabel: 'Нержавійка',
    img: '/uploads/lobby-iko.webp',
    desc: "Настінні панно, перегородки, декоративні екрани. AISI 304, полірована або матова поверхня.",
    descFull: "Металевий декор для інтер'єру — стиль, що поєднує функціональність і естетику. Нержавіюча сталь в інтер'єрі — це чистота, довговічність і відчуття преміального матеріалу.",
    descExtra: "Виготовляємо перегородки, настінні панно, декоративні решітки, облицювальні панелі. Всі вироби виготовляються за індивідуальними кресленнями. Приймаємо ескізи, фото референсів, Revit-файли.",
    specs: [
      {k:'Матеріал', v:'Нержавійка AISI 304'},
      {k:'Поверхня', v:'Дзеркальна, матова, з текстурою'},
      {k:'Товщина', v:'1–3 мм'},
      {k:'Формат', v:'За кресленням клієнта або власний дизайн'},
      {k:'Монтаж', v:'Готові до монтажу панелі'},
      {k:'Термін', v:'7–14 робочих днів'},
    ],
    gallery: ['/uploads/lobby-iko.webp','/uploads/lobby-art.webp','/uploads/brendova-tablichka.webp'],
    related: ['vyviska','mebli','qr-horeca'],
  },
  {
    slug: 'pamiatky',
    title: 'Пам\'ятники та меморіали',
    titleH1: 'Пам\'ятники та<br><em>меморіальні плити.</em>',
    sub: 'Меморіальні вироби',
    type: 'memorial', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/pamiatnyk-corten.webp',
    desc: "Лазерне гравіювання, перфорація, об'ємні букви. Кортен і нержавійка.",
    descFull: "Меморіальні вироби з кортену несуть в собі особливу символіку: атмосферостійка сталь, що живе і змінюється разом з часом, є метафорою пам'яті. Лазерне гравіювання, перфорована ілюстрація, об'ємні літери.",
    descExtra: "Ми ставимось до кожного такого замовлення з особливою увагою і повагою. Допоможемо розробити дизайн, підготуємо ескіз для погодження. Виготовляємо як індивідуальні пам'ятники, так і серійні меморіальні таблички.",
    specs: [
      {k:'Матеріал', v:'Кортен / Нержавійка AISI 304'},
      {k:'Гравіювання', v:'Лазерне, до 0.1 мм точності'},
      {k:'Товщина', v:'2–6 мм'},
      {k:'Обробка', v:'Різка, гравіювання, зварювання'},
      {k:'Термін', v:'7–14 робочих днів'},
      {k:'Підготовка дизайну', v:'Безкоштовно за замовленням'},
    ],
    gallery: ['/uploads/pamiatnyk-corten.webp','/uploads/corten-zrazok.webp','/uploads/entrance.webp'],
    related: ['skulptury','vyviska','fasady'],
  },
  {
    slug: 'ekrany',
    title: 'Декоративні екрани та перфорація',
    titleH1: 'Декоративні екрани<br><em>та перфорація.</em>',
    sub: 'Фасад і ландшафт',
    type: 'facade', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-corten-border.webp',
    desc: "Privacy screens, фасадні панелі з перфорацією, декоративні огорожі.",
    descFull: "Декоративні перфоровані екрани з кортену — поєднання функціональності і краси. Захищають від сонця і вітру, забезпечують приватність і при цьому виглядають як елемент архітектурного дизайну.",
    descExtra: "Малюнок перфорації — будь-який: геометрія, орнамент, логотип, силует. Виготовляємо панелі будь-якого розміру з будь-яким відсотком отворів. Ідеально для тераси, саду, паркінгу, фасаду.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A / Чорна сталь'},
      {k:'Перфорація', v:'Будь-який малюнок за ескізом'},
      {k:'Товщина', v:'2–5 мм'},
      {k:'Монтаж', v:'Настінний, підлоговий, підвісний'},
      {k:'Формати', v:'DXF, DWG, AI, PDF'},
      {k:'Термін', v:'7–14 робочих днів'},
    ],
    gallery: ['/uploads/cat-corten-border.webp','/uploads/entrance.webp','/uploads/corten-zrazok.webp'],
    related: ['fasady','kashpo','bordyury'],
  },
  {
    slug: 'qr-horeca',
    title: 'QR-таблички та брендинг HoReCa',
    titleH1: 'Брендинг і вироби<br><em>для ресторанів.</em>',
    sub: 'HoReCa / Ресторани і готелі',
    type: 'sign', metal: 'stainless', metalLabel: 'Нержавійка',
    img: '/uploads/lobby-art.webp',
    desc: "QR-монети, нумерація столів, меню-холдери. Серійне виробництво під замовлення.",
    descFull: "Металевий брендинг для ресторанів і готелів — деталь, яка формує перше враження. QR-монети на столах, нумерація кімнат, вивіски в лобі, меню-холдери — все виготовляється в єдиному стилі з вашим брендом.",
    descExtra: "Приймаємо серійні замовлення будь-якого обсягу. Виготовляємо 18 унікальних QR-монет для ресторану так само ретельно, як і один виставковий об'єкт. Швидкий цикл виробництва, можливість доставки по всій Україні.",
    specs: [
      {k:'Матеріал', v:'Нержавійка AISI 304 / Латунь Л63'},
      {k:'Гравіювання', v:'Лазерне (логотип, QR, текст)'},
      {k:'Поверхня', v:'Дзеркальна, матова, золота PVD'},
      {k:'Мінімальна партія', v:'Від 1 шт'},
      {k:'Серія', v:'Від 10 шт — знижка на партію'},
      {k:'Термін', v:'5–10 робочих днів'},
    ],
    gallery: ['/uploads/lobby-art.webp','/uploads/brendova-tablichka.webp','/uploads/lobby-iko.webp'],
    related: ['vyviska','interior','mebli'],
  },
  {
    slug: 'mebli',
    title: 'Металеві меблі та каркаси',
    titleH1: 'Металеві меблі<br><em>та каркаси.</em>',
    sub: 'Інтер\'єр і виробництво',
    type: 'interior', metal: 'steel', metalLabel: 'Чорна сталь',
    img: '/uploads/cat-metal-furniture.webp',
    desc: "Столи, стелажі, підставки, каркаси під фарбування або з заводським покриттям.",
    descFull: "Металеві меблі та каркаси — міцно, лаконічно, стильно. Чорна сталь в інтер'єрі — тренд, який не проходить. Ми виготовляємо меблеві каркаси, опори, ніжки, стелажі та підставки за індивідуальними кресленнями.",
    descExtra: "Можемо підготувати конструктивне креслення за вашим ескізом або референсом. Видаємо готові вироби під фарбування (ґрунтовані) або наносимо порошкове покриття будь-якого кольору RAL.",
    specs: [
      {k:'Матеріал', v:'Чорна сталь St37 / St52'},
      {k:'Зварювання', v:'MIG/MAG, TIG'},
      {k:'Покриття', v:'Ґрунтовка або порошкова фарба RAL'},
      {k:'Обробка країв', v:'Шліфовані, без задирок'},
      {k:'Проектування', v:'За ескізом клієнта'},
      {k:'Термін', v:'7–14 робочих днів'},
    ],
    gallery: ['/uploads/cat-metal-furniture.webp','/uploads/cat-laser-parts.webp','/uploads/lobby-art.webp'],
    related: ['interior','detali','qr-horeca'],
  },
  {
    slug: 'bordyury',
    title: 'Бордюри та кромки клумб',
    titleH1: 'Бордюри та<br><em>кромки клумб.</em>',
    sub: 'Ландшафтний дизайн',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/corten-zrazok.webp',
    desc: "Стрічковий кортен для оформлення клумб, доріжок і ландшафтних зон.",
    descFull: "Бордюри з кортену — простий і ефектний спосіб впорядкувати ландшафт. Тонка смуга атмосферостійкої сталі відокремлює газон від клумби, створює чіткі межі доріжок або ділить садовий простір на зони.",
    descExtra: "Виготовляємо смуги будь-якої довжини і висоти. Кріпляться в ґрунт спеціальними кілочками (у комплекті). З часом набувають природного рудого кольору і виглядають як частина живої природи.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A'},
      {k:'Товщина', v:'1.5–3 мм'},
      {k:'Висота', v:'100–200 мм'},
      {k:'Довжина', v:'За потребою'},
      {k:'Кріплення', v:'Сталеві кілочки у комплекті'},
      {k:'Термін', v:'3–7 робочих днів'},
    ],
    gallery: ['/uploads/corten-zrazok.webp','/uploads/kashpo-pryvatnyi-budynok.webp','/uploads/cat-corten-border.webp'],
    related: ['kashpo','fontany','ekrany'],
  },
  {
    slug: 'detali',
    title: 'Деталі та конструкції B2B',
    titleH1: 'Деталі та<br><em>конструкції B2B.</em>',
    sub: 'Промислова металообробка',
    type: 'b2b', metal: 'steel', metalLabel: 'Чорна сталь',
    img: '/uploads/cat-laser-parts.webp',
    desc: "Лазерна різка і гнуття за кресленням DXF/DWG. Від 1 шт до серійної партії.",
    descFull: "Промислова металообробка для юридичних осіб: лазерна різка, гнуття ЧПУ, зварювання за технічними кресленнями. Приймаємо замовлення від 1 деталі до великих серій.",
    descExtra: "Файли DXF, DWG, STEP, PDF — починаємо виробництво без зайвих погоджень. Забезпечуємо сталу якість деталі від першої до останньої в серії. Виставляємо рахунки ФОП/юр. особам, повний пакет документів.",
    specs: [
      {k:'Матеріал', v:'Чорна сталь, нержавійка, алюміній, кортен'},
      {k:'Лазерна різка', v:'До 20 мм, точність ±0.1 мм'},
      {k:'Гнуття ЧПУ', v:'До 4 мм, довжина до 2500 мм'},
      {k:'Зварювання', v:'TIG, MIG/MAG'},
      {k:'Документи', v:'Рахунок + Акт, ФОП/юр. особа'},
      {k:'Термін', v:'За погодженням'},
    ],
    gallery: ['/uploads/cat-laser-parts.webp','/uploads/corten-zrazok.webp','/uploads/brendova-tablichka.webp'],
    related: ['mebli','vyviska','fasady'],
  },
  {
    slug: 'parkan',
    title: 'Паркани та огородження',
    titleH1: 'Паркани та<br><em>огородження.</em>',
    sub: 'Ландшафт і приватність',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-parkan-perforated.webp',
    desc: "Перфоровані панелі, ламелі, суцільні секції. Приватність і дизайн в одному рішенні.",
    descFull: "Паркани та огородження з кортенової сталі — поєднання функціональності і архітектурної виразності. Перфоровані панелі зі стандартним або індивідуальним малюнком, вертикальні ламелі, суцільні секції — для кожного об'єкта підбираємо оптимальне рішення.",
    descExtra: "Кортеновий паркан не потребує фарбування або обслуговування — атмосферостійка сталь самостійно формує захисну патину. Виготовляємо під будь-яку архітектуру: сучасний мінімалізм, скандинавський стиль, промисловий лофт.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A'},
      {k:'Товщина', v:'2–5 мм'},
      {k:'Перфорація', v:'Стандартна або за індивідуальним ескізом'},
      {k:'Монтаж', v:'На опорні стовпи або стіну'},
      {k:'Покриття', v:'Без покриття, природна патина'},
      {k:'Термін', v:'10–21 робочий день'},
    ],
    gallery: ['/uploads/cat-parkan-perforated.webp','/uploads/cat-fasad-lameli.webp','/uploads/corten-zrazok.webp'],
    related: ['ekrany','bordyury','fasady'],
  },
  {
    slug: 'mangal',
    title: 'Мангали та грилі',
    titleH1: 'Мангали та грилі<br><em>з кортену.</em>',
    sub: 'Відпочинок і барбекю',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-mangal-round.webp',
    desc: "Кругла чаша-мангал, вбудований гриль з робочою поверхнею. Жаростійка атмосферостійка сталь.",
    descFull: "Мангали і грилі з кортенової сталі — преміальний вибір для тераси, саду або зони барбекю. Кортен витримує постійний нагрів і при цьому залишається красивим ззовні завдяки природній патині. Ніякого фарбування і корозії.",
    descExtra: "Виготовляємо два базові формати: кругла чаша-мангал на ніжках (для відкритого простору і посиденьок) і вбудований мангал з робочою поверхнею (для стаціонарної барбекю-зони). Обидва доступні в різних розмірах і з опційними аксесуарами.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A, жаростійкий'},
      {k:'Товщина', v:'3–5 мм'},
      {k:'Форми', v:'Кругла чаша, прямокутний вбудований'},
      {k:'Зварювання', v:'TIG, жаростійкий шов'},
      {k:'Аксесуари', v:'Решітка, кришка (опціонально)'},
      {k:'Термін', v:'7–14 робочих днів'},
    ],
    gallery: ['/uploads/cat-mangal-round.webp','/uploads/cat-mangal-builtin.webp','/uploads/corten-zrazok.webp'],
    related: ['stelazh','kashpo','bordyury'],
  },
  {
    slug: 'stelazh',
    title: 'Стелажі для дров',
    titleH1: 'Стелажі для дров<br><em>з кортену.</em>',
    sub: 'Функціональний декор',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-stelazh-cube.webp',
    desc: "Компактні та великі дровниці з кортену. Зберігають дрова і прикрашають простір.",
    descFull: "Стелажі для дров з кортенової сталі — функціональний елемент, який стає декоративним акцентом. Компактний куб для балкона або тераси, великий стелаж з навісом для двору — виготовляємо будь-який формат під ваш простір.",
    descExtra: "Усі стелажі мають достатній просвіт між підлогою і поличкою для вентиляції дров. Кортен не потребує обслуговування і красиво вписується в сад, особливо поруч з мангалом або вогнищем.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A'},
      {k:'Товщина', v:'2–3 мм'},
      {k:'Форми', v:'Куб, прямокутний, з дахом'},
      {k:'Вентиляція', v:'Відкрита конструкція для просушки дров'},
      {k:'Покриття', v:'Без покриття, природна патина'},
      {k:'Термін', v:'5–10 робочих днів'},
    ],
    gallery: ['/uploads/cat-stelazh-cube.webp','/uploads/cat-mangal-round.webp','/uploads/corten-zrazok.webp'],
    related: ['mangal','kashpo','bordyury'],
  },
  {
    slug: 'svitylnyky',
    title: 'Вуличні світильники',
    titleH1: 'Вуличні світильники<br><em>з кортену.</em>',
    sub: 'Ландшафтне освітлення',
    type: 'garden', metal: 'corten', metalLabel: 'Кортен',
    img: '/uploads/cat-light-wall.webp',
    desc: "Настінні та підвісні садові світильники. Кортен + LED. Атмосфера теплого світла.",
    descFull: "Вуличні світильники з кортенової сталі — унікальне поєднання теплого металевого відтінку патини і м'якого LED-освітлення. Настінні ліхтарі для фасаду, підвісні садові світильники, стовпчики-болларди — всі формати виготовляємо під замовлення.",
    descExtra: "Корпус з атмосферостійкої сталі розрахований на цілорічну вуличну експлуатацію. Внутрішні електричні елементи захищені від вологи. Виготовляємо під стандартні E27 або GU10 лампи, або з готовим LED-модулем.",
    specs: [
      {k:'Матеріал', v:'Кортен COR-TEN A'},
      {k:'Захист', v:'IP54 (пил і бризки)'},
      {k:'Цоколь', v:'E27 або GU10 (за вибором)'},
      {k:'Форми', v:'Настінний, підвісний, болард'},
      {k:'Покриття', v:'Без покриття, природна патина'},
      {k:'Термін', v:'7–14 робочих днів'},
    ],
    gallery: ['/uploads/cat-light-wall.webp','/uploads/cat-light-garden.webp','/uploads/corten-zrazok.webp'],
    related: ['kashpo','mangal','bordyury'],
  },
];

// ── PRODUCT DETAIL PAGE ───────────────────────────────────────
function productPage(p) {
  const related = catalogProducts.filter(x => p.related.includes(x.slug)).slice(0, 3);
  return head(
    `${p.title} з металу на замовлення | FEROX LVIV`,
    `${p.desc} Виготовлення у Львові, доставка по Україні. ${p.metalLabel}, власне виробництво.`,
    `${p.title.toLowerCase()}, ${p.metalLabel.toLowerCase()}, вироби з металу, металообробка Львів`,
    `/viroby/${p.slug}/`
  ) + nav('viroby') +

  `<section class="pd-hero">
    <div class="pd-hero-img" style="background-image:url('${p.img}')">
      <div class="pd-hero-ov"></div>
    </div>
    <div class="pd-hero-content">
      <nav class="crumbs pd-crumbs" aria-label="Хлібні крихти">
        <a href="/">Головна</a><span class="crumbs-sep">/</span>
        <a href="/viroby/">Вироби</a><span class="crumbs-sep">/</span>
        <span>${p.title}</span>
      </nav>
      <span class="pd-metal-tag">${p.metalLabel}</span>
      <h1 class="pd-h1">${p.titleH1}</h1>
      <p class="pd-hero-sub">${p.sub}</p>
    </div>
  </section>

  <section class="pd-main">
    <div class="pd-main-grid">
      <div class="pd-desc-col">
        <p class="s-label">Про виріб</p>
        <p class="pd-desc-main">${p.descFull}</p>
        <p class="pd-desc-extra">${p.descExtra}</p>
        <a href="/contact/" class="btn-p pd-cta">
          <span>Отримати розрахунок</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
      <div class="pd-spec-col">
        <div class="pd-spec-box">
          <p class="pd-spec-label">Характеристики</p>
          ${p.specs.map(r => `<div class="pd-spec-row">
            <span class="pd-spec-k">${r.k}</span>
            <span class="pd-spec-v">${r.v}</span>
          </div>`).join('')}
        </div>
        <a href="https://t.me/feroxlviv" class="pd-tg-btn" target="_blank" rel="noopener">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 2L11 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Написати в Telegram
        </a>
      </div>
    </div>
  </section>

  <section class="pd-gallery">
    <div class="pd-gallery-inner">
      <p class="s-label">Галерея</p>
      <h2 class="s-title">Приклади<br><em>робіт.</em></h2>
      <div class="pd-gallery-grid">
        ${p.gallery.map((img, i) => `<div class="pd-gallery-item pd-gi-${i}" style="background-image:url('${img}')"></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="pd-process dark-section">
    <div class="pd-process-inner">
      <p class="s-label">Як отримати</p>
      <h2 class="s-title" style="color:var(--white)">Три кроки до<br><em>готового виробу.</em></h2>
      <div class="pd-steps">
        <div class="pd-step reveal">
          <div class="pd-step-n">01</div>
          <h3 class="pd-step-t">Заявка та розрахунок</h3>
          <p class="pd-step-d">Надсилаєте ескіз, фото або опис — ми готуємо розрахунок вартості і термінів протягом 15 хвилин у робочий час.</p>
        </div>
        <div class="pd-step reveal">
          <div class="pd-step-n">02</div>
          <h3 class="pd-step-t">Виробництво</h3>
          <p class="pd-step-d">Наше виробництво у Львові: лазерна різка, гнуття, зварювання. Тримаємо вас в курсі на кожному етапі.</p>
        </div>
        <div class="pd-step reveal">
          <div class="pd-step-n">03</div>
          <h3 class="pd-step-t">Доставка або самовивіз</h3>
          <p class="pd-step-d">Відправляємо Новою поштою по всій Україні або організовуємо самовивіз у Львові. Упаковка включена.</p>
        </div>
      </div>
    </div>
  </section>

  ${related.length > 0 ? `<section class="pd-related">
    <div class="pd-related-inner">
      <p class="s-label">Також виготовляємо</p>
      <h2 class="s-title">Схожі<br><em>вироби.</em></h2>
      <div class="pd-related-grid">
        ${related.map(r => `<a href="/viroby/${r.slug}/" class="pd-rel-card reveal">
          <div class="pd-rel-img" style="background-image:url('${r.img}')">
            <span class="pd-rel-metal">${r.metalLabel}</span>
          </div>
          <div class="pd-rel-body">
            <p class="pd-rel-sub">${r.sub}</p>
            <h3 class="pd-rel-title">${r.title}</h3>
            <span class="pd-rel-cta">Детальніше →</span>
          </div>
        </a>`).join('')}
      </div>
    </div>
  </section>` : ''}

  ` + contactSection('', `Замовити<br><em>${p.title.toLowerCase()}.</em>`) + footer();
}

// ── CATALOG INDEX PAGE ────────────────────────────────────────
function catalogPage() {
  const cards = CATALOG.map(p => {
    const lo = minPrice(p);
    return `      <a class="card" href="/viroby/tovar/${p.slug}/" data-cat="${p.c}">
        <span class="card-vis">
          <span class="card-tag" data-tag>кортен</span>
          <img src="/uploads/${p.img}.webp" alt="${esc(p.t)} з кортенової сталі — FEROX LVIV" loading="lazy" decoding="async">
          <span class="fx-ph" data-ph hidden><i></i><b></b><s>Фото готуємо</s></span>
        </span>
        <span class="card-bd">
          <h3>${esc(p.t)}</h3>
          <span class="d">${esc(p.d)}</span>
          ${lo ? `<span class="p-from" data-price data-lo="${lo}">${p.badge ? `<b>${esc(p.badge)}</b>` : ''}від ${uah(lo)}</span>` : ''}
          <span class="more">Дивитись виріб →</span>
        </span>
      </a>`;
  }).join('\n');

  const metalBand = METAL_ORDER.map(k => {
    const m = METAL_INFO[k];
    const tex = k === 'corten'
      ? 'repeating-linear-gradient(112deg,rgba(0,0,0,.3) 0 2px,transparent 2px 7px,rgba(232,184,148,.35) 7px 8px,transparent 8px 15px)'
      : k === 'steel'
      ? 'repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0 1px,transparent 1px 9px)'
      : 'repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 1px,transparent 1px 4px)';
    return `        <button type="button" class="sw" data-metal="${k}" aria-pressed="${k === 'corten'}" style="--c:${m.ch};--tex:${tex}">
          <span class="sw-chip"></span><span class="sw-name">${esc(m.n.split('—')[0].trim())}</span>
          <span class="sw-note">${esc(m.spec)}${k !== 'corten' ? ` Ціни на ${Math.round((1 - METAL_MULT[k]) * 100)}% нижчі за кортен.` : ''}</span>
        </button>`;
  }).join('\n');

  const cats = [['all','Усі вироби'],['kashpo','Кашпо'],['light','Світильники'],['mangal','Мангали'],
    ['bowl','Чаші'],['lamel','Ламелі'],['sign','Вивіски'],['facade','Фасадні панелі'],
    ['gate','Панелі для воріт'],['clad','Облицювання'],['decor','Декор']];

  return head(
    'Вироби з металу — каталог і ціни | Кортен, нержавійка, чорна сталь | FEROX LVIV',
    'Каталог виробів з металу з цінами: кашпо, світильники, мангали, ламелі, вивіски, фасадні панелі, облицювання кортеном. Виробництво у Львові, доставка по всій Україні.',
    'вироби з металу, кортен купити, кашпо з кортену ціна, вироби з металу львів, вироби з металу київ, металовироби на замовлення україна, доставка по україні',
    '/viroby/'
  ) + nav('viroby') +
  pageHeader(
    [{href:'/',label:'Головна'},{label:'Вироби з металу'}],
    'Вироби з металу<br><em>на замовлення.</em>',
    'Від декоративного арт-об\'єкту до промислової конструкції. Кортен, нержавійка, чорна сталь — з цінами й доставкою по Україні.',
    null, true, 'Каталог виробів'
  ) + `
<section class="fx-metals">
  <div class="fx-metals-in">
    <p class="fx-metals-lead">Кожен виріб виготовляємо у трьох металах. Оберіть матеріал — каталог покаже ціни для нього.</p>
    <div class="picker">
      <div class="picker-lb"><span class="mono">Оберіть метал</span><span class="cur" id="curM">Кортен — жива іржа</span></div>
      <div class="sws" role="group" aria-label="Вибір металу">
${metalBand}
      </div>
    </div>
  </div>
</section>

<nav class="filters" aria-label="Категорії">
  <div class="wrap filters-in" id="fbar">
    ${cats.map(([k, l]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('\n    ')}
  </div>
</nav>

<main class="cat">
  <div class="wrap">
    <div class="cat-hd"><h2>Готові моделі</h2><span class="mono" id="cnt"></span></div>
    <div class="grid" id="grid">
${cards}
    </div>
  </div>
</main>

<section class="clad" id="clad">
  <div class="clad-in">
    <div class="clad-ph"><img data-zoom src="/uploads/cat-kamin-corten-tall.webp" alt="Облицювання каміну кортеновою сталлю — FEROX LVIV" loading="lazy"></div>
    <div class="clad-tx">
      <span class="mono">Облицювання поверхонь</span>
      <h2>Кортен там, де був <em>бетон</em></h2>
      <p>Обшиваємо каміни, колони, стіни, барні стійки та ресепшени листовим кортеном. Панелі розкроюємо під конкретну геометрію об'єкта — з припусками на шви, вирізами під топку й прихованим кріпленням.</p>
      <ul class="clad-l">
        <li><span>01</span>Виїзд на заміри або робота за вашими кресленнями</li>
        <li><span>02</span>Розкрій панелей під геометрію — включно з кутами й нішами</li>
        <li><span>03</span>Приховане кріплення без видимих саморізів</li>
        <li><span>04</span>Стабілізація патини — щоб не фарбувала руки й підлогу</li>
      </ul>
      <a class="btn" href="/viroby/tovar/oblytsyuvannya-kaminu/">Дивитись облицювання</a>
    </div>
  </div>
</section>

<section class="cust-b">
  <div class="wrap cust-in">
    <div>
      <span class="mono" style="color:var(--steel)">Індивідуальне виготовлення</span>
      <h2>Розмір під ваш <em>простір</em></h2>
      <p>Стандартні габарити рідко підходять точно. Робимо будь-який виріб з каталогу під ваші розміри — або зовсім нову форму за ескізом, кресленням чи фото.</p>
      <a class="btn-lg" href="https://t.me/feroxlviv" target="_blank" rel="noopener">Обговорити проєкт</a>
    </div>
    <ul class="steps">
      <li><span class="n">01</span><span class="t">Надсилаєте ідею<span>Ескіз, фото, розміри або просто опис словами</span></span></li>
      <li><span class="n">02</span><span class="t">Отримуєте креслення й ціну<span>Технічне креслення з габаритами протягом 1–2 днів</span></span></li>
      <li><span class="n">03</span><span class="t">Виготовлення<span>Лазерна різка, гнуття з ЧПУ, зварювання TIG</span></span></li>
      <li><span class="n">04</span><span class="t">Доставка по Україні<span>Київ, Одеса, Дніпро, Харків. Монтаж — за потреби</span></span></li>
    </ul>
  </div>
</section>

${cartMarkup()}
<script>
${shopScript()}
(function(){
  var metal='corten';
  var q=new URLSearchParams(location.search).get('metal');
  if(q&&MI[q])metal=q;

  function paint(){
    var m=MI[metal],r=document.documentElement.style;
    r.setProperty('--m',m.c);r.setProperty('--m-l',m.l);r.setProperty('--m-d',m.d);
    document.getElementById('curM').textContent=m.n;
    document.querySelectorAll('.sw').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.metal===metal))});
    document.querySelectorAll('.card').forEach(function(c){
      var tag=c.querySelector('[data-tag]'); if(tag)tag.textContent=m.short;
      var img=c.querySelector('img'), ph=c.querySelector('[data-ph]');
      if(img&&ph){
        if(m.photo){img.hidden=false;ph.hidden=true}
        else{img.hidden=true;ph.hidden=false;ph.style.setProperty('--phc',m.ch);ph.querySelector('b').textContent=m.short}
      }
      var pr=c.querySelector('[data-price]');
      if(pr){
        var lo=+pr.dataset.lo, base=Math.round(lo/MULT.steel);
        var v=mp(base,metal);
        var b=pr.querySelector('b');
        pr.innerHTML=(b?b.outerHTML:'')+'від '+fmt(v);
      }
      var href=c.getAttribute('href').split('?')[0];
      c.setAttribute('href',metal==='corten'?href:href+'?metal='+metal);
    });
  }
  document.querySelectorAll('.sw').forEach(function(b){
    b.addEventListener('click',function(){metal=b.dataset.metal;paint()});
  });

  var plural=function(n){return n===1?'виріб':(n>=2&&n<=4?'вироби':'виробів')};
  function count(){
    var v=[].filter.call(document.querySelectorAll('.card'),function(c){return !c.hidden}).length;
    document.getElementById('cnt').textContent=v+' '+plural(v);
  }
  document.getElementById('fbar').addEventListener('click',function(e){
    var b=e.target.closest('.chip'); if(!b)return;
    document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');
    var f=b.dataset.f;
    document.querySelectorAll('.card').forEach(function(c){c.hidden=!(f==='all'||c.dataset.cat===f)});
    count();
  });
  function applyCat(f){
    document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.f===f))});
    document.querySelectorAll('.card').forEach(function(c){c.hidden=!(f==='all'||c.dataset.cat===f)});
    count();
  }
  paint();
  var c0=new URLSearchParams(location.search).get('cat');
  if(c0&&document.querySelector('.chip[data-f="'+c0+'"]')){
    applyCat(c0);
    var g=document.querySelector('.filters');
    if(g)setTimeout(function(){g.scrollIntoView({behavior:'smooth',block:'start'})},80);
  } else count();
})();
</script>
` + footer();
}

const CATALOG=[
 {c:'kashpo',img:'cat-kashpo-round',t:'Кашпо кругле',slug:'kashpo-krugle',
  d:'Класична форма для дерев і великих рослин.',
  full:'Циліндрична форма, зварений шов зачищений урівень. Дно з дренажними отворами та ніжками — щоб вода йшла, а метал не стояв у воді.',
  s:['⌀40×40','⌀50×50','⌀60×60','⌀80×70'],
  pr:{'⌀40×40':[16500,11500],'⌀50×50':[19000,14000],'⌀60×60':[20500,16500]},
  badge:'Топ продажів',
  note:'Можливе хімічне патинування — термін до 14 днів.',
  sp:[['Товщина','2 мм'],['Дно','Дренаж + ніжки 20 мм'],['Термін','7–10 днів']]},
 {c:'kashpo',img:'cat-kashpo-rectangle',t:'Кашпо прямокутне',slug:'kashpo-pryamokutne',
  d:'Довга форма для зонування й живоплотів.',
  full:'Витягнута форма для розділення простору — тераси, входи, паркувальні зони. Ребра жорсткості всередині, щоб довга стінка не вигиналась під вагою ґрунту.',
  s:['60×60×25','90×60×25'],
  pr:{'60×60×25':[17000,12000],'90×60×25':[18500,13500]},
  badge:'Топ продажів',
  sp:[['Товщина','2–3 мм'],['Жорсткість','Внутрішні ребра'],['Термін','10–14 днів']]},
 {c:'kashpo',img:'cat-kashpo-modular',t:'Модульний набір кашпо',sn:'Набір кашпо з кортену',slug:'nabir-kashpo',
  d:'Композиція з кількох кашпо — на 10% дешевше, ніж поштучно.',
  full:'Набір кашпо різної висоти в одній геометрії. Ставляться групою — працюють як цілісна композиція, а не окремі горщики. Ціна набору на 10% нижча за суму тих самих виробів поштучно.',
  s:['Набір S · ⌀40+⌀50','Набір M · ⌀40+⌀50+⌀60','Набір L · ⌀40+⌀50+⌀60 + прямокутне 90×60'],
  pr:{'Набір S · ⌀40+⌀50':[25500,22950],
      'Набір M · ⌀40+⌀50+⌀60':[42000,37800],
      'Набір L · ⌀40+⌀50+⌀60 + прямокутне 90×60':[55500,49950]},
  badge:'Вигода 10%',
  note:'Закреслена ціна — сума тих самих кашпо поштучно. Можливе хімічне патинування — термін до 14 днів.',
  sp:[['У наборі','2–4 вироби'],['Товщина','2 мм'],['Знижка','−10% до поштучної'],['Термін','12–16 днів']]},
 {c:'light',img:'cat-light-pillar',t:'Ліхтар FEROX PRO 1',sn:'Садовий ліхтар з кортену',slug:'likhtar-ferox-pro-1',
  d:'Вертикальний об\'єм зі світловою щілиною. Власна модель.',
  full:'Світло виходить через похилу щілину — освітлює доріжку, не б\'є в очі. Всередині гільза під стандартний патрон, ввід кабелю знизу. Наша власна модель, інших виробників у неї немає.',
  s:['H-40','H-60'],
  pr:{'H-40':[9500,8500],'H-60':[10500,9500]},
  badge:'Сезонний розпродаж',
  sp:[['Захист','IP65'],['Світло','3000K тепле'],['Живлення','220V або 12V'],['Термін','10–14 днів']]},
 {c:'light',img:'cat-light-wall',t:'FEROX Mini Light',sn:'Настінний світильник з металу',slug:'ferox-mini-light',
  d:'Компактний настінний світильник для фасаду й тераси.',
  full:'Невеликий корпус із двома світловими отворами — промінь малює на стіні дві симетричні плями. Монтаж на дюбелі, кабель заводиться ззаду приховано.',
  s:['20×12×10','28×15×12'],
  pr:{'20×12×10':[null,2000],'28×15×12':[null,2500]},
  sp:[['Захист','IP65'],['Світло','3000K тепле'],['Монтаж','Прихований ввід'],['Термін','7–10 днів']]},
 {c:'light',img:'cat-light-sphere',t:'Світильник-куля перфорований',sn:'Садовий світильник-куля',slug:'svitylnyk-kulya',
  d:'Світло малює візерунок по стінах і землі.',
  full:'Перфорована сфера — вночі проєктує візерунок на все довкола. Підвісний або на ніжці. Малюнок перфорації можна замінити на ваш.',
  s:['⌀25','⌀35','⌀45','⌀60'],
  sp:[['Виконання','Підвіс або ніжка'],['Перфорація','Наша або ваша'],['Термін','10–14 днів']]},
 {c:'mangal',img:'cat-mangal-built',t:'Мангал вбудований з поверхнею',sn:'Вбудований мангал з металу',slug:'mangal-vbudovanyi',
  d:'Мангал із робочою поверхнею та місцем під дрова.',
  full:'Стаціонарний модуль: жарова частина, робоча поверхня збоку, ніша для дров унизу. Стінки 3 мм — не веде від жару навіть після сезону.',
  s:['120×60×90','150×60×90','180×65×90'],
  sp:[['Товщина','3 мм'],['Комплект','Решітка + піддон'],['Термін','14–20 днів']]},
 {c:'mangal',img:'cat-mangal-round',t:'Мангал-чаша кругла',slug:'mangal-chasha',
  d:'Відкрите вогнище для тераси й саду.',
  full:'Кругла чаша на ніжках — вогнище й мангал водночас. Кортен від жару темнішає нерівномірно, і з часом кожна чаша стає впізнаваною.',
  s:['⌀60×30','⌀80×35','⌀100×40'],
  sp:[['Товщина','3 мм'],['Опції','Решітка, кришка'],['Термін','10–14 днів']]},
 {c:'bowl',img:'cat-mangal-round',t:'Чаша декоративна',slug:'chasha-dekoratyvna',
  d:'Для води, каміння або як самостійний акцент.',
  full:'Неглибока чаша для води чи гальки. Під фонтан робимо переливний борт і отвір під помпу — насос і підводка окремо.',
  s:['⌀40×15','⌀60×20','⌀80×25','⌀100×30'],
  sp:[['Товщина','2–3 мм'],['Опція','Переливний борт'],['Термін','10–14 днів']]},
 {c:'lamel',img:'cat-lamels',t:'Ламелі фасадні вертикальні',sn:'Фасадні ламелі з металу',slug:'lameli-fasadni',
  d:'Планки для фасаду, парканів і зонування.',
  full:'Вертикальні планки з рівним кроком. Закривають від погляду, але пропускають повітря й світло. Крок і ширину підбираємо під потрібну щільність.',
  s:['H-180','H-200','H-240','H-300'],
  sp:[['Крок','40–120 мм'],['Кріплення','Прихована рама'],['Термін','14–18 днів']]},
 {c:'lamel',img:'cat-parkan-perforated',t:'Паркан з перфорацією',slug:'parkan-perforaciya',
  d:'Суцільні панелі з наскрізним малюнком.',
  full:'Секції з перфорацією — від щільної сітки до великого візерунка. Малюнок можемо зробити за вашим ескізом або взяти з нашої бібліотеки.',
  s:['200×180','250×200','300×200'],
  sp:[['Товщина','2–3 мм'],['Малюнок','Ваш або наш'],['Термін','16–22 дні']]},
 {c:'facade',img:'cat-parkan-perforated',t:'Панель фасадна перфорована',sn:'Перфорована фасадна панель',slug:'panel-fasadna',
  d:'Малюнок за вашим ескізом або з нашої бібліотеки.',
  full:'Панелі для вентильованого фасаду чи декоративної обшивки. Розкрій під модуль будівлі, кріплення на прихованій підсистемі.',
  s:['100×200','120×240','150×300','за кресленням'],
  sp:[['Товщина','2–3 мм'],['Підсистема','Прихована'],['Термін','від 18 днів']]},
 {c:'gate',img:'cat-lamels',t:'Панель для воріт',slug:'panel-vorit',
  d:'Вставка в готовий каркас воріт або хвіртки.',
  full:'Виготовляємо вставку під ваш каркас — глуху, ламельну або перфоровану. Потрібні розміри прорізу й тип кріплення до каркаса.',
  s:['150×180','200×180','300×200','за кресленням'],
  sp:[['Виконання','Глуха / ламелі / перфорація'],['Вага','Рахуємо під привід'],['Термін','14–20 днів']]},
 {c:'sign',img:'brendova-tablichka',t:'Таблички та номерки',slug:'tablychky',own:true,sub:'qr-horeca',
  d:'Лазерне гравіювання. QR-коди, номери, логотипи.',
  full:'Від номерка на стіл до дверної таблички. Гравіюємо лазером — малюнок не стирається й не вигорає. На фото — наш виконаний проєкт: QR-медальйони для ресторану в Києві.',
  s:['⌀5','⌀8','⌀10','за макетом'],
  sp:[['Гравіювання','Лазерне'],['Товщина','1.5–3 мм'],['Від тиражу','від 10 шт'],['Термін','5–10 днів']]},
 {c:'sign',img:'cat-light-wall',t:'Вивіска з підсвіткою',slug:'vyviska-pidsvitka',
  d:'Контражур або підсвітка літер. LED IP65.',
  full:'Літери з прихованою LED-стрічкою — світиться контур навколо, сам напис лишається темним. Ефект працює в сутінках, коли звичайна вивіска вже не читається.',
  s:['до 60 см','до 100 см','до 150 см','понад 150'],
  sp:[['Підсвітка','LED IP65, 3000K'],['Відступ','40–50 мм від стіни'],['Термін','12–18 днів']]},
 {c:'clad',img:'cat-kamin-corten',t:'Облицювання каміну кортеном',sn:'Облицювання каміну кортеном',slug:'oblytsyuvannya-kaminu',
  d:'Обшивка топки, колони або порталу листовим кортеном.',
  full:'Панелі розкроюємо під геометрію об\'єкта — з вирізами під топку, вентиляційні щілини й кути. Кріплення приховане. Патину стабілізуємо, щоб не фарбувала руки й підлогу.',
  s:['до 2 м²','2–4 м²','4–8 м²','за проєктом'],
  sp:[['Товщина','2–3 мм'],['Кріплення','Приховане'],['Патина','Стабілізована'],['Термін','від 20 днів']]},
 {c:'clad',img:'cat-kamin-corten',t:'Облицювання стін і колон',slug:'oblytsyuvannya-stin',
  d:'Кортенові панелі для інтер\'єру та фасаду.',
  full:'Обшивка колон, стін, барних стійок і ресепшенів. Шов між панелями робимо навмисно видимим — він задає ритм поверхні замість того, щоб маскуватись.',
  s:['до 5 м²','5–15 м²','15–30 м²','за проєктом'],
  sp:[['Модуль','Під розмір поверхні'],['Шов','Відкритий 8–12 мм'],['Термін','від 20 днів']]},
 {c:'decor',img:'cat-sculpture-deer',t:'Скульптура «Олень»',sn:'Скульптура оленя з кортену',slug:'skulptura-olen',
  d:'Силует висотою 3 метри з рогами. Ексклюзивний об\'єкт.',
  full:'Силует, вирізаний лазером із листа, висотою 3 метри разом з рогами. Ставиться на ґрунтові анкери або бетонну п\'яту. У кортені читається на будь-якому фоні — зелень, сніг, бетон. Домінанта ділянки, а не садова фігурка.',
  s:['H-300 з рогами'],
  pr:{'H-300 з рогами':[200000,188488]},
  badge:'Ексклюзив',
  note:'Виготовляється під замовлення. Менші висоти рахуємо окремо.',
  sp:[['Висота','3 м з рогами'],['Товщина','3 мм'],['Кріплення','Анкер або бетонна п\'ята'],['Термін','від 20 днів']]},
 {c:'decor',img:'cat-stelazh-cube',t:'Стелаж-куб',slug:'stelazh-kub',
  d:'Компактна модульна полиця для інтер\'єру.',
  full:'Кубічна секція — окремо або в стосі. Зварні кути без видимого шва. Для стіни робимо приховане кріплення, щоб куб ніби висів.',
  s:['40×40×30','50×50×35','60×60×40'],
  sp:[['Товщина','2 мм'],['Монтаж','Підлога або стіна'],['Термін','10–14 днів']]},
 {c:'decor',img:'cat-kashpo-modular',t:'Садовий декор',slug:'sadovyi-dekor',
  d:'Топіарії, стели, ширми — форми, що тримають композицію.',
  full:'Вертикальні акценти для саду: стели, ширми, геометричні об\'єми. Працюють як точка, до якої збирається решта ландшафту.',
  s:['H-60','H-100','H-150','H-200'],
  sp:[['Товщина','2–3 мм'],['Кріплення','Анкер у ґрунт'],['Термін','12–16 днів']]}
];

// ── СТОРІНКА ТОВАРУ (з фіду для Merchant Center) ─────────────
// ══════════════════════════════════════════════════════════
// МАГАЗИН: спільні дані, ціни за металом, кошик
// ══════════════════════════════════════════════════════════

const METAL_MULT = { corten: 1, stainless: 0.7, steel: 0.5 };
const METAL_INFO = {
  corten:    { n:'Кортен — жива іржа', short:'кортен', c:'#A0522D', ch:'#A0522D', l:'#D4956A', d:'#8a4425',
               spec:'Кортен 2–4 мм. Патина формується 3–6 місяців.', photo:true },
  steel:     { n:'Чорна сталь + фарбування', short:'чорна сталь', c:'#3A3A37', ch:'#3A3A37', l:'#8E8D86', d:'#26261F',
               spec:'Ст3, 2–4 мм. Порошкова фарба, будь-який колір RAL.', photo:false },
  stainless: { n:'Нержавіюча сталь AISI 304', short:'нержавіюча сталь', c:'#5E656A', ch:'#9FA4A8', l:'#C8CDD1', d:'#474D51',
               spec:'AISI 304, 1.5–3 мм. Шліфування або дзеркало.', photo:false }
};
const METAL_ORDER = ['corten','steel','stainless'];

function mPrice(base, metal) {
  if (METAL_MULT[metal] === 1) return base;
  return Math.round(base * METAL_MULT[metal] / 10) * 10;
}
function minSize(p) {
  if (!p.pr) return null;
  return Math.min(...Object.keys(p.pr).map(s => p.pr[s][1]));
}
function minPrice(p) {
  if (!p.pr) return null;
  return Math.min(...Object.keys(p.pr).map(s => mPrice(p.pr[s][1], 'steel')));
}
function maxPrice(p) {
  if (!p.pr) return null;
  return Math.max(...Object.keys(p.pr).map(s => p.pr[s][1]));
}

// ── SEO ─────────────────────────────────────────────────────
const CAT_SEO = {
  kashpo:    { g:'кашпо',              pl:'кашпо для рослин' },
  light:     { g:'світильник',         pl:'вуличні світильники' },
  mangal:    { g:'мангал',             pl:'мангали та вогнища' },
  bowl:      { g:'чаша',               pl:'декоративні чаші' },
  lamel:     { g:'ламелі',             pl:'фасадні ламелі' },
  sign:      { g:'вивіска',            pl:'вивіски та таблички' },
  facade:    { g:'фасадна панель',     pl:'фасадні панелі' },
  gate:      { g:'панель для воріт',   pl:'панелі для воріт' },
  clad:      { g:'облицювання',        pl:'облицювання кортеном' },
  decor:     { g:'декор',              pl:'садовий декор' }
};

function seoName(p) { return p.sn || p.t; }

function seoTitle(p) {
  const lo = minPrice(p);
  const n = seoName(p);
  const t = lo ? `${n} — ціна від ${uah(lo)} | FEROX LVIV`
               : `${n} на замовлення — Львів, Київ | FEROX LVIV`;
  return t.length <= 65 ? t : (lo ? `${n} — від ${uah(lo)} | FEROX LVIV`
                                  : `${n} — Львів, Київ | FEROX LVIV`);
}
function seoDesc(p) {
  const lo = minPrice(p);
  const price = lo ? `Ціна від ${uah(lo)}. ` : 'Прорахунок за 15 хвилин. ';
  return `${seoName(p)} на замовлення: кортенова сталь, нержавійка AISI 304 або чорний метал з фарбуванням RAL. `
       + `${price}Виробництво у Львові, доставка по Україні — Київ, Одеса, Дніпро, Харків.`;
}
function seoKeywords(p) {
  const g = (CAT_SEO[p.c] || {}).g || 'вироби з металу';
  const pl = (CAT_SEO[p.c] || {}).pl || 'вироби з металу';
  const n = seoName(p).toLowerCase();
  const set = new Set([
    n, `${n} ціна`, `купити ${n}`,
    `${g} з кортену`, `${g} з металу`, `${g} з нержавійки`,
    `${g} купити львів`, `${g} купити київ`, `${g} на замовлення`,
    `${pl} україна`, 'кортенова сталь вироби', 'вироби з металу на замовлення',
    'металовироби львів', 'доставка по україні'
  ]);
  if (p.t.toLowerCase() !== n) set.add(p.t.toLowerCase());
  return [...set].join(', ');
}
function seoH1(p) {
  const n = seoName(p);
  return n.toLowerCase().includes('метал') || n.toLowerCase().includes('кортен')
    ? `${n}<br><em>на замовлення.</em>`
    : `${n}<br><em>з металу.</em>`;
}

const CAT_LABEL = {kashpo:'Кашпо',light:'Світильники',mangal:'Мангали',bowl:'Чаші',
  lamel:'Ламелі',sign:'Вивіски',facade:'Фасадні панелі',gate:'Панелі для воріт',
  clad:'Облицювання',decor:'Декор'};
const CAT_SUB = {kashpo:'kashpo',light:'svitylnyky',mangal:'mangal',bowl:'fontany',
  lamel:'fasady',sign:'vyviska',facade:'fasady',gate:'parkan',clad:'interior',decor:'skulptury'};

function uah(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' грн'; }
function esc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }


function cartMarkup() {
  return `<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Перегляд фото">
  <button type="button" class="lb-x" aria-label="Закрити">✕</button>
  <button type="button" class="lb-a lb-prev" aria-label="Попереднє фото">‹</button>
  <button type="button" class="lb-a lb-next" aria-label="Наступне фото">›</button>
  <figure class="lb-fig"><img id="lbImg" alt="" hidden><figcaption id="lbCap"></figcaption></figure>
</div>
<div class="toast" id="toast" role="status"></div>
<button type="button" class="cart-fab" id="cartFab" hidden aria-label="Відкрити замовлення">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 4h2.2l1.6 8.4a1.6 1.6 0 001.6 1.3h6.3a1.6 1.6 0 001.6-1.2L17.6 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="17" r="1.1" fill="currentColor"/><circle cx="15" cy="17" r="1.1" fill="currentColor"/></svg>
  <span id="cartN">0</span>
</button>
<div class="ov" id="cartOv"></div>
<aside class="cart" id="cart" role="dialog" aria-modal="true" aria-labelledby="cartT">
  <div class="cart-hd"><h2 id="cartT">Ваше замовлення</h2>
    <button type="button" class="pd-x cart-x" aria-label="Закрити">✕</button></div>
  <div class="cart-body" id="cartBody"></div>
  <div class="cart-foot" id="cartFoot"></div>
</aside>`;
}

function shopScript() {
  return `
var TG='https://t.me/feroxlviv?text=';
var MULT=${JSON.stringify(METAL_MULT)};
var MI=${JSON.stringify(Object.fromEntries(METAL_ORDER.map(k => [k, {n: METAL_INFO[k].n, short: METAL_INFO[k].short, c: METAL_INFO[k].c, ch: METAL_INFO[k].ch, l: METAL_INFO[k].l, d: METAL_INFO[k].d, spec: METAL_INFO[k].spec, photo: METAL_INFO[k].photo}])))};
function fmt(n){return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')+' грн'}
function mp(base,metal){return MULT[metal]===1?base:Math.round(base*MULT[metal]/10)*10}

var CART=[];
try{var _c=localStorage.getItem('ferox_cart'); if(_c)CART=JSON.parse(_c)||[];}catch(e){CART=[];}
function cartSave(){try{localStorage.setItem('ferox_cart',JSON.stringify(CART))}catch(e){}}
function cartQty(){return CART.reduce(function(a,i){return a+i.q},0)}
function cartSum(){return CART.reduce(function(a,i){return a+(i.price||0)*i.q},0)}
function cartOld(){return CART.reduce(function(a,i){return a+((i.old||i.price||0))*i.q},0)}
function cartHasPrice(){return CART.some(function(i){return i.price})}
function toast(m){var t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('fx-on');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('fx-on')},3200)}
function cartFab(){var f=document.getElementById('cartFab'),n=document.getElementById('cartN');if(!f)return;var q=cartQty();f.hidden=q===0;if(n)n.textContent=q}

function cartText(){
  var L=['Доброго дня! Хочу оформити замовлення.',''];
  CART.forEach(function(i,k){
    L.push((k+1)+'. '+i.t);
    L.push('   Метал: '+i.m+' · Розмір: '+i.s+' · К-сть: '+i.q);
    if(i.price)L.push('   Ціна: '+fmt(i.price)+' × '+i.q+' = '+fmt(i.price*i.q));
    L.push('');
  });
  if(cartHasPrice())L.push('Разом: '+fmt(cartSum()));
  L.push('','Прошу підтвердити наявність і термін виготовлення.');
  return L.join('\\n');
}

function cartRender(){
  var body=document.getElementById('cartBody'),foot=document.getElementById('cartFoot');
  if(!body)return;
  if(!CART.length){
    body.innerHTML='<p class="cart-empty">Тут з\\'являться вироби, які ви додасте.<br>Оберіть товар, метал і розмір.</p>';
    foot.innerHTML='';cartFab();return;
  }
  body.innerHTML=CART.map(function(i,k){
    return '<div class="ci"><button type="button" class="ci-x" data-del="'+k+'" aria-label="Прибрати">✕</button>'+
    '<div class="ci-in"><div class="ci-t">'+i.t+'</div><div class="ci-m">'+i.m+' · '+i.s+'</div>'+
    '<div class="ci-b"><div class="qty"><button type="button" class="qty-b" data-ck="'+k+'" data-q="-1">−</button>'+
    '<input class="qty-i" data-cq="'+k+'" type="text" inputmode="numeric" value="'+i.q+'">'+
    '<button type="button" class="qty-b" data-ck="'+k+'" data-q="1">+</button></div>'+
    '<span class="ci-p">'+(i.price?fmt(i.price*i.q):'<em>за прорахунком</em>')+'</span></div></div></div>';
  }).join('');
  var sum=cartSum(),old=cartOld(),save=old-sum;
  foot.innerHTML=(cartHasPrice()?'<div class="cart-tot"><span>Разом</span><b>'+fmt(sum)+'</b></div>':'')+
    (save>0?'<p class="cart-save">Ваша економія — '+fmt(save)+'</p>':'')+
    '<p class="cart-note">Ціни за прайсом і є остаточні. Доставка рахується окремо за тарифом перевізника.</p>'+
    '<a class="btn-order" id="cartGo" href="#" target="_blank" rel="noopener">Оформити замовлення</a>';
  var g=document.getElementById('cartGo');if(g)g.href=TG+encodeURIComponent(cartText());
  cartFab();
}
function cartOpen(){cartRender();document.getElementById('cartOv').classList.add('fx-on');document.getElementById('cart').classList.add('fx-on');document.body.classList.add('lock')}
function cartClose(){document.getElementById('cartOv').classList.remove('fx-on');document.getElementById('cart').classList.remove('fx-on');document.body.classList.remove('lock')}

(function(){
  var fab=document.getElementById('cartFab'); if(!fab)return;
  fab.addEventListener('click',cartOpen);
  document.getElementById('cartOv').addEventListener('click',cartClose);
  document.getElementById('cart').addEventListener('click',function(e){
    if(e.target.closest('.cart-x')){cartClose();return}
    var d=e.target.closest('[data-del]');
    if(d){CART.splice(+d.dataset.del,1);cartSave();cartRender();return}
    var b=e.target.closest('[data-ck]');
    if(b){var k=+b.dataset.ck;CART[k].q+=(+b.dataset.q);if(CART[k].q<1)CART.splice(k,1);cartSave();cartRender()}
  });
  document.getElementById('cart').addEventListener('input',function(e){
    var i=e.target.closest('[data-cq]');if(!i)return;
    var k=+i.dataset.cq,v=parseInt(i.value,10);if(!v||v<1)v=1;if(v>99)v=99;
    CART[k].q=v;cartSave();cartRender();
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&document.getElementById('cart').classList.contains('fx-on'))cartClose();
  });
  cartFab();
})();

/* ── Повноекранний перегляд фото ── */
(function(){
  var lb=document.getElementById('lb'); if(!lb)return;
  var im=document.getElementById('lbImg'), cap=document.getElementById('lbCap');
  var list=[], idx=0;

  function collect(){
    list=[].slice.call(document.querySelectorAll('[data-zoom]'))
      .filter(function(e){return !e.hidden && e.getAttribute('src')});
  }
  function show(i){
    if(!list.length)return;
    idx=(i+list.length)%list.length;
    var e=list[idx];
    im.src=e.getAttribute('src'); im.alt=e.getAttribute('alt')||''; im.hidden=false;
    cap.textContent=e.getAttribute('alt')||'';
    var multi=list.length>1;
    lb.querySelector('.lb-prev').hidden=!multi;
    lb.querySelector('.lb-next').hidden=!multi;
  }
  function open(e){
    collect();
    var i=list.indexOf(e); if(i<0){list=[e];i=0}
    show(i); lb.classList.add('fx-on'); document.body.classList.add('lock');
    lb.querySelector('.lb-x').focus();
  }
  function close(){lb.classList.remove('fx-on');document.body.classList.remove('lock');im.hidden=true;im.removeAttribute('src')}

  document.addEventListener('click',function(ev){
    var z=ev.target.closest('[data-zoom]');
    if(z&&!z.hidden){ev.preventDefault();open(z);return}
  });
  lb.addEventListener('click',function(ev){
    if(ev.target.closest('.lb-x')){close();return}
    if(ev.target.closest('.lb-prev')){show(idx-1);return}
    if(ev.target.closest('.lb-next')){show(idx+1);return}
    if(!ev.target.closest('.lb-fig'))close();
  });
  document.addEventListener('keydown',function(ev){
    if(!lb.classList.contains('fx-on'))return;
    if(ev.key==='Escape')close();
    if(ev.key==='ArrowLeft')show(idx-1);
    if(ev.key==='ArrowRight')show(idx+1);
  });
  var sx=null;
  lb.addEventListener('touchstart',function(e){sx=e.changedTouches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){
    if(sx===null)return;
    var d=e.changedTouches[0].clientX-sx; sx=null;
    if(Math.abs(d)>50)show(idx+(d<0?1:-1));
  },{passive:true});
})();`;
}

function itemScript(p) {
  return `
(function(){
  var PRODUCT=${JSON.stringify({t: p.t, slug: p.slug, img: p.img, badge: p.badge || null, pr: p.pr || null})};
  var metal='corten', size=null;
  var $=function(id){return document.getElementById(id)};

  var q=new URLSearchParams(location.search).get('metal');
  if(q&&MI[q])metal=q;

  function paintMetal(){
    var m=MI[metal],r=document.documentElement.style;
    r.setProperty('--m',m.c);r.setProperty('--m-l',m.l);r.setProperty('--m-d',m.d);
    document.querySelectorAll('.im-b').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.metal===metal))});
    var sp=$('itMspec'); if(sp)sp.textContent=m.spec;
    var img=$('itImg'),ph=$('itPh');
    if(img&&ph){
      if(m.photo){img.hidden=false;ph.hidden=true;}
      else{img.hidden=true;ph.hidden=false;
        ph.style.setProperty('--phc',m.ch);
        ph.querySelector('b').textContent=m.short;}
    }
    priceBox();
  }

  function priceBox(){
    var el=$('priceBox'); if(!el)return;
    if(!PRODUCT.pr){el.innerHTML='<span class="p-hint">Індивідуальне виготовлення — ціну надішлемо у відповідь</span>';return}
    if(!size){el.innerHTML='<span class="p-hint">Оберіть розмір — покажемо ціну</span>';return}
    if(!PRODUCT.pr[size]){
      el.innerHTML='<span class="p-hint">Індивідуальний розмір — ціну надішлемо у відповідь</span>';
      topPrice(null);qtySum();tgLink();return}
    var base=PRODUCT.pr[size][1], oldb=PRODUCT.pr[size][0];
    var now=mp(base,metal), old=oldb?mp(oldb,metal):null;
    topPrice(now);
    el.innerHTML=(old&&PRODUCT.badge?'<span class="p-badge">'+PRODUCT.badge+'</span>':'')+
      (old?'<span class="p-old">'+fmt(old)+'</span>':'')+
      '<span class="p-now">'+fmt(now)+'</span>'+
      (old?'<span class="p-save">−'+fmt(old-now)+'</span>':'')+
      (metal!=='corten'?'<span class="p-mnote">ціна для «'+MI[metal].short+'»</span>':'');
    qtySum();tgLink();
  }

  function topPrice(v){
    var big=$('itBig'), lb=$('itLb');
    if(!big)return;
    if(v){ big.textContent=fmt(v); if(lb)lb.textContent='Ціна'; }
    else {
      var vals=Object.keys(PRODUCT.pr||{}).map(function(k){return mp(PRODUCT.pr[k][1],metal)});
      if(vals.length){ big.textContent=fmt(Math.min.apply(null,vals)); if(lb)lb.textContent='Ціна від'; }
    }
  }

  function selectSize(v){
    size=v;
    document.querySelectorAll('.size').forEach(function(x){
      x.setAttribute('aria-pressed',String(x.dataset.s===v));
    });
    setQty(1);priceBox();
  }

  function smallestSize(){
    if(!PRODUCT.pr)return null;
    var ks=Object.keys(PRODUCT.pr);
    if(!ks.length)return null;
    return ks.reduce(function(a,b){return PRODUCT.pr[b][1]<PRODUCT.pr[a][1]?b:a});
  }

  function curPrice(){
    if(!PRODUCT.pr||!size||!PRODUCT.pr[size])return null;
    return mp(PRODUCT.pr[size][1],metal);
  }
  function getQty(){var i=$('qtyI');var v=i?parseInt(i.value,10):1;return(!v||v<1)?1:(v>99?99:v)}
  function setQty(v){var i=$('qtyI');if(!i)return;i.value=(v<1?1:(v>99?99:v));qtySum()}
  function qtySum(){
    var el=$('qtySum');if(!el)return;
    var pr=curPrice(),q=getQty();
    el.innerHTML=(pr&&q>1)?'<b>'+fmt(pr*q)+'</b>':'';
  }
  function tgLink(){
    var b=$('tgBtn');if(!b)return;
    var pr=curPrice();
    var t='Доброго дня! Цікавить: '+PRODUCT.t+'\\nМетал: '+MI[metal].short+
      (size?'\\nРозмір: '+size:'')+(pr?'\\nЦіна: '+fmt(pr):'')+
      '\\n\\nПрошу підтвердити наявність і термін.';
    b.href=TG+encodeURIComponent(t);
  }

  document.querySelectorAll('.im-b').forEach(function(b){
    b.addEventListener('click',function(){metal=b.dataset.metal;paintMetal()});
  });
  document.querySelectorAll('.size').forEach(function(b){
    b.addEventListener('click',function(){selectSize(b.dataset.s)});
  });
  document.querySelectorAll('.qty-b[data-q]').forEach(function(b){
    if(b.dataset.ck)return;
    b.addEventListener('click',function(){setQty(getQty()+(+b.dataset.q))});
  });
  var qi=$('qtyI'); if(qi)qi.addEventListener('input',qtySum);

  var add=$('addBtn');
  if(add)add.addEventListener('click',function(){
    if(!size){toast('Спершу оберіть розмір');
      var f=document.querySelector('.size');if(f)f.scrollIntoView({behavior:'smooth',block:'center'});return}
    var pr=curPrice();
    var oldb=(PRODUCT.pr&&PRODUCT.pr[size])?PRODUCT.pr[size][0]:null;
    var m=MI[metal].short,qn=getQty();
    var same=CART.find(function(i){return i.t===PRODUCT.t&&i.s===size&&i.m===m});
    if(same)same.q+=qn;
    else CART.push({t:PRODUCT.t,s:size,m:m,q:qn,price:pr,old:oldb?mp(oldb,metal):null});
    cartSave();cartRender();toast(PRODUCT.t+' — додано до замовлення');
  });

  paintMetal();
  var s0=smallestSize();
  if(s0)selectSize(s0);
  tgLink();
})();`;
}

function itemPage(p) {
  const sizes = Object.keys(p.pr || {});
  const lo = minPrice(p), hi = maxPrice(p);
  const img = `https://feroxlviv.com.ua/uploads/${p.img}.webp`;
  const url = `https://feroxlviv.com.ua/viroby/tovar/${p.slug}/`;
  const sub = p.sub || CAT_SUB[p.c];
  const catName = CAT_LABEL[p.c] || 'Вироби';

  const offers = [];
  METAL_ORDER.forEach(mk => sizes.forEach((s, i) => {
    offers.push({
      "@type": "Offer",
      "name": `${p.t} — ${s}, ${METAL_INFO[mk].short}`,
      "sku": `${p.slug}-${mk}-${i + 1}`,
      "url": url,
      "priceCurrency": "UAH",
      "price": String(mPrice(p.pr[s][1], mk)),
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "FEROX LVIV" }
    });
  }));

  const schema = sizes.length ? {
    "@context": "https://schema.org", "@type": "Product",
    "name": `${p.t} з кортенової сталі`,
    "description": p.full,
    "image": [img], "sku": p.slug, "mpn": p.slug.toUpperCase(),
    "brand": { "@type": "Brand", "name": "FEROX LVIV" },
    "material": "Кортенова сталь, нержавіюча сталь AISI 304, конструкційна сталь",
    "category": catName,
    "offers": offers.length === 1 ? offers[0] : {
      "@type": "AggregateOffer", "priceCurrency": "UAH",
      "lowPrice": String(lo), "highPrice": String(hi),
      "offerCount": String(offers.length),
      "availability": "https://schema.org/InStock", "offers": offers
    }
  } : null;

  const crumbSchema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type":"ListItem","position":1,"name":"Головна","item":"https://feroxlviv.com.ua/"},
      {"@type":"ListItem","position":2,"name":"Вироби з металу","item":"https://feroxlviv.com.ua/viroby/"},
      {"@type":"ListItem","position":3,"name":p.t,"item":url}
    ]
  };

  const metalBtns = METAL_ORDER.map(k => {
    const m = METAL_INFO[k];
    return `<button type="button" class="im-b" data-metal="${k}" aria-pressed="${k === 'corten'}" style="--c:${m.ch}">
        <i></i><span>${esc(m.n.split('—')[0].trim())}</span>
      </button>`;
  }).join('\n      ');

  const sizeBtns = sizes.map(s =>
    `<button type="button" class="size" data-s="${esc(s)}" data-base="${p.pr[s][1]}" data-old="${p.pr[s][0] || ''}" aria-pressed="false">${esc(s)}</button>`
  ).join('\n        ') +
  `\n        <button type="button" class="size cust" data-s="індивідуальні" aria-pressed="false">Індивідуальні розміри</button>`;

  return head(seoTitle(p), seoDesc(p), seoKeywords(p), `/viroby/tovar/${p.slug}/`) +
  (schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : '') +
  `<script type="application/ld+json">${JSON.stringify(crumbSchema)}</script>` +
  nav('viroby') +
  pageHeader(
    [{href:'/',label:'Головна'},{href:'/viroby/',label:'Вироби'},{label:p.t}],
    seoH1(p),
    esc(p.d) + ' Кортен, нержавійка або чорна сталь. Виробництво у Львові, доставка по Україні.',
    null, false, catName
  ) + `
<section class="it-wrap">
  <div class="it-grid">
    <div class="it-media">
      <div class="it-ph" id="itPh" hidden><i></i><b></b><s>Фото у цьому металі готуємо. Форма й розміри ті самі.</s></div>
      <img id="itImg" data-zoom src="/uploads/${p.img}.webp" alt="${esc(p.t)} з кортенової сталі — FEROX LVIV, виробництво у Львові" width="1000" height="750" loading="eager">
      <button type="button" class="it-zoom" aria-label="Відкрити фото на весь екран">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M7.6 13.2a5.6 5.6 0 100-11.2 5.6 5.6 0 000 11.2zM16 16l-4.4-4.4M5.6 7.6h4M7.6 5.6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="it-info">
      ${sizes.length ? `<p class="it-price-lead">
        ${p.badge ? `<span class="it-badge">${esc(p.badge)}</span>` : ''}
        <span class="it-from" id="itLb">Ціна</span>
        <span class="it-big" id="itBig">${uah(minSize(p))}</span>
      </p>` : ''}

      <p class="it-full">${esc(p.full)}</p>
      ${p.note ? `<p class="it-note">${esc(p.note)}</p>` : ''}

      <div class="it-sec">
        <span class="it-lb">Метал</span>
        <div class="im-row">
      ${metalBtns}
        </div>
        <p class="it-mspec" id="itMspec">${METAL_INFO.corten.spec}</p>
      </div>

      ${sizes.length ? `<div class="it-sec">
        <span class="it-lb">Розмір, см</span>
        <div class="row">
        ${sizeBtns}
        </div>
        <div class="price-box" id="priceBox"></div>
      </div>

      <div class="it-sec it-buy-sec">
        <div class="qty-row">
          <span class="qty-lb">Кількість</span>
          <div class="qty">
            <button type="button" class="qty-b" data-q="-1" aria-label="Менше">−</button>
            <input class="qty-i" id="qtyI" type="text" inputmode="numeric" value="1" aria-label="Кількість">
            <button type="button" class="qty-b" data-q="1" aria-label="Більше">+</button>
          </div>
          <span class="qty-sum" id="qtySum"></span>
        </div>
        <button type="button" class="it-b1" id="addBtn">Додати до замовлення</button>
        <a class="it-b2" id="tgBtn" href="https://t.me/feroxlviv" target="_blank" rel="noopener">Замовити в Telegram</a>
      </div>` : `
      <div class="it-sec it-buy-sec">
        <a class="it-b1" id="tgBtn" href="https://t.me/feroxlviv" target="_blank" rel="noopener">Отримати прорахунок</a>
        <a class="it-b2" href="tel:+380630194013">+38 (063) 019-40-13</a>
      </div>`}

      <ul class="it-specs">
        ${p.sp.map(x => `<li><b>${esc(x[0])}</b><span>${esc(x[1])}</span></li>`).join('\n        ')}
        <li><b>Метали</b><span>Кортен, нержавійка AISI 304, чорна сталь + RAL</span></li>
        <li><b>Виробництво</b><span>Власний цех у Львові</span></li>
        <li><b>Доставка</b><span>Київ, Одеса, Дніпро, Харків — уся Україна</span></li>
      </ul>

      <p class="it-more"><a href="/viroby/${sub}/">Більше про категорію «${esc(catName)}» →</a>
        <a href="/viroby/?cat=${p.c}">Усі «${esc(catName)}» у каталозі →</a></p>
    </div>
  </div>

  ${(() => {
    const idx = CATALOG.findIndex(x => x.slug === p.slug);
    const prev = CATALOG[(idx - 1 + CATALOG.length) % CATALOG.length];
    const next = CATALOG[(idx + 1) % CATALOG.length];
    const sib = CATALOG.filter(x => x.c === p.c && x.slug !== p.slug).slice(0, 4);
    return `
  <nav class="it-nav" aria-label="Навігація між виробами">
    <a class="it-nav-a it-nav-prev" href="/viroby/tovar/${prev.slug}/">
      <span class="it-nav-lb">← Попередній</span><span class="it-nav-t">${esc(prev.t)}</span></a>
    <a class="it-nav-all" href="/viroby/">Усі вироби</a>
    <a class="it-nav-a it-nav-next" href="/viroby/tovar/${next.slug}/">
      <span class="it-nav-lb">Наступний →</span><span class="it-nav-t">${esc(next.t)}</span></a>
  </nav>

  ${sib.length ? `<section class="it-sib">
    <h2 class="it-sib-h">Інші вироби в категорії «${esc(catName)}»</h2>
    <div class="it-sib-g">
      ${sib.map(x => {
        const l = minSize(x);
        return `<a class="it-sib-c" href="/viroby/tovar/${x.slug}/">
        <span class="it-sib-i"><img src="/uploads/${x.img}.webp" alt="${esc(x.t)} — FEROX LVIV" loading="lazy"></span>
        <span class="it-sib-b"><b>${esc(x.t)}</b>${l ? `<em>від ${uah(l)}</em>` : '<em>за прорахунком</em>'}</span></a>`;
      }).join('\n      ')}
    </div>
  </section>` : ''}`;
  })()}

  <div class="it-seo">
    <h2>${esc(p.t)} з металу — виготовлення на замовлення</h2>
    <p>Виготовляємо ${esc(p.t.toLowerCase())} з кортенової сталі, нержавіючої сталі AISI 304 та чорного металу з порошковим фарбуванням у будь-який колір RAL. Кортен набуває природної патини й не потребує догляду, нержавійка зберігає вигляд роками, фарбована сталь — найдоступніший варіант.</p>
    <p>Працюємо з власного виробництва у Львові: лазерна різка, гнуття на ЧПУ, зварювання TIG. Відправляємо по всій Україні — Київ, Одеса, Дніпро, Харків, Івано-Франківськ, Тернопіль. Потрібні нестандартні габарити — виготовимо за вашим кресленням або ескізом.</p>
  </div>
</section>

${cartMarkup()}
<script>
${shopScript()}
${itemScript(p)}
</script>
` + footer();
}


// ── THANK YOU PAGE ───────────────────────────────────────────
function thankYouPage() {
  return head(
    'Дякуємо за заявку | FEROX LVIV',
    'Ваша заявка отримана. Відповімо протягом 15 хвилин у робочий час.',
    'FEROX LVIV контакт',
    '/thank-you/'
  ) + nav('') + `
<section class="ty-section">
  <div class="ty-inner">
    <div class="ty-icon" aria-hidden="true">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="27" stroke="#a0522d" stroke-width="1.5"/>
        <path d="M18 28l7 7 13-13" stroke="#a0522d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <p class="ty-label">Заявка отримана</p>
    <h1 class="ty-h">Дякуємо!<br>Зв'яжемось<br><em>невдовзі.</em></h1>
    <p class="ty-sub">Відповідаємо протягом 15 хвилин у робочий час.<br>Якщо терміново — телефонуйте або пишіть у Telegram.</p>
    <div class="ty-contacts">
      <a href="tel:${site.contacts.phone}" class="ty-contact">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C7.163 21 3 16.837 3 7a2 2 0 012-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        <span>${site.contacts.phone}</span>
      </a>
      <a href="https://t.me/feroxlviv" target="_blank" rel="noopener" class="ty-contact">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 5L2 12.5l7 1M21 5l-5 15-4.5-5.5M21 5L9 13.5m0 0L11.5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Telegram</span>
      </a>
    </div>
    <a href="/" class="btn-p ty-back">
      <span>На головну</span>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
  <div class="ty-bg" aria-hidden="true"></div>
</section>
` + footer();
}

function build() {
  // Clean
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  // Static files
  fs.copyFileSync(SRC + '/styles.css', OUT + '/styles.css');
  fs.copyFileSync(SRC + '/script.js', OUT + '/script.js');
  // Cloudflare Pages routing & headers
  ['_redirects','_headers'].forEach(f => {
    const src = __dirname + '/static/' + f;
    if (fs.existsSync(src)) fs.copyFileSync(src, OUT + '/' + f);
  });
  const faviconSrc = __dirname + '/static/favicon.svg';
  if (fs.existsSync(faviconSrc)) fs.copyFileSync(faviconSrc, OUT + '/favicon.svg');
  const faviconIcoSrc = __dirname + '/static/favicon.ico';
  if (fs.existsSync(faviconIcoSrc)) fs.copyFileSync(faviconIcoSrc, OUT + '/favicon.ico');
  ['favicon-32.png','favicon-48.png','favicon-180.png'].forEach(f => {
    const src = __dirname + '/static/' + f;
    if (fs.existsSync(src)) fs.copyFileSync(src, OUT + '/' + f);
  });
  console.log('  ✓ styles.css, script.js');

  // Admin (Sveltia CMS)
  const ADMIN = __dirname + '/admin';
  if (fs.existsSync(ADMIN)) {
    fs.mkdirSync(OUT + '/admin', { recursive: true });
    fs.readdirSync(ADMIN).forEach(f => {
      fs.copyFileSync(ADMIN + '/' + f, OUT + '/admin/' + f);
    });
    console.log('  ✓ admin/');
  }

  // Uploaded media (from CMS uploads)
  const UPLOADS = __dirname + '/static/uploads';
  if (fs.existsSync(UPLOADS)) {
    fs.mkdirSync(OUT + '/uploads', { recursive: true });
    fs.readdirSync(UPLOADS).forEach(f => {
      const src = UPLOADS + '/' + f;
      const dest = OUT + '/uploads/' + f;
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, dest);
    });
    console.log('  ✓ uploads/');
  }

  // Home
  writeFile('index.html', homePage());

  // Services
  writeFile('services/index.html', servicesIndex());
  services.forEach(s => writeFile(`services/${s.slug}/index.html`, servicePage(s)));

  // Portfolio
  writeFile('portfolio/index.html', portfolioIndex());
  projects.forEach(p => writeFile(`portfolio/${p.slug}/index.html`, projectPage(p)));

  // Blog
  writeFile('blog/index.html', blogListPage());
  blogPosts.forEach(post => writeFile(`blog/${post.slug}/index.html`, blogPostPage(post)));

  // Catalog — Вироби
  writeFile('viroby/index.html', catalogPage());
  CATALOG.forEach(p => writeFile(`viroby/tovar/${p.slug}/index.html`, itemPage(p)));
  catalogProducts.forEach(p => writeFile(`viroby/${p.slug}/index.html`, productPage(p)));

  writeFile('about/index.html', aboutPage());
  writeFile('process/index.html', processPage());
  writeFile('contact/index.html', contactPage());
  writeFile('architects/index.html', architectPage());
  writeFile('thank-you/index.html', thankYouPage());

  // Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  '/', '/viroby/', '/services/', '/portfolio/', '/blog/', '/about/', '/process/', '/contact/', '/architects/',
  ...catalogProducts.map(p => `/viroby/${p.slug}/`),
  ...CATALOG.map(p => `/viroby/tovar/${p.slug}/`),
  ...services.map(s => `/services/${s.slug}/`),
  ...projects.map(p => `/portfolio/${p.slug}/`),
  ...blogPosts.map(p => `/blog/${p.slug}/`)
].map(u => {
  const shop = u === '/viroby/' || u.startsWith('/viroby/tovar/');
  return `  <url><loc>https://feroxlviv.com.ua${u}</loc>`
       + `<lastmod>${shop ? SHOP_UPDATED : BUILD_DATE}</lastmod>`
       + `<changefreq>${shop ? 'weekly' : 'monthly'}</changefreq>`
       + `<priority>${u === '/' ? '1.0' : shop ? '0.9' : '0.7'}</priority></url>`;
}).join('\n')}
</urlset>`;
  writeFile('sitemap.xml', sitemap);

  // Robots
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: https://feroxlviv.com.ua/sitemap.xml\n`);

  // llms.txt — structured info for AI crawlers (Perplexity, Claude, Gemini)
  writeFile('llms.txt', `# FEROX LVIV

> Виготовлення дизайн-об'єктів з кортенової сталі та послуги металообробки у Львові, Україна.

FEROX LVIV — комерційний партнер виробничого підприємства з повним циклом металообробки. Ми виготовляємо архітектурні вироби та забезпечуємо промислову металообробку для архітекторів, девелоперів і виробничих компаній.

## Контакти

- Телефон: +380 63 019 40 13
- Email: feroxlviv.business@gmail.com
- Telegram: https://t.me/feroxlviv
- Сайт: https://feroxlviv.com.ua
- Локація: Львів, Україна

## Послуги

### Дизайн-об'єкти з кортену (COR-TEN)
${SERVICE_FAQ['corten'].map(f => `- **${f.q}** ${f.a}`).join('\n')}
Детальніше: https://feroxlviv.com.ua/services/corten/

### Лазерна різка металу
${SERVICE_FAQ['laser-cutting'].map(f => `- **${f.q}** ${f.a}`).join('\n')}
Детальніше: https://feroxlviv.com.ua/services/laser-cutting/

### Гнуття металу з ЧПУ
${SERVICE_FAQ['cnc-bending'].map(f => `- **${f.q}** ${f.a}`).join('\n')}
Детальніше: https://feroxlviv.com.ua/services/cnc-bending/

### Зварювання та вальцювання
${SERVICE_FAQ['welding'].map(f => `- **${f.q}** ${f.a}`).join('\n')}
Детальніше: https://feroxlviv.com.ua/services/welding/

### Hardox — броньова сталь
${SERVICE_FAQ['hardox'].map(f => `- **${f.q}** ${f.a}`).join('\n')}
Детальніше: https://feroxlviv.com.ua/services/hardox/

## Матеріали

- **Кортен (COR-TEN)**: атмосферостійка сталь стандартів A588, A606, COR-TEN A/B. Листи від 1.5 до 12 мм. Натуральна патина без фарбування.
- **Hardox**: шведська броньова сталь SSAB твердістю 400–600 HB. Hardox 400, 450, 500, 600.
- **Чорна сталь**: конструкційна сталь СТ3, СТ10, СТ20.
- **Нержавійка**: харчова і технічна нержавіюча сталь AISI 304, AISI 316.
- **Алюміній**: АМЦ, Д16, АД31.

## Блог

${blogPosts.slice(0,5).map(p => `- [${p.title}](https://feroxlviv.com.ua/blog/${p.slug}/) — ${p.excerpt || ''}`).join('\n')}

## Ключові факти

- Розташування виробництва: Львів, Україна
- Термін прорахунку: до 15 хвилин
- Термін виготовлення типових виробів: 7–14 робочих днів
- Клієнти: архітектори, девелопери, ландшафтні дизайнери, виробничі компанії, підприємства ОПК
- Мова обслуговування: українська
`);

  console.log('\n✅ Build complete! Files in:', OUT);
}

build();
