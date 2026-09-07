/* =========================================================
   EquinoxX 的小窝 — 页面逻辑
   霓虹动效 / 登录注册 / 动态圈 / 个人资料 / 百宝箱门控
   ========================================================= */
(function () {
  "use strict";
  var doc = document.documentElement;
  var API = "./api";
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* ---------- 吐司 ---------- */
  var toastWrap = document.getElementById("toasts");
  function toast(msg, type) {
    if (!toastWrap) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = "<b>" + (type === "err" ? "!" : "✓") + "</b><span>" + esc(msg) + "</span>";
    toastWrap.appendChild(el);
    setTimeout(function () { el.classList.add("out"); setTimeout(function () { el.remove(); }, 300); }, 2400);
  }
  window.__toast = toast;

  /* ---------- 波纹（全局 .btn / 圆钮） ---------- */
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".btn");
    if (!b) return;
    var r = b.getBoundingClientRect();
    var d = Math.max(r.width, r.height);
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = e.clientX - r.left - d / 2 + "px";
    s.style.top = e.clientY - r.top - d / 2 + "px";
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 640);
  }, { passive: true });

  /* ---------- 导航 / 滚动 ---------- */
  var header = document.getElementById("siteHeader");
  var menuBtn = document.getElementById("menuBtn");
  var mobileNav = document.getElementById("mobileNav");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
    });
    mobileNav.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("click", function () {
        menuBtn.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      });
    });
  }

  /* ---------- Hero：名字逐字登场 ---------- */
  var nameEl = document.getElementById("heroName");
  if (nameEl) {
    var txt = nameEl.textContent;
    nameEl.textContent = "";
    var html = "";
    for (var i = 0; i < txt.length; i++) {
      html += '<span class="ch glitch" style="animation-delay:' + (0.08 * i) + 's">' + esc(txt[i]) + "</span>";
    }
    nameEl.innerHTML = html;
  }

  /* ---------- 打字机（标签短词轮换） ---------- */
  var typeEl = document.getElementById("typeText");
  var WORDS = ["辽宁 · 本溪", "高中生", "Apex", "术力口", "double pleasure"]; // 极简短词
  if (typeEl) {
    var wi = 0, ci = 0, del = false;
    (function tick() {
      var w = WORDS[wi];
      if (!del) {
        ci++;
        if (ci > w.length) { del = true; setTimeout(tick, 1700); return; }
      } else {
        ci--;
        if (ci < 0) { del = false; wi = (wi + 1) % WORDS.length; setTimeout(tick, 300); return; }
      }
      typeEl.textContent = w.slice(0, ci);
      setTimeout(tick, del ? 36 : 72);
    })();
  }

  /* ---------- 扫光入场 + 3D 悬浮 ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 }) : null;
  document.querySelectorAll(".sweep").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });

  var fine = window.matchMedia("(pointer:fine)").matches;
  if (fine && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(600px) rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 8) + "deg) translateY(-3px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- 复制邮箱 / 年份 ---------- */
  var copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var done = function (ok) { toast(ok ? "邮箱已复制" : "复制失败", ok ? "ok" : "err"); };
      var txt = "EquinoxX1337@163.com";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); });
      } else {
        try {
          var ta = document.createElement("textarea");
          ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          done(document.execCommand("copy"));
          document.body.removeChild(ta);
        } catch (e) { done(false); }
      }
    });
  }
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 访客计数 ---------- */
  var visitLine = document.getElementById("visitLine");
  function initVisits() {
    if (!visitLine) return;
    var bumped = false;
    try { bumped = !!sessionStorage.getItem("eqx-v"); } catch (e) {}
    (bumped ? fetch(API + "/visits", { cache: "no-store" }) : fetch(API + "/visits", { method: "POST" }))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (v) {
        visitLine.innerHTML = "今日访问 <b>" + (v.today || 0) + "</b> · 累计 <b>" + (v.total || 0) + "</b>";
        visitLine.hidden = false;
        if (!bumped) { try { sessionStorage.setItem("eqx-v", "1"); } catch (e) {} }
      })
      .catch(function () {});
  }
  initVisits();

  /* =========================================================
     账号：登录 / 注册 / 资料 / 主题色
     ========================================================= */
  var AUTH_KEY = "pb-token", EMAIL_KEY = "pb-email";
  var token = null, email = null, profile = { nick: "", accent: "violet" };
  var authOverlay = document.getElementById("authOverlay");
  var authBody = document.getElementById("authBody");
  var acctBtn = document.getElementById("acctBtn");
  var mobileAcct = document.getElementById("mobileAcct");
  var mobileTool = document.getElementById("mobileTool");
  var ACCENTS = { violet: ["#a78bfa", "#22d3ee"], blue: ["#818cf8", "#60a5fa"], pink: ["#f472b6", "#fb7185"], green: ["#34d399", "#22d3ee"], red: ["#f87171", "#fb923c"] };
  var currentView = "login";

  function apiCall(m, p, body) {
    var opt = { method: m, headers: { "Content-Type": "application/json" } };
    if (token) opt.headers.Authorization = "Bearer " + token;
    if (body !== undefined) opt.body = JSON.stringify(body);
    return fetch(API + p, opt).then(function (r) { return r.json(); });
  }
  function applyAccent(key) {
    if (ACCENTS[key]) document.body.setAttribute("data-accent", key);
  }
  function saveLocal() {
    try { localStorage.setItem(AUTH_KEY, token); localStorage.setItem(EMAIL_KEY, email); } catch (e) {}
  }
  function setAuthUI() {
    var logged = !!email;
    acctBtn.textContent = logged ? email.slice(0, 1).toUpperCase() : "登录";
    acctBtn.classList.toggle("is-in", logged);
    acctBtn.title = logged ? email + "（我的账户）" : "登录 / 注册";
    mobileAcct.textContent = logged ? "账户：" + email : "登录";
    mobileTool.hidden = !logged;
    applyAccent(profile.accent);
    renderComposer();
    renderFeed(); // 刷新以决定是否显示发布框
  }
  function storeSession(t, e, p) {
    token = t; email = e; profile = p || profile;
    saveLocal(); setAuthUI();
  }
  function clearSession() {
    token = null; email = null; profile = { nick: "", accent: "violet" };
    try { localStorage.removeItem(AUTH_KEY); localStorage.removeItem(EMAIL_KEY); } catch (e) {}
    setAuthUI();
  }
  function closeAuth() { authOverlay.hidden = true; document.body.style.overflow = ""; }

  function formHTML() {
    var isReg = currentView === "register";
    return "" +
      '<div class="auth-tabs">' +
        '<button type="button" class="auth-tab' + (!isReg ? " is-on" : "") + '" data-v="login">登录</button>' +
        '<button type="button" class="auth-tab' + (isReg ? " is-on" : "") + '" data-v="register">注册</button>' +
      "</div>" +
      '<form id="authForm" novalidate>' +
        '<label class="auth-field"><span class="auth-label">邮箱</span><input id="aEmail" type="email" autocomplete="email" placeholder="you@example.com" /></label>' +
        '<label class="auth-field"><span class="auth-label">密码</span><span class="auth-pw-wrap"><input id="aPass" type="password" autocomplete="' + (isReg ? "new-password" : "current-password") + '" placeholder="至少 6 位" />' +
        '<button type="button" class="auth-eye" id="aEye"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg></button></span></label>' +
        (isReg ? '<label class="auth-field"><span class="auth-label">确认密码</span><input id="aPass2" type="password" autocomplete="new-password" placeholder="再输入一次" /></label>' : "") +
        '<p class="auth-err" id="aErr"></p>' +
        '<button class="btn primary auth-submit" type="submit"><span>' + (isReg ? "注 册" : "登 录") + "</span></button>" +
        '<p class="auth-hint">邮箱仅用于登录本站，不对外公开。</p>' +
      "</form>";
  }
  function profileHTML() {
    var dots = Object.keys(ACCENTS).map(function (k) {
      var c = ACCENTS[k];
      return '<button type="button" class="accent-dot' + (profile.accent === k ? " on" : "") + '" data-accent="' + k + '" style="background:linear-gradient(135deg,' + c[0] + "," + c[1] + ')" title="' + k + '"></button>';
    }).join("");
    return "" +
      '<p class="acct-mail">' + esc(email || "") + "</p>" +
      '<label class="auth-field"><span class="auth-label">昵称（动态里显示）</span><input id="pNick" type="text" maxlength="16" value="' + esc(profile.nick || email.split("@")[0]) + '" /></label>' +
      '<span class="auth-label">主题色</span>' +
      '<div class="pf-row" id="accentRow">' + dots + "</div>" +
      '<button class="btn primary auth-submit" id="pSave" type="button"><span>保存设置</span></button>' +
      '<div class="pf-row">' +
        '<button class="btn ghost" id="pTool" type="button">打开百宝箱</button>' +
        '<button class="btn ghost" id="pOut" type="button">退出登录</button>' +
      "</div>";
  }
  function renderView() {
    var title = document.querySelector("#authOverlay .panel-head h3");
    if (currentView === "account") {
      title.textContent = "我的账户";
      authBody.innerHTML = profileHTML();
      document.getElementById("pSave").addEventListener("click", function () {
        var nick = (document.getElementById("pNick").value || "").trim().slice(0, 16);
        apiCall("PATCH", "/api/profile", { nick: nick, accent: profile.accent }).then(function (j) {
          if (j.ok && j.profile) {
            profile = j.profile; applyAccent(profile.accent);
            toast("已保存", "ok");
            setAuthUI();
          } else toast("保存失败", "err");
        });
      });
      document.getElementById("accentRow").addEventListener("click", function (e) {
        var d = e.target.closest("[data-accent]");
        if (!d) return;
        profile.accent = d.getAttribute("data-accent");
        applyAccent(profile.accent);
        document.querySelectorAll(".accent-dot").forEach(function (x) { x.classList.toggle("on", x === d); });
        // 即时预览并保存
        apiCall("PATCH", "/api/profile", { accent: profile.accent }).catch(function () {});
      });
      document.getElementById("pTool").addEventListener("click", function () { closeAuth(); openTool(); });
      document.getElementById("pOut").addEventListener("click", function () {
        if (token) fetch(API + "/auth/logout", { method: "POST", headers: { Authorization: "Bearer " + token } }).catch(function () {});
        clearSession(); closeAuth(); toast("已退出登录", "ok");
      });
      return;
    }
    title.textContent = currentView === "register" ? "创建账号" : "欢迎回来";
    authBody.innerHTML = formHTML();
    authBody.querySelector(".auth-tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".auth-tab");
      if (t) { currentView = t.getAttribute("data-v"); renderView(); }
    });
    var eye = document.getElementById("aEye");
    if (eye) eye.addEventListener("click", function () {
      var p = document.getElementById("aPass");
      p.type = p.type === "password" ? "text" : "password";
    });
    document.getElementById("authForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = document.getElementById("aErr");
      var em = (document.getElementById("aEmail").value || "").trim().toLowerCase();
      var pw = document.getElementById("aPass").value || "";
      err.textContent = "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { err.textContent = "邮箱格式不对"; shake(); return; }
      if (pw.length < 6) { err.textContent = "密码至少 6 位"; shake(); return; }
      if (currentView === "register" && pw !== (document.getElementById("aPass2").value || "")) {
        err.textContent = "两次密码不一致"; shake(); return;
      }
      var btn = document.querySelector("#authForm .auth-submit");
      btn.innerHTML = '<span class="spinner"></span>';
      fetch(API + "/auth/" + currentView, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j.ok && j.token) {
          storeSession(j.token, j.email, { nick: j.email.split("@")[0].slice(0, 16), accent: "violet" });
          apiCall("GET", "/api/profile").then(function (p) {
            if (p.ok) { profile = p.profile; applyAccent(profile.accent); setAuthUI(); }
          });
          closeAuth();
          toast(currentView === "register" ? "注册成功，欢迎" : "登录成功，欢迎回来", "ok");
          if (window.FX) window.FX.rain(1.4);
        } else if (j.error) { err.textContent = j.error; shake(); }
        else { err.textContent = "邮箱或密码不对"; shake(); }
      }).catch(function () { err.textContent = "连接服务器失败"; shake(); })
      .finally(restoreAuthBtn);
    });
  }
  function restoreAuthBtn() {
    var f = document.getElementById("authForm");
    var b = f && f.querySelector(".auth-submit");
    if (b) b.innerHTML = "<span>" + (currentView === "register" ? "注 册" : "登 录") + "</span>";
  }
  function shake() {
    var p = authOverlay.querySelector(".auth-panel");
    p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake");
  }
  function openAuth() {
    currentView = "login";
    authOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    renderView();
  }
  function openAccount() {
    currentView = "account";
    authOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    renderView();
  }
  function openTool() {
    if (window.__toolbox) window.__toolbox.open(email || "");
  }

  document.querySelectorAll(".auth-close").forEach(function (b) { b.addEventListener("click", closeAuth); });
  authOverlay.addEventListener("click", function (e) { if (e.target === authOverlay) closeAuth(); });
  acctBtn.addEventListener("click", function () { email ? openAccount() : openAuth(); });
  mobileAcct.addEventListener("click", function () { email ? openAccount() : openAuth(); });
  mobileTool.addEventListener("click", openTool);

  function initSession() {
    var t = null, e = null;
    try { t = localStorage.getItem(AUTH_KEY); e = localStorage.getItem(EMAIL_KEY); } catch (err) {}
    if (t && e) {
      token = t; email = e;
      apiCall("GET", "/api/profile").then(function (p) {
        if (p.ok) { profile = p.profile; setAuthUI(); }
        else clearSession();
      });
    }
    setAuthUI();
  }

  /* =========================================================
     动态（朋友圈）
     ========================================================= */
  var composer = document.getElementById("composer");
  var guestHint = document.getElementById("guestHint");
  var postText = document.getElementById("postText");
  var postCount = document.getElementById("postCount");
  var postSend = document.getElementById("postSend");
  var feedEl = document.getElementById("feed");
  var compDot = document.getElementById("compDot");
  var compWho = document.getElementById("compWho");
  var feedCache = [];

  function renderComposer() {
    if (!composer) return;
    if (email) {
      composer.hidden = false;
      guestHint.hidden = true;
      compDot.textContent = (profile.nick || email.slice(0, 1)).slice(0, 1).toUpperCase();
      compWho.textContent = profile.nick || email.split("@")[0];
    } else {
      composer.hidden = true;
      guestHint.hidden = false;
    }
  }
  function renderFeed() {
    if (!feedEl) return;
    if (!feedCache.length) {
      feedEl.innerHTML = '<p class="feed-empty">暂无动态</p>';
      return;
    }
    feedEl.innerHTML = feedCache.map(function (p) {
      var own = !!p.owner;
      return "" +
        '<div class="feed-item">' +
          '<div class="fi-head"><span class="fi-ava">' + esc((p.nick || "?").slice(0, 1).toUpperCase()) + "</span>" +
          '<span class="fi-name">' + esc(p.nick || "用户") + "</span>" +
          '<span class="fi-time">' + esc(p.date || "") + "</span></div>" +
          '<p class="fi-text">' + esc(p.content) + "</p>" +
          (own ? '<button class="fi-del" data-id="' + p.id + '" type="button">删除</button>' : "") +
        "</div>";
    }).join("");
    feedEl.querySelectorAll(".fi-del").forEach(function (b) {
      b.addEventListener("click", function () {
        apiCall("DELETE", "/api/posts", { id: parseInt(b.getAttribute("data-id"), 10) }).then(function (j) {
          if (j.list) { feedCache = j.list; renderFeed(); renderComposer(); toast("已删除", "ok"); }
          else toast("删除失败", "err");
        });
      });
    });
  }
  function loadFeed() {
    fetch(API + "/posts", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.list) { feedCache = j.list; renderFeed(); }
    }).catch(function () {});
  }
  if (postText) {
    postText.addEventListener("input", function () {
      postCount.textContent = postText.value.length + " / 2000";
    });
    postSend.addEventListener("click", function () {
      var c = (postText.value || "").trim();
      if (!c) { toast("写点什么再发吧", "err"); return; }
      postSend.disabled = true;
      apiCall("POST", "/api/posts", { content: c }).then(function (j) {
        if (j.list) {
          postText.value = ""; postCount.textContent = "0 / 2000";
          feedCache = j.list; renderFeed(); toast("已发布", "ok");
        } else { toast(j.error || "发布失败", "err"); }
      }).finally(function () { postSend.disabled = false; });
    });
  }

  /* ---------- 启动 ---------- */
  initSession();
  loadFeed();
  renderComposer();
})();
