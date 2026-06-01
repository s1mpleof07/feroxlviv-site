// FEROX LVIV — Static site generator
const fs = require('fs');
const path = require('path');

const SRC = __dirname + '/src';
const OUT = __dirname + '/build';
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
  "email": "hello@feroxlviv.com.ua",
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
    `<a href="/services/${s.slug}/"><strong>${s.titleShort}</strong><small>${s.tags.slice(0,3).join(' · ')}</small></a>`
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
    ${link('/portfolio/', 'Проекти', 'portfolio')}
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
  <a href="/portfolio/"${active === 'portfolio' ? ' class="active"' : ''}>Проекти</a>
  <a href="/blog/"${active === 'blog' ? ' class="active"' : ''}>Блог</a>
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
        ${services.map(s => `<li><a href="/services/${s.slug}/">${s.titleShort}</a></li>`).join('')}
      </ul>
    </div>
    <div class="ft-col">
      <div class="ft-col-t">Компанія</div>
      <ul>
        <li><a href="/about/">Про нас</a></li>
        <li><a href="/portfolio/">Проекти</a></li>
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

<script src="/script.js?v=2" defer></script>
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
    <img src="/uploads/hero-bg.jpg" class="hero-photo-real" alt="Кортеновий олень — арт-об'єкт із сталі COR-TEN, виробництво FEROX LVIV" loading="eager" fetchpriority="high" decoding="async">
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
      <a href="${site.hero.ctaPrimary.href}" class="btn-p" data-event="cta_click" data-label="hero_primary">
        <span>${site.hero.ctaPrimary.label}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="${site.hero.ctaSecondary.href}" class="btn-g" data-event="cta_click" data-label="hero_secondary">
        <span>${site.hero.ctaSecondary.label}</span>
      </a>
    </div>
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

<section id="portfolio" style="padding-top:0">
  <div class="reveal" style="padding-top:80px;padding-bottom:40px">
    <p class="s-label">Проекти</p>
    <h2 class="s-title">Вибрані роботи<br><em>з металу.</em></h2>
  </div>
  <div class="port-grid">
    ${projects.map(p => `<a class="port-item${p.wide ? ' port-wide' : ''} reveal" href="/portfolio/${p.slug}/">
      <div class="port-inner">
        <div class="port-bg" aria-hidden="true" style="background-image:url(${p.image})"></div>
        <div class="port-ov" aria-hidden="true"></div>
        <div class="port-c">
          <p class="port-tag">${p.tag}</p>
          <h3 class="port-title">${p.title}</h3>
        </div>
      </div>
    </a>`).join('')}
  </div>
  <div style="text-align:center;margin-top:48px">
    <a href="/portfolio/" class="btn-dark"><span>Всі проекти</span><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
  </div>
</section>

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
        <div class="port-bg" aria-hidden="true" style="background-image:url(${p.image})"></div>
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
        <div class="port-bg" aria-hidden="true" style="background-image:url(${op.image})"></div>
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
    <img src="/uploads/hero-bg.jpg" class="arch-hero-img" alt="Арт-скульптура з кортенової сталі у преміальному інтер'єрі — FEROX LVIV" loading="eager" fetchpriority="high" decoding="async">
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

  <div class="patina-stages reveal">
    <div class="patina-stage">
      <div class="patina-swatch" style="background:#8e8c87"></div>
      <div class="patina-stage-body">
        <div class="patina-stage-date">День монтажу</div>
        <h3 class="patina-stage-t">Сталь без патини</h3>
        <p class="patina-stage-d">Після різки та гнуття поверхня сріблясто-сіра. Виглядає як звичайний метал. Замовника треба попередити — це не брак, це початок процесу.</p>
      </div>
    </div>
    <div class="patina-arrow" aria-hidden="true">→</div>
    <div class="patina-stage">
      <div class="patina-swatch" style="background:#a0622d"></div>
      <div class="patina-stage-body">
        <div class="patina-stage-date">2–4 місяці</div>
        <h3 class="patina-stage-t">Перша патина</h3>
        <p class="patina-stage-d">Оксидний шар формується нерівномірно — плямами теплого рудого кольору. Смуги від дощу на суміжних матеріалах — максимальні саме в цей період.</p>
      </div>
    </div>
    <div class="patina-arrow" aria-hidden="true">→</div>
    <div class="patina-stage">
      <div class="patina-swatch" style="background:#5c3118"></div>
      <div class="patina-stage-body">
        <div class="patina-stage-date">1–2 роки</div>
        <h3 class="patina-stage-t">Зріла патина</h3>
        <p class="patina-stage-d">Захисний шар стабілізується. Глибокий бархатний коричнево-рудий колір. Патина більше не «тече» і сама захищає сталь. Саме так виглядає кортен на рендерах.</p>
      </div>
    </div>
  </div>

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
  const faviconSrc = __dirname + '/static/favicon.svg';
  if (fs.existsSync(faviconSrc)) fs.copyFileSync(faviconSrc, OUT + '/favicon.svg');
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

  // Other pages
  writeFile('about/index.html', aboutPage());
  writeFile('process/index.html', processPage());
  writeFile('contact/index.html', contactPage());
  writeFile('architects/index.html', architectPage());
  writeFile('thank-you/index.html', thankYouPage());

  // Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  '/', '/services/', '/portfolio/', '/blog/', '/about/', '/process/', '/contact/', '/architects/',
  ...services.map(s => `/services/${s.slug}/`),
  ...projects.map(p => `/portfolio/${p.slug}/`),
  ...blogPosts.map(p => `/blog/${p.slug}/`)
].map(u => `  <url><loc>https://feroxlviv.com.ua${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
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
- Email: hello@feroxlviv.com.ua
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
