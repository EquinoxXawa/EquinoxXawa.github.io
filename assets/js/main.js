/* =========================================================
   main.js — 页面逻辑：主题 / 导航 / 滚动 / 文章 / 匿名问答 / 访客计数
   问答与计数走同源 /api（服务器版）；GitHub Pages 备份自动降级为只读
   ========================================================= */
(function () {
  "use strict";

  var doc = document.documentElement;

  /* ---------- 主题 ---------- */
  var themeBtn = document.getElementById("themeBtn");
  function applyTheme(next) {
    doc.setAttribute("data-theme", next);
    try { localStorage.setItem("eqx-theme", next); } catch (e) {}
    window.dispatchEvent(new Event("eqxtheme"));
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(doc.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  }

  /* ---------- 移动端导航 ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var mobileNav = document.getElementById("mobileNav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.setAttribute("aria-label", open ? "打开菜单" : "关闭菜单");
      mobileNav.hidden = open;
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menuBtn.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      });
    });
  }

  /* ---------- 滚动 ---------- */
  var header = document.getElementById("siteHeader");
  var toTop = document.getElementById("toTop");
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.hidden = y < 560;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 彩带 ---------- */
  function rain() { if (window.FX) window.FX.rain(2.6); }
  function burstAtCenter() { if (window.FX) window.FX.burst(window.innerWidth / 2, window.innerHeight * 0.5, 80); }
  var confettiBtn = document.getElementById("confettiBtn");
  var confettiCta = document.getElementById("confettiCta");
  if (confettiBtn) confettiBtn.addEventListener("click", rain);
  if (confettiCta) confettiCta.addEventListener("click", rain);

  /* ---------- 滚动显现动画 ---------- */
  var revealObserver = null;
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            revealObserver.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }
  function observeReveals(scope) {
    if (!revealObserver) return;
    scope.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  var PALETTE = [
    ["#6366f1", "#8b5cf6"],
    ["#0ea5e9", "#22d3ee"],
    ["#f59e0b", "#f97316"],
    ["#ec4899", "#f43f5e"],
    ["#10b981", "#34d399"],
    ["#8b5cf6", "#d946ef"],
  ];
  function hashStr(s) {
    var h = 0;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function gradFor(key) {
    var c = PALETTE[hashStr(key) % PALETTE.length];
    return "linear-gradient(135deg," + c[0] + "," + c[1] + ")";
  }

  /* ---------- 打字机文案 ---------- */
  var typeEl = document.getElementById("typeText");
  var LINES = [
    "白天写代码，晚上开镜 🎮",
    "Apex / COD / CS2 / Deadlock 常驻选手",
    "在这里写点代码笔记、游戏心得和碎碎念",
    "欢迎光临我的 PhantomBlog 👋",
  ];
  if (typeEl) {
    var li = 0, ci = 0, deleting = false;
    (function tick() {
      var line = LINES[li];
      if (!deleting) {
        ci++;
        if (ci >= line.length) { deleting = true; setTimeout(tick, 2100); return; }
      } else {
        ci--;
        if (ci <= 0) { deleting = false; li = (li + 1) % LINES.length; setTimeout(tick, 300); return; }
      }
      typeEl.textContent = line.slice(0, ci);
      setTimeout(tick, deleting ? 34 : 62);
    })();
  }

  /* ---------- 文章渲染（空态） ---------- */
  var postList = document.getElementById("postList");
  if (postList) {
    postList.innerHTML =
      '<p class="state-note">还没有文章——第一篇正在路上 🚧</p>';
  }

  /* =========================================================
     匿名问答
     ========================================================= */
  var API = "./api";
  var MAIN_URL = "http://103.236.97.213:38090"; // 服务器主站（域名备案后可换回 https://equinoxx.tech）
  var qaList = document.getElementById("qaList");
  var qaForm = document.getElementById("qaForm");
  var qaName = document.getElementById("qaName");
  var qaContent = document.getElementById("qaContent");
  var qaSend = document.getElementById("qaSend");
  var qaStatus = document.getElementById("qaStatus");
  var liveMode = false;

  function qaItemHTML(e, idx) {
    var name = e.name || "匿名用户";
    var anon = !!e.anon || !e.name;
    var letter = anon ? "？" : esc(String(name).slice(0, 1));
    var key = (e.id != null ? e.id : idx) + ":" + name;
    return (
      '<div class="qa-item reveal" data-d="' + (idx % 3 + 1) + '">' +
        '<div class="qa-head">' +
          '<span class="qa-ava" style="background:' + gradFor(key) + '">' + letter + "</span>" +
          '<span class="qa-name">' + esc(name) + "</span>" +
          (anon ? '<span class="qa-pill">匿名</span>' : "") +
          '<span class="qa-date">' + esc(e.date || "") + "</span>" +
        "</div>" +
        '<p class="qa-text">' + esc(e.content || "") + "</p>" +
      "</div>"
    );
  }
  function renderQA(list) {
    if (!qaList) return;
    if (!Array.isArray(list) || list.length === 0) {
      qaList.innerHTML = '<p class="state-note">还没有留言，来问第一个问题吧～</p>';
      return;
    }
    qaList.innerHTML = list.map(qaItemHTML).join("");
    observeReveals(qaList);
  }
  function setStatus(msg, type) {
    if (!qaStatus) return;
    qaStatus.textContent = msg || "";
    qaStatus.className = "qa-status" + (type ? " " + type : "");
  }
  function setReadOnly(reason) {
    liveMode = false;
    if (qaForm) {
      [].forEach.call(qaForm.querySelectorAll("input, textarea, button"), function (el) {
        el.disabled = true;
      });
    }
    setStatus(reason || "只读预览：这是 GitHub Pages 备份，问答请访问主站", "err");
  }

  // 尝试连接后端 API；失败则读本地 comments.json 只读展示
  function initQA() {
    if (!qaList) return;
    fetch(API + "/qa", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        liveMode = true;
        renderQA(data.list || []);
      })
      .catch(function (err) {
        console.warn("API 不可用，降级为只读:", err);
        renderQA([]);
        fetch("./data/comments.json", { cache: "no-store" })
          .then(function (r2) { if (!r2.ok) throw 0; return r2.json(); })
          .then(function (legacy) {
            var mapped = (Array.isArray(legacy) ? legacy : []).map(function (c) {
              return { id: "f" + hashStr(c.username + c.date), name: c.username, content: c.content, date: c.date, anon: false };
            });
            renderQA(mapped);
            setReadOnly("这里是 GitHub Pages 备份（只读）；到主站 " + MAIN_URL + " 可以匿名提问互动哦");
          })
          .catch(function () { setReadOnly(); });
      });
  }

  if (qaForm) {
    qaForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var content = (qaContent.value || "").trim();
      if (!content) { setStatus("写点内容再发送呀～", "err"); return; }
      if (content.length > 500) { setStatus("最多 500 字哦", "err"); return; }
      if (!liveMode) { setStatus("备份版无法保存，去主站提问吧", "err"); return; }
      qaSend.disabled = true;
      qaSend.textContent = "发送中…";
      setStatus("", "");
      fetch(API + "/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: (qaName.value || "").trim(), content: content }),
      })
        .then(function (r) {
          if (r.status === 429) throw { rate: true };
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (data) {
          qaContent.value = "";
          renderQA(data.list || []);
          setStatus("已悄悄放上去啦 ✨", "ok");
          burstAtCenter();
        })
        .catch(function (err) {
          setStatus(err && err.rate ? "发得太快啦，休息几秒再试" : "发送失败，稍后再试试", "err");
        })
        .finally(function () {
          qaSend.disabled = false;
          qaSend.textContent = "发 送 ✦";
        });
    });
  }
  initQA();

  /* =========================================================
     访客计数（服务器版；不可用时隐藏徽章）
     ========================================================= */
  var badge = document.getElementById("visitBadge");
  function initVisits() {
    if (!badge) return;
    fetch(API + "/visits", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (v) {
        var txt = "👀 今日 " + (v.today || 0) + " 人 · 累计 " + (v.total || 0) + " 次访问";
        badge.innerHTML = "";
        var parts = txt.split("·");
        parts.forEach(function (p) {
          var span = document.createElement("span");
          span.innerHTML = p.trim();
          badge.appendChild(span);
        });
        badge.hidden = false;
        // 每次会话只计一次
        try {
          if (!sessionStorage.getItem("eqx-v")) {
            sessionStorage.setItem("eqx-v", "1");
            fetch(API + "/visits", { method: "POST" }).catch(function () {});
          }
        } catch (e) {}
      })
      .catch(function () { /* 非服务器环境，保持隐藏 */ });
  }
  initVisits();

  /* ---------- 复制邮箱 ---------- */
  var copyBtn = document.getElementById("copyBtn");
  var copyLabel = document.getElementById("copyLabel");
  var EMAIL = "EquinoxX1337@163.com";
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      function done(ok) {
        if (copyLabel) copyLabel.textContent = ok ? "已复制 ✓" : "复制失败，请手动复制";
        setTimeout(function () { if (copyLabel) copyLabel.textContent = "复制邮箱"; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(false); });
      } else {
        try {
          var ta = document.createElement("textarea");
          ta.value = EMAIL;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand("copy");
          document.body.removeChild(ta);
          done(ok);
        } catch (e) { done(false); }
      }
    });
  }

  /* ---------- 年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
