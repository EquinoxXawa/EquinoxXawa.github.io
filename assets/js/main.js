/* =========================================================
   main.js — 页面逻辑：主题 / 导航 / 打字机 / 匿名问答（含站长管理）/ 访客计数
   问答走同源 /api（服务器版）；GitHub Pages 备份自动降级为只读
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
  function rain() { if (window.FX) window.FX.rain(2.8); }
  function burstCenter() { if (window.FX) window.FX.burst(window.innerWidth / 2, window.innerHeight * 0.5, 70); }
  var confettiBtn = document.getElementById("confettiBtn");
  var confettiCta = document.getElementById("confettiCta");
  if (confettiBtn) confettiBtn.addEventListener("click", rain);
  if (confettiCta) confettiCta.addEventListener("click", rain);

  /* ---------- 滚动显现 ---------- */
  var revealObserver = null;
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          revealObserver.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { revealObserver.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
  function observeReveals(scope) {
    if (!revealObserver) return;
    scope.querySelectorAll(".reveal:not(.in)").forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var PALETTE = [
    ["#6366f1", "#8b5cf6"], ["#0ea5e9", "#22d3ee"], ["#f59e0b", "#f97316"],
    ["#ec4899", "#f43f5e"], ["#10b981", "#34d399"], ["#8b5cf6", "#d946ef"],
  ];
  function hashStr(s) {
    var h = 0; s = String(s || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function gradFor(key) {
    var c = PALETTE[hashStr(key) % PALETTE.length];
    return "linear-gradient(135deg," + c[0] + "," + c[1] + ")";
  }

  /* ---------- 打字机 ---------- */
  var typeEl = document.getElementById("typeText");
  var LINES = [
    "白天写代码，晚上开镜",
    "Apex / COD / CS2 / Deadlock 常驻",
    "写点代码笔记、游戏心得和碎碎念",
    "欢迎光临我的 PhantomBlog",
  ];
  if (typeEl) {
    var li = 0, ci = 0, deleting = false;
    (function tick() {
      var line = LINES[li];
      if (!deleting) {
        ci++;
        if (ci >= line.length) { deleting = true; setTimeout(tick, 2000); return; }
      } else {
        ci--;
        if (ci <= 0) { deleting = false; li = (li + 1) % LINES.length; setTimeout(tick, 260); return; }
      }
      typeEl.textContent = line.slice(0, ci);
      setTimeout(tick, deleting ? 32 : 58);
    })();
  }

  /* =========================================================
     匿名问答 + 站长管理
     ========================================================= */
  var API = "./api";
  var MAIN_URL = "http://103.236.97.213:38090";
  var ADMIN_KEY = "pb-admin-token";

  var qaList = document.getElementById("qaList");
  var qaForm = document.getElementById("qaForm");
  var qaName = document.getElementById("qaName");
  var qaContent = document.getElementById("qaContent");
  var qaSend = document.getElementById("qaSend");
  var qaStatus = document.getElementById("qaStatus");

  var adminToggle = document.getElementById("adminToggle");
  var adminPanel = document.getElementById("adminPanel");
  var adminPass = document.getElementById("adminPass");
  var adminUnlock = document.getElementById("adminUnlock");
  var adminLock = document.getElementById("adminLock");
  var adminStatus = document.getElementById("adminStatus");

  var liveMode = false;
  var adminToken = null;

  function getStoredToken() {
    try { return localStorage.getItem(ADMIN_KEY); } catch (e) { return null; }
  }
  function storeToken(t) {
    adminToken = t || null;
    try {
      if (t) localStorage.setItem(ADMIN_KEY, t);
      else localStorage.removeItem(ADMIN_KEY);
    } catch (e) {}
  }

  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg || "";
    el.className = "qa-status" + (type ? " " + type : "");
  }
  function setReadOnly(reason) {
    liveMode = false;
    adminToken = null;
    if (qaForm) {
      [].forEach.call(qaForm.querySelectorAll("input, textarea, button"), function (el) { el.disabled = true; });
    }
    if (adminToggle) adminToggle.hidden = true;
    if (adminPanel) adminPanel.hidden = true;
    setStatus(qaStatus, reason || "只读预览：这是 GitHub Pages 备份，互动请访问主站", "err");
  }

  function qaItemHTML(e) {
    var name = e.name || "匿名用户";
    var anon = !!e.anon || !e.name;
    var letter = anon ? "?" : esc(String(name).slice(0, 1));
    var key = (e.id != null ? e.id : Math.random()) + ":" + name;
    var replyBlock = "";
    if (e.reply && e.reply.text) {
      replyBlock =
        '<div class="qa-reply">' +
          '<div class="qa-reply-head">站长回复<span class="qa-reply-date">' + esc(e.reply.date || "") + "</span></div>" +
          '<p class="qa-reply-text">' + esc(e.reply.text) + "</p>" +
        "</div>";
    }
    var adminOps = "";
    if (adminToken) {
      adminOps =
        '<div class="qa-admin-ops">' +
          '<button type="button" class="qa-mini-btn" data-act="reply" data-id="' + e.id + '">回复</button>' +
          (e.reply && e.reply.text
            ? '<button type="button" class="qa-mini-btn" data-act="delreply" data-id="' + e.id + '">删除回复</button>' : "") +
          '<button type="button" class="qa-mini-btn danger" data-act="del" data-id="' + e.id + '">删除此条</button>' +
        "</div>";
    }
    return (
      '<div class="qa-item reveal" data-id="' + e.id + '">' +
        '<div class="qa-head">' +
          '<span class="qa-ava" style="background:' + gradFor(key) + '">' + letter + "</span>" +
          '<span class="qa-name">' + esc(name) + "</span>" +
          (anon ? '<span class="qa-pill">匿名</span>' : "") +
          '<span class="qa-date">' + esc(e.date || "") + "</span>" +
        "</div>" +
        '<p class="qa-text">' + esc(e.content || "") + "</p>" +
        replyBlock +
        adminOps +
        '<div class="qa-reply-editor" hidden>' +
          '<div class="qa-replybox">' +
            '<textarea rows="2" maxlength="400" placeholder="以站长身份回复（最多 400 字）"></textarea>' +
            '<button type="button" class="btn btn-primary btn-sm" data-act="sendreply" data-id="' + e.id + '">发出回复</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="cancelreply" data-id="' + e.id + '">取消</button>' +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderQA(list) {
    if (!qaList) return;
    if (!Array.isArray(list) || list.length === 0) {
      qaList.innerHTML = '<p class="state-note">还没有留言，来问第一个问题吧。</p>';
      return;
    }
    qaList.innerHTML = list.map(qaItemHTML).join("");
    observeReveals(qaList);
  }

  /* ---------- API ---------- */
  function api(method, path, bodyObj) {
    var opts = {
      method: method,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    };
    if (adminToken) opts.headers.Authorization = "Bearer " + adminToken;
    if (bodyObj !== undefined) opts.body = JSON.stringify(bodyObj);
    return fetch(API + path, opts).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var err = new Error(j.error || "HTTP " + r.status);
          err.status = r.status;
          err.json = j;
          throw err;
        }
        return j;
      });
    });
  }

  function reloadQA() {
    return api("GET", "/qa").then(function (j) {
      liveMode = true;
      renderQA(j.list || []);
    });
  }

  /* ---------- 初始化 ---------- */
  function initQA() {
    if (!qaList) return;
    // 先试着带已有 token 验证管理员身份
    var stored = getStoredToken();
    if (stored) adminToken = stored;
    reloadQA()
      .then(function () {
        // live；若带 token，校验是否仍有效
        if (stored) {
          fetch(API + "/authcheck", { headers: { Authorization: "Bearer " + stored } })
            .then(function (r) { return r.json(); })
            .then(function (j) { if (!j.ok) { storeToken(null); adminLockState(); } })
            .catch(function () { storeToken(null); adminLockState(); });
        }
      })
      .catch(function () {
        // 无后端：降级只读（读本地 comments.json 旧留言）
        renderQA([]);
        fetch("./data/comments.json", { cache: "no-store" })
          .then(function (r2) { if (!r2.ok) throw 0; return r2.json(); })
          .then(function (legacy) {
            var mapped = (Array.isArray(legacy) ? legacy : []).map(function (c) {
              return { id: "f" + hashStr(c.username + c.date), name: c.username, content: c.content, date: c.date, anon: false };
            });
            renderQA(mapped);
            setReadOnly("这里是 GitHub Pages 备份（只读），到主站 " + MAIN_URL + " 可以匿名提问互动");
          })
          .catch(function () { setReadOnly(); });
      });
  }

  /* ---------- 提交问答 ---------- */
  if (qaForm) {
    qaForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var content = (qaContent.value || "").trim();
      if (!content) { setStatus(qaStatus, "写点内容再发送吧", "err"); return; }
      if (content.length > 500) { setStatus(qaStatus, "最多 500 字哦", "err"); return; }
      if (!liveMode) { setStatus(qaStatus, "备份版无法保存，去主站提问吧", "err"); return; }
      qaSend.disabled = true;
      qaSend.textContent = "发送中…";
      setStatus(qaStatus, "", "");
      api("POST", "/qa", { name: (qaName.value || "").trim(), content: content })
        .then(function (j) {
          qaContent.value = "";
          renderQA(j.list || []);
          setStatus(qaStatus, "已悄悄放上去啦", "ok");
          burstCenter();
        })
        .catch(function (err) {
          setStatus(qaStatus, err.status === 429 ? "发得太快啦，休息几秒再试" : "发送失败，稍后再试试", "err");
        })
        .finally(function () {
          qaSend.disabled = false;
          qaSend.textContent = "发送";
        });
    });
  }

  /* ---------- 管理：解锁 / 锁定 ---------- */
  function adminUnlockState() {
    if (adminToggle) adminToggle.textContent = "锁定";
    if (adminPanel) adminPanel.hidden = true;
    if (liveMode) reloadQA();
  }
  function adminLockState() {
    storeToken(null);
    if (adminToggle) adminToggle.textContent = "管理";
    if (adminPanel) adminPanel.hidden = true;
    if (qaList && liveMode) reloadQA();
    setStatus(adminStatus, "", "");
  }
  function unlockTry() {
    var secret = (adminPass.value || "").trim();
    if (!secret) { setStatus(adminStatus, "请输入口令", "err"); return; }
    setStatus(adminStatus, "验证中…", "");
    fetch(API + "/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secret }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok && j.token) {
          storeToken(j.token);
          adminPass.value = "";
          adminUnlockState();
          setStatus(adminStatus, "已解锁，可以回复或删除问答", "ok");
          setStatus(qaStatus, "", "");
        } else {
          setStatus(adminStatus, "口令不对哦", "err");
        }
      })
      .catch(function () { setStatus(adminStatus, "后端不可用", "err"); });
  }
  if (adminToggle) {
    adminToggle.addEventListener("click", function () {
      if (adminToken) { adminLockState(); return; }
      if (adminPanel) adminPanel.hidden = !adminPanel.hidden;
      if (!adminPanel.hidden && adminPass) adminPass.focus();
    });
  }
  if (adminUnlock) adminUnlock.addEventListener("click", unlockTry);
  if (adminPass) {
    adminPass.addEventListener("keydown", function (e) { if (e.key === "Enter") unlockTry(); });
  }
  if (adminLock) adminLock.addEventListener("click", function () { adminLockState(); });

  /* ---------- 管理：回复 / 删除（事件委托） ---------- */
  function apiReply(id, text) {
    return api("POST", "/qa/reply", { id: id, text: text });
  }
  function apiDel(id) { return api("POST", "/qa/del", { id: id }); }
  function apiDelReply(id) { return api("POST", "/qa/delreply", { id: id }); }

  if (qaList) {
    qaList.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-act]");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var act = btn.getAttribute("data-act");
      var item = btn.closest(".qa-item");

      if (act === "reply") {
        var editor = item && item.querySelector(".qa-reply-editor");
        if (editor) {
          editor.hidden = !editor.hidden;
          var ta = editor.querySelector("textarea");
          if (!editor.hidden && ta) ta.focus();
        }
      } else if (act === "cancelreply") {
        var ed2 = item && item.querySelector(".qa-reply-editor");
        if (ed2) ed2.hidden = true;
      } else if (act === "sendreply") {
        var ta2 = item && item.querySelector(".qa-reply-editor textarea");
        var text = (ta2 && ta2.value || "").trim();
        if (!text) return;
        btn.disabled = true;
        apiReply(parseInt(id, 10), text.slice(0, 400))
          .then(function (j) { renderQA(j.list || []); setStatus(qaStatus, "回复已发出", "ok"); })
          .catch(function () { setStatus(qaStatus, "回复失败，请重试", "err"); })
          .finally(function () { btn.disabled = false; });
      } else if (act === "del") {
        if (!window.confirm("确定删除这条问答吗？删除后无法恢复。")) return;
        apiDel(parseInt(id, 10))
          .then(function (j) { renderQA(j.list || []); setStatus(qaStatus, "已删除", "ok"); })
          .catch(function () { setStatus(qaStatus, "删除失败，请重试", "err"); });
      } else if (act === "delreply") {
        if (!window.confirm("删除这条站长回复？")) return;
        apiDelReply(parseInt(id, 10))
          .then(function (j) { renderQA(j.list || []); setStatus(qaStatus, "回复已删除", "ok"); })
          .catch(function () { setStatus(qaStatus, "操作失败，请重试", "err"); });
      }
    });
  }

  initQA();

  /* =========================================================
     访客计数
     ========================================================= */
  var badge = document.getElementById("visitBadge");
  function initVisits() {
    if (!badge) return;
    fetch(API + "/visits", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (v) {
        badge.innerHTML = "";
        [["今日访问 ", v.today || 0], ["累计访问 ", v.total || 0]].forEach(function (pair) {
          var span = document.createElement("span");
          span.innerHTML = pair[0] + "<b>" + pair[1] + "</b>";
          badge.appendChild(span);
        });
        badge.hidden = false;
        try {
          if (!sessionStorage.getItem("eqx-v")) {
            sessionStorage.setItem("eqx-v", "1");
            fetch(API + "/visits", { method: "POST" }).catch(function () {});
          }
        } catch (e) {}
      })
      .catch(function () {});
  }
  initVisits();

  /* ---------- 复制邮箱 ---------- */
  var copyBtn = document.getElementById("copyBtn");
  var copyLabel = document.getElementById("copyLabel");
  var EMAIL = "EquinoxX1337@163.com";
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      function done(ok) {
        if (copyLabel) copyLabel.textContent = ok ? "已复制" : "复制失败，请手动复制";
        setTimeout(function () { if (copyLabel) copyLabel.textContent = "复制邮箱"; }, 1800);
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
