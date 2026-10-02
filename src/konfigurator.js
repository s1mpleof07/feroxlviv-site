/* FEROX LVIV — конфігуратор виробів v2
   Усе процедурне: текстури, оточення й підлога генеруються в браузері, окремих файлів не потрібно.
   Дані каталогу — window.FX_CAT, множники металу — window.FX_MULT. Заявка — через той самий воркер. */
(function () {
'use strict';
var root = document.getElementById('kf');
if (!root || !window.THREE) return;

var CAT = window.FX_CAT || [];
var MULT = window.FX_MULT || { corten: 1, stainless: 0.7, steel: 0.5 };
var WORKER = 'https://leads-feroxlviv.prokopiv-andriy99.workers.dev/lead';
var SITE = 'https://feroxlviv.com.ua';
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
var PI = Math.PI;
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' грн'; }
function r100(n) { return Math.round(n / 100) * 100; }
function num(s) { var m = String(s).match(/\d+(?:[.,]\d+)?/g); return m ? m.map(function (x) { return parseFloat(x.replace(',', '.')); }) : []; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function cm(v) { return v / 100; }
function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

/* ═════════ РЕНДЕРЕР ═════════ */
var stage = root.querySelector('.kf-stage');
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0, 0);
stage.insertBefore(renderer.domElement, stage.firstChild);
var MAXAN = renderer.capabilities.getMaxAnisotropy();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(32, 1, 0.02, 120);
var pmrem = new THREE.PMREMGenerator(renderer);

/* ═════════ ПРОЦЕДУРНІ ТЕКСТУРИ ═════════ */
function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/* періодичний value-noise: текстура тайлиться без швів */
function noiseField(size, period, seed) {
  var r = rng(seed), g = new Float32Array(period * period);
  for (var i = 0; i < g.length; i++) g[i] = r();
  return function (x, y) {
    var fx = x / size * period, fy = y / size * period, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    var a = g[(y0 % period) * period + (x0 % period)], b = g[(y0 % period) * period + ((x0 + 1) % period)],
      c = g[((y0 + 1) % period) * period + (x0 % period)], d = g[((y0 + 1) % period) * period + ((x0 + 1) % period)];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}
function fbm(size, base, oct, seed) {
  var fs = []; for (var o = 0; o < oct; o++) fs.push(noiseField(size, base << o, seed + o * 97));
  return function (x, y) { var v = 0, a = 0.5, n = 0; for (var o = 0; o < oct; o++) { v += fs[o](x, y) * a; n += a; a *= 0.5; } return v / n; };
}
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function sstep(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
function hex(h) { return [(h >> 16) & 255, (h >> 8) & 255, h & 255]; }
function makeCanvas(size, fn) {
  var c = document.createElement('canvas'); c.width = c.height = size;
  var g = c.getContext('2d'), im = g.createImageData(size, size), d = im.data;
  for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) { var p = fn(x, y), i = (y * size + x) * 4; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c;
}
function texFrom(c, color, rep) {
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAXAN;
  if (color) t.encoding = THREE.sRGBEncoding; if (rep) t.repeat.set(rep, rep); return t;
}
var TX = {};
function canvasTex(w, h, draw, repeat) {
  var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat, repeat); return t;
}
/* стадії патини кортену: 0 — окалина, 1 — перший місяць, 3 — три місяці, 6 — зріла */
function rustStage(st) {
  var key = 'rust' + st; if (TX[key]) return TX[key];
  var S = 512, coarse = fbm(S, 4, 5, 11 + st), fine = fbm(S, 32, 3, 77 + st), spots = fbm(S, 8, 4, 311 + st);
  var cols = {
    0: [hex(0x3c4146), hex(0x5c6268), hex(0x7a4a2c)], 1: [hex(0x7c7e80), hex(0xae5f2c), hex(0x6a3418)],
    3: [hex(0x9a5128), hex(0x6e6a66), hex(0x6b3218)], 6: [hex(0x6c3318), hex(0x8e4521), hex(0x4a2210)]
  }[st];
  var col = makeCanvas(S, function (x, y) {
    var c = coarse(x, y), f = fine(x, y), s = spots(x, y), p;
    if (st === 0) { p = mix(cols[0], cols[1], sstep(.3, .75, c)); p = mix(p, cols[2], sstep(.74, .86, s) * .55); }
    else if (st === 1) { p = mix(cols[0], cols[1], sstep(.46, .62, s)); p = mix(p, cols[2], sstep(.66, .8, s) * .7); }
    else if (st === 3) { p = mix(cols[0], cols[1], sstep(.34, .2, s) * .8); p = mix(p, cols[2], sstep(.55, .8, c) * .6); }
    else { p = mix(cols[0], cols[1], sstep(.35, .7, c)); p = mix(p, cols[2], sstep(.62, .82, f) * .6); }
    var k = 0.86 + f * 0.28; return [p[0] * k, p[1] * k, p[2] * k];
  });
  var bump = makeCanvas(256, function (x, y) { var v = (st === 0 ? 118 + fine(x * 2, y * 2) * 20 : 70 + fine(x * 2, y * 2) * 120 + spots(x * 2, y * 2) * 40); return [v, v, v]; });
  return (TX[key] = { map: texFrom(col, true), bump: texFrom(bump, false) });
}
function lazyTex(key, size, fn, color) { if (!TX[key]) TX[key] = texFrom(makeCanvas(size, fn), color); return TX[key]; }
function brushTex() {
  if (TX.brush) return TX.brush;
  var c = document.createElement('canvas'); c.width = c.height = 1024; var g = c.getContext('2d');
  g.fillStyle = '#7c7c7c'; g.fillRect(0, 0, 1024, 1024);
  for (var i = 0; i < 6000; i++) { var v = 85 + Math.random() * 90 | 0; g.strokeStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (.15 + Math.random() * .3) + ')'; g.lineWidth = Math.random() * 1.2 + .25; var y = Math.random() * 1024, x = Math.random() * 1024; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 150 + Math.random() * 800, y); g.stroke(); }
  return (TX.brush = texFrom(c, false));
}
function fineTex() { var f = fbm(256, 64, 2, 5); return lazyTex('fine', 256, function (x, y) { var v = 100 + f(x, y) * 60 + Math.random() * 30; return [v, v, v]; }); }
function hammerTex() {
  if (TX.hammer) return TX.hammer;
  var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (var i = 0; i < 900; i++) { var x = Math.random() * 512, y = Math.random() * 512, r = 6 + Math.random() * 14, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(40,40,40,.55)'); gr.addColorStop(.7, 'rgba(128,128,128,.1)'); gr.addColorStop(1, 'rgba(200,200,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  return (TX.hammer = texFrom(c, false));
}
/* підлога сцен */
function groundTex(kind) {
  var key = 'g_' + kind; if (TX[key]) return TX[key];
  var S = 512, c;
  if (kind === 'grass') {
    var a = fbm(S, 8, 4, 21), b = fbm(S, 64, 2, 22);
    c = makeCanvas(S, function (x, y) { var t = a(x, y), f = b(x, y); var p = mix(hex(0x3f5a26), hex(0x6f8a3c), sstep(.3, .75, t)); p = mix(p, hex(0x9a8f5a), sstep(.72, .9, f) * .5); var k = .8 + f * .4; return [p[0] * k, p[1] * k, p[2] * k]; });
  } else if (kind === 'deck') {
    var gr = fbm(S, 4, 3, 31), fb = fbm(S, 128, 2, 32);
    c = makeCanvas(S, function (x, y) { var plank = Math.floor(y / 64), yy = y % 64, gap = yy < 2 ? .35 : 1, sh = (plank * 37 % 11) / 11;
      var grain = Math.sin((x * 0.05 + gr(x, (y + plank * 40) % S) * 18)) * .5 + .5; var p = mix(hex(0x6e4128), hex(0x9a633d), grain * .6 + sh * .3); var k = gap * (.85 + fb(x, y) * .3); return [p[0] * k, p[1] * k, p[2] * k]; });
  } else {
    var g2 = fbm(S, 4, 3, 41), f2 = fbm(S, 128, 2, 42);
    c = makeCanvas(S, function (x, y) { var row = Math.floor(y / 42), off = (row % 2) * 128, col = Math.floor((x + off) / 256), yy = y % 42, xx = (x + off) % 256;
      var seam = (yy < 1 || xx < 1) ? .78 : 1, tone = ((row * 7 + col * 13) % 9) / 9; var grain = Math.sin(x * 0.03 + g2(x, y) * 14) * .5 + .5;
      var p = mix(hex(0xb89a74), hex(0xd6bf9a), tone * .5 + grain * .35); var k = seam * (.9 + f2(x, y) * .18); return [p[0] * k, p[1] * k, p[2] * k]; });
  }
  return (TX[key] = texFrom(c, true));
}
function soilTex() { var f = fbm(256, 32, 3, 51); return lazyTex('soil', 256, function (x, y) { var v = f(x, y), p = mix(hex(0x1d1510), hex(0x3b2c21), v); if (Math.random() > .985) p = hex(0x6b5a4a); return p; }, true); }

/* ═════════ СЦЕНИ: процедурне оточення для відбиттів ═════════ */
function gradSphere(env, top, mid, bot, k) {
  var geo = new THREE.SphereGeometry(20, 32, 16), pos = geo.attributes.position, col = [];
  var T = new THREE.Color(top), Mi = new THREE.Color(mid), B = new THREE.Color(bot);
  for (var i = 0; i < pos.count; i++) { var y = pos.getY(i) / 20, c = y > 0 ? Mi.clone().lerp(T, Math.pow(y, .6)) : Mi.clone().lerp(B, Math.min(1, -y * 3)); c.multiplyScalar(k); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  env.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
}
function panel(env, w, h, x, y, z, ry, rx, k, tint) {
  var c = new THREE.Color(tint || 0xffffff).multiplyScalar(k);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  m.position.set(x, y, z); m.lookAt(0, y, 0); if (rx) { m.rotation.set(rx, ry || 0, 0); } env.add(m);
}
var ENV = {};
function envFor(kind) {
  if (ENV[kind]) return ENV[kind];
  var env = new THREE.Scene();
  if (kind === 'studio') {
    env.add(new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), new THREE.MeshBasicMaterial({ color: 0x3c3d40, side: THREE.BackSide })).translateY(3));
    panel(env, 5, 1.6, 0, 6.4, -.8, 0, PI / 2, 4.5); panel(env, 4, .6, 0, 6.4, 1.5, 0, PI / 2, 2.6);
    panel(env, 1.2, 4.5, -6.9, 2.6, .8, 0, 0, 3.2); panel(env, .9, 4.5, 6.9, 2.6, -.8, 0, 0, 1.8);
    panel(env, .6, 4.6, -2.4, 2.6, 6.9, 0, 0, 2.6); panel(env, .4, 4.6, 1.8, 2.6, 6.9, 0, 0, 2.0);
    panel(env, 10, 3.4, 0, 2.2, 6.8, 0, 0, .9); panel(env, 10, 3.4, 6.8, 2.2, 0, 0, 0, .75);
  } else if (kind === 'garden') {
    gradSphere(env, 0x6f9fd8, 0xdfe8ee, 0x3d5226, 1.25);
    for (var i = 0; i < 14; i++) { var a = i / 14 * 2 * PI, t = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random(), 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2c4a22).multiplyScalar(.6 + Math.random() * .4) })); t.position.set(Math.cos(a) * 12, 1 + Math.random() * 1.5, Math.sin(a) * 12); env.add(t); }
    panel(env, 1.6, 1.6, -4, 12, 6, 0, PI / 2, 14, 0xfff3e0);
  } else if (kind === 'terrace') {
    gradSphere(env, 0x4f6a9a, 0xf2a45e, 0x3a2418, 1.1);
    panel(env, 2.2, 1.2, -14, 1.4, 6, 0, 0, 9, 0xffb070);
    for (var j = 0; j < 8; j++) { var b = new THREE.Mesh(new THREE.BoxGeometry(3, 2 + Math.random() * 4, 2), new THREE.MeshBasicMaterial({ color: 0x2a1c14 })); var an = PI * .3 + j / 8 * PI; b.position.set(Math.cos(an) * 14, 1.5, Math.sin(an) * 14); env.add(b); }
  } else {
    env.add(new THREE.Mesh(new THREE.BoxGeometry(12, 5, 12), new THREE.MeshBasicMaterial({ color: 0x3e342b, side: THREE.BackSide })).translateY(2.2));
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: 0x2c231c })); fl.rotation.x = -PI / 2; fl.position.y = -.3; env.add(fl);
    var rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc8b8a2).multiplyScalar(1.3) })); rug.rotation.x = -PI / 2; rug.position.set(.6, -.28, .8); env.add(rug);
    for (var st2 = 0; st2 < 5; st2++) { var sl = new THREE.Mesh(new THREE.PlaneGeometry(.12, 5), new THREE.MeshBasicMaterial({ color: 0x9a8066 })); sl.rotation.x = -PI / 2; sl.position.set(-4 + st2 * 1.8, -.29, 0); env.add(sl); }
    var sofa = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1.2), new THREE.MeshBasicMaterial({ color: 0xb3a592 })); sofa.position.set(0, .3, -2.8); env.add(sofa);
    panel(env, 4.5, 3.2, -5.9, 2, 0, 0, 0, 5.2, 0xf4f8ff);
    panel(env, 1.2, 3.2, -5.9, 2, -3.4, 0, 0, 3.8, 0xf4f8ff);
    panel(env, 5, .35, 0, 4.6, 0, 0, PI / 2, 3.2, 0xfff0dc);
    panel(env, .8, .8, 3, 3.8, -3, 0, PI / 2, 2.4, 0xffd9a8);
    panel(env, 3, 2, 0, 1.6, -5.9, 0, 0, 1.1, 0xd8c8b4);
    var patch = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2e0).multiplyScalar(2.2) })); patch.rotation.x = -PI / 2; patch.position.set(-2.6, -.27, 1.8); env.add(patch);
    for (var q = 0; q < 4; q++) { var s = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 1), new THREE.MeshBasicMaterial({ color: 0x3a2e26 })); s.position.set(-2 + q * 2, .3, 5); env.add(s); }
  }
  return (ENV[kind] = pmrem.fromScene(env, .04).texture);
}
var SCENES = {
  studio: { n: 'Студія', ground: null, sun: [220, 48] },
  garden: { n: 'Сад', ground: 'grass', sun: [160, 52], rep: 5 },
  terrace: { n: 'Тераса', ground: 'deck', sun: [245, 12], rep: 3 },
  living: { n: 'Вітальня', ground: 'parquet', sun: [110, 28], rep: 3.2 }
};
var TOD = {
  morning: { n: 'Ранок', el: 16, c: 0xffdcb8, i: 2.0, e: .85, x: 1 },
  noon: { n: 'День', el: 55, c: 0xffffff, i: 2.3, e: 1, x: 1 },
  sunset: { n: 'Захід', el: 7, c: 0xff9a55, i: 2.2, e: .6, x: 1.05 },
  night: { n: 'Вечір', el: 12, c: 0x6f86b8, i: .1, e: .1, x: 1.15 }
};

/* ═════════ СВІТЛО І ПІДЛОГА ═════════ */
var hemi = new THREE.HemisphereLight(0xffffff, 0x7a7064, .18); scene.add(hemi);
var sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 10; sun.shadow.bias = -0.0004;
scene.add(sun); scene.add(sun.target);
var ups = [0, 1].map(function () { var l = new THREE.SpotLight(0xffb070, 0, 5, .6, .8, 1.5); scene.add(l); scene.add(l.target); return l; });
var groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, transparent: true });
groundMat.onBeforeCompile = function (sh) {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vFade;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade=position.xy;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vFade;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a*=smoothstep(1.0,.28,length(vFade));');
};
var groundR = { value: 4 };
var ground = new THREE.Mesh(new THREE.CircleGeometry(1, 96), groundMat);
ground.rotation.x = -PI / 2; ground.receiveShadow = true; scene.add(ground);
var shadowOnly = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.ShadowMaterial({ opacity: .14 }));
shadowOnly.rotation.x = -PI / 2; shadowOnly.receiveShadow = true; shadowOnly.position.y = .0005; scene.add(shadowOnly);
var blob = (function () {
  var c = document.createElement('canvas'); c.width = c.height = 256;
  var g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 14, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(.55, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.y = .0012; scene.add(m); return m;
})();

/* ═════════ МАТЕРІАЛИ Й ОБРОБКИ ═════════ */
var RAL = [['9005', 'Чорний', '#0e0e10'], ['7016', 'Антрацит', '#383e42'], ['7024', 'Графіт', '#474a50'], ['7039', 'Кварц', '#6c6960'],
  ['8017', 'Шоколад', '#45322e'], ['6005', 'Мох', '#0f4336'], ['3009', 'Оксид', '#6d342d'], ['9016', 'Білий', '#f1f0ea']];
var HEAT_RAL = ['9005', '7024'];
var PVD = [['none', 'Без покриття', null], ['gold', 'Золото', '#d8b26a'], ['bronze', 'Бронза', '#8c6a4f'], ['graphite', 'Графіт', '#4a4b4f'], ['champagne', 'Шампань', '#d9c4a2']];
var METALS = { corten: { n: 'Кортен', rho: 7.85 }, steel: { n: 'Чорна сталь', rho: 7.85 }, stainless: { n: 'Нержавійка AISI 304', rho: 7.93 } };

var matCache = {};
function cortenAge(s) { var b = { raw: 0, light: 2, deep: 6 }[s.cs || 'raw']; return (s.cp || 'none') === 'none' ? b + (+s.mo || 0) : b; }
function metalMat(s) {
  var metal = s.metal || 'corten', key = metal + '|' + [s.cs, s.cp, s.mo, s.st, s.ral, s.tx, s.ss, s.pvd].join('|');
  if (matCache[key]) return matCache[key];
  var m;
  if (metal === 'corten') {
    var a = cortenAge(s), st = a < .6 ? 0 : a < 2 ? 1 : a < 5 ? 3 : 6, t = rustStage(st);
    m = new THREE.MeshPhysicalMaterial({ map: t.map, bumpMap: t.bump, bumpScale: st === 0 ? .0003 : .0012, roughness: [.48, .74, .88, .9][[0, 1, 3, 6].indexOf(st)], metalness: [.55, .28, .12, .08][[0, 1, 3, 6].indexOf(st)] });
    if (s.cp === 'stab') { m.color = new THREE.Color(.84, .82, .8); m.clearcoat = .25; m.clearcoatRoughness = .6; }
    if (s.cp === 'lak') { m.color = new THREE.Color(.78, .75, .73); m.clearcoat = .55; m.clearcoatRoughness = .45; }
    if (s.cp === 'wax') { m.color = new THREE.Color(.74, .7, .68); m.clearcoat = .75; m.clearcoatRoughness = .28; }
  } else if (metal === 'steel') {
    var stt = s.st || 'powder', col = lin((RAL.filter(function (r) { return r[0] === s.ral; })[0] || RAL[1])[2]);
    if (stt === 'powder') {
      var tx = { mat: { r: .62, m: 0 }, semi: { r: .32, m: 0, cc: .6, ccr: .18 }, shagren: { r: .6, m: 0, bump: fineTex(), bs: .0012 }, hammer: { r: .36, m: .55, cc: .3, ccr: .25, bump: hammerTex(), bs: .004 } }[s.tx || 'mat'];
      m = new THREE.MeshPhysicalMaterial({ color: col, roughness: tx.r, metalness: tx.m, clearcoat: tx.cc || 0, clearcoatRoughness: tx.ccr || 0, bumpMap: tx.bump || null, bumpScale: tx.bs || 0 });
    } else if (stt === 'heat') m = new THREE.MeshStandardMaterial({ color: col, roughness: .86, metalness: .05 });
    else if (stt === 'blued') m = new THREE.MeshPhysicalMaterial({ color: lin(0x262c38), metalness: .92, roughness: .28, clearcoat: .4, clearcoatRoughness: .2, roughnessMap: brushTex(), bumpMap: brushTex(), bumpScale: .0004 });
    else { var r0 = rustStage(0); m = new THREE.MeshPhysicalMaterial({ map: r0.map, color: new THREE.Color(.9, .92, .95), metalness: .65, roughness: .42, clearcoat: 1, clearcoatRoughness: .12, bumpMap: r0.bump, bumpScale: .0003 }); }
  } else {
    var p = PVD.filter(function (x) { return x[0] === (s.pvd || 'none'); })[0], pc = p && p[2] ? lin(p[2]) : new THREE.Color(0xd2d4d7), ss = s.ss || 'satin';
    if (ss === 'mirror') m = new THREE.MeshPhysicalMaterial({ color: pc, metalness: 1, roughness: .035 });
    else if (ss === 'blast') m = new THREE.MeshPhysicalMaterial({ color: pc.clone().multiplyScalar(.9), metalness: 1, roughness: .46, bumpMap: fineTex(), bumpScale: .0005 });
    else m = new THREE.MeshPhysicalMaterial({ color: pc, metalness: 1, roughness: .24, roughnessMap: brushTex(), bumpMap: brushTex(), bumpScale: .0004 });
  }
  m.userData.metal = true;
  return (matCache[key] = m);
}
var M = {
  soil: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: lin(0x3f5f2c), roughness: .8 }),
  leaf2: new THREE.MeshStandardMaterial({ color: lin(0x557a38), roughness: .8 }),
  dark: new THREE.MeshStandardMaterial({ color: lin(0x1c1b1a), roughness: .9 }),
  wall: new THREE.MeshStandardMaterial({ color: lin(0xc9c5bd), roughness: .95 }),
  wood: new THREE.MeshStandardMaterial({ color: lin(0x7a5236), roughness: .9 }),
  water: new THREE.MeshPhysicalMaterial({ color: lin(0x3d5360), roughness: .05, metalness: .1, transparent: true, opacity: .85 }),
  stone: new THREE.MeshStandardMaterial({ color: lin(0x9a968e), roughness: .8 }),
  ceramic: new THREE.MeshStandardMaterial({ color: lin(0xece8e1), roughness: .55 }),
  book: new THREE.MeshStandardMaterial({ color: lin(0x55645a), roughness: .85 }),
  glow: new THREE.MeshStandardMaterial({ color: 0x2a2520, emissive: 0xffb25a, emissiveIntensity: 0, roughness: 1 })
};
M.soil.map = soilTex();

/* ── примітиви ── */
function add(g, geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
function box(g, w, h, d, mat, x, y, z) { return add(g, new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function vis(t) { return Math.max(t, 0.004); }
function openBox(g, L, W, H, t, mat) {
  t = vis(t);
  box(g, L, H, t, mat, 0, H / 2, W / 2 - t / 2); box(g, L, H, t, mat, 0, H / 2, -W / 2 + t / 2);
  box(g, t, H, W - 2 * t, mat, L / 2 - t / 2, H / 2, 0); box(g, t, H, W - 2 * t, mat, -L / 2 + t / 2, H / 2, 0);
  box(g, L - 2 * t, t, W - 2 * t, mat, 0, t / 2 + .02, 0);
}
function tube(g, r, h, t, mat, y0) {
  t = vis(t); y0 = y0 || 0;
  var pts = [[0, y0], [r - .006, y0], [r, y0 + .006], [r, y0 + h - t / 2]];
  for (var i = 1; i <= 8; i++) { var a = i / 8 * PI; pts.push([r - t / 2 + Math.cos(a) * t / 2, y0 + h - t / 2 + Math.sin(a) * t / 2]); }
  pts.push([r - t, y0 + t + .003], [0, y0 + t]);
  var v = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg = 128, geo = new THREE.LatheGeometry(v, seg);
  var L = [0]; for (var j = 1; j < v.length; j++) L.push(L[j - 1] + v[j].distanceTo(v[j - 1]));
  var uv = geo.attributes.uv, circ = Math.max(1, Math.round(2 * PI * r / .5));
  for (var k = 0; k <= seg; k++) for (var q = 0; q < v.length; q++) uv.setXY(k * v.length + q, k / seg * circ, L[q] / .5);
  geo.computeVertexNormals();
  var m = add(g, geo, mat); m.userData.uvDone = true; return m;
}
function lathe(g, pts, mat, y) { var v = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }); var mm = mat; if (mat.userData.metal) { mm = mat.clone(); mm.userData.metal = true; } mm.side = THREE.DoubleSide; return add(g, new THREE.LatheGeometry(v, 72), mm, 0, y || 0, 0); }
function roundedShape(w, h, r) {
  var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, PI / 2, PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, PI, 1.5 * PI, false); return s;
}
/* злакова трава зі стеблин */
function plant(g, r, y) {
  var n = Math.round(160 + r * 900), pos = [], col = [], idx = [], base = 0, hMax = Math.max(.25, Math.min(.7, r * 1.5));
  var c1 = lin(0x3f5a2a), c2 = lin(0xb9b27a), c3 = lin(0x6d8a45);
  for (var b = 0; b < n; b++) {
    var a = Math.random() * 2 * PI, d = Math.sqrt(Math.random()) * r * .82, x0 = Math.cos(a) * d, z0 = Math.sin(a) * d;
    var hb = hMax * (.55 + Math.random() * .5), w = .005 + Math.random() * .005, bend = (.15 + Math.random() * .45) * hb, dir = a + (Math.random() - .5) * 1.2, segs = 5, tip = Math.random() < .35 ? c2 : c3;
    for (var s = 0; s <= segs; s++) {
      var f = s / segs, ww = w * (1 - f * .92), yy = f * hb, off = bend * f * f, cx = x0 + Math.cos(dir) * off, cz = z0 + Math.sin(dir) * off, px = -Math.sin(dir) * ww, pz = Math.cos(dir) * ww;
      pos.push(cx - px, y + yy, cz - pz, cx + px, y + yy, cz + pz); var cc = c1.clone().lerp(tip, f); col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
      if (s < segs) { var q = base + s * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    base += (segs + 1) * 2;
  }
  var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .75 })); m.castShadow = true; g.add(m);
}
function wall(g, w, h, z) { var m = box(g, w, h, .04, M.wall, 0, h / 2, z - .02); m.userData.extra = true; return m; }
function glowAt(g, geo, x, y, z) { var m = add(g, geo, M.glow, x, y, z); m.castShadow = false; return m; }

/* перфорація: одна текстура на панель */
function perfMat(s, Wm, Hm, pattern, holeCm) {
  var pxcm = Math.min(5, 2048 / Math.max(Wm, Hm) / 100), w = Math.max(64, Math.round(Wm * 100 * pxcm)), h = Math.max(64, Math.round(Hm * 100 * pxcm));
  var hole = holeCm * pxcm, step = hole * 2.1, margin = 5 * pxcm;
  var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d');
  var base = metalMat(s);
  if (base.map) { var img = base.map.image; for (var yy = 0; yy < h; yy += img.height) for (var xx = 0; xx < w; xx += img.width) g.drawImage(img, xx, yy); }
  else { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
  g.globalCompositeOperation = 'destination-out';
  var rows = Math.floor((h - 2 * margin) / step), cols = Math.floor((w - 2 * margin) / step), ox = (w - cols * step) / 2 + step / 2, oy = (h - rows * step) / 2 + step / 2;
  for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) {
    var x = ox + j * step + (pattern === 'romb' && i % 2 ? step / 2 : 0), y = oy + i * step;
    if (pattern === 'romb' && i % 2 && j === cols - 1) continue;
    g.beginPath();
    if (pattern === 'kvadrat') g.rect(x - hole / 2, y - hole / 2, hole, hole);
    else if (pattern === 'romb') { g.moveTo(x, y - hole * .7); g.lineTo(x + hole * .7, y); g.lineTo(x, y + hole * .7); g.lineTo(x - hole * .7, y); }
    else if (pattern === 'hvylia') { var k = hole * (.35 + .65 * (.5 + .5 * Math.sin((j / cols) * PI * 3 + i * .35))); g.arc(x, y, k / 2, 0, 7); }
    else if (pattern === 'lystia') g.ellipse(x + (Math.random() - .5) * hole * .6, y, hole * (.3 + Math.random() * .35), hole * (.12 + Math.random() * .15), Math.random() * 3, 0, 7);
    else g.arc(x, y, hole / 2, 0, 7);
    g.fill();
  }
  var tex = new THREE.CanvasTexture(c), m = base.clone();
  m.roughnessMap = null; m.bumpMap = null; m.side = THREE.DoubleSide; m.alphaTest = .5;
  if (base.map) { m.map = tex; tex.encoding = THREE.sRGBEncoding; } else { m.map = null; m.alphaMap = tex; }
  m.userData.metal = true; m.userData.own = true; m.userData.uvDone = true;
  m.needsUpdate = true; return m;
}
function perfPanel(g, W, H, s, pattern, hole, y0, z) { var m = add(g, new THREE.PlaneGeometry(W, H), perfMat(s, W, H, pattern, hole), 0, (y0 || 0) + H / 2, z || 0); m.userData.uvDone = true; return m; }

/* об'ємні літери з ореолом */
function letters(g, text, hM, depthM, mat, y0, z0, halo) {
  text = (text || 'FEROX').slice(0, 24);
  var fs = 200, font = '700 ' + fs + 'px "DM Sans", Arial, sans-serif', pad = 90, c = document.createElement('canvas'), g2 = c.getContext('2d'); g2.font = font;
  c.width = Math.min(4096, Math.ceil(g2.measureText(text).width) + pad * 2); c.height = Math.round(fs * 1.25) + pad;
  g2 = c.getContext('2d'); g2.font = font; g2.fillStyle = '#fff'; g2.textBaseline = 'middle'; g2.fillText(text, pad, c.height / 2 + fs * .04);
  var tex = new THREE.CanvasTexture(c), scale = hM / (fs * .72), W = c.width * scale, H = c.height * scale;
  var base = mat.map ? lin(0x8a4a2b) : mat.color.clone(), layers = 14;
  for (var i = 0; i <= layers; i++) {
    var lm = new THREE.MeshStandardMaterial({ color: i === layers ? base : base.clone().multiplyScalar(.7), roughness: mat.roughness, metalness: mat.metalness, alphaMap: tex, alphaTest: .5, side: THREE.DoubleSide });
    lm.userData.own = true;
    var m = add(g, new THREE.PlaneGeometry(W, H), lm, 0, y0, z0 + depthM * i / layers); m.castShadow = i === layers; m.userData.uvDone = true;
  }
  if (halo) {
    var hc = document.createElement('canvas'); hc.width = c.width; hc.height = c.height; var hg = hc.getContext('2d'); hg.font = font; hg.textBaseline = 'middle';
    hg.shadowColor = 'rgba(255,170,80,1)'; hg.fillStyle = 'rgba(255,170,80,1)';
    [60, 34, 16].forEach(function (b) { hg.shadowBlur = b; hg.fillText(text, pad, c.height / 2 + fs * .04); });
    var hm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); hm.userData.own = true;
    var hmesh = add(g, new THREE.PlaneGeometry(W * 1.02, H * 1.06), hm, 0, y0, .003); hmesh.castShadow = false; hmesh.receiveShadow = false; hmesh.userData.halo = true;
  }
  return { w: (c.width - pad * 2) * scale, h: hM, n: text.replace(/\s/g, '').length };
}

/* силует людини для масштабу */
var human = (function () {
  var c = document.createElement('canvas'); c.width = 256; c.height = 1024; var g = c.getContext('2d'); g.fillStyle = '#6f6c67';
  g.beginPath(); g.arc(128, 70, 52, 0, 7); g.fill();
  g.beginPath(); g.moveTo(58, 150); g.lineTo(198, 150); g.quadraticCurveTo(222, 152, 224, 190); g.lineTo(214, 560); g.lineTo(186, 560); g.lineTo(178, 1010); g.lineTo(140, 1010); g.lineTo(128, 600); g.lineTo(116, 1010); g.lineTo(78, 1010); g.lineTo(70, 560); g.lineTo(42, 560); g.lineTo(32, 190); g.quadraticCurveTo(34, 152, 58, 150); g.fill();
  var m = new THREE.Mesh(new THREE.PlaneGeometry(.44, 1.75), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, alphaTest: .4, side: THREE.DoubleSide }));
  m.visible = false; scene.add(m); return m;
})();

/* ═════════ ТОВАРИ ═════════ */
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
  }
};

/* столики */
D['stolyk-p-podibnyi'] = {
  t: 3, use: 'in', def: { cs: 'deep', cp: 'lak' }, incl: ['deep', 'lak'],
  params: [['L', 'Довжина', 60, 160, 5, 90], ['W', 'Ширина', 40, 90, 5, 60], ['H', 'Висота', 30, 50, 1, 40]],
  opts: [['R', 'Радіус згину', 'select', '20', [['10', 'R10 мм'], ['20', 'R20 мм'], ['30', 'R30 мм']]], ['decor', 'Декор', 'bool', true]],
  preset: function (k) { var n = num(k); return n.length >= 3 ? { L: n[0], W: n[1], H: n[2] } : null; },
  area: function (p) { return cm(p.L + 2 * p.H) * cm(p.W); },
  dimsText: function (p, o) { return p.L + ' × ' + p.W + ' × H' + p.H + ' см, згини R' + o.R; },
  warn: function (p) { return p.L > 120 ? 'Стільниця довша за 1,2 м — знизу додамо приховане ребро жорсткості, щоб не прогиналась.' : (p.L + 2 * p.H > 300 ? 'Розгортка довша за 3 м — зробимо зі стиком під стільницею.' : ''); },
  build: function (g, p, o, s) {
    var L = cm(p.L), W = cm(p.W), H = cm(p.H), t = .004, R = Math.max(t * 1.5, (+o.R + 3) / 1000), ri = R - t, sh = new THREE.Shape();
    sh.moveTo(-L / 2, 0); sh.lineTo(-L / 2, H - R); sh.absarc(-L / 2 + R, H - R, R, PI, PI / 2, true);
    sh.lineTo(L / 2 - R, H); sh.absarc(L / 2 - R, H - R, R, PI / 2, 0, true); sh.lineTo(L / 2, 0);
    sh.lineTo(L / 2 - t, 0); sh.lineTo(L / 2 - t, H - R); sh.absarc(L / 2 - R, H - R, ri, 0, PI / 2, false);
    sh.lineTo(-L / 2 + R, H - t); sh.absarc(-L / 2 + R, H - R, ri, PI / 2, PI, false); sh.lineTo(-L / 2, 0);
    var geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelThickness: .0008, bevelSize: .0008, bevelSegments: 2, curveSegments: 20 });
    geo.translate(0, 0, -W / 2); add(g, geo, metalMat(s));
    if (o.decor) { var bk = box(g, .25, .03, .18, M.book, -L * .2, H + .015, W * .08); bk.rotation.y = .12; lathe(g, [[0, 0], [.07, 0], [.11, .045], [.105, .05]], M.dark, H).position.set(L * .2, H, -W * .1); }
    return { x: L, y: H, z: W };
  }
};
D['stolyk-zakrytyi'] = {
  t: 3, use: 'in', def: { cs: 'deep', cp: 'lak' }, incl: ['deep', 'lak'],
  params: [['L', 'Довжина', 60, 160, 5, 90], ['W', 'Ширина', 40, 100, 5, 60], ['H', 'Висота', 30, 50, 1, 40]],
  opts: [['R', 'Радіус кутів', 'select', '20', [['10', 'R10 мм'], ['20', 'R20 мм'], ['30', 'R30 мм'], ['50', 'R50 мм']]], ['decor', 'Декор', 'bool', true]],
  preset: function (k) { var n = num(k); return n.length >= 3 ? { L: n[0], W: n[1], H: n[2] } : null; },
  area: function (p) { var L = cm(p.L), W = cm(p.W), H = cm(p.H); return H * 2 * (L + W) + 2 * L * W; },
  dimsText: function (p, o) { return p.L + ' × ' + p.W + ' × H' + p.H + ' см, кути R' + o.R; },
  warn: function (p) { return 2 * (p.L + p.W) > 296 ? 'Обичайка довша за 3 м — зробимо з двох половин із двома швами на торцях.' : ''; },
  build: function (g, p, o, s) {
    var L = cm(p.L), W = cm(p.W), H = cm(p.H), r = (+o.R + 3) / 1000, b = .0015;
    var geo = new THREE.ExtrudeGeometry(roundedShape(L - 2 * b, W - 2 * b, r - b), { depth: H - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 28 });
    geo.rotateX(-PI / 2); geo.translate(0, b, 0); add(g, geo, metalMat(s));
    if (o.decor) { var bk = box(g, .25, .03, .18, M.book, -L * .22, H + .015, W * .1); bk.rotation.y = .12; lathe(g, [[0, 0], [.07, 0], [.11, .045], [.105, .05]], M.dark, H).position.set(L * .22, H, -W * .12); }
    return { x: L, y: H, z: W };
  }
};

/* призначення виробу — від нього залежать доступні обробки */
var USE = { 'mangal-vbudovanyi': 'heat', 'mangal-chasha': 'heat', 'oblytsyuvannya-kaminu': 'heatin', 'oblytsyuvannya-stin': 'in', 'stelazh-kub': 'in', 'tablychky': 'any' };
function useOf(slug) { return D[slug].use || USE[slug] || 'out'; }
function isIn(u) { return u === 'in' || u === 'heatin'; }
function isHeat(u) { return u === 'heat' || u === 'heatin'; }

var CATNAME = { kashpo: 'Кашпо', light: 'Світло', mangal: 'Мангали', bowl: 'Чаші', lamel: 'Ламелі й паркани', facade: 'Фасад', gate: 'Ворота', sign: 'Вивіски й таблички', clad: 'Облицювання', decor: 'Декор', mebli: 'Меблі' };
var LIST = CAT.filter(function (p) { return D[p.slug]; });
var bySlug = {}; LIST.forEach(function (p) { bySlug[p.slug] = p; });

/* ═════════ ПРАВИЛА ОБРОБОК ═════════
   Для кожного варіанта: доступний чи ні, і чому. */
function avail(slug, group, v) {
  var u = useOf(slug);
  if (group === 'cp') {
    if (u === 'heat' && v !== 'none') return 'Лак, віск і стабілізатор вигорять від жару мангала.';
    if (u === 'heatin' && (v === 'lak' || v === 'wax')) return 'Біля топки лак і віск жовтіють — лише термостійкий стабілізатор.';
    if (isIn(u) && v === 'none') return 'У приміщенні кортен без захисту фарбує руки й підлогу.';
  }
  if (group === 'st') {
    if (isHeat(u) && v !== 'heat') return 'Порошкова фарба не витримує жару — лише жаростійка.';
    if (!isHeat(u) && v === 'heat') return 'hide';
    if (!isIn(u) && u !== 'any' && (v === 'blued' || v === 'rawlak')) return 'Лише для приміщень: надворі піде корозія.';
  }
  if (group === 'pvd' && v !== 'none' && isHeat(u)) return 'PVD-покриття темніє від високої температури.';
  return '';
}
function fixState(st) {
  ['cp', 'st'].forEach(function (g) {
    if (avail(st.slug, g, st[g])) {
      var opts = g === 'cp' ? ['lak', 'stab', 'none', 'wax'] : ['powder', 'heat', 'blued', 'rawlak'];
      for (var i = 0; i < opts.length; i++) if (!avail(st.slug, g, opts[i])) { st[g] = opts[i]; break; }
    }
  });
  if (avail(st.slug, 'pvd', st.pvd)) st.pvd = 'none';
  if (st.st === 'heat' && HEAT_RAL.indexOf(st.ral) < 0) st.ral = '9005';
  if (st.cp !== 'none') st.mo = 0;
}

/* ═════════ ЦІНИ ═════════ */
var FITS = {};
function defaults(slug) { var o = {}; D[slug].params.forEach(function (q) { o[q[0]] = q[5]; }); return o; }
function optDefaults(slug) { var o = {}; D[slug].opts.forEach(function (q) { o[q[0]] = q[3]; }); return o; }
function fitFor(slug) {
  if (FITS[slug] !== undefined) return FITS[slug];
  var p = bySlug[slug], d = D[slug]; if (!p || !p.pr || d.price) return (FITS[slug] = null);
  var pts = [];
  Object.keys(p.pr).forEach(function (k) { var v = p.pr[k][1]; if (!v) return; var pp = d.preset(k); if (!pp) return; var full = defaults(slug); Object.keys(pp).forEach(function (x) { full[x] = pp[x]; }); pts.push([d.area(full, optDefaults(slug)), v]); });
  if (!pts.length) return (FITS[slug] = null);
  var a, b;
  if (pts.length === 1) { b = pts[0][1] * .45 / pts[0][0]; a = pts[0][1] * .55; }
  else { var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(function (q) { sx += q[0]; sy += q[1]; sxx += q[0] * q[0]; sxy += q[0] * q[1]; }); b = (n * sxy - sx * sy) / (n * sxx - sx * sx); a = (sy - b * sx) / n; if (b <= 0 || a < 0) { b = sy / sx * .5; a = sy / n * .5; } }
  return (FITS[slug] = { a: a, b: b, min: Math.min.apply(null, pts.map(function (q) { return q[1]; })) });
}
function fitPrice(slug, params) { var f = fitFor(slug); if (!f) return null; return Math.max(f.min * .8, f.a + f.b * D[slug].area(params, optDefaults(slug))); }
function metalK(slug, metal) { var p = bySlug[slug]; return p && p.mm && p.mm[metal] !== undefined ? p.mm[metal] : MULT[metal]; }
var COST = {
  cs: function (v, A) { return { raw: 0, light: 900 + 300 * A, deep: 1400 + 450 * A }[v]; },
  cp: function (v, A) { return { none: 0, stab: 600 + 350 * A, lak: 700 + 400 * A, wax: 300 + 200 * A }[v]; }
};
function estimate(st, area) {
  var d = D[st.slug], base;
  if (d.price) base = d.price(st.p, fitPrice);
  else if (st.slug === 'skulptura-olen') base = st.p.H === 300 && bySlug[st.slug].pr ? bySlug[st.slug].pr['H-300 з рогами'][1] : null;
  else base = fitPrice(st.slug, st.p);
  if (!base) return null;
  var inc = d.incl || [], def = d.def || {}, prod = bySlug[st.slug];
  /* базова конфігурація з каталогу — точна ціна, як на сторінці товару */
  if (prod && prod.pr) {
    var key = Object.keys(prod.pr).filter(function (k) { var pp = d.preset(k); if (!pp || !prod.pr[k][1]) return false; return Object.keys(pp).every(function (x) { return st.p[x] === undefined || Math.abs(st.p[x] - pp[x]) < .01; }); })[0];
    var optsDef = D[st.slug].opts.every(function (q) { return q[2] === 'bool' || q[2] === 'text' || st.o[q[0]] === q[3]; });
    var finDef = st.metal === 'corten' ? (st.cs === (def.cs || 'raw') && st.cp === (def.cp || 'none')) : st.metal === 'steel' ? (st.st === 'powder' && st.tx === 'mat') || st.st === 'heat' : (st.ss === 'satin' && st.pvd === 'none');
    if (key && optsDef && finDef) { var k2 = metalK(st.slug, st.metal); return { exact: k2 === 1 ? prod.pr[key][1] : Math.round(prod.pr[key][1] * k2 / 10) * 10 }; }
  }
  var v = base * metalK(st.slug, st.metal);
  if (st.metal === 'corten') {
    v += COST.cs(st.cs, area) - (inc.indexOf(def.cs) >= 0 ? COST.cs(def.cs, area) : 0);
    v += COST.cp(st.cp, area) - (inc.indexOf(def.cp) >= 0 ? COST.cp(def.cp, area) : 0);
  } else if (st.metal === 'steel') v *= st.st === 'powder' ? { mat: 1, semi: 1.03, shagren: 1.03, hammer: 1.05 }[st.tx] : st.st === 'blued' ? 1.08 : st.st === 'rawlak' ? 1.02 : 1;
  else { v *= { satin: 1, mirror: 1.18, blast: 1.06 }[st.ss]; if (st.pvd !== 'none') v += 3500 + 2800 * area; }
  return { lo: r100(v * .93), hi: r100(v * 1.08) };
}

/* ═════════ СТАН ═════════ */
function clampParam(slug, k, v) { var q = D[slug].params.filter(function (x) { return x[0] === k; })[0]; if (!q) return v; return Math.min(q[3], Math.max(q[2], Math.round(v / q[4]) * q[4])); }
function sceneFor(slug) { var u = useOf(slug); return isIn(u) ? 'living' : u === 'heat' ? 'terrace' : 'garden'; }
function fresh(slug, sizeKey) {
  var d = D[slug], p = defaults(slug), prod = bySlug[slug], key = sizeKey || (prod && prod.s && prod.s[0]);
  if (key) { var pp = d.preset(key); if (pp) Object.keys(pp).forEach(function (k) { if (p[k] !== undefined) p[k] = clampParam(slug, k, pp[k]); }); }
  var def = d.def || {};
  var st = { slug: slug, p: p, o: optDefaults(slug), metal: 'corten', cs: def.cs || 'raw', cp: def.cp || 'none', mo: 0, st: 'powder', ral: '7016', tx: 'mat', ss: 'satin', pvd: 'none', sc: sceneFor(slug), tod: 'noon', az: 0, el: 0, q: d.qty || 1 };
  st.az = SCENES[st.sc].sun[0]; st.el = SCENES[st.sc].sun[1]; fixState(st); return st;
}
var KEYS = ['m', 'cs', 'cp', 'mo', 'st', 'ral', 'tx', 'ss', 'pvd', 'sc', 'tod', 'az', 'el', 'q'];
function encode(st) {
  var a = ['p=' + st.slug];
  Object.keys(st.p).forEach(function (k) { a.push(k + '=' + st.p[k]); });
  Object.keys(st.o).forEach(function (k) { a.push('o_' + k + '=' + encodeURIComponent(st.o[k])); });
  KEYS.forEach(function (k) { a.push(k + '=' + encodeURIComponent(k === 'm' ? st.metal : st[k])); });
  return a.join('&');
}
function decode(str) {
  var qp = new URLSearchParams(str), slug = qp.get('p'); if (!slug || !D[slug] || !bySlug[slug]) return null;
  var st = fresh(slug, qp.get('s'));
  Object.keys(st.p).forEach(function (k) { if (qp.has(k)) st.p[k] = clampParam(slug, k, parseFloat(qp.get(k))); });
  Object.keys(st.o).forEach(function (k) { if (!qp.has('o_' + k)) return; var v = qp.get('o_' + k), def = D[slug].opts.filter(function (x) { return x[0] === k; })[0]; st.o[k] = def[2] === 'bool' ? v === 'true' : v; });
  if (METALS[qp.get('m')]) st.metal = qp.get('m');
  ['cs', 'cp', 'st', 'ral', 'tx', 'ss', 'pvd', 'tod'].forEach(function (k) { if (qp.get(k)) st[k] = qp.get(k); });
  if (SCENES[qp.get('sc')]) st.sc = qp.get('sc');
  ['mo', 'az', 'el'].forEach(function (k) { if (qp.has(k)) st[k] = +qp.get(k) || 0; });
  if (qp.get('q')) st.q = Math.max(1, Math.min(999, parseInt(qp.get('q'), 10) || 1));
  if (!TOD[st.tod]) st.tod = 'noon';
  fixState(st); return st;
}
var S = decode(location.hash.slice(1)) || decode(location.search.slice(1)) || fresh(LIST[0] ? LIST[0].slug : 'kashpo-krugle');

/* ═════════ ПОБУДОВА ═════════ */
var product = new THREE.Group(); scene.add(product);
var dimsGroup = new THREE.Group(); scene.add(dimsGroup);
var lights = [], lastBuild = null;
function isShared(m) { return m === M.glow || Object.values(M).indexOf(m) >= 0 || Object.values(matCache).indexOf(m) >= 0; }
function disposeGroup(g) {
  g.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !isShared(o.material)) { if (o.material.userData.own) { if (o.material.map) o.material.map.dispose(); if (o.material.alphaMap) o.material.alphaMap.dispose(); } o.material.dispose(); }
  });
  while (g.children.length) g.remove(g.children[0]);
}
function scaleUV(g) {
  g.traverse(function (o) {
    if (!o.isMesh || !o.material || !o.material.userData.metal || o.userData.uvDone || !o.geometry.attributes.uv) return;
    var uv = o.geometry.attributes.uv, k;
    if (o.geometry.type === 'ExtrudeGeometry') k = 2;
    else { o.geometry.computeBoundingBox(); var sz = new THREE.Vector3(); o.geometry.boundingBox.getSize(sz); k = Math.max(.15, Math.max(sz.x, sz.y, sz.z) / .5); }
    for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
    uv.needsUpdate = true; o.userData.uvDone = true;
  });
}
var dimMat = new THREE.LineBasicMaterial({ color: 0xa0522d });
function line(pts) { dimsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); })), dimMat)); }
var anchors = {};
var $ = function (sel) { return root.querySelector(sel); };
var labels = { x: $('#kfLx'), y: $('#kfLy'), z: $('#kfLz') }, photo = $('.kf-photo');
function rebuild(refit) {
  disposeGroup(product); disposeGroup(dimsGroup);
  lights.forEach(function (l) { scene.remove(l); }); lights = [];
  var d = D[S.slug], info = d.build(product, S.p, S.o, S) || { x: 1, y: 1, z: 1 };
  scaleUV(product); lastBuild = info;
  var X = info.x, Y = info.y, Z = info.z, y0 = info.y0 || 0, o = Math.max(.05, Math.max(X, Z) * .08), fz = Z / 2 + o, fx = X / 2 + o, tk = o * .3;
  if (!d.photo) {
    line([[-X / 2, .001, fz], [X / 2, .001, fz]]); line([[-X / 2, .001, fz - tk], [-X / 2, .001, fz + tk]]); line([[X / 2, .001, fz - tk], [X / 2, .001, fz + tk]]);
    if (Z > .1) { line([[fx, .001, -Z / 2], [fx, .001, Z / 2]]); line([[fx - tk, .001, -Z / 2], [fx + tk, .001, -Z / 2]]); line([[fx - tk, .001, Z / 2], [fx + tk, .001, Z / 2]]); }
    line([[fx, y0, fz], [fx, y0 + Y, fz]]); line([[fx - tk, y0 + Y, fz], [fx + tk, y0 + Y, fz]]); line([[fx - tk, y0, fz], [fx + tk, y0, fz]]);
  }
  anchors = { x: new THREE.Vector3(0, .001, fz), z: new THREE.Vector3(fx, .001, 0), y: new THREE.Vector3(fx, y0 + Y / 2, fz) };
  labels.x.textContent = Math.round(X * 100) + ' см'; labels.z.textContent = Math.round(Z * 100) + ' см'; labels.y.textContent = Math.round(Y * 100) + ' см';
  labels.z.dataset.off = Z > .1 ? '' : '1';
  (info.glows || []).forEach(function (q) { var l = new THREE.PointLight(0xffa24a, 0, Math.max(1.5, X * 2), 2); l.position.set(q[0], q[1], q[2]); l.userData.k = q[3]; scene.add(l); lights.push(l); });
  var span = Math.max(X, Z, .25);
  blob.scale.set(Math.max(.3, X * 1.5), Math.max(.3, Math.max(Z, .15) * 1.6), 1);
  groundR.value = Math.max(3, span * 3.5); ground.scale.setScalar(groundR.value); shadowOnly.scale.setScalar(groundR.value);
  var sc = SCENES[S.sc]; if (sc.ground) { var gt = groundTex(sc.ground); gt.repeat.set(groundR.value * sc.rep / 2, groundR.value * sc.rep / 2); }
  human.position.set(X / 2 + .45 + o, .875, 0);
  photo.hidden = !d.photo; if (d.photo) photo.querySelector('img').src = '/uploads/' + d.photo + '.webp';
  applyLight();
  if (refit) frame(info);
}

/* ── камера ── */
var target = new THREE.Vector3(0, .3, 0), cur = { az: .72, pol: 1.13, r: 3 }, goal = { az: .72, pol: 1.13, r: 3 }, baseR = 3;
var VIEWS = { persp: [.72, 1.13, 1], front: [0, 1.5, .95], side: [PI / 2, 1.5, .95], top: [0, .03, 1] };
function frame(info) {
  var X = info.x, Y = info.y + (info.y0 || 0), Z = info.z, extra = S.o.plant ? Math.min(.7, X * .75) : 0, span = Math.max(X, (Y + extra) * 1.15, Z, .25);
  if (human.visible) span = Math.max(span, 1.9, X + 1.2);
  target.set(human.visible ? .3 : 0, Math.max(.08, (Y + extra * .8) * .45), 0);
  baseR = span * 2.35 / Math.tan(camera.fov * PI / 360) * .42 + .3; goal.r = baseR; if (reduced) cur.r = baseR;
}
function place() { var s = Math.sin(cur.pol); camera.position.set(target.x + cur.r * s * Math.sin(cur.az), target.y + cur.r * Math.cos(cur.pol), target.z + cur.r * s * Math.cos(cur.az)); camera.lookAt(target); }
var drag = null, pinch = null, cv = renderer.domElement;
cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', function (e) { if (!drag || pinch) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; goal.az -= dx * .006; goal.pol = Math.min(1.54, Math.max(.03, goal.pol - dy * .005)); cur.az = goal.az; cur.pol = goal.pol; pressView(null); });
cv.addEventListener('pointerup', function () { drag = null; });
cv.addEventListener('wheel', function (e) { e.preventDefault(); goal.r = Math.min(baseR * 2.5, Math.max(baseR * .35, goal.r * (1 + e.deltaY * .0012))); }, { passive: false });
cv.addEventListener('touchstart', function (e) { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
cv.addEventListener('touchmove', function (e) { if (pinch && e.touches.length === 2) { var dd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); goal.r = Math.min(baseR * 2.5, Math.max(baseR * .35, goal.r * pinch / dd)); pinch = dd; } }, { passive: true });
cv.addEventListener('touchend', function (e) { if (e.touches.length < 2) pinch = null; });

/* ── сцена і світло ── */
function applyScene() {
  var sc = SCENES[S.sc];
  scene.environment = envFor(S.sc);
  if (sc.ground) { groundMat.map = groundTex(sc.ground); groundMat.needsUpdate = true; ground.visible = true; shadowOnly.visible = false; }
  else { ground.visible = false; shadowOnly.visible = true; }
  stage.className = stage.className.replace(/\bsc-\w+/g, '').replace(/\btod-\w+/g, '').trim() + ' sc-' + S.sc + ' tod-' + S.tod;
}
function applyLight() {
  var t = TOD[S.tod], az = S.az * PI / 180, el = S.el * PI / 180, info = lastBuild || { x: 1, y: 1, z: 1 }, span = Math.max(info.x, info.y, info.z, .3), R = span * 3 + 2;
  sun.position.set(Math.cos(el) * Math.sin(az) * R, Math.sin(el) * R, Math.cos(el) * Math.cos(az) * R); sun.target.position.set(0, info.y / 2, 0);
  sun.color.set(t.c); sun.intensity = t.i;
  var sc = sun.shadow.camera; sc.left = sc.bottom = -span * 1.7; sc.right = sc.top = span * 1.7; sc.near = .1; sc.far = R * 2.5; sc.updateProjectionMatrix();
  renderer.toneMappingExposure = t.x * (S.sc === 'living' ? .82 : 1);
  var night = S.tod === 'night';
  hemi.intensity = night ? .02 : .18;
  scene.traverse(function (o) { if (o.material && o.material.envMapIntensity !== undefined) o.material.envMapIntensity = t.e * (o.material.metalness > .9 ? 1.2 : 1); });
  M.glow.emissiveIntensity = night ? 2.2 : 0; M.glow.color.set(night ? 0x3a2a18 : 0x2a2520);
  lights.forEach(function (l) { l.intensity = night ? 2.6 * l.userData.k : 0; });
  product.traverse(function (o) { if (o.userData.halo) o.material.opacity = night ? 1 : 0; });
  var glowProduct = (info.glows || []).length > 0;
  ups.forEach(function (l, i) { var a = az + (i ? .55 : -.55), d = Math.max(info.x, info.z) / 2 + .35; l.position.set(Math.sin(a) * d, .03, Math.cos(a) * d); l.target.position.set(0, info.y * .6, 0); l.intensity = night && !glowProduct ? 8 : 0; l.distance = Math.max(2.5, info.y * 4); });
  stage.className = stage.className.replace(/\btod-\w+/g, '').trim() + ' tod-' + S.tod;
}

/* ═════════ ІНТЕРФЕЙС ═════════ */
function pressView(v) { root.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); }); }
function renderPicker() {
  var cats = []; LIST.forEach(function (p) { if (cats.indexOf(p.c) < 0) cats.push(p.c); });
  var curCat = bySlug[S.slug].c;
  $('#kfCats').innerHTML = cats.map(function (c) { return '<button type="button" data-cat="' + c + '" aria-pressed="' + (c === curCat) + '">' + (CATNAME[c] || c) + '</button>'; }).join('');
  $('#kfProds').innerHTML = LIST.filter(function (p) { return p.c === curCat; }).map(function (p) { return '<button type="button" data-slug="' + p.slug + '" aria-pressed="' + (p.slug === S.slug) + '">' + esc(p.t) + (D[p.slug].photo ? ' <small>фото</small>' : '') + '</button>'; }).join('');
  var prod = bySlug[S.slug];
  $('#kfPresets').innerHTML = (prod.s || []).filter(function (k) { return D[S.slug].preset(k); }).map(function (k) { return '<button type="button" data-preset="' + esc(k) + '">' + esc(k) + '</button>'; }).join('');
  $('#kfPresetsWrap').hidden = !$('#kfPresets').innerHTML;
}
function renderParams() {
  var d = D[S.slug];
  $('#kfParams').innerHTML = d.params.map(function (q) {
    if (S.slug === 'tablychky' && q[0] === 'H' && S.o.shape !== 'rect') return '';
    var id = 'kfp_' + q[0], u = q[0] === 'n' ? 'шт' : 'см';
    return '<div class="kf-row"><label for="' + id + '">' + q[1] + '</label><input type="range" id="' + id + '" data-p="' + q[0] + '" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '" value="' + S.p[q[0]] + '"><span class="kf-num"><input type="number" data-pn="' + q[0] + '" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '" value="' + S.p[q[0]] + '" aria-label="' + q[1] + ', ' + u + '"><em>' + u + '</em></span></div>';
  }).join('');
  $('#kfOpts').innerHTML = d.opts.map(function (q) {
    var k = q[0];
    if (q[2] === 'bool') return '<label class="kf-chk"><input type="checkbox" data-o="' + k + '"' + (S.o[k] ? ' checked' : '') + '> ' + q[1] + '</label>';
    if (q[2] === 'text') return '<div class="kf-row kf-row-text"><label for="kfo_' + k + '">' + q[1] + '</label><input type="text" id="kfo_' + k + '" data-o="' + k + '" maxlength="24" value="' + esc(S.o[k]) + '"></div>';
    return '<div class="kf-row kf-row-text"><label for="kfo_' + k + '">' + q[1] + '</label><select id="kfo_' + k + '" data-o="' + k + '">' + q[4].map(function (v) { return '<option value="' + v[0] + '"' + (S.o[k] === v[0] ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select></div>';
  }).join('');
  $('#kfOptsStep').hidden = !d.opts.length;
}
function seg(group, list) {
  var vis = list.filter(function (x) { return avail(S.slug, group, x[0]) !== 'hide'; });
  return '<div class="kf-seg kf-fin" data-g="' + group + '">' + vis.map(function (x) { var why = avail(S.slug, group, x[0]); return '<button type="button" data-v="' + x[0] + '" aria-pressed="' + (S[group] === x[0]) + '"' + (why ? ' disabled title="' + esc(why) + '"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>';
}
function chips(group, list) {
  return '<div class="kf-ral" data-g="' + group + '">' + list.map(function (x) { var why = avail(S.slug, group, x[0]); return '<button type="button" data-v="' + x[0] + '" aria-pressed="' + (S[group] === x[0]) + '"' + (why ? ' disabled title="' + esc(why) + '"' : '') + ' style="--c:' + (x[2] || 'transparent') + '">' + (x[2] ? '<span></span>' : '') + x[1] + '</button>'; }).join('') + '</div>';
}
function renderFinish() {
  root.querySelectorAll('[data-metal]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.metal === S.metal)); });
  var h = '';
  if (S.metal === 'corten') {
    h += '<p class="kf-sub">Стан при доставці</p>' + seg('cs', [['raw', 'Сирий'], ['light', 'Легка патина'], ['deep', 'Глибока патина']]);
    h += '<p class="kf-sub">Захист</p>' + seg('cp', [['none', 'Без захисту'], ['stab', 'Стабілізатор'], ['lak', 'Матовий лак'], ['wax', 'Віск']]);
    if (S.cp === 'none') h += '<div class="kf-row" style="margin-top:12px"><label for="kfMo">Як виглядатиме через <b id="kfMoV">' + (S.mo ? S.mo + ' міс' : 'одразу') + '</b></label><input type="range" id="kfMo" min="0" max="12" step="1" value="' + S.mo + '" style="grid-column:1/-1"></div>';
  } else if (S.metal === 'steel') {
    h += '<p class="kf-sub">Покриття</p>' + seg('st', [['powder', 'Порошкова фарба'], ['heat', 'Жаростійка фарба'], ['blued', 'Воронування'], ['rawlak', 'Сира під лаком']]);
    if (S.st === 'powder' || S.st === 'heat') {
      h += '<p class="kf-sub">Колір RAL</p>' + chips('ral', RAL.filter(function (r) { return S.st !== 'heat' || HEAT_RAL.indexOf(r[0]) >= 0; }));
      if (S.st === 'powder') h += '<p class="kf-sub">Фактура</p>' + seg('tx', [['mat', 'Мат'], ['semi', 'Напівглянець'], ['shagren', 'Шагрень'], ['hammer', 'Молоткова']]);
    }
  } else {
    h += '<p class="kf-sub">Поверхня</p>' + seg('ss', [['satin', 'Сатин'], ['mirror', 'Дзеркало'], ['blast', 'Дробоструйна']]);
    h += '<p class="kf-sub">PVD-покриття</p>' + chips('pvd', PVD);
  }
  $('#kfFinish').innerHTML = h;
}
function renderScene() {
  $('#kfScenes').innerHTML = Object.keys(SCENES).map(function (k) { return '<button type="button" data-sc="' + k + '" aria-pressed="' + (k === S.sc) + '" class="kf-sc kf-sc-' + k + '"><span></span>' + SCENES[k].n + '</button>'; }).join('');
  $('#kfTod').innerHTML = Object.keys(TOD).map(function (k) { return '<button type="button" data-tod="' + k + '" aria-pressed="' + (k === S.tod) + '">' + TOD[k].n + '</button>'; }).join('');
  $('#kfAz').value = S.az; $('#kfEl').value = S.el; $('#kfAzV').textContent = S.az + '°'; $('#kfElV').textContent = S.el + '°';
}
function metalText() {
  var t = D[S.slug].t;
  if (S.metal === 'corten') return 'Кортен ' + t + ' мм';
  if (S.metal === 'steel') return 'Чорна сталь ' + t + ' мм';
  return 'Нержавійка AISI 304, ' + t + ' мм';
}
function finishText() {
  if (S.metal === 'corten') return { raw: 'без патини, з окалиною', light: 'легка патина', deep: 'глибока патина' }[S.cs] + { none: '', stab: ', стабілізатор', lak: ', матовий лак', wax: ', віск' }[S.cp];
  if (S.metal === 'steel') { var r = RAL.filter(function (x) { return x[0] === S.ral; })[0] || RAL[0];
    if (S.st === 'powder') return 'порошкова фарба RAL ' + r[0] + ' ' + r[1].toLowerCase() + ', ' + { mat: 'мат', semi: 'напівглянець', shagren: 'шагрень', hammer: 'молоткова' }[S.tx];
    if (S.st === 'heat') return 'жаростійка фарба, ' + r[1].toLowerCase(); return S.st === 'blued' ? 'воронування' : 'сира сталь під лаком'; }
  var p = PVD.filter(function (x) { return x[0] === S.pvd; })[0];
  return { satin: 'сатин №4', mirror: 'дзеркало №8', blast: 'дробоструйна' }[S.ss] + (S.pvd !== 'none' ? ', PVD ' + p[1].toLowerCase() : '');
}
function optText() {
  return D[S.slug].opts.filter(function (q) { return ['plant', 'decor', 'water'].indexOf(q[0]) < 0; }).map(function (q) {
    var v = S.o[q[0]]; if (q[2] === 'bool') return v ? q[1].toLowerCase() : ''; if (q[2] === 'text') return q[1].toLowerCase() + ': «' + v + '»';
    var lab = q[4].filter(function (x) { return x[0] === v; })[0]; return q[1].toLowerCase() + ': ' + (lab ? lab[1] : v);
  }).filter(Boolean).join(', ');
}
function notes() {
  var N = [], u = useOf(S.slug), d = D[S.slug];
  if (S.metal === 'corten') {
    if (S.cs === 'raw' && S.cp === 'none') N.push('Приїде сірим з окалиною, рудим стане сам за 3–6 місяців надворі. Посуньте повзунок часу, щоб побачити.');
    if (S.cp === 'lak') N.push((d.incl || []).indexOf('lak') >= 0 ? 'Матовий лак уже в ціні: патина не вимазується й не фарбує підлогу.' : 'Матовий лак фіксує патину — не фарбує руки й одяг, колір стає глибшим.');
    if (S.cp === 'stab') N.push('Стабілізатор зупиняє зміну кольору й прибирає «мажучий» ефект, зберігаючи матовий вигляд.');
    if (S.cp === 'wax') N.push('Віск дає м\'який блиск і глибокий колір. Освіжати раз на рік.');
    if (u === 'heat') N.push('Для мангала кортен лишаємо без покриттів: від жару він просто темнішає, і це частина характеру.');
  }
  if (S.metal === 'steel') {
    if (S.st === 'powder' && S.tx === 'hammer') N.push('Молоткова фактура ховає дрібні подряпини — найпрактичніша для вулиці.');
    if (S.st === 'powder' && S.tx === 'semi') N.push('Напівглянець підкреслює форму, але помітніші відбитки й пил.');
    if (S.st === 'heat') N.push('Жаростійка фарба витримує до 600 °C. Кольори — лише чорний і графіт.');
    if (S.st === 'blued') N.push('Воронування — синювато-чорна плівка з металевим відблиском. Для інтер\'єру.');
    if (S.st === 'rawlak') N.push('Сира сталь під лаком зберігає природні розводи окалини. Для інтер\'єру.');
  }
  if (S.metal === 'stainless') {
    if (S.ss === 'mirror' && !isIn(u)) N.push('Надворі на дзеркалі видно краплі й пил — сатин виглядає так само дорого, але практичніший.');
    if (S.ss === 'mirror' && isIn(u)) N.push('На дзеркалі видно відбитки пальців — сатин простіший у догляді.');
    if (S.pvd !== 'none') N.push('PVD — вакуумне напилення: колір не вигорає й не облазить.');
  }
  var dis = []; root.querySelectorAll('#kfFinish button[disabled]').forEach(function (b) { if (dis.indexOf(b.title) < 0) dis.push(b.title); });
  return { info: N, why: dis };
}
function state() { var d = D[S.slug], meta = lastBuild && lastBuild.meta, area = d.area(S.p, S.o, meta); return { d: d, area: area, kg: area * d.t * METALS[S.metal].rho, price: estimate(S, area), dims: d.dimsText(S.p, S.o, meta) }; }
function renderSummary() {
  var st = state(), d = st.d;
  $('#kfTitle').textContent = bySlug[S.slug].t;
  $('#kfDims').textContent = st.dims; $('#kfMetalTxt').textContent = metalText(); $('#kfFinTxt').textContent = finishText(); $('#kfOptTxt').textContent = optText() || '—';
  $('#kfArea').textContent = (st.area < .1 ? st.area.toFixed(3) : st.area.toFixed(2)).replace('.', ',') + ' м² металу, ≈ ' + (st.kg < 1 ? st.kg.toFixed(2).replace('.', ',') : st.kg < 10 ? st.kg.toFixed(1).replace('.', ',') : Math.round(st.kg)) + ' кг';
  var w = d.warn ? d.warn(S.p, S.o) : ''; $('#kfWarn').textContent = w; $('#kfWarn').hidden = !w;
  var n = notes(); $('#kfNotes').innerHTML = n.info.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + n.why.map(function (t) { return '<li class="kf-why">' + esc(t) + '</li>'; }).join('');
  $('#kfQty').value = S.q;
  if (st.price && st.price.exact) $('#kfPrice').innerHTML = '<b>' + fmt(st.price.exact) + '</b><span>ціна за каталогом' + (S.q > 1 ? ', разом ' + fmt(st.price.exact * S.q) : '') + '</span>'; else
  $('#kfPrice').innerHTML = st.price ? '<b>' + fmt(st.price.lo).replace(' грн', '') + ' – ' + fmt(st.price.hi) + '</b><span>орієнтовно за 1 шт' + (S.q > 1 ? ', разом ' + fmt(st.price.lo * S.q).replace(' грн', '') + ' – ' + fmt(st.price.hi * S.q) : '') + '</span>' : '<b>Ціна після прорахунку</b><span>Порахуємо протягом 15 хвилин у робочий час</span>';
  history.replaceState(null, '', '#' + encode(S));
  return { st: st, link: SITE + '/konfigurator/#' + encode(S) };
}
var pending = 0;
function update(refit, params) {
  fixState(S);
  if (params) renderParams();
  renderFinish(); renderScene();
  clearTimeout(pending); pending = setTimeout(function () { rebuild(refit); renderSummary(); }, refit ? 0 : 40);
}
function pickProduct(slug, sizeKey) {
  var keep = { metal: S.metal, ral: S.ral, tx: S.tx, ss: S.ss, pvd: S.pvd, tod: S.tod };
  S = fresh(slug, sizeKey); Object.keys(keep).forEach(function (k) { S[k] = keep[k]; }); fixState(S);
  applyScene(); renderPicker(); update(true, true);
  window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'configurator_product', product: slug });
}

/* ── події ── */
root.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b || !root.contains(b) || b.disabled) return;
  var grp = b.parentElement && b.parentElement.dataset.g;
  if (grp) { S[grp] = b.dataset.v; if (grp === 'cp' && S.cp !== 'none') S.mo = 0; update(false); return; }
  if (b.dataset.cat) { var first = LIST.filter(function (p) { return p.c === b.dataset.cat; })[0]; if (first) pickProduct(first.slug); }
  else if (b.dataset.slug) pickProduct(b.dataset.slug);
  else if (b.dataset.preset) { var pp = D[S.slug].preset(b.dataset.preset); Object.keys(pp).forEach(function (k) { if (S.p[k] !== undefined) S.p[k] = clampParam(S.slug, k, pp[k]); }); update(true, true); }
  else if (b.dataset.metal) { S.metal = b.dataset.metal; update(false); }
  else if (b.dataset.sc) { S.sc = b.dataset.sc; if (S.tod !== 'night') { S.az = SCENES[S.sc].sun[0]; S.el = S.tod === 'noon' ? SCENES[S.sc].sun[1] : TOD[S.tod].el; } applyScene(); renderScene(); rebuild(false); renderSummary(); }
  else if (b.dataset.tod) { S.tod = b.dataset.tod; if (S.tod !== 'night') S.el = S.tod === 'noon' ? SCENES[S.sc].sun[1] : TOD[S.tod].el; renderScene(); applyLight(); renderSummary(); }
  else if (b.dataset.view) { var v = VIEWS[b.dataset.view], az = v[0]; while (az - goal.az > PI) az -= 2 * PI; while (goal.az - az > PI) az += 2 * PI; goal.az = az; goal.pol = v[1]; goal.r = baseR * v[2]; if (reduced) { cur.az = goal.az; cur.pol = goal.pol; cur.r = goal.r; } pressView(b.dataset.view); }
  else if (b.dataset.hud === 'human') { human.visible = !human.visible; b.setAttribute('aria-pressed', String(human.visible)); frame(lastBuild); }
  else if (b.dataset.hud === 'dims') { dimsGroup.visible = !dimsGroup.visible; b.setAttribute('aria-pressed', String(dimsGroup.visible)); }
  else if (b.dataset.q) { S.q = Math.max(1, Math.min(999, S.q + (+b.dataset.q))); renderSummary(); }
  else if (b.id === 'kfSendOpen') { $('#kfForm').hidden = false; $('#kfName').focus(); }
  else if (b.id === 'kfCart') addToCart();
  else if (b.id === 'kfCopy') copyLink();
});
root.addEventListener('input', function (e) {
  var el = e.target;
  if (el.dataset.p) { S.p[el.dataset.p] = parseFloat(el.value); var n = root.querySelector('[data-pn="' + el.dataset.p + '"]'); if (n) n.value = el.value; update(false); }
  else if (el.dataset.pn) { var v = parseFloat(el.value); if (isNaN(v)) return; var c = clampParam(S.slug, el.dataset.pn, v); S.p[el.dataset.pn] = c; var r = root.querySelector('[data-p="' + el.dataset.pn + '"]'); if (r) r.value = c; update(false); }
  else if (el.id === 'kfMo') { S.mo = +el.value; $('#kfMoV').textContent = S.mo ? S.mo + ' міс' : 'одразу'; clearTimeout(pending); pending = setTimeout(function () { rebuild(false); renderSummary(); }, 30); }
  else if (el.id === 'kfAz') { S.az = +el.value; $('#kfAzV').textContent = S.az + '°'; applyLight(); }
  else if (el.id === 'kfEl') { S.el = +el.value; $('#kfElV').textContent = S.el + '°'; applyLight(); }
  else if (el.dataset.o && el.type === 'text') { S.o[el.dataset.o] = el.value; update(false); }
  else if (el.id === 'kfQty') { S.q = Math.max(1, Math.min(999, parseInt(el.value, 10) || 1)); renderSummary(); }
});
root.addEventListener('change', function (e) {
  var el = e.target;
  if (el.dataset.pn) { el.value = S.p[el.dataset.pn]; update(true); }
  else if (el.dataset.p) update(true);
  else if (el.id === 'kfAz' || el.id === 'kfEl') renderSummary();
  else if (el.dataset.o) { S.o[el.dataset.o] = el.type === 'checkbox' ? el.checked : el.value; update(['shape', 'mount', 'plant', 'decor'].indexOf(el.dataset.o) >= 0, el.dataset.o === 'shape'); }
});

/* ── кошик і посилання ── */
function toast(m) { var t = $('#kfToast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 3600); }
function addToCart() {
  var st = state(), cart = [];
  try { cart = JSON.parse(localStorage.getItem('ferox_cart') || '[]') || []; } catch (e) { cart = []; }
  cart.push({ t: bySlug[S.slug].t + ' — свій розмір', s: st.dims + '; ' + finishText() + (optText() ? '; ' + optText() : ''), m: metalText(), q: S.q, price: null, old: null, cfg: SITE + '/konfigurator/#' + encode(S) });
  try { localStorage.setItem('ferox_cart', JSON.stringify(cart)); } catch (e) {}
  toast('Додано до замовлення. Оформити можна в каталозі — кнопка кошика внизу справа.');
  window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'configurator_cart', product: S.slug });
}
function copyLink() { var link = SITE + '/konfigurator/#' + encode(S); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { toast('Посилання на цей виріб скопійовано.'); }, function () { prompt('Скопіюйте посилання:', link); }); }

/* ── заявка ── */
function normPhone(raw) { var d = String(raw || '').replace(/\D/g, ''); if (d.length === 12 && d.indexOf('380') === 0) return '+' + d; if (d.length === 10 && d[0] === '0') return '+38' + d; if (d.length === 9) return '+380' + d; return null; }
$('#kfForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var name = $('#kfName').value.trim(), phone = normPhone($('#kfPhone').value), note = $('#kfNote').value.trim(), status = $('#kfStatus'), btn = $('#kfSend');
  if (name.length < 2) { status.textContent = 'Вкажіть ім\'я.'; status.className = 'kf-status err'; $('#kfName').focus(); return; }
  if (!phone) { status.textContent = 'Перевірте номер: потрібен український формат +380 XX XXX XX XX.'; status.className = 'kf-status err'; $('#kfPhone').focus(); return; }
  var sum = renderSummary(), st = sum.st;
  var msg = ['Заявка з конфігуратора', 'Виріб: ' + bySlug[S.slug].t, 'Розміри: ' + st.dims, 'Метал: ' + metalText(), 'Обробка: ' + finishText(),
    optText() ? 'Опції: ' + optText() : '', 'Кількість: ' + S.q + ' шт',
    st.price ? (st.price.exact ? 'Ціна за каталогом: ' + fmt(st.price.exact) + ' за шт' : 'На сайті показано: ' + fmt(st.price.lo).replace(' грн', '') + ' – ' + fmt(st.price.hi) + ' за шт') : 'Ціна: за прорахунком',
    'Метал на 1 шт: ' + st.area.toFixed(2).replace('.', ',') + ' м², ≈' + Math.round(st.kg) + ' кг; листів 1500×3000 на все: ≈' + Math.max(1, Math.ceil(st.area * S.q / 3.4)),
    note ? 'Коментар: ' + note : '', 'Модель: ' + sum.link].filter(Boolean).join('\n');
  var data = { name: name, phone: phone, phoneDisplay: '+380 ' + phone.slice(4, 6) + ' ' + phone.slice(6, 9) + ' ' + phone.slice(9), message: msg, service: 'configurator', website: $('#kfWeb').value, page: '/konfigurator/', referrer: document.referrer || '', serviceFromUrl: S.slug, ts: new Date().toISOString(), config: encode(S) };
  btn.disabled = true; status.textContent = 'Надсилаємо…'; status.className = 'kf-status';
  try {
    var res = await fetch(WORKER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'lead_submit', service: 'configurator', product: S.slug, page_path: '/konfigurator/' });
    status.textContent = 'Заявку отримано. Передзвонимо протягом 15 хвилин у робочий час.'; status.className = 'kf-status ok';
    setTimeout(function () { location.href = '/thank-you/'; }, 900);
  } catch (err) {
    status.innerHTML = 'Не вдалося надіслати. Напишіть нам у <a href="https://t.me/feroxlviv" target="_blank" rel="noopener">Telegram</a> і вставте це посилання на модель:<br><span class="kf-link">' + esc(sum.link) + '</span>'; status.className = 'kf-status err';
  } finally { btn.disabled = false; }
});

/* ═════════ ЦИКЛ ═════════ */
function resize() { var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px'; camera.aspect = w / h; camera.fov = w < 700 ? 40 : 32; camera.updateProjectionMatrix(); if (lastBuild) frame(lastBuild); }
new ResizeObserver(resize).observe(stage);
var v3 = new THREE.Vector3();
function loop() {
  var k = reduced ? 1 : .1;
  cur.az += (goal.az - cur.az) * k; cur.pol += (goal.pol - cur.pol) * k; cur.r += (goal.r - cur.r) * k;
  place(); renderer.render(scene, camera);
  var w = stage.clientWidth, h = stage.clientHeight, photoMode = D[S.slug].photo;
  ['x', 'y', 'z'].forEach(function (a) {
    var el = labels[a]; if (!anchors[a]) return; v3.copy(anchors[a]).project(camera);
    var hide = photoMode || !dimsGroup.visible || v3.z > 1 || el.dataset.off === '1' || (a === 'y' && cur.pol < .3) || (a === 'z' && Math.abs(Math.sin(cur.az)) < .1 && cur.pol > 1.2) || (a === 'x' && Math.abs(Math.cos(cur.az)) < .1 && cur.pol > 1.2);
    el.classList.toggle('hide', hide); el.style.transform = 'translate(' + ((v3.x + 1) / 2 * w) + 'px,' + ((1 - v3.y) / 2 * h) + 'px) translate(-50%,-50%)';
  });
  requestAnimationFrame(loop);
}
renderPicker(); renderParams(); renderFinish(); renderScene(); applyScene(); resize(); rebuild(true); renderSummary();
if (!reduced) { cur.r = baseR * 1.3; cur.az = .25; }
loop();
window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'configurator_open', product: S.slug });
})();
