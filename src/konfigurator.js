/* FEROX LVIV — конфігуратор виробів
   Дані каталогу приходять із build.js у window.FX_CAT, множники металу — у window.FX_MULT.
   Заявка йде тим самим воркером, що й форма контакту. */
(function () {
'use strict';
var root = document.getElementById('kf');
if (!root || !window.THREE) return;

var CAT = window.FX_CAT || [];
var MULT = window.FX_MULT || { corten: 1, stainless: 0.7, steel: 0.5 };
var WORKER = 'https://leads-feroxlviv.prokopiv-andriy99.workers.dev/lead';
var SITE = 'https://feroxlviv.com.ua';
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
var catBy = {}; CAT.forEach(function (p) { catBy[p.slug] = p; });
var PI = Math.PI;

function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' грн'; }
function r100(n) { return Math.round(n / 100) * 100; }
function num(s) { var m = String(s).match(/\d+(?:[.,]\d+)?/g); return m ? m.map(function (x) { return parseFloat(x.replace(',', '.')); }) : []; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function cm(v) { return v / 100; }

/* ═════════ МЕТАЛИ ═════════ */
var METALS = {
  corten: { n: 'Кортен', rho: 7.85 },
  steel: { n: 'Чорна сталь + порошкова фарба', rho: 7.85 },
  stainless: { n: 'Нержавійка AISI 304', rho: 7.93 }
};
var RAL = [
  ['9005', 'Чорний', '#0e0e10'], ['7016', 'Антрацит', '#383e42'], ['7024', 'Графіт', '#474a50'],
  ['8017', 'Шоколад', '#45322e'], ['6005', 'Зелений мох', '#0f4336'], ['9016', 'Білий', '#f1f0ea']
];

/* ═════════ СЦЕНА ═════════ */
var stage = root.querySelector('.kf-stage');
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0, 0);
stage.insertBefore(renderer.domElement, stage.firstChild);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(32, 1, 0.02, 120);

(function envMap() {
  var env = new THREE.Scene();
  var room = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), new THREE.MeshBasicMaterial({ color: 0x3b3d40, side: THREE.BackSide }));
  room.position.y = 3; env.add(room);
  function panel(w, h, x, y, z, ry, rx, k) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); env.add(m);
  }
  panel(5, 1.5, 0, 6.4, -0.8, 0, PI / 2, 4.2); panel(4, 0.6, 0, 6.4, 1.5, 0, PI / 2, 2.6);
  panel(1.1, 4.5, -6.9, 2.6, 0.8, PI / 2, 0, 3.0); panel(0.9, 4.5, 6.9, 2.6, -0.8, -PI / 2, 0, 1.7);
  panel(0.6, 4.6, -2.4, 2.6, 6.9, PI, 0, 2.6); panel(0.4, 4.6, 1.8, 2.6, 6.9, PI, 0, 1.9);
  panel(10, 3.4, 0, 2.2, 6.8, PI, 0, 0.85); panel(10, 3.4, 6.8, 2.2, 0, -PI / 2, 0, 0.7);
  var pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.03).texture;
})();

var hemi = new THREE.HemisphereLight(0xffffff, 0x8a8680, 0.38); scene.add(hemi);
var sun = new THREE.DirectionalLight(0xffffff, 1.05);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 12; sun.shadow.bias = -0.0004;
scene.add(sun); scene.add(sun.target);
var floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.12 }));
floor.rotation.x = -PI / 2; floor.receiveShadow = true; scene.add(floor);
var contact = (function () {
  var c = document.createElement('canvas'); c.width = c.height = 256;
  var g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 16, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(.55, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.y = 0.0008; scene.add(m); return m;
})();

/* ── текстури ── */
function canvasTex(w, h, draw, repeat) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat, repeat);
  return t;
}
function rustDraw(g, w, h) {
  g.fillStyle = '#7d3f22'; g.fillRect(0, 0, w, h);
  var cols = ['#9a4e27', '#6b331b', '#a85a2e', '#5a2a16', '#b8703f', '#8a4425'];
  for (var i = 0; i < 2600; i++) {
    g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.05 + Math.random() * 0.18;
    var r = 2 + Math.random() * 22; g.beginPath();
    g.ellipse(Math.random() * w, Math.random() * h, r, r * (0.5 + Math.random()), Math.random() * 3, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}
var TEX = {
  rust: canvasTex(512, 512, rustDraw, 1.6),
  brush: canvasTex(1024, 1024, function (g, w, h) {
    g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 5000; i++) {
      var v = 90 + Math.random() * 80 | 0; g.strokeStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.18 + Math.random() * 0.3) + ')';
      g.lineWidth = Math.random() * 1.4 + 0.3; var x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 120 + Math.random() * 700, y); g.stroke();
    }
  }, 2.5)
};
TEX.rust.encoding = THREE.sRGBEncoding;
function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

/* ── матеріали ── */
var matCache = {};
function metalMat(s) {
  var key = s.metal + '|' + s.finish + '|' + s.ral;
  if (matCache[key]) return matCache[key];
  var m;
  if (s.metal === 'corten') {
    m = new THREE.MeshStandardMaterial({ color: s.finish === 'fresh' ? 0x8f8a84 : 0xffffff, map: s.finish === 'fresh' ? null : TEX.rust, roughness: 0.86, metalness: s.finish === 'fresh' ? 0.7 : 0.18, envMapIntensity: 0.9 });
  } else if (s.metal === 'steel') {
    var col = (RAL.filter(function (r) { return r[0] === s.ral; })[0] || RAL[0])[2];
    m = new THREE.MeshStandardMaterial({ color: lin(col), roughness: 0.58, metalness: 0.25, envMapIntensity: 0.8 });
  } else {
    var mirror = s.finish === 'mirror';
    m = new THREE.MeshPhysicalMaterial({ color: mirror ? 0xe2e4e7 : 0xd4d6d9, metalness: 1, roughness: mirror ? 0.04 : 0.3, roughnessMap: mirror ? null : TEX.brush, bumpMap: mirror ? null : TEX.brush, bumpScale: 0.001, envMapIntensity: 1.15 });
  }
  m.userData.baseEnv = m.envMapIntensity;
  return (matCache[key] = m);
}
var M = {
  soil: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x51683f, roughness: 0.9 }),
  leaf2: new THREE.MeshStandardMaterial({ color: 0x6a7f47, roughness: 0.9 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1c1b1a, roughness: 0.9 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xc9c5bd, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.9 }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x3d5360, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.8 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xece8e1, roughness: 0.55 }),
  glow: new THREE.MeshStandardMaterial({ color: 0x2a2520, emissive: 0xffb25a, emissiveIntensity: 0.0, roughness: 1 })
};
['soil', 'leaf', 'leaf2', 'dark', 'wall', 'wood', 'stone', 'ceramic', 'water'].forEach(function (k) { M[k].color.convertSRGBToLinear(); });

/* ── примітиви ── */
function add(g, geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
function box(g, w, h, d, mat, x, y, z) { return add(g, new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function vis(t) { return Math.max(t, 0.004); } // стінка тонша за 4 мм на екрані зникає
function openBox(g, L, W, H, t, mat) {
  t = vis(t);
  box(g, L, H, t, mat, 0, H / 2, W / 2 - t / 2); box(g, L, H, t, mat, 0, H / 2, -W / 2 + t / 2);
  box(g, t, H, W - 2 * t, mat, L / 2 - t / 2, H / 2, 0); box(g, t, H, W - 2 * t, mat, -L / 2 + t / 2, H / 2, 0);
  box(g, L - 2 * t, t, W - 2 * t, mat, 0, t / 2 + 0.02, 0);
}
function tube(g, r, h, t, mat, y0) {
  t = vis(t); y0 = y0 || 0;
  add(g, new THREE.CylinderGeometry(r, r, h, 72, 1, true), mat, 0, y0 + h / 2, 0);
  var inner = new THREE.MeshStandardMaterial({ color: lin(0x2a2320), roughness: 0.95, side: THREE.BackSide });
  add(g, new THREE.CylinderGeometry(r - t, r - t, h, 72, 1, true), inner, 0, y0 + h / 2, 0);
  var ring = add(g, new THREE.RingGeometry(r - t, r, 72), mat, 0, y0 + h, 0); ring.rotation.x = -PI / 2;
}
function lathe(g, pts, mat, y) {
  var v = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
  var m = add(g, new THREE.LatheGeometry(v, 72), mat, 0, y || 0, 0); m.material.side = THREE.DoubleSide; return m;
}
function roundedShape(w, h, r) {
  var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, PI / 2, PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, PI, 1.5 * PI, false); return s;
}
function plant(g, r, y, spread) {
  var n = Math.max(5, Math.round(r * 40));
  for (var i = 0; i < n; i++) {
    var a = Math.random() * 2 * PI, d = Math.random() * r * 0.7, s = r * (0.28 + Math.random() * 0.25);
    add(g, new THREE.IcosahedronGeometry(s, 1), i % 2 ? M.leaf : M.leaf2, Math.cos(a) * d * (spread || 1), y + s * 0.6 + Math.random() * r * 0.5, Math.sin(a) * d);
  }
}
function wall(g, w, h, z) { var m = box(g, w, h, 0.04, M.wall, 0, h / 2, z - 0.02); m.userData.extra = true; return m; }
function glowAt(g, geo, x, y, z) { var m = add(g, geo, M.glow, x, y, z); m.castShadow = false; return m; }

/* перфорація: одна текстура на всю панель (дірки прозорі) */
function perfMat(s, Wm, Hm, pattern, holeCm) {
  var pxcm = Math.min(5, 2048 / Math.max(Wm, Hm) / 100);
  var w = Math.max(64, Math.round(Wm * 100 * pxcm)), h = Math.max(64, Math.round(Hm * 100 * pxcm));
  var hole = holeCm * pxcm, step = hole * 2.1, margin = 5 * pxcm;
  var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d');
  if (s.metal === 'corten') rustDraw(g, w, h); else { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
  g.globalCompositeOperation = 'destination-out';
  var rows = Math.floor((h - 2 * margin) / step), cols = Math.floor((w - 2 * margin) / step);
  var ox = (w - cols * step) / 2 + step / 2, oy = (h - rows * step) / 2 + step / 2;
  for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) {
    var x = ox + j * step + (pattern === 'romb' && i % 2 ? step / 2 : 0), y = oy + i * step;
    if (pattern === 'romb' && i % 2 && j === cols - 1) continue;
    g.beginPath();
    if (pattern === 'kvadrat') g.rect(x - hole / 2, y - hole / 2, hole, hole);
    else if (pattern === 'romb') { g.moveTo(x, y - hole * 0.7); g.lineTo(x + hole * 0.7, y); g.lineTo(x, y + hole * 0.7); g.lineTo(x - hole * 0.7, y); }
    else if (pattern === 'hvylia') { var k = hole * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin((j / cols) * PI * 3 + i * 0.35))); g.arc(x, y, k / 2, 0, 7); }
    else if (pattern === 'lystia') { g.ellipse(x + (Math.random() - .5) * hole * .6, y, hole * (0.3 + Math.random() * .35), hole * (0.12 + Math.random() * .15), Math.random() * 3, 0, 7); }
    else g.arc(x, y, hole / 2, 0, 7);
    g.fill();
  }
  var tex = new THREE.CanvasTexture(c);
  var base = metalMat(s), m = base.clone();
  m.roughnessMap = null; m.bumpMap = null; m.side = THREE.DoubleSide; m.alphaTest = 0.5;
  if (s.metal === 'corten') { m.map = tex; m.map.encoding = THREE.sRGBEncoding; }
  else { m.map = null; m.alphaMap = tex; }
  m.needsUpdate = true; return m;
}
function perfPanel(g, W, H, s, pattern, hole, y0, z) {
  var m = add(g, new THREE.PlaneGeometry(W, H), perfMat(s, W, H, pattern, hole), 0, (y0 || 0) + H / 2, z || 0);
  m.castShadow = true; return m;
}

/* об'ємні літери: шари з альфа-текстурою + ореол для контражуру */
function letters(g, text, hM, depthM, mat, y0, z0, halo) {
  text = (text || 'FEROX').slice(0, 24);
  var fs = 200, font = '700 ' + fs + 'px "DM Sans", Arial, sans-serif', pad = 90;
  var c = document.createElement('canvas'), g2 = c.getContext('2d'); g2.font = font;
  var tw = Math.ceil(g2.measureText(text).width) + pad * 2;
  c.width = Math.min(4096, tw); c.height = Math.round(fs * 1.25) + pad;
  g2 = c.getContext('2d'); g2.font = font; g2.fillStyle = '#fff'; g2.textBaseline = 'middle';
  g2.fillText(text, pad, c.height / 2 + fs * 0.04);
  var tex = new THREE.CanvasTexture(c);
  var capH = fs * 0.72, scale = hM / capH, W = c.width * scale, H = c.height * scale;
  var base = mat.color.clone();
  if (mat.map) base = lin(0x8a4a2b);           // кортен без карти: чистий колір іржі
  var layers = 14;
  for (var i = 0; i <= layers; i++) {
    var lm = new THREE.MeshStandardMaterial({ color: i === layers ? base : base.clone().multiplyScalar(0.7), roughness: mat.roughness, metalness: mat.metalness, alphaMap: tex, alphaTest: 0.5, side: THREE.DoubleSide, envMapIntensity: mat.envMapIntensity });
    lm.userData.baseEnv = mat.envMapIntensity;
    var m = add(g, new THREE.PlaneGeometry(W, H), lm, 0, y0, z0 + depthM * i / layers);
    m.castShadow = i === layers;
  }
  if (halo) {
    var hc = document.createElement('canvas'); hc.width = c.width; hc.height = c.height;
    var hg = hc.getContext('2d'); hg.font = font; hg.textBaseline = 'middle';
    hg.shadowColor = 'rgba(255,170,80,1)'; hg.fillStyle = 'rgba(255,170,80,1)';
    [60, 34, 16].forEach(function (b) { hg.shadowBlur = b; hg.fillText(text, pad, c.height / 2 + fs * 0.04); });
    var hm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var hmesh = add(g, new THREE.PlaneGeometry(W * 1.02, H * 1.06), hm, 0, y0, 0.003);
    hmesh.castShadow = false; hmesh.receiveShadow = false; hmesh.userData.halo = true;
  }
  return { w: (c.width - pad * 2) * scale, h: hM, n: text.replace(/\s/g, '').length };
}

/* силует людини для масштабу */
var human = (function () {
  var t = canvasTex(256, 1024, function (g, w, h) {
    g.fillStyle = '#6f6c67';
    g.beginPath(); g.arc(128, 70, 52, 0, 7); g.fill();
    g.beginPath(); g.moveTo(58, 150); g.lineTo(198, 150); g.quadraticCurveTo(222, 152, 224, 190); g.lineTo(214, 560); g.lineTo(186, 560); g.lineTo(178, 1010); g.lineTo(140, 1010); g.lineTo(128, 600); g.lineTo(116, 1010); g.lineTo(78, 1010); g.lineTo(70, 560); g.lineTo(42, 560); g.lineTo(32, 190); g.quadraticCurveTo(34, 152, 58, 150); g.fill();
  });
  t.repeat.set(1, 1);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 1.75), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
  m.visible = false; scene.add(m); return m;
})();

/* ═════════ ТОВАРИ ═════════
   p — параметри (см), o — опції, s — метал. build повертає габарит (м) і площу металу (м²). */
function sz(key, re) { var n = num(key); return n; }
var D = {
  'kashpo-krugle': {
    t: 2, params: [['D', 'Діаметр', 30, 120, 5, 50], ['H', 'Висота', 25, 100, 5, 50]],
    opts: [['plant', 'Рослина', 'bool', true]],
    preset: function (k) { var n = num(k); return n.length >= 2 ? { D: n[0], H: n[1] } : null; },
    area: function (p) { var d = cm(p.D), h = cm(p.H); return PI * d * h + PI * d * d / 4; },
    dimsText: function (p) { return '⌀' + p.D + ' × H' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var r = cm(p.D) / 2, h = cm(p.H), mat = metalMat(s);
      tube(g, r, h, 0.002, mat, 0.02);
      for (var i = 0; i < 3; i++) { var a = i * 2 * PI / 3; box(g, 0.03, 0.02, 0.03, mat, Math.cos(a) * r * 0.7, 0.01, Math.sin(a) * r * 0.7); }
      var soil = add(g, new THREE.CircleGeometry(r - 0.006, 48), M.soil, 0, 0.02 + h - 0.03, 0); soil.rotation.x = -PI / 2;
      if (o.plant) plant(g, r * 0.8, 0.02 + h - 0.03);
      return { x: 2 * r, y: h, y0: 0.02, z: 2 * r };
    }
  },
  'kashpo-pryamokutne': {
    t: 2, params: [['L', 'Довжина', 40, 300, 5, 90], ['W', 'Ширина', 20, 100, 5, 25], ['H', 'Висота', 25, 100, 5, 60]],
    opts: [['plant', 'Рослина', 'bool', true]],
    preset: function (k) { var n = num(k); return n.length >= 3 ? { L: n[0], H: n[1], W: n[2] } : null; },
    area: function (p) { var L = cm(p.L), W = cm(p.W), H = cm(p.H); return 2 * L * H + 2 * W * H + L * W; },
    dimsText: function (p) { return p.L + ' × ' + p.W + ' × H' + p.H + ' см'; },
    warn: function (p) { return p.L > 150 ? 'Стінка довша за 1,5 м — додамо внутрішні ребра жорсткості, щоб ґрунт її не вигнув.' : ''; },
    build: function (g, p, o, s) {
      var L = cm(p.L), W = cm(p.W), H = cm(p.H), mat = metalMat(s);
      openBox(g, L, W, H, 0.002, mat);
      box(g, L - 0.012, 0.01, W - 0.012, M.soil, 0, H - 0.03, 0);
      if (o.plant) { var n = Math.max(1, Math.round(L / 0.35)); for (var i = 0; i < n; i++) { var gg = new THREE.Group(); gg.position.x = -L / 2 + (i + 0.5) * L / n; plant(gg, Math.min(W, L / n) * 0.6, H - 0.03); g.add(gg); } }
      return { x: L, y: H, z: W };
    }
  },
  'nabir-kashpo': {
    t: 2, params: [['n', 'Кашпо в наборі', 2, 4, 1, 3], ['D', 'Найменший діаметр', 30, 60, 5, 40], ['step', 'Крок діаметра', 5, 20, 5, 10]],
    opts: [['plant', 'Рослини', 'bool', true]],
    preset: function (k) { if (/S/.test(k)) return { n: 2, D: 40, step: 10 }; if (/L/.test(k)) return { n: 4, D: 40, step: 10 }; return { n: 3, D: 40, step: 10 }; },
    items: function (p) { var a = []; for (var i = 0; i < p.n; i++) a.push(p.D + i * p.step); return a; },
    area: function (p) { return this.items(p).reduce(function (s, d) { return s + D['kashpo-krugle'].area({ D: d, H: d }); }, 0); },
    dimsText: function (p) { return this.items(p).map(function (d) { return '⌀' + d + '×' + d; }).join(' + ') + ' см'; },
    build: function (g, p, o, s) {
      var ds = this.items(p), x = 0, total = ds.reduce(function (a, d) { return a + cm(d) + 0.08; }, -0.08), mx = 0;
      x = -total / 2;
      ds.forEach(function (d, i) {
        var gg = new THREE.Group(); gg.position.set(x + cm(d) / 2, 0, (i % 2 ? -1 : 1) * cm(d) * 0.18); g.add(gg);
        D['kashpo-krugle'].build(gg, { D: d, H: d }, { plant: o.plant }, s); x += cm(d) + 0.08; mx = Math.max(mx, cm(d));
      });
      return { x: total, y: mx + 0.02, z: mx * 1.3 };
    },
    price: function (p, fit) { return this.items(p).reduce(function (s, d) { return s + fit('kashpo-krugle', { D: d, H: d }); }, 0) * 0.9; }
  },
  'likhtar-ferox-pro-1': {
    t: 2, glow: true, params: [['W', 'Сторона перерізу', 12, 30, 1, 15], ['H', 'Висота', 30, 120, 5, 40]],
    opts: [],
    preset: function (k) { var n = num(k); return n.length ? { H: n[0] } : null; },
    area: function (p) { var W = cm(p.W), H = cm(p.H); return 4 * W * H + W * W; },
    dimsText: function (p) { return p.W + ' × ' + p.W + ' × H' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), mat = metalMat(s);
      box(g, W, H, W, mat, 0, H / 2, 0);
      var slit = glowAt(g, new THREE.BoxGeometry(0.012, H * 0.62, 0.004), 0, H * 0.52, W / 2 + 0.001); slit.rotation.z = 0.22;
      box(g, W + 0.01, 0.012, W + 0.01, mat, 0, H + 0.006, 0);
      return { x: W, y: H, z: W, glows: [[0, H * 0.55, W / 2 + 0.05, 0.9]] };
    }
  },
  'ferox-mini-light': {
    t: 2, glow: true, params: [['W', 'Ширина', 15, 40, 1, 20], ['H', 'Висота', 10, 25, 1, 12], ['Dp', 'Виліт від стіни', 8, 20, 1, 10]],
    opts: [],
    preset: function (k) { var n = num(k); return n.length >= 3 ? { W: n[0], H: n[1], Dp: n[2] } : null; },
    area: function (p) { var W = cm(p.W), H = cm(p.H), d = cm(p.Dp); return 2 * (W * H + W * d + H * d); },
    dimsText: function (p) { return p.W + ' × ' + p.H + ' × ' + p.Dp + ' см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), d = cm(p.Dp), y = 0.9, mat = metalMat(s);
      wall(g, 1.4, 1.8, 0);
      box(g, W, H, d, mat, 0, y, d / 2);
      glowAt(g, new THREE.CircleGeometry(W * 0.12, 24), 0, y + H / 2 + 0.001, d / 2).rotation.x = -PI / 2;
      glowAt(g, new THREE.CircleGeometry(W * 0.12, 24), 0, y - H / 2 - 0.001, d / 2).rotation.x = PI / 2;
      return { x: W, y: H, z: d, y0: y - H / 2, glows: [[0, y + H / 2 + 0.12, d / 2, 0.6], [0, y - H / 2 - 0.12, d / 2, 0.6]] };
    }
  },
  'svitylnyk-kulya': {
    t: 1.5, glow: true, params: [['D', 'Діаметр', 20, 80, 5, 35]],
    opts: [['mount', 'Виконання', 'select', 'stand', [['stand', 'На ніжці'], ['hang', 'Підвісний']]], ['pattern', 'Перфорація', 'select', 'kolo', [['kolo', 'Кола'], ['lystia', 'Листя'], ['kvadrat', 'Квадрати']]]],
    preset: function (k) { var n = num(k); return n.length ? { D: n[0] } : null; },
    area: function (p) { var d = cm(p.D); return PI * d * d; },
    dimsText: function (p) { return '⌀' + p.D + ' см'; },
    build: function (g, p, o, s) {
      var r = cm(p.D) / 2, y = o.mount === 'hang' ? 1.6 : r + 0.35, mat = perfMat(s, PI * 2 * r, PI * r, o.pattern, Math.max(1.2, p.D / 18));
      add(g, new THREE.SphereGeometry(r, 64, 40), mat, 0, y, 0);
      glowAt(g, new THREE.SphereGeometry(r * 0.25, 20, 14), 0, y, 0);
      if (o.mount === 'hang') { add(g, new THREE.CylinderGeometry(0.003, 0.003, 2.4 - y - r, 8), M.dark, 0, (2.4 + y + r) / 2, 0); }
      else { add(g, new THREE.CylinderGeometry(0.012, 0.012, y - r, 12), metalMat(s), 0, (y - r) / 2, 0); add(g, new THREE.CylinderGeometry(r * 0.5, r * 0.55, 0.012, 32), metalMat(s), 0, 0.006, 0); }
      return { x: 2 * r, y: 2 * r, z: 2 * r, y0: y - r, glows: [[0, y, 0, 1.2]] };
    }
  },
  'mangal-vbudovanyi': {
    t: 3, params: [['L', 'Довжина', 100, 250, 10, 150], ['W', 'Глибина', 50, 80, 5, 60], ['H', 'Висота', 80, 100, 5, 90]],
    opts: [['worktop', 'Робоча поверхня', 'bool', true], ['wood', 'Ніша для дров', 'bool', true]],
    preset: function (k) { var n = num(k); return n.length >= 3 ? { L: n[0], W: n[1], H: n[2] } : null; },
    area: function (p) { var L = cm(p.L), W = cm(p.W), H = cm(p.H); return 2 * L * H + 2 * W * H + 2.4 * L * W; },
    dimsText: function (p) { return p.L + ' × ' + p.W + ' × H' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var L = cm(p.L), W = cm(p.W), H = cm(p.H), mat = metalMat(s), fl = o.worktop ? Math.min(0.7, L * 0.5) : L;
      box(g, L, H - 0.2, W, mat, 0, (H - 0.2) / 2, 0);
      box(g, fl, 0.2, W, mat, -L / 2 + fl / 2, H - 0.1, 0);
      box(g, fl - 0.06, 0.02, W - 0.06, M.dark, -L / 2 + fl / 2, H + 0.001, 0);
      for (var i = 0; i < 12; i++) box(g, 0.006, 0.006, W - 0.08, mat, -L / 2 + 0.05 + i * (fl - 0.1) / 11, H + 0.01, 0);
      if (o.worktop) box(g, L - fl, 0.03, W, mat, L / 2 - (L - fl) / 2, H - 0.2 + 0.015, 0);
      if (o.wood) {
        box(g, L * 0.6, 0.34, 0.01, M.dark, -L * 0.1, 0.26, W / 2 + 0.001);
        for (var j = 0; j < 7; j++) { var lg = add(g, new THREE.CylinderGeometry(0.045, 0.045, W * 0.8, 10), M.wood, -L * 0.36 + (j % 4) * L * 0.12 + (j > 3 ? L * 0.06 : 0), 0.14 + (j > 3 ? 0.09 : 0), 0.02); lg.rotation.x = PI / 2; }
      }
      return { x: L, y: H, z: W };
    }
  },
  'mangal-chasha': {
    t: 3, glow: true, params: [['D', 'Діаметр', 50, 120, 5, 80], ['H', 'Глибина чаші', 20, 50, 5, 35]],
    opts: [['grill', 'Решітка', 'bool', true]],
    preset: function (k) { var n = num(k); return n.length >= 2 ? { D: n[0], H: n[1] } : null; },
    area: function (p) { var a = cm(p.D) / 2, h = cm(p.H); return PI * (a * a + h * h) * 1.05; },
    dimsText: function (p) { return '⌀' + p.D + ' × ' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var a = cm(p.D) / 2, h = cm(p.H), y = 0.28, mat = metalMat(s), pts = [];
      for (var i = 0; i <= 24; i++) { var t = i / 24; pts.push([a * Math.sin(t * PI / 2), h - h * Math.cos(t * PI / 2)]); }
      lathe(g, pts, mat, y);
      for (var k = 0; k < 3; k++) { var an = k * 2 * PI / 3, lg = box(g, 0.03, y + 0.04, 0.03, mat, Math.cos(an) * a * 0.45, (y + 0.04) / 2, Math.sin(an) * a * 0.45); }
      glowAt(g, new THREE.CircleGeometry(a * 0.5, 32), 0, y + h * 0.22, 0).rotation.x = -PI / 2;
      if (o.grill) for (var j = -5; j <= 5; j++) box(g, 0.005, 0.005, a * 1.7 * Math.cos(Math.asin(Math.min(0.95, Math.abs(j) / 6))), mat, j * a / 6, y + h - 0.01, 0);
      return { x: 2 * a, y: y + h, z: 2 * a, glows: [[0, y + h * 0.6, 0, 1.4]] };
    }
  },
  'chasha-dekoratyvna': {
    t: 2, params: [['D', 'Діаметр', 30, 150, 5, 60], ['H', 'Глибина', 10, 40, 5, 20]],
    opts: [['water', 'Вода', 'bool', true], ['overflow', 'Переливний борт під фонтан', 'bool', false]],
    preset: function (k) { var n = num(k); return n.length >= 2 ? { D: n[0], H: n[1] } : null; },
    area: function (p) { var a = cm(p.D) / 2, h = cm(p.H); return PI * (a * a + h * h); },
    dimsText: function (p) { return '⌀' + p.D + ' × ' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var a = cm(p.D) / 2, h = cm(p.H), mat = metalMat(s), pts = [[0, 0], [a * 0.8, 0], [a, h * 0.25], [a, h]];
      lathe(g, pts, mat, 0);
      if (o.water) { var w = add(g, new THREE.CircleGeometry(a - 0.004, 64), M.water, 0, h * (o.overflow ? 0.98 : 0.8), 0); w.rotation.x = -PI / 2; }
      for (var i = 0; i < 9; i++) add(g, new THREE.DodecahedronGeometry(a * 0.07, 0), M.stone, (Math.random() - .5) * a, 0.02, (Math.random() - .5) * a);
      return { x: 2 * a, y: h, z: 2 * a };
    }
  },
  'lameli-fasadni': {
    t: 2, params: [['W', 'Ширина секції', 50, 400, 10, 200], ['H', 'Висота', 100, 300, 10, 180], ['b', 'Ширина ламелі', 4, 15, 1, 8], ['gap', 'Просвіт', 2, 12, 1, 5]],
    opts: [],
    preset: function (k) { var n = num(k); return n.length ? { H: n[0] } : null; },
    count: function (p) { return Math.max(2, Math.floor((p.W + p.gap) / (p.b + p.gap))); },
    area: function (p) { return this.count(p) * cm(p.b + 8) * cm(p.H) + 2 * cm(p.W) * 0.12; },
    dimsText: function (p) { return p.W + ' × H' + p.H + ' см, ' + this.count(p) + ' ламелей ' + p.b + ' см'; },
    warn: function (p) { return p.H > 300 ? 'Ламелі довші за 3 м ріжемо зі стиком.' : ''; },
    build: function (g, p, o, s) {
      var n = this.count(p), b = cm(p.b), gap = cm(p.gap), H = cm(p.H), mat = metalMat(s), tot = n * b + (n - 1) * gap;
      for (var i = 0; i < n; i++) box(g, b, H, 0.04, mat, -tot / 2 + b / 2 + i * (b + gap), H / 2 + 0.05, 0);
      box(g, tot, 0.04, 0.04, mat, 0, 0.05, -0.04); box(g, tot, 0.04, 0.04, mat, 0, H + 0.03, -0.04);
      return { x: tot, y: H + 0.05, z: 0.08 };
    }
  },
  'parkan-perforaciya': {
    t: 2, params: [['W', 'Ширина', 100, 300, 10, 200], ['H', 'Висота', 100, 250, 10, 180], ['hole', 'Розмір отвору', 1, 8, 0.5, 3]],
    opts: [['pattern', 'Малюнок', 'select', 'kolo', [['kolo', 'Кола'], ['romb', 'Ромби'], ['kvadrat', 'Квадрати'], ['hvylia', 'Хвиля'], ['lystia', 'Листя']]]],
    preset: function (k) { var n = num(k); return n.length >= 2 ? { W: n[0], H: n[1] } : null; },
    area: function (p) { return cm(p.W) * cm(p.H); },
    dimsText: function (p) { return p.W + ' × ' + p.H + ' см'; },
    warn: function (p) { return Math.min(p.W, p.H) > 150 ? 'Панель ширша за лист 1,5 м в обох напрямках — зробимо з двох частин зі стиком по рамі.' : ''; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), mat = metalMat(s);
      perfPanel(g, W, H, s, o.pattern, p.hole, 0.08, 0);
      box(g, 0.06, H + 0.1, 0.06, mat, -W / 2 - 0.03, (H + 0.1) / 2, 0); box(g, 0.06, H + 0.1, 0.06, mat, W / 2 + 0.03, (H + 0.1) / 2, 0);
      return { x: W + 0.12, y: H + 0.1, z: 0.06 };
    }
  },
  'panel-fasadna': {
    t: 2, params: [['W', 'Ширина', 50, 150, 5, 100], ['H', 'Висота', 100, 300, 10, 200], ['hole', 'Розмір отвору', 1, 8, 0.5, 2.5]],
    opts: [['pattern', 'Малюнок', 'select', 'hvylia', [['kolo', 'Кола'], ['romb', 'Ромби'], ['kvadrat', 'Квадрати'], ['hvylia', 'Хвиля'], ['lystia', 'Листя']]]],
    preset: function (k) { var n = num(k); return n.length >= 2 ? { W: n[0], H: n[1] } : null; },
    area: function (p) { return cm(p.W) * cm(p.H); },
    dimsText: function (p) { return p.W + ' × ' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H); wall(g, W + 0.8, H + 0.6, -0.04);
      perfPanel(g, W, H, s, o.pattern, p.hole, 0.2, 0.01);
      return { x: W, y: H, z: 0.02, y0: 0.2 };
    }
  },
  'panel-vorit': {
    t: 2, params: [['W', 'Ширина прорізу', 100, 400, 10, 200], ['H', 'Висота прорізу', 100, 220, 10, 180]],
    opts: [['type', 'Заповнення', 'select', 'lameli', [['gluha', 'Глуха'], ['lameli', 'Ламелі'], ['perf', 'Перфорація']]]],
    preset: function (k) { var n = num(k); return n.length >= 2 ? { W: n[0], H: n[1] } : null; },
    area: function (p) { return cm(p.W) * cm(p.H) * 1.08; },
    dimsText: function (p) { return p.W + ' × ' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), mat = metalMat(s), y0 = 0.06;
      [[W + 0.08, 0.04, 0, y0 + H + 0.02], [W + 0.08, 0.04, 0, y0 - 0.02]].forEach(function (b) { box(g, b[0], b[1], 0.04, mat, b[2], b[3], 0); });
      box(g, 0.04, H, 0.04, mat, -W / 2 - 0.02, y0 + H / 2, 0); box(g, 0.04, H, 0.04, mat, W / 2 + 0.02, y0 + H / 2, 0);
      if (o.type === 'gluha') box(g, W, H, 0.004, mat, 0, y0 + H / 2, 0);
      else if (o.type === 'perf') perfPanel(g, W, H, s, 'romb', 3, y0, 0);
      else { var n = Math.floor(H / 0.1); for (var i = 0; i < n; i++) box(g, W, 0.07, 0.02, mat, 0, y0 + 0.05 + i * H / n, 0); }
      return { x: W + 0.08, y: H + 0.1, z: 0.04 };
    }
  },
  'tablychky': {
    t: 2, qty: 10, params: [['W', 'Ширина / діаметр', 3, 60, 0.5, 8], ['H', 'Висота (для прямокутної)', 3, 40, 0.5, 8]],
    opts: [['shape', 'Форма', 'select', 'round', [['round', 'Кругла'], ['rect', 'Прямокутна']]], ['text', 'Гравіювання', 'text', '12']],
    preset: function (k) { var n = num(k); return n.length ? { W: n[0], H: n[0] } : null; },
    area: function (p, o) { return cm(p.W) * cm(o && o.shape === 'rect' ? p.H : p.W); },
    dimsText: function (p, o) { return o.shape === 'rect' ? p.W + ' × ' + p.H + ' см' : '⌀' + p.W + ' см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = o.shape === 'rect' ? cm(p.H) : W, mat = metalMat(s), y = H / 2 + 0.2;
      var tex = canvasTex(512, Math.round(512 * H / W), function (c, w, h) {
        c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#222';
        c.font = '700 ' + Math.round(Math.min(w, h) * 0.45) + 'px "DM Sans", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText((o.text || '').slice(0, 14), w / 2, h / 2);
      });
      var face = mat.clone(); face.roughnessMap = null; face.bumpMap = null;
      var eng = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, alphaMap: tex, transparent: true, alphaTest: 0.5 });
      eng.alphaMap = tex; tex.repeat.set(1, 1);
      var engInv = canvasTex(512, Math.round(512 * H / W), function (c, w, h) {
        c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff';
        c.font = '700 ' + Math.round(Math.min(w, h) * 0.45) + 'px "DM Sans", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText((o.text || '').slice(0, 14), w / 2, h / 2);
      }); engInv.repeat.set(1, 1); eng.alphaMap = engInv;
      if (o.shape === 'round') { var d = add(g, new THREE.CylinderGeometry(W / 2, W / 2, 0.002, 64), face, 0, y, 0); d.rotation.x = PI / 2; add(g, new THREE.CircleGeometry(W / 2, 64), eng, 0, y, 0.0012); }
      else { box(g, W, H, 0.002, face, 0, y, 0); add(g, new THREE.PlaneGeometry(W, H), eng, 0, y, 0.0012); }
      return { x: W, y: H, z: 0.002, y0: 0.2 };
    }
  },
  'vyviska-pidsvitka': {
    t: 1.5, glow: true, params: [['h', 'Висота літер', 10, 60, 1, 25], ['dp', 'Глибина літер', 3, 10, 1, 5]],
    opts: [['text', 'Напис', 'text', 'FEROX'], ['light', 'Контражурна підсвітка', 'bool', true]],
    preset: function (k) { var n = num(k); if (!n.length) return null; return { h: Math.max(10, Math.round(n[0] / 4)) }; },
    area: function (p, o, meta) { var n = meta ? meta.n : 5, h = cm(p.h); return n * (0.55 * h * h * 0.8 + 5.5 * h * cm(p.dp)); },
    dimsText: function (p, o, meta) { return 'літери ' + p.h + ' см, глибина ' + p.dp + ' см' + (meta ? ', довжина ≈ ' + Math.round(meta.w * 100) + ' см' : ''); },
    build: function (g, p, o, s) {
      var h = cm(p.h), y = 1.2 + h / 2, w = 0, meta;
      meta = letters(g, o.text, h, cm(p.dp), metalMat(s), y, 0.04, o.light);
      wall(g, meta.w + 0.8, 2.2 + h, 0);
      return { x: meta.w, y: h, z: cm(p.dp), y0: y - h / 2, meta: meta, glows: o.light ? [[0, y, 0.08, 1.0]] : [] };
    }
  },
  'oblytsyuvannya-kaminu': {
    t: 2, glow: true, params: [['W', 'Ширина порталу', 80, 250, 5, 150], ['H', 'Висота', 100, 300, 5, 220], ['Dp', 'Глибина', 30, 80, 5, 50], ['OW', 'Ширина топки', 40, 150, 5, 80], ['OH', 'Висота топки', 40, 120, 5, 60]],
    opts: [],
    preset: function () { return null; },
    area: function (p) { var W = cm(p.W), H = cm(p.H), d = cm(p.Dp); return W * H - cm(p.OW) * cm(p.OH) + 2 * d * H + W * d; },
    dimsText: function (p) { return p.W + ' × ' + p.H + ' × ' + p.Dp + ' см, топка ' + p.OW + '×' + p.OH; },
    warn: function (p) { return p.OW > p.W - 20 || p.OH > p.H - 30 ? 'Топка майже на всю ширину — лишаємо щонайменше по 10 см металу з боків.' : ''; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), d = cm(p.Dp), ow = Math.min(cm(p.OW), W - 0.2), oh = Math.min(cm(p.OH), H - 0.3), y0 = 0.3, mat = metalMat(s);
      wall(g, W + 1.2, H + 0.4, -d / 2);
      var side = (W - ow) / 2;
      box(g, side, H, d, mat, -W / 2 + side / 2, H / 2, 0); box(g, side, H, d, mat, W / 2 - side / 2, H / 2, 0);
      box(g, ow, H - y0 - oh, d, mat, 0, y0 + oh + (H - y0 - oh) / 2, 0); box(g, ow, y0, d, mat, 0, y0 / 2, 0);
      box(g, ow, oh, 0.01, M.dark, 0, y0 + oh / 2, -d / 2 + 0.02);
      glowAt(g, new THREE.PlaneGeometry(ow * 0.6, oh * 0.35), 0, y0 + oh * 0.25, -d / 2 + 0.05);
      return { x: W, y: H, z: d, glows: [[0, y0 + oh * 0.4, 0.1, 1.2]] };
    }
  },
  'oblytsyuvannya-stin': {
    t: 2, params: [['W', 'Ширина стіни', 100, 800, 10, 300], ['H', 'Висота', 100, 400, 10, 270], ['mod', 'Ширина панелі', 40, 150, 5, 100]],
    opts: [['seam', 'Шов між панелями', 'select', '10', [['8', '8 мм'], ['10', '10 мм'], ['12', '12 мм']]]],
    preset: function () { return null; },
    area: function (p) { return cm(p.W) * cm(p.H) * 1.04; },
    dimsText: function (p) { return p.W + ' × ' + p.H + ' см, панелі по ' + p.mod + ' см'; },
    warn: function (p) { return p.H > 300 ? 'Панелі вищі за 3 м — ділимо по висоті горизонтальним швом.' : ''; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), mw = cm(p.mod), seam = (+o.seam) / 1000, n = Math.max(1, Math.round(W / mw)), pw = (W - (n - 1) * seam) / n, mat = metalMat(s);
      box(g, W + 0.02, H + 0.02, 0.02, M.dark, 0, H / 2, -0.012);
      var rows = H > 3 ? 2 : 1, ph = (H - (rows - 1) * seam) / rows;
      for (var r = 0; r < rows; r++) for (var i = 0; i < n; i++) box(g, pw, ph, 0.003, mat, -W / 2 + pw / 2 + i * (pw + seam), ph / 2 + r * (ph + seam), 0);
      return { x: W, y: H, z: 0.02 };
    }
  },
  'skulptura-olen': {
    t: 3, photo: 'cat-sculpture-deer', params: [['H', 'Висота з рогами', 150, 300, 10, 300]],
    opts: [],
    preset: function () { return { H: 300 }; },
    area: function (p) { return 5.2 * Math.pow(p.H / 300, 2); },
    dimsText: function (p) { return 'H ' + p.H + ' см'; },
    build: function (g, p) { var h = cm(p.H); return { x: h * 0.55, y: h, z: 0.4 }; }
  },
  'stelazh-kub': {
    t: 2, params: [['W', 'Ширина', 30, 80, 5, 40], ['H', 'Висота', 30, 80, 5, 40], ['Dp', 'Глибина', 25, 50, 5, 30], ['n', 'Секцій у стосі', 1, 4, 1, 1]],
    opts: [['decor', 'Книги й декор', 'bool', true]],
    preset: function (k) { var n = num(k); return n.length >= 3 ? { W: n[0], H: n[1], Dp: n[2] } : null; },
    area: function (p) { var W = cm(p.W), H = cm(p.H), d = cm(p.Dp); return p.n * (2 * W * d + 2 * H * d + W * H); },
    dimsText: function (p) { return p.n + ' × (' + p.W + ' × ' + p.H + ' × ' + p.Dp + ') см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), d = cm(p.Dp), t = 0.004, mat = metalMat(s);
      for (var i = 0; i < p.n; i++) {
        var y = i * H;
        box(g, W, t, d, mat, 0, y + t / 2, 0); box(g, W, t, d, mat, 0, y + H - t / 2, 0);
        box(g, t, H, d, mat, -W / 2 + t / 2, y + H / 2, 0); box(g, t, H, d, mat, W / 2 - t / 2, y + H / 2, 0);
        box(g, W, H, t, mat, 0, y + H / 2, -d / 2 + t / 2);
        if (o.decor) { box(g, W * 0.12, H * 0.62, d * 0.7, i % 2 ? M.leaf2 : M.wood, -W / 2 + W * 0.16, y + t + H * 0.31, 0); box(g, W * 0.1, H * 0.55, d * 0.7, M.ceramic, -W / 2 + W * 0.29, y + t + H * 0.275, 0); lathe(g, [[0, 0], [W * 0.09, 0], [W * 0.1, H * 0.2], [W * 0.05, H * 0.42], [W * 0.055, H * 0.45]], M.ceramic, y + t).position.x = W * 0.22; }
      }
      return { x: W, y: H * p.n, z: d };
    }
  },
  'sadovyi-dekor': {
    t: 2, params: [['W', 'Ширина', 20, 100, 5, 40], ['H', 'Висота', 60, 250, 10, 150], ['T', 'Товщина стели', 5, 25, 1, 10]],
    opts: [['style', 'Вигляд', 'select', 'slot', [['solid', 'Суцільна'], ['slot', 'Зі щілиною'], ['perf', 'Перфорована']]]],
    preset: function (k) { var n = num(k); return n.length ? { H: n[0] } : null; },
    area: function (p) { var W = cm(p.W), H = cm(p.H), T = cm(p.T); return 2 * W * H + 2 * T * H + W * T; },
    dimsText: function (p) { return p.W + ' × ' + p.T + ' × H' + p.H + ' см'; },
    build: function (g, p, o, s) {
      var W = cm(p.W), H = cm(p.H), T = cm(p.T), mat = metalMat(s);
      if (o.style === 'slot') {
        var sw = Math.max(0.02, W * 0.08);
        box(g, (W - sw) / 2, H, T, mat, -(W + sw) / 4, H / 2, 0); box(g, (W - sw) / 2, H, T, mat, (W + sw) / 4, H / 2, 0);
        box(g, sw, H * 0.12, T, mat, 0, H * 0.06, 0); box(g, sw, H * 0.12, T, mat, 0, H - H * 0.06, 0);
      } else box(g, W, H, T, mat, 0, H / 2, 0);
      if (o.style === 'perf') perfPanel(g, W * 0.8, H * 0.7, { metal: 'steel', ral: '9005', finish: '' }, 'kolo', 2.5, H * 0.15, T / 2 + 0.001);
      box(g, W + 0.1, 0.04, T + 0.1, M.stone, 0, 0.02, 0);
      return { x: W + 0.1, y: H, z: T + 0.1 };
    }
  },
  'stolyk-zhurnalnyi': {
    t: 3, title: 'Журнальний столик закритий', cat: 'mebli', defMetal: 'stainless',
    params: [['L', 'Довжина', 60, 160, 5, 90], ['W', 'Ширина', 40, 100, 5, 60], ['H', 'Висота', 30, 50, 1, 40]],
    opts: [['R', 'Радіус кутів', 'select', '20', [['10', 'R10 мм'], ['20', 'R20 мм'], ['30', 'R30 мм'], ['50', 'R50 мм']]], ['decor', 'Декор', 'bool', true]],
    preset: function () { return null; },
    area: function (p) { var L = cm(p.L), W = cm(p.W), H = cm(p.H); return H * 2 * (L + W) + 2 * L * W; },
    dimsText: function (p, o) { return p.L + ' × ' + p.W + ' × H' + p.H + ' см, кути R' + o.R; },
    warn: function (p) { return 2 * (p.L + p.W) > 296 ? 'Обичайка довша за 3 м — зробимо з двох половин із двома швами на торцях.' : ''; },
    build: function (g, p, o, s) {
      var L = cm(p.L), W = cm(p.W), H = cm(p.H), r = (+o.R + 3) / 1000, b = 0.002;
      var geo = new THREE.ExtrudeGeometry(roundedShape(L - 2 * b, W - 2 * b, r - b), { depth: H - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 28 });
      geo.rotateX(-PI / 2); geo.translate(0, b, 0);
      add(g, geo, metalMat(s));
      if (o.decor) { box(g, 0.25, 0.032, 0.18, new THREE.MeshStandardMaterial({ color: lin(0x55645a), roughness: 0.85 }), -L * 0.22, H + 0.016, W * 0.1).rotation.y = 0.12; lathe(g, [[0, 0], [0.042, 0], [0.058, 0.07], [0.03, 0.17], [0.026, 0.22]], M.ceramic, H).position.set(L * 0.26, H, -W * 0.15); }
      return { x: L, y: H, z: W };
    }
  }
};

var CATNAME = { kashpo: 'Кашпо', light: 'Світло', mangal: 'Мангали', bowl: 'Чаші', lamel: 'Ламелі й паркани', facade: 'Фасад', gate: 'Ворота', sign: 'Вивіски й таблички', clad: 'Облицювання', decor: 'Декор', mebli: 'Меблі' };
var LIST = CAT.filter(function (p) { return D[p.slug]; }).map(function (p) { return { slug: p.slug, t: p.t, c: p.c, s: p.s || [], pr: p.pr || null }; });
LIST.push({ slug: 'stolyk-zhurnalnyi', t: D['stolyk-zhurnalnyi'].title, c: 'mebli', s: [], pr: null });
var bySlug = {}; LIST.forEach(function (p) { bySlug[p.slug] = p; });

/* ═════════ ЦІНИ ═════════
   Калібруємо лінійну модель «фікс + грн/м²» по реальних цінах каталогу (кортен, нова ціна).
   Для виробів без цін у каталозі — «за прорахунком». */
var FITS = {};
function fitFor(slug) {
  if (FITS[slug] !== undefined) return FITS[slug];
  var p = bySlug[slug], d = D[slug];
  if (!p || !p.pr || d.price) return (FITS[slug] = null);
  var pts = [];
  Object.keys(p.pr).forEach(function (k) {
    var v = p.pr[k][1]; if (!v) return;
    var pp = d.preset(k); if (!pp) return;
    var full = defaults(slug); Object.keys(pp).forEach(function (x) { full[x] = pp[x]; });
    pts.push([d.area(full, optDefaults(slug)), v]);
  });
  if (!pts.length) return (FITS[slug] = null);
  var a, b;
  if (pts.length === 1) { b = pts[0][1] * 0.45 / pts[0][0]; a = pts[0][1] * 0.55; }
  else {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (q) { sx += q[0]; sy += q[1]; sxx += q[0] * q[0]; sxy += q[0] * q[1]; });
    b = (n * sxy - sx * sy) / (n * sxx - sx * sx); a = (sy - b * sx) / n;
    if (b <= 0 || a < 0) { b = sy / sx * 0.5; a = sy / n * 0.5; }
  }
  return (FITS[slug] = { a: a, b: b, min: Math.min.apply(null, pts.map(function (q) { return q[1]; })) });
}
function fitPrice(slug, params) {
  var f = fitFor(slug); if (!f) return null;
  return Math.max(f.min * 0.8, f.a + f.b * D[slug].area(params, optDefaults(slug)));
}
function estimate(st, area) {
  var d = D[st.slug], base = null;
  if (d.price) base = d.price(st.p, fitPrice);
  else if (st.slug === 'skulptura-olen') base = st.p.H === 300 ? (bySlug[st.slug].pr ? bySlug[st.slug].pr['H-300 з рогами'][1] : null) : null;
  else base = fitPrice(st.slug, st.p);
  if (!base) return null;
  var mult = MULT[st.metal] || 1, v = base * mult;
  if (st.metal === 'corten' && st.finish === 'patina') v += 900 + area * 350;
  return { lo: r100(v * 0.92), hi: r100(v * 1.1) };
}

/* ═════════ СТАН ═════════ */
function defaults(slug) { var o = {}; D[slug].params.forEach(function (q) { o[q[0]] = q[5]; }); return o; }
function optDefaults(slug) { var o = {}; D[slug].opts.forEach(function (q) { o[q[0]] = q[3]; }); return o; }
function fresh(slug, sizeKey) {
  var d = D[slug], p = defaults(slug), prod = bySlug[slug], key = sizeKey || (prod && prod.s[0]);
  if (key) { var pp = d.preset(key); if (pp) Object.keys(pp).forEach(function (k) { if (p[k] !== undefined) p[k] = clampParam(slug, k, pp[k]); }); }
  return { slug: slug, p: p, o: optDefaults(slug), metal: d.defMetal || 'corten', finish: (d.defMetal === 'stainless') ? 'satin' : 'natural', ral: '7016', q: d.qty || 1 };
}
function clampParam(slug, k, v) { var q = D[slug].params.filter(function (x) { return x[0] === k; })[0]; if (!q) return v; return Math.min(q[3], Math.max(q[2], Math.round(v / q[4]) * q[4])); }
function encode(st) {
  var a = ['p=' + st.slug];
  Object.keys(st.p).forEach(function (k) { a.push(k + '=' + st.p[k]); });
  Object.keys(st.o).forEach(function (k) { a.push('o_' + k + '=' + encodeURIComponent(st.o[k])); });
  a.push('m=' + st.metal, 'f=' + st.finish, 'ral=' + st.ral, 'q=' + st.q);
  return a.join('&');
}
function decode(str) {
  var qp = new URLSearchParams(str), slug = qp.get('p');
  if (!slug || !D[slug]) return null;
  var st = fresh(slug, qp.get('s'));
  Object.keys(st.p).forEach(function (k) { if (qp.has(k)) st.p[k] = clampParam(slug, k, parseFloat(qp.get(k))); });
  Object.keys(st.o).forEach(function (k) {
    if (!qp.has('o_' + k)) return; var v = qp.get('o_' + k), def = D[slug].opts.filter(function (x) { return x[0] === k; })[0];
    st.o[k] = def[2] === 'bool' ? v === 'true' : v;
  });
  if (METALS[qp.get('m')]) st.metal = qp.get('m');
  if (qp.get('f')) st.finish = qp.get('f');
  if (qp.get('ral')) st.ral = qp.get('ral');
  if (qp.get('q')) st.q = Math.max(1, Math.min(999, parseInt(qp.get('q'), 10) || 1));
  return st;
}

var S = decode(location.hash.slice(1)) || decode(location.search.slice(1)) || fresh('kashpo-krugle');

/* ═════════ ПОБУДОВА ═════════ */
var product = new THREE.Group(); scene.add(product);
var dimsGroup = new THREE.Group(); scene.add(dimsGroup);
var lights = [];
var lastBuild = null, night = false;
function disposeGroup(g) {
  g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== M.glow && !Object.values(matCache).includes(o.material) && !Object.values(M).includes(o.material)) { if (o.material.map && o.material.map !== TEX.rust) o.material.map.dispose(); if (o.material.alphaMap) o.material.alphaMap.dispose(); o.material.dispose(); } });
  while (g.children.length) g.remove(g.children[0]);
}
var dimMat = new THREE.LineBasicMaterial({ color: 0xa0522d });
function line(pts) { dimsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); })), dimMat)); }
var anchors = {};
function rebuild(refit) {
  disposeGroup(product); disposeGroup(dimsGroup);
  lights.forEach(function (l) { scene.remove(l); }); lights = [];
  var d = D[S.slug];
  var info = d.build(product, S.p, S.o, S) || { x: 1, y: 1, z: 1 };
  lastBuild = info;
  var X = info.x, Y = info.y, Z = info.z, y0 = info.y0 || 0, o = Math.max(0.05, Math.max(X, Z) * 0.08), fz = Z / 2 + o, fx = X / 2 + o, tk = o * 0.3;
  if (!d.photo) {
    line([[-X / 2, 0.001, fz], [X / 2, 0.001, fz]]); line([[-X / 2, 0.001, fz - tk], [-X / 2, 0.001, fz + tk]]); line([[X / 2, 0.001, fz - tk], [X / 2, 0.001, fz + tk]]);
    if (Z > 0.1) { line([[fx, 0.001, -Z / 2], [fx, 0.001, Z / 2]]); line([[fx - tk, 0.001, -Z / 2], [fx + tk, 0.001, -Z / 2]]); line([[fx - tk, 0.001, Z / 2], [fx + tk, 0.001, Z / 2]]); }
    line([[fx, y0, fz], [fx, y0 + Y, fz]]); line([[fx - tk, y0 + Y, fz], [fx + tk, y0 + Y, fz]]); line([[fx - tk, y0, fz], [fx + tk, y0, fz]]);
  }
  anchors = { x: new THREE.Vector3(0, 0.001, fz), z: new THREE.Vector3(fx, 0.001, 0), y: new THREE.Vector3(fx, y0 + Y / 2, fz) };
  labels.x.textContent = Math.round(X * 100) + ' см'; labels.z.textContent = Math.round(Z * 100) + ' см'; labels.y.textContent = Math.round(Y * 100) + ' см';
  labels.z.dataset.off = Z > 0.1 ? '' : '1';
  (info.glows || []).forEach(function (q) { var l = new THREE.PointLight(0xffa24a, 0, Math.max(1.5, X * 2), 2); l.position.set(q[0], q[1], q[2]); l.userData.k = q[3]; scene.add(l); lights.push(l); });
  contact.scale.set(Math.max(0.3, X * 1.5), Math.max(0.3, Math.max(Z, 0.15) * 1.6), 1);
  var span = Math.max(X, Y, Z, 0.3);
  sun.position.set(-span * 1.2, span * 3 + 1, span * 1.4); sun.target.position.set(0, 0, 0);
  var sc = sun.shadow.camera; sc.left = sc.bottom = -span * 1.6; sc.right = sc.top = span * 1.6; sc.near = 0.1; sc.far = span * 8 + 6; sc.updateProjectionMatrix();
  human.position.set(X / 2 + 0.45 + o, 0.875, 0);
  photo.hidden = !d.photo;
  if (d.photo) photo.querySelector('img').src = '/uploads/' + d.photo + '.webp';
  stage.classList.toggle('kf-has-glow', !!d.glow);
  if (!d.glow && night) setNight(false);
  applyNight();
  if (refit) frame(info);
}

/* ── камера ── */
var target = new THREE.Vector3(0, 0.3, 0);
var cur = { az: 0.72, pol: 1.13, r: 3 }, goal = { az: 0.72, pol: 1.13, r: 3 }, baseR = 3;
var VIEWS = { persp: [0.72, 1.13, 1], front: [0, 1.5, 0.95], side: [PI / 2, 1.5, 0.95], top: [0, 0.03, 1] };
function frame(info) {
  var X = info.x, Y = info.y + (info.y0 || 0), Z = info.z, span = Math.max(X, Y * 1.15, Z, 0.25);
  if (human.visible) span = Math.max(span, 1.9, X + 1.2);
  target.set(human.visible ? 0.3 : 0, Math.max(0.08, Y * 0.45), 0);
  baseR = span * 2.35 / Math.tan(camera.fov * PI / 360) * 0.42 + 0.3;
  goal.r = baseR; if (reduced) cur.r = baseR;
}
function place() {
  var s = Math.sin(cur.pol);
  camera.position.set(target.x + cur.r * s * Math.sin(cur.az), target.y + cur.r * Math.cos(cur.pol), target.z + cur.r * s * Math.cos(cur.az));
  camera.lookAt(target);
}
var drag = null, pinch = null;
var cv = renderer.domElement;
cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', function (e) {
  if (!drag || pinch) return;
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
  goal.az -= dx * 0.006; goal.pol = Math.min(1.54, Math.max(0.03, goal.pol - dy * 0.005)); cur.az = goal.az; cur.pol = goal.pol; pressView(null);
});
cv.addEventListener('pointerup', function () { drag = null; });
cv.addEventListener('wheel', function (e) { e.preventDefault(); goal.r = Math.min(baseR * 2.5, Math.max(baseR * 0.35, goal.r * (1 + e.deltaY * 0.0012))); }, { passive: false });
cv.addEventListener('touchstart', function (e) { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
cv.addEventListener('touchmove', function (e) { if (pinch && e.touches.length === 2) { var dd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); goal.r = Math.min(baseR * 2.5, Math.max(baseR * 0.35, goal.r * pinch / dd)); pinch = dd; } }, { passive: true });
cv.addEventListener('touchend', function (e) { if (e.touches.length < 2) pinch = null; });

/* ── ніч ── */
function setNight(v) { night = v; var b = root.querySelector('[data-hud=night]'); if (b) b.setAttribute('aria-pressed', String(v)); applyNight(); }
function applyNight() {
  stage.classList.toggle('kf-night', night);
  hemi.intensity = night ? 0.05 : 0.38; sun.intensity = night ? 0.06 : 1.05;
  M.glow.emissiveIntensity = night ? 2.2 : 0.0;
  M.glow.color.set(night ? 0x3a2a18 : 0x2a2520);
  lights.forEach(function (l) { l.intensity = night ? 2.6 * l.userData.k : 0; });
  product.traverse(function (o) { if (o.userData.halo) o.material.opacity = night ? 1 : 0; });
  Object.values(matCache).concat([M.wall, M.stone, M.wood, M.ceramic]).forEach(function (m) { if (m.envMapIntensity !== undefined) m.envMapIntensity = (m.userData.baseEnv || 1) * (night ? 0.12 : 1); });
  product.traverse(function (o) { if (o.material && o.material.envMapIntensity !== undefined && o.material.userData && !Object.values(matCache).includes(o.material)) o.material.envMapIntensity = night ? 0.12 : (o.material.userData.baseEnv || 1); });
}

/* ═════════ ІНТЕРФЕЙС ═════════ */
var $ = function (sel) { return root.querySelector(sel); };
var labels = { x: $('#kfLx'), y: $('#kfLy'), z: $('#kfLz') };
var photo = $('.kf-photo');

function renderPicker() {
  var cats = []; LIST.forEach(function (p) { if (cats.indexOf(p.c) < 0) cats.push(p.c); });
  var curCat = bySlug[S.slug].c;
  $('#kfCats').innerHTML = cats.map(function (c) { return '<button type="button" data-cat="' + c + '" aria-pressed="' + (c === curCat) + '">' + (CATNAME[c] || c) + '</button>'; }).join('');
  $('#kfProds').innerHTML = LIST.filter(function (p) { return p.c === curCat; }).map(function (p) {
    var photoOnly = D[p.slug].photo ? ' <small>фото</small>' : '';
    return '<button type="button" data-slug="' + p.slug + '" aria-pressed="' + (p.slug === S.slug) + '">' + esc(p.t) + photoOnly + '</button>';
  }).join('');
  var prod = bySlug[S.slug];
  $('#kfPresets').innerHTML = prod.s.filter(function (k) { return D[S.slug].preset(k); }).map(function (k) { return '<button type="button" data-preset="' + esc(k) + '">' + esc(k) + '</button>'; }).join('');
  $('#kfPresetsWrap').hidden = !$('#kfPresets').innerHTML;
}
function renderParams() {
  var d = D[S.slug];
  $('#kfParams').innerHTML = d.params.map(function (q) {
    if (S.slug === 'tablychky' && q[0] === 'H' && S.o.shape !== 'rect') return '';
    var id = 'kfp_' + q[0];
    return '<div class="kf-row"><label for="' + id + '">' + q[1] + '</label>' +
      '<input type="range" id="' + id + '" data-p="' + q[0] + '" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '" value="' + S.p[q[0]] + '">' +
      '<span class="kf-num"><input type="number" data-pn="' + q[0] + '" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '" value="' + S.p[q[0]] + '" aria-label="' + q[1] + ', ' + (q[0] === 'n' ? 'шт' : 'см') + '"><em>' + (q[0] === 'n' ? 'шт' : 'см') + '</em></span></div>';
  }).join('');
  $('#kfOpts').innerHTML = d.opts.map(function (q) {
    var k = q[0];
    if (q[2] === 'bool') return '<label class="kf-chk"><input type="checkbox" data-o="' + k + '"' + (S.o[k] ? ' checked' : '') + '> ' + q[1] + '</label>';
    if (q[2] === 'text') return '<div class="kf-row kf-row-text"><label for="kfo_' + k + '">' + q[1] + '</label><input type="text" id="kfo_' + k + '" data-o="' + k + '" maxlength="24" value="' + esc(S.o[k]) + '"></div>';
    return '<div class="kf-row kf-row-text"><label for="kfo_' + k + '">' + q[1] + '</label><select id="kfo_' + k + '" data-o="' + k + '">' + q[4].map(function (v) { return '<option value="' + v[0] + '"' + (S.o[k] === v[0] ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select></div>';
  }).join('');
  $('#kfOptsStep').hidden = !d.opts.length;
}
function renderMetal() {
  root.querySelectorAll('[data-metal]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.metal === S.metal)); });
  var h = '';
  if (S.metal === 'corten') h = '<div class="kf-seg">' + [['natural', 'Природна патина'], ['patina', 'Прискорена хімією'], ['fresh', 'Без патини']].map(function (f) { return '<button type="button" data-finish="' + f[0] + '" aria-pressed="' + (S.finish === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div><p class="kf-note">' + (S.finish === 'fresh' ? 'Приїде сірим — рудий колір набере сам за 3–6 місяців надворі.' : S.finish === 'patina' ? 'Одразу рудий, патину стабілізуємо — не фарбує руки й підлогу.' : 'Патина формується природно: так кортен виглядає через кілька місяців.') + '</p>';
  else if (S.metal === 'steel') h = '<div class="kf-ral">' + RAL.map(function (r) { return '<button type="button" data-ral="' + r[0] + '" aria-pressed="' + (S.ral === r[0]) + '" title="RAL ' + r[0] + ' — ' + r[1] + '" style="--c:' + r[2] + '"><span></span>' + r[1] + '</button>'; }).join('') + '</div><p class="kf-note">Будь-який інший колір RAL — напишіть у коментарі до заявки.</p>';
  else h = '<div class="kf-seg">' + [['satin', 'Сатин'], ['mirror', 'Дзеркало']].map(function (f) { return '<button type="button" data-finish="' + f[0] + '" aria-pressed="' + (S.finish === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div><p class="kf-note">' + (S.finish === 'mirror' ? 'Ефектно, але видно кожен відбиток пальця.' : 'Шліфування №4 — ховає відбитки й дрібні подряпини.') + '</p>';
  $('#kfFinish').innerHTML = h;
}
function state() {
  var d = D[S.slug], info = lastBuild || {}, meta = info.meta;
  var area = d.area(S.p, S.o, meta), t = d.t, kg = area * t * METALS[S.metal].rho;
  return { d: d, area: area, kg: kg, t: t, meta: meta, price: estimate(S, area), dims: d.dimsText(S.p, S.o, meta) };
}
function metalText() {
  if (S.metal === 'corten') return 'Кортен ' + D[S.slug].t + ' мм, ' + ({ natural: 'природна патина', patina: 'прискорена патина', fresh: 'без патини' }[S.finish] || '');
  if (S.metal === 'steel') { var r = RAL.filter(function (x) { return x[0] === S.ral; })[0] || RAL[0]; return 'Чорна сталь ' + D[S.slug].t + ' мм, RAL ' + r[0] + ' ' + r[1].toLowerCase(); }
  return 'Нержавійка AISI 304, ' + D[S.slug].t + ' мм, ' + (S.finish === 'mirror' ? 'дзеркало' : 'сатин');
}
function optText() {
  var d = D[S.slug];
  return d.opts.filter(function (q) { return q[0] !== 'plant' && q[0] !== 'decor' && q[0] !== 'water'; }).map(function (q) {
    var v = S.o[q[0]];
    if (q[2] === 'bool') return v ? q[1].toLowerCase() : '';
    if (q[2] === 'text') return q[1].toLowerCase() + ': «' + v + '»';
    var lab = q[4].filter(function (x) { return x[0] === v; })[0]; return q[1].toLowerCase() + ': ' + (lab ? lab[1].toLowerCase() : v);
  }).filter(Boolean).join(', ');
}
function renderSummary() {
  var st = state(), d = st.d;
  $('#kfTitle').textContent = bySlug[S.slug].t;
  $('#kfDims').textContent = st.dims;
  $('#kfMetalTxt').textContent = metalText();
  $('#kfOptTxt').textContent = optText() || '—';
  $('#kfArea').textContent = (st.area < 0.1 ? st.area.toFixed(3) : st.area.toFixed(2)).replace('.', ',') + ' м² металу, ≈ ' + (st.kg < 1 ? st.kg.toFixed(2).replace('.', ',') : st.kg < 10 ? st.kg.toFixed(1).replace('.', ',') : Math.round(st.kg)) + ' кг';
  var w = d.warn ? d.warn(S.p, S.o) : '';
  $('#kfWarn').textContent = w; $('#kfWarn').hidden = !w;
  $('#kfQty').value = S.q;
  if (st.price) {
    $('#kfPrice').innerHTML = '<b>' + fmt(st.price.lo).replace(' грн', '') + ' – ' + fmt(st.price.hi) + '</b><span>орієнтовно за 1 шт' + (S.q > 1 ? ', разом ' + fmt(st.price.lo * S.q).replace(' грн', '') + ' – ' + fmt(st.price.hi * S.q) : '') + '</span>';
  } else {
    $('#kfPrice').innerHTML = '<b>Ціна після прорахунку</b><span>Порахуємо протягом 15 хвилин у робочий час</span>';
  }
  var link = SITE + '/konfigurator/#' + encode(S);
  history.replaceState(null, '', '#' + encode(S));
  return { st: st, link: link };
}

var pending = 0;
function update(refit, rerenderParams) {
  if (rerenderParams) renderParams();
  renderMetal();
  clearTimeout(pending);
  pending = setTimeout(function () { rebuild(refit); renderSummary(); }, refit ? 0 : 40);
}
function pickProduct(slug, sizeKey) {
  var keepMetal = S.metal, keepRal = S.ral;
  S = fresh(slug, sizeKey);
  if (!D[slug].defMetal) { S.metal = keepMetal; S.ral = keepRal; S.finish = keepMetal === 'stainless' ? 'satin' : keepMetal === 'corten' ? 'natural' : ''; }
  renderPicker(); update(true, true);
  window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'configurator_product', product: slug });
}

/* ── події ── */
root.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
  if (b.dataset.cat) { var first = LIST.filter(function (p) { return p.c === b.dataset.cat; })[0]; if (first) pickProduct(first.slug); }
  else if (b.dataset.slug) pickProduct(b.dataset.slug);
  else if (b.dataset.preset) { var pp = D[S.slug].preset(b.dataset.preset); Object.keys(pp).forEach(function (k) { if (S.p[k] !== undefined) S.p[k] = clampParam(S.slug, k, pp[k]); }); update(true, true); }
  else if (b.dataset.metal) { S.metal = b.dataset.metal; S.finish = S.metal === 'stainless' ? 'satin' : S.metal === 'corten' ? 'natural' : ''; update(false); }
  else if (b.dataset.finish) { S.finish = b.dataset.finish; update(false); }
  else if (b.dataset.ral) { S.ral = b.dataset.ral; update(false); }
  else if (b.dataset.view) { var v = VIEWS[b.dataset.view]; var az = v[0]; while (az - goal.az > PI) az -= 2 * PI; while (goal.az - az > PI) az += 2 * PI; goal.az = az; goal.pol = v[1]; goal.r = baseR * v[2]; if (reduced) { cur.az = goal.az; cur.pol = goal.pol; cur.r = goal.r; } pressView(b.dataset.view); }
  else if (b.dataset.hud === 'night') setNight(!night);
  else if (b.dataset.hud === 'human') { human.visible = !human.visible; b.setAttribute('aria-pressed', String(human.visible)); frame(lastBuild); }
  else if (b.dataset.hud === 'dims') { dimsGroup.visible = !dimsGroup.visible; b.setAttribute('aria-pressed', String(dimsGroup.visible)); }
  else if (b.dataset.q) { S.q = Math.max(1, Math.min(999, S.q + (+b.dataset.q))); renderSummary(); }
  else if (b.id === 'kfSendOpen') { $('#kfForm').hidden = false; $('#kfName').focus(); }
  else if (b.id === 'kfCart') addToCart();
  else if (b.id === 'kfCopy') copyLink(b);
});
function pressView(v) { root.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); }); }
root.addEventListener('input', function (e) {
  var el = e.target;
  if (el.dataset.p) { S.p[el.dataset.p] = parseFloat(el.value); var n = root.querySelector('[data-pn="' + el.dataset.p + '"]'); if (n) n.value = el.value; update(false); }
  else if (el.dataset.pn) { var v = parseFloat(el.value); if (isNaN(v)) return; var c = clampParam(S.slug, el.dataset.pn, v); S.p[el.dataset.pn] = c; var r = root.querySelector('[data-p="' + el.dataset.pn + '"]'); if (r) r.value = c; update(false); }
  else if (el.dataset.o && el.type === 'text') { S.o[el.dataset.o] = el.value; update(false); }
  else if (el.id === 'kfQty') { S.q = Math.max(1, Math.min(999, parseInt(el.value, 10) || 1)); renderSummary(); }
});
root.addEventListener('change', function (e) {
  var el = e.target;
  if (el.dataset.pn) { el.value = S.p[el.dataset.pn]; update(true); }
  else if (el.dataset.p) update(true);
  else if (el.dataset.o) { S.o[el.dataset.o] = el.type === 'checkbox' ? el.checked : el.value; update(el.dataset.o === 'shape' || el.dataset.o === 'mount', el.dataset.o === 'shape'); }
});

/* ── кошик: той самий, що в каталозі ── */
function addToCart() {
  var st = state(), cart = [];
  try { cart = JSON.parse(localStorage.getItem('ferox_cart') || '[]') || []; } catch (e) { cart = []; }
  cart.push({ t: bySlug[S.slug].t + ' — свій розмір', s: st.dims + (optText() ? '; ' + optText() : ''), m: metalText(), q: S.q, price: null, old: null, cfg: SITE + '/konfigurator/#' + encode(S) });
  try { localStorage.setItem('ferox_cart', JSON.stringify(cart)); } catch (e) {}
  toast('Додано до замовлення. Оформити можна в каталозі — кнопка кошика внизу справа.');
  window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'configurator_cart', product: S.slug });
}
function copyLink(b) {
  var link = SITE + '/konfigurator/#' + encode(S);
  (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { toast('Посилання на цей виріб скопійовано.'); }, function () { prompt('Скопіюйте посилання:', link); });
}
function toast(m) { var t = $('#kfToast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 3600); }

/* ── заявка через воркер ── */
function normPhone(raw) { var d = String(raw || '').replace(/\D/g, ''); if (d.length === 12 && d.indexOf('380') === 0) return '+' + d; if (d.length === 10 && d[0] === '0') return '+38' + d; if (d.length === 9) return '+380' + d; return null; }
$('#kfForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var name = $('#kfName').value.trim(), phone = normPhone($('#kfPhone').value), note = $('#kfNote').value.trim(), status = $('#kfStatus'), btn = $('#kfSend');
  if (name.length < 2) { status.textContent = 'Вкажіть ім\'я.'; status.className = 'kf-status err'; $('#kfName').focus(); return; }
  if (!phone) { status.textContent = 'Перевірте номер: потрібен український формат +380 XX XXX XX XX.'; status.className = 'kf-status err'; $('#kfPhone').focus(); return; }
  var sum = renderSummary(), st = sum.st;
  var lines = [
    'Заявка з конфігуратора',
    'Виріб: ' + bySlug[S.slug].t,
    'Розміри: ' + st.dims,
    'Метал: ' + metalText(),
    optText() ? 'Опції: ' + optText() : '',
    'Кількість: ' + S.q + ' шт',
    st.price ? 'На сайті показано: ' + fmt(st.price.lo).replace(' грн', '') + ' – ' + fmt(st.price.hi) + ' за шт' : 'Ціна: за прорахунком',
    'Метал на 1 шт: ' + st.area.toFixed(2).replace('.', ',') + ' м², ≈' + Math.round(st.kg) + ' кг; листів 1500×3000 на все замовлення: ≈' + Math.max(1, Math.ceil(st.area * S.q / 3.4)),
    note ? 'Коментар: ' + note : '',
    'Модель: ' + sum.link
  ].filter(Boolean).join('\n');
  var p = phone;
  var data = { name: name, phone: p, phoneDisplay: '+380 ' + p.slice(4, 6) + ' ' + p.slice(6, 9) + ' ' + p.slice(9), message: lines, service: 'configurator', website: $('#kfWeb').value, page: '/konfigurator/', referrer: document.referrer || '', serviceFromUrl: S.slug, ts: new Date().toISOString(), config: encode(S) };
  btn.disabled = true; status.textContent = 'Надсилаємо…'; status.className = 'kf-status';
  try {
    var res = await fetch(WORKER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'lead_submit', service: 'configurator', product: S.slug, page_path: '/konfigurator/' });
    status.textContent = 'Заявку отримано. Передзвонимо протягом 15 хвилин у робочий час.'; status.className = 'kf-status ok';
    setTimeout(function () { location.href = '/thank-you/'; }, 900);
  } catch (err) {
    status.innerHTML = 'Не вдалося надіслати. Напишіть нам у <a href="https://t.me/feroxlviv" target="_blank" rel="noopener">Telegram</a> і вставте це посилання на модель: <br><span class="kf-link">' + esc(sum.link) + '</span>';
    status.className = 'kf-status err';
  } finally { btn.disabled = false; }
});

/* ═════════ ЦИКЛ ═════════ */
function resize() {
  var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px';
  camera.aspect = w / h; camera.fov = w < 700 ? 40 : 32; camera.updateProjectionMatrix();
  if (lastBuild) frame(lastBuild);
}
new ResizeObserver(resize).observe(stage);
var v3 = new THREE.Vector3();
function loop() {
  var k = reduced ? 1 : 0.1;
  cur.az += (goal.az - cur.az) * k; cur.pol += (goal.pol - cur.pol) * k; cur.r += (goal.r - cur.r) * k;
  place(); renderer.render(scene, camera);
  var w = stage.clientWidth, h = stage.clientHeight, photoMode = D[S.slug].photo;
  ['x', 'y', 'z'].forEach(function (a) {
    var el = labels[a]; if (!anchors[a]) return;
    v3.copy(anchors[a]).project(camera);
    var hide = photoMode || !dimsGroup.visible || v3.z > 1 || el.dataset.off === '1' || (a === 'y' && cur.pol < 0.3) || (a === 'z' && Math.abs(Math.sin(cur.az)) < 0.1 && cur.pol > 1.2) || (a === 'x' && Math.abs(Math.cos(cur.az)) < 0.1 && cur.pol > 1.2);
    el.classList.toggle('hide', hide);
    el.style.transform = 'translate(' + ((v3.x + 1) / 2 * w) + 'px,' + ((1 - v3.y) / 2 * h) + 'px) translate(-50%,-50%)';
  });
  requestAnimationFrame(loop);
}

renderPicker(); renderParams(); renderMetal(); resize(); rebuild(true); renderSummary();
if (!reduced) { cur.r = baseR * 1.3; cur.az = 0.25; }
loop();
window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'configurator_open', product: S.slug });
})();
