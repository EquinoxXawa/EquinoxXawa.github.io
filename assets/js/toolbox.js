/* =========================================================
   toolbox.js — 百宝箱（登录用户可用）：QR / 涂鸦 / 转盘 / 密码 / 文本 / 配色
   全部本地运算，无网络请求
   ========================================================= */
(function () {
  "use strict";

  var overlay = document.getElementById("tbOverlay");
  var body = document.getElementById("tbBody");
  var nav = document.getElementById("tbNav");
  var userEl = document.getElementById("tbUser");
  var current = "qr";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function toast(msg, type) {
    if (window.__toast) window.__toast(msg, type);
  }
  function copyText(txt, okMsg) {
    var done = function (ok) { toast(ok ? (okMsg || "已复制") : "复制失败，请手动复制", ok ? "ok" : "err"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); });
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = txt;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        done(document.execCommand("copy"));
        document.body.removeChild(ta);
      } catch (e) { done(false); }
    }
  }
  function toBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function fromBase64(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  /* ================= QR 二维码 ================= */
  function qrHTML() {
    return '<div class="tool">' +
      '<textarea id="qrText" rows="3" placeholder="输入文字 / 网址，例如 https://www.baidu.com"></textarea>' +
      '<div class="tool-row">' +
        '<button class="btn btn-primary" id="qrGo" type="button">生成二维码</button>' +
        '<button class="btn" id="qrDl" type="button" hidden>下载 PNG</button>' +
      "</div>" +
      '<div class="qr-box" id="qrBox"></div>' +
      "</div>";
  }
  function bindQR() {
    var go = document.getElementById("qrGo");
    var dl = document.getElementById("qrDl");
    var box = document.getElementById("qrBox");
    var txt = document.getElementById("qrText");
    go.addEventListener("click", function () {
      var v = (txt.value || "").trim();
      if (!v) { toast("先输入点内容吧", "err"); return; }
      try {
        var q = qrcode(0, "M");
        q.addData(v);
        q.make();
        box.innerHTML = q.createSvgTag({ cellSize: 5, margin: 2 });
        dl.hidden = false;
      } catch (e) {
        box.innerHTML = "";
        dl.hidden = true;
        toast("生成失败：" + e.message, "err");
      }
    });
    dl.addEventListener("click", function () {
      var svg = box.querySelector("svg");
      if (!svg) return;
      try {
        var xml = new XMLSerializer().serializeToString(svg);
        var url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
        var img = new Image();
        img.onload = function () {
          var c = document.createElement("canvas");
          c.width = 640; c.height = 640;
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, 640, 640);
          ctx.drawImage(img, 0, 0, 640, 640);
          URL.revokeObjectURL(url);
          var a = document.createElement("a");
          a.download = "qrcode.png";
          a.href = c.toDataURL("image/png");
          a.click();
        };
        img.src = url;
      } catch (e) { toast("下载失败", "err"); }
    });
  }

  /* ================= 涂鸦板 ================= */
  function drawHTML() {
    return '<div class="tool">' +
      '<div class="tool-row">' +
        '<button class="tb-chip" data-color="#111827" type="button">黑</button>' +
        '<button class="tb-chip" data-color="#ef4444" type="button">红</button>' +
        '<button class="tb-chip" data-color="#3b82f6" type="button">蓝</button>' +
        '<button class="tb-chip" data-color="#22c55e" type="button">绿</button>' +
        '<button class="tb-chip" data-color="#f59e0b" type="button">橙</button>' +
        '<button class="btn btn-ghost" id="drawClear" type="button">清空</button>' +
        '<button class="btn" id="drawSave" type="button">保存 PNG</button>' +
      "</div>" +
      '<canvas class="doodle" id="drawCv" width="560" height="330"></canvas>' +
      "</div>";
  }
  function bindDraw() {
    var cv = document.getElementById("drawCv");
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    var drawing = false;
    var last = null;
    function pos(e) {
      var r = cv.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (cv.width / r.width),
        y: (e.clientY - r.top) * (cv.height / r.height),
      };
    }
    cv.addEventListener("pointerdown", function (e) {
      drawing = true;
      cv.setPointerCapture(e.pointerId);
      last = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x + 0.1, last.y + 0.1);
      ctx.stroke();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    });
    cv.addEventListener("pointerup", function () { drawing = false; });
    var row = document.querySelector("#tbBody .tool-row");
    row.addEventListener("click", function (e) {
      var c = e.target.closest("[data-color]");
      if (c) { ctx.strokeStyle = c.getAttribute("data-color"); return; }
      if (e.target.closest("#drawClear")) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cv.width, cv.height);
      }
      if (e.target.closest("#drawSave")) {
        var a = document.createElement("a");
        a.download = "doodle.png";
        a.href = cv.toDataURL("image/png");
        a.click();
        toast("已保存涂鸦", "ok");
      }
    });
  }

  /* ================= 转盘 ================= */
  function wheelHTML() {
    return '<div class="tool">' +
      '<textarea id="wheelOpts" rows="4" placeholder="每行一项，例如：&#10;晚饭吃什么&#10;奶茶&#10;火锅&#10;烧烤"></textarea>' +
      '<div class="tool-row"><button class="btn btn-primary" id="wheelSpin" type="button">开转</button>' +
      '<button class="btn" id="wheelDemo" type="button">填示例</button></div>' +
      '<p class="fun-result" id="wheelRes" style="text-align:center"></p>' +
      '<canvas id="wheelCanvas" width="300" height="300"></canvas>' +
      "</div>";
  }
  function wheelColors() {
    return ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
      "#14b8a6", "#f97316", "#6366f1", "#22d3ee", "#84cc16", "#a855f7"];
  }
  function drawWheel(cv, items) {
    var ctx = cv.getContext("2d");
    var n = items.length;
    var a0 = -Math.PI / 2;
    ctx.clearRect(0, 0, cv.width, cv.height);
    var colors = wheelColors();
    for (var i = 0; i < n; i++) {
      var a1 = a0 + (i + 1) * (Math.PI * 2 / n);
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, 146, a0 + i * (Math.PI * 2 / n), a1);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(a0 + (i + 0.5) * (Math.PI * 2 / n));
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      var label = items[i].length > 6 ? items[i].slice(0, 6) + "…" : items[i];
      ctx.fillText(label, 138, 4);
      ctx.restore();
    }
    // pointer
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(150, 8);
    ctx.lineTo(141, 26);
    ctx.lineTo(159, 26);
    ctx.closePath();
    ctx.fill();
  }
  function bindWheel() {
    var opts = document.getElementById("wheelOpts");
    var spin = document.getElementById("wheelSpin");
    var demo = document.getElementById("wheelDemo");
    var cv = document.getElementById("wheelCanvas");
    var res = document.getElementById("wheelRes");
    var items = [];
    var angle = 0;
    var spinning = false;
    demo.addEventListener("click", function () {
      opts.value = "晚饭吃什么\n奶茶\n火锅\n烧烤\nKFC";
      drawWheel(cv, ["晚饭吃什么", "奶茶", "火锅", "烧烤", "KFC"]);
      items = ["晚饭吃什么", "奶茶", "火锅", "烧烤", "KFC"];
      res.textContent = "";
    });
    spin.addEventListener("click", function () {
      var list = opts.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      if (list.length < 2) { toast("至少写两项", "err"); return; }
      if (spinning) return;
      items = list.slice(0, 12);
      angle = 0;
      drawWheel(cv, items);
      res.textContent = "";
      spinning = true;
      var target = (Math.floor(4 + Math.random() * 5)) * 360 + Math.random() * 360 + angle;
      var t0 = null;
      var dur = 3800;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var ease = 1 - Math.pow(1 - p, 3);
        var cur = angle + (target - angle) * ease;
        cv.style.transform = "rotate(" + cur + "deg)";
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          spinning = false;
          var deg = ((cur % 360) + 360) % 360;
          var seg = 360 / items.length;
          var idx = Math.floor(((360 - deg + 90) % 360) / seg) % items.length;
          res.innerHTML = "结果：<b style=\"color:var(--accent)\">" + esc(items[idx]) + "</b>";
          if (window.FX) window.FX.burst(cv.getBoundingClientRect().left + 150, cv.getBoundingClientRect().top + 80, 36);
        }
      }
      requestAnimationFrame(step);
    });
    cv.style.transition = "none";
  }

  /* ================= 密码生成器 ================= */
  function passHTML() {
    return '<div class="tool">' +
      '<div class="tool-row">' +
        '<label>长度 <b id="passLenV">16</b> <input type="range" id="passLen" min="8" max="40" value="16" style="width:180px"></label>' +
      "</div>" +
      '<div class="tool-row">' +
        '<label><input type="checkbox" id="pwU" checked> 大写</label>' +
        '<label><input type="checkbox" id="pwL" checked> 小写</label>' +
        '<label><input type="checkbox" id="pwN" checked> 数字</label>' +
        '<label><input type="checkbox" id="pwS" checked> 符号</label>' +
      "</div>" +
      '<div class="tool-row">' +
        '<button class="btn btn-primary" id="passGen" type="button">生成</button>' +
        '<button class="btn" id="passCopy" type="button">复制</button>' +
      "</div>" +
      '<div class="tool-output" id="passOut">点击“生成”获得随机密码</div>' +
      "</div>";
  }
  function bindPass() {
    var len = document.getElementById("passLen");
    var lenV = document.getElementById("passLenV");
    var out = document.getElementById("passOut");
    var gen = document.getElementById("passGen");
    var copy = document.getElementById("passCopy");
    var last = "";
    len.addEventListener("input", function () { lenV.textContent = len.value; });
    function sets() {
      var s = "";
      if (document.getElementById("pwU").checked) s += "ABCDEFGHJKLMNPQRSTUVWXYZ";
      if (document.getElementById("pwL").checked) s += "abcdefghijkmnopqrstuvwxyz";
      if (document.getElementById("pwN").checked) s += "23456789";
      if (document.getElementById("pwS").checked) s += "!@#$%^&*()-_=+[]{};:,.?";
      return s;
    }
    gen.addEventListener("click", function () {
      var pool = sets();
      if (!pool) { toast("至少勾选一类字符", "err"); return; }
      var n = Math.min(64, parseInt(len.value, 10) || 16);
      var arr = new Uint32Array(n);
      crypto.getRandomValues(arr);
      var s = "";
      for (var i = 0; i < n; i++) s += pool[arr[i] % pool.length];
      last = s;
      out.textContent = s;
    });
    copy.addEventListener("click", function () {
      if (!last) { toast("先生成一个吧", "err"); return; }
      copyText(last, "密码已复制（仅本次会话）");
    });
  }

  /* ================= 文本工具箱 ================= */
  function txtHTML() {
    return '<div class="tool">' +
      '<textarea id="txtIn" rows="5" placeholder="粘贴或输入文本"></textarea>' +
      '<p class="fun-result" id="txtStat"></p>' +
      '<div class="tool-row" style="gap:.45rem">' +
        '<button class="btn btn-ghost" data-a="upper" type="button">大写</button>' +
        '<button class="btn btn-ghost" data-a="lower" type="button">小写</button>' +
        '<button class="btn btn-ghost" data-a="trim" type="button">去空格</button>' +
        '<button class="btn btn-ghost" data-a="b64e" type="button">Base64 编码</button>' +
        '<button class="btn btn-ghost" data-a="b64d" type="button">Base64 解码</button>' +
        '<button class="btn btn-ghost" data-a="urle" type="button">URL 编码</button>' +
        '<button class="btn btn-ghost" data-a="urld" type="button">URL 解码</button>' +
        '<button class="btn btn-ghost" data-a="json" type="button">JSON 美化</button>' +
        '<button class="btn btn-ghost" data-a="copy" type="button">复制结果</button>' +
      "</div>" +
      '<div class="tool-output" id="txtOut"></div>' +
      "</div>";
  }
  function bindTxt() {
    var inp = document.getElementById("txtIn");
    var stat = document.getElementById("txtStat");
    var out = document.getElementById("txtOut");
    var box = document.getElementById("txtOut");
    function count() {
      var t = inp.value;
      var cn = (t.match(/[\u4e00-\u9fff]/g) || []).length;
      var words = t.trim() ? t.trim().split(/\s+/).length : 0;
      stat.textContent = "字符 " + t.length + " · 汉字 " + cn + " · 词 " + words;
    }
    inp.addEventListener("input", count);
    count();
    document.querySelector("#tbBody .tool").addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]");
      if (!b) return;
      var v = inp.value;
      var a = b.getAttribute("data-a");
      var o;
      try {
        if (a === "upper") o = v.toUpperCase();
        else if (a === "lower") o = v.toLowerCase();
        else if (a === "trim") o = v.replace(/\s+/g, "");
        else if (a === "b64e") o = toBase64(v);
        else if (a === "b64d") o = fromBase64(v.trim());
        else if (a === "urle") o = encodeURIComponent(v);
        else if (a === "urld") o = decodeURIComponent(v);
        else if (a === "json") { o = JSON.stringify(JSON.parse(v), null, 2); }
        else if (a === "copy") { copyText(box.textContent, "结果已复制"); return; }
        box.textContent = String(o);
      } catch (err) {
        toast(a === "b64d" || a === "urld" ? "内容格式不对，无法解码" : "操作失败", "err");
      }
    });
  }

  /* ================= 配色板 ================= */
  function colorHTML() {
    return '<div class="tool">' +
      '<div class="tool-row">' +
        '<button class="btn btn-primary" id="colorNew" type="button">随机一组配色</button>' +
        '<span style="color:var(--muted);font-size:.82rem">点色块复制</span>' +
      "</div>" +
      '<div class="color-swatches" id="swatches"></div>' +
      "</div>";
  }
  function bindColor() {
    var sw = document.getElementById("swatches");
    var gen = document.getElementById("colorNew");
    function hsl(h, s, l) { return "hsl(" + h + "," + s + "%," + l + "%)"; }
    function render() {
      var base = Math.floor(Math.random() * 360);
      var palette = [];
      for (var i = 0; i < 5; i++) {
        var h = (base + i * 24 + Math.floor(Math.random() * 10 - 5) + 360) % 360;
        palette.push(hsl(h, 62 + Math.random() * 20, 42 + Math.random() * 18));
      }
      sw.innerHTML = palette.map(function (c) {
        return '<div class="swatch" data-c="' + c + '">' + c + "</div>";
      }).join("");
    }
    gen.addEventListener("click", render);
    sw.addEventListener("click", function (e) {
      var t = e.target.closest(".swatch");
      if (t) copyText(t.getAttribute("data-c"), "颜色 " + t.getAttribute("data-c") + " 已复制");
    });
    render();
  }

  /* ================= 路由 ================= */
  var RENDER = { qr: qrHTML, draw: drawHTML, wheel: wheelHTML, pass: passHTML, txt: txtHTML, color: colorHTML };
  var BIND = { qr: bindQR, draw: bindDraw, wheel: bindWheel, pass: bindPass, txt: bindTxt, color: bindColor };

  function show(name) {
    if (!RENDER[name]) name = "qr";
    current = name;
    nav.querySelectorAll(".tb-chip").forEach(function (c) {
      c.classList.toggle("is-on", c.getAttribute("data-tb") === name);
    });
    body.innerHTML = RENDER[name]();
    BIND[name]();
  }
  nav.addEventListener("click", function (e) {
    var c = e.target.closest(".tb-chip");
    if (c) show(c.getAttribute("data-tb"));
  });

  window.__toolbox = {
    open: function (email) {
      if (userEl) userEl.textContent = email || "";
      show(current);
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
    },
    close: function () {
      overlay.hidden = true;
      document.body.style.overflow = "";
    },
  };
  document.querySelectorAll(".tb-close").forEach(function (b) {
    b.addEventListener("click", function () { window.__toolbox.close(); });
  });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) window.__toolbox.close();
  });
})();
