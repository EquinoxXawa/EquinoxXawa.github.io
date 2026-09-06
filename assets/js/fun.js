/* =========================================================
   fun.js — 小玩具坞：手速测试 / 今日运势 / 一言 / 彩带
   ========================================================= */
(function () {
  "use strict";

  var overlay = document.getElementById("overlay");
  var panelTitle = document.getElementById("panelTitle");
  var panelBody = document.getElementById("panelBody");
  var panelClose = document.getElementById("panelClose");
  var dock = document.getElementById("funDock");
  var body = document.body;

  function openPanel(title, html) {
    if (!overlay || !panelTitle || !panelBody) return;
    panelTitle.textContent = title;
    panelBody.innerHTML = html;
    overlay.hidden = false;
    body.style.overflow = "hidden";
    if (panelClose) panelClose.focus();
  }
  function closePanel() {
    if (!overlay) return;
    overlay.hidden = true;
    body.style.overflow = "";
    panelBody.innerHTML = "";
    // 结束小游戏计时器
    if (window.__reflexTimer) { clearTimeout(window.__reflexTimer); window.__reflexTimer = null; }
    if (window.__reflexStart) window.__reflexStart = null;
  }
  if (panelClose) panelClose.addEventListener("click", closePanel);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePanel();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay && !overlay.hidden) closePanel();
  });

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- 今日运势（按日期固定） ---------- */
  var FORTUNES = [
    { rank: "大吉", text: "代码一把过，Bug 绕着你走。", tip: "适合今天把欠下的东西都清掉。" },
    { rank: "吉", text: "排位要连胜，匹到的队友都是大神。", tip: "开局前先夸自己一句，效果更好。" },
    { rank: "中吉", text: "灵感在线，适合写点新东西。", tip: "想到就记下来，别让它溜走。" },
    { rank: "小吉", text: "稳扎稳打的一天，别急着秀操作。", tip: "该苟的时候苟，该冲的时候冲。" },
    { rank: "中平", text: "平平无奇但很安全的一天。", tip: "吃顿好的犒劳一下自己。" },
    { rank: "末吉", text: "可能有点小波折，但问题不大。", tip: "遇到坑先深呼吸，再来一次。" },
    { rank: "凶", text: "今日不宜立 Flag、不宜通宵。", tip: "早点睡，明天又是新的一局。" },
  ];
  function dayHash() {
    var d = new Date();
    var n = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    var h = n;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = ((h >> 16) ^ h);
    return Math.abs(h);
  }
  function showFortune() {
    var idx = dayHash() % FORTUNES.length;
    var f = FORTUNES[idx];
    var today = new Date();
    var ymd = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    openPanel("今日运势", "" +
      '<p class="fortune-date">' + ymd + '  ·  运势按日期固定，明天会变</p>' +
      '<div class="fortune-rank">' + esc(f.rank) + "</div>" +
      '<p class="fortune-text">' + esc(f.text) + "</p>" +
      '<p class="fun-tip" style="margin-top:1rem">小提示：' + esc(f.tip) + "</p>" +
      '<div class="fun-row"><button class="btn" data-close-panel type="button">收下好运</button></div>'
    );
  }

  /* ---------- 一言 ---------- */
  var WORDS = [
    ["代码如诗，Bug 如烟。", "EquinoxX"],
    ["今天不写代码，写点开心。", "PhantomBlog"],
    ["FPS 的浪漫：枪线之上，皆是风景。", "PhantomBlog"],
    ["慢慢来，比较快。", "佚名"],
    ["所有的晦暗都留给过往，从遇见你开始，凛冬散尽。", "佚名"],
    ["世界上只有一种真正的英雄主义，就是认清了生活的真相后还依然热爱它。", "罗曼·罗兰"],
    ["关关难过关关过，夜夜难熬夜夜熬。", "佚名"],
    ["愿你走出半生，归来仍是少年。", "佚名"],
    ["但行好事，莫问前程。", "增广贤文"],
    ["道阻且长，行则将至。", "佚名"],
    ["最好的状态是：眼里写满了故事，脸上却不见风霜。", "佚名"],
    ["知命不惧，日日自新。", "佚名"],
    ["热爱可抵岁月漫长。", "佚名"],
    ["键盘敲下的每一行，都在为未来铺路。", "PhantomBlog"],
    ["上分靠技术，人生靠心态。", "EquinoxX"],
    ["多喝热水，少熬夜。", "站长寄语"],
  ];
  function showWord() {
    var idx = (Math.random() * WORDS.length) | 0;
    var w = WORDS[idx];
    openPanel("一言", "" +
      '<p class="word-line">' + esc(w[0]) + "</p>" +
      '<p class="word-src">—— ' + esc(w[1]) + "</p>" +
      '<div class="fun-row"><button class="btn" id="wordAgain" type="button">换一句</button>' +
      '<button class="btn btn-ghost" data-close-panel type="button">关闭</button></div>'
    );
    var again = document.getElementById("wordAgain");
    if (again) again.addEventListener("click", showWord);
  }

  /* ---------- 手速测试 ---------- */
  var BEST_KEY = "eqx-reflex-best";
  function best() {
    try { return parseFloat(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
  }
  function rating(ms) {
    if (ms < 180) return "传说级反应";
    if (ms < 240) return "王者级反应";
    if (ms < 300) return "钻石级反应";
    if (ms < 380) return "铂金级反应";
    return "青铜选手，再练练";
  }
  function showReflex() {
    var html =
      '<p class="fun-tip">点击方块开始，方块会在 1-5 秒内随机变绿，变绿后立刻再点一次。越快越好。</p>' +
      '<div class="r-box" id="rBox" role="button" tabindex="0">点我开始</div>' +
      '<p class="fun-result" id="rResult"></p>' +
      '<div class="fun-row"><button class="btn btn-primary" id="rRetry" type="button">再来一次</button>' +
      '<button class="btn btn-ghost" data-close-panel type="button">关闭</button></div>';
    openPanel("手速测试", html);
    var box = document.getElementById("rBox");
    var result = document.getElementById("rResult");
    var retry = document.getElementById("rRetry");
    var state = "idle"; // idle | waiting | ready | done
    var b = best();
    if (b) result.textContent = "历史最快：" + b + " ms";

    function reset() {
      state = "idle";
      box.textContent = "点我开始";
      box.className = "r-box r-wait";
      window.__reflexTimer = null;
    }
    function start() {
      reset();
      box.textContent = "等待变绿（1-5 秒随机）……";
      var delay = 1000 + Math.random() * 4000; // 保证在 5 秒内变绿
      window.__reflexTimer = setTimeout(function () {
        if (state !== "waiting") return;
        state = "ready";
        box.textContent = "点！";
        box.className = "r-box r-ready";
        window.__reflexStart = performance.now();
      }, delay);
    }
    function clickBox() {
      if (state === "idle") {
        state = "waiting";
        start();
      } else if (state === "waiting") {
        // 抢跑了
        window.__reflexTimer && clearTimeout(window.__reflexTimer);
        state = "done";
        box.textContent = "抢跑啦，等变绿再点";
        box.className = "r-box r-done";
        result.innerHTML = "抢跑不算数，<b>再来一次</b>";
      } else if (state === "ready") {
        var ms = Math.round(performance.now() - window.__reflexStart);
        state = "done";
        box.textContent = ms + " ms";
        box.className = "r-box r-done";
        result.innerHTML = "本次 <b>" + ms + " ms</b> · " + esc(rating(ms));
        if (!b || ms < b) {
          try { localStorage.setItem(BEST_KEY, String(ms)); } catch (e) {}
          result.innerHTML += "<br>新纪录，存入本地！";
        }
      }
    }
    box.addEventListener("click", clickBox);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clickBox(); }
    });
    retry.addEventListener("click", start);
    reset();
  }

  /* ---------- 彩带 ---------- */
  function confetti() {
    if (window.FX) window.FX.rain(3);
  }

  /* ---------- 坞按钮路由 ---------- */
  function route(name) {
    if (name === "fortune") showFortune();
    else if (name === "word") showWord();
    else if (name === "reflex") showReflex();
    else if (name === "confetti") confetti();
  }
  if (dock) {
    dock.querySelectorAll(".fun-dock-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        route(btn.getAttribute("data-fun"));
      });
    });
  }
  // data-close-panel 按钮关闭
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-close-panel]");
    if (c) closePanel();
  });
  window.__closePanel = closePanel;
})();
