/* =========================================================
   fx.js — 视觉特效：粒子背景 / 打字机 / 彩带雨
   零依赖、尊重 prefers-reduced-motion、随主题变色
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("fx");
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- 主题色读取 ---------------- */
  var accentRGB = [129, 140, 248]; // 默认 indigo
  function readColors() {
    try {
      var cs = getComputedStyle(document.body);
      var m = (cs.getPropertyValue("--accent") || "").trim().match(/\d+/g);
      if (m && m.length >= 3) accentRGB = [+m[0], +m[1], +m[2]];
    } catch (e) {}
  }
  readColors();
  window.addEventListener("eqxtheme", readColors);

  /* ---------------- 粒子背景 ---------------- */
  var ctx = null;
  var W = 0, H = 0, DPR = 1;
  var particles = [];
  var confetti = [];
  var mouse = { x: -9999, y: -9999 };
  var running = false;
  var lastT = 0;

  function sizeCanvas() {
    if (!canvas) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx = canvas.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seedParticles() {
    var count = W < 640 ? 42 : W < 1200 ? 78 : 110;
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.04 - Math.random() * 0.18,
        tw: Math.random() * Math.PI * 2,
        tws: 0.008 + Math.random() * 0.02,
      });
    }
  }

  function drawParticles(t) {
    var c = accentRGB;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // 缓慢上浮 + 鼠标轻微排斥
      p.x += p.vx;
      p.y += p.vy;
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < 16900 && d2 > 0.01) {
        var d = Math.sqrt(d2);
        var f = (130 - d) / 130;
        p.x += (dx / d) * f * 1.4;
        p.y += (dy / d) * f * 1.4;
      }
      if (p.x < -8) p.x = W + 8; else if (p.x > W + 8) p.x = -8;
      if (p.y < -8) p.y = H + 8;
      p.tw += p.tws;
      var alpha = 0.10 + Math.abs(Math.sin(p.tw)) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha.toFixed(3) + ")";
      ctx.fill();
    }
    void t;
  }

  /* ---------------- 彩带 ---------------- */
  var PALETTE = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#22d3ee"];
  var RAIN = null; // {until, timer}

  function spawnPiece(fromTop) {
    var w = 7 + Math.random() * 7;
    var h = 10 + Math.random() * 8;
    var left = Math.random() < 0.5;
    confetti.push({
      x: fromTop ? Math.random() * W : mouse.x + (Math.random() - 0.5) * 60,
      y: fromTop ? -20 - Math.random() * 40 : mouse.y + (Math.random() - 0.5) * 40,
      w: w,
      h: h,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      vy: fromTop ? 2.2 + Math.random() * 2.4 : -(3 + Math.random() * 4),
      vx: (Math.random() - 0.5) * 1.4,
      swayAmp: 0.6 + Math.random() * 1.6,
      swayF: 0.02 + Math.random() * 0.03,
      swayT: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.24,
      left: left,
      life: 0,
    });
  }

  function drawConfetti() {
    for (var i = confetti.length - 1; i >= 0; i--) {
      var c = confetti[i];
      c.life++;
      c.swayT += c.swayF;
      c.x += c.vx + Math.cos(c.swayT) * c.swayAmp * 0.4;
      c.y += c.vy;
      c.vy = Math.min(c.vy + 0.12, 6.5);
      c.rot += c.vr;
      if (c.y > H + 30 || (c.life > 260 && c.y > H * 0.6)) {
        confetti.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = Math.min(1, 1.15 - c.life / 700);
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
  }

  /* ---------------- 点击彩花 ---------------- */
  var sparks = [];
  function spawnSparks(x, y) {
    for (var i = 0; i < 16; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 0.6 + Math.random() * 2.8;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.6,
        size: 1 + Math.random() * 2.4,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        life: 0,
        max: 26 + Math.random() * 22,
      });
    }
  }
  function drawSparks() {
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.life++;
      s.vy += 0.1;
      s.x += s.vx;
      s.y += s.vy;
      if (s.life > s.max) { sparks.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (1 - s.life / s.max / 2), 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 1 - s.life / s.max;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- 自动流星 ---------------- */
  var stars = [];
  var nextStar = 0;
  function spawnStar(t) {
    stars.push({
      x: Math.random() * (W + 160) - 80,
      y: -12,
      vx: 3.5 + Math.random() * 4,
      vy: 2.2 + Math.random() * 2.6,
      life: 0,
      max: 46 + Math.random() * 30,
    });
    nextStar = t + 7000 + Math.random() * 9000;
  }
  function drawStars() {
    for (var i = stars.length - 1; i >= 0; i--) {
      var s = stars[i];
      s.life++;
      s.x += s.vx;
      s.y += s.vy;
      if (s.life > s.max || s.y > H + 30) { stars.splice(i, 1); continue; }
      var fade = Math.sin((s.life / s.max) * Math.PI);
      var tx = s.x - s.vx * 11;
      var ty = s.y - s.vy * 11;
      var g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, "rgba(" + accentRGB[0] + "," + accentRGB[1] + "," + accentRGB[2] + "," + (0.85 * fade).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + accentRGB[0] + "," + accentRGB[1] + "," + accentRGB[2] + ",0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }

  function loop(t) {
    if (!running) return;
    if (!ctx) return;
    if (t > nextStar && stars.length < 2) spawnStar(t);
    ctx.clearRect(0, 0, W, H);
    drawParticles(t);
    drawSparks();
    drawStars();
    drawConfetti();
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || REDUCE || !canvas) return;
    sizeCanvas();
    seedParticles();
    running = true;
    nextStar = 1500 + Math.random() * 2500; // 入场后不久来第一颗流星
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", function () {
    if (!running) return;
    sizeCanvas();
    seedParticles();
  });
  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  // 点击彩花：在空白/卡片区域点击时绽放；控件与弹窗内不触发
  window.addEventListener("pointerdown", function (e) {
    if (REDUCE || !ctx || e.button !== 0) return;
    if (e.target.closest("input, textarea, select, button, a, .overlay, .fun-dock, .to-top, .verify")) return;
    spawnSparks(e.clientX, e.clientY);
  }, { passive: true });
  document.addEventListener("mouseleave", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { lastT = 0; } // 隐藏时暂停由 rAF 自然处理
  });
  start();

  /* ---------------- 对外 API ---------------- */
  window.FX = {
    // 彩带雨：从顶部下 n 秒
    rain: function (seconds) {
      if (REDUCE || !ctx) return;
      var until = Date.now() + (seconds || 2.4) * 1000;
      var step = function () {
        for (var i = 0; i < 3; i++) spawnPiece(true);
        if (Date.now() < until) requestAnimationFrame(step);
      };
      step();
    },
    // 定点小爆花
    burst: function (x, y, count) {
      if (REDUCE || !ctx) return;
      mouse.x = x || W / 2;
      mouse.y = y || H * 0.55;
      var n = count || 60;
      for (var i = 0; i < n; i++) spawnPiece(false);
    },
  };
})();
