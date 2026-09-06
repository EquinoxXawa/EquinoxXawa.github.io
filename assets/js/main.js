/* =========================================================
   EquinoxX · PhantomBlog — 前端脚本
   主题切换 / 移动导航 / 滚动效果 / JSON 内容渲染
   ========================================================= */
(function () {
  "use strict";

  var doc = document.documentElement;

  /* ---------- 主题 ---------- */
  var themeBtn = document.getElementById("themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
      doc.setAttribute("data-theme", next);
      try { localStorage.setItem("eqx-theme", next); } catch (e) {}
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

  /* ---------- 滚动：导航底色 / 回到顶部 ---------- */
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
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
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* ---------- 文章渲染 ---------- */
  var postList = document.getElementById("postList");
  function renderPosts(list) {
    if (!postList) return;
    if (!Array.isArray(list) || list.length === 0) {
      postList.innerHTML =
        '<p class="state-note">还没有文章——第一篇正在路上。</p>';
      return;
    }
    // 按日期从新到旧
    var sorted = list
      .slice()
      .sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
    var html = "";
    sorted.forEach(function (p, i) {
      html +=
        '<article class="post-card reveal" data-d="' + (i % 3 + 1) + '">' +
          '<span class="post-no">' + pad(i + 1) + "</span>" +
          '<div class="post-meta">' +
            "<time>" + esc(p.date || "日期待定") + "</time>" +
            '<span class="dot">·</span>' +
            '<span class="post-cat">' + esc(p.category || "未分类") + "</span>" +
          "</div>" +
          '<h3 class="post-title">' + esc(p.title || "无标题") + "</h3>" +
          '<p class="post-desc">' + esc(p.desc || "") + "</p>" +
        "</article>";
    });
    postList.innerHTML = html;
    observeReveals(postList);
  }
  function postFail(err) {
    console.error("文章加载失败:", err);
    if (postList)
      postList.innerHTML =
        '<p class="state-note">文章加载失败……请在 data/posts.json 中检查内容格式。</p>';
  }

  /* ---------- 留言渲染 ---------- */
  var commentList = document.getElementById("commentList");
  var PALETTE = [
    ["#6366f1", "#8b5cf6"],
    ["#0ea5e9", "#22d3ee"],
    ["#f59e0b", "#f97316"],
    ["#ec4899", "#f43f5e"],
    ["#10b981", "#34d399"],
    ["#8b5cf6", "#d946ef"],
  ];
  function hashName(s) {
    var h = 0;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }
  function renderComments(list) {
    if (!commentList) return;
    if (!Array.isArray(list) || list.length === 0) {
      commentList.innerHTML =
        '<p class="state-note">还没有留言，来抢个沙发吧～</p>';
      return;
    }
    var html = "";
    list.forEach(function (c) {
      var name = esc(c.username || "匿名用户");
      var colors = PALETTE[hashName(name) % PALETTE.length];
      html +=
        '<div class="comment-card reveal">' +
          '<div class="comment-head">' +
            '<span class="c-avatar" style="background:linear-gradient(135deg,' +
              colors[0] + "," + colors[1] + ')">' +
              esc((c.username || "匿").slice(0, 1)) +
            "</span>" +
            '<div><div class="c-name">' + name + "</div>" +
            '<div class="c-date">' + esc(c.date || "") + "</div></div>" +
          "</div>" +
          '<p class="c-text">' + esc(c.content || "") + "</p>" +
        "</div>";
    });
    commentList.innerHTML = html;
    observeReveals(commentList);
  }
  function commentFail(err) {
    console.error("留言加载失败:", err);
    if (commentList)
      commentList.innerHTML =
        '<p class="state-note">留言加载失败……请在 data/comments.json 中检查内容格式。</p>';
  }

  function loadJSON(url, ok, fail) {
    fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(ok)
      .catch(fail);
  }

  /* ---------- 复制邮箱 ---------- */
  var copyBtn = document.getElementById("copyBtn");
  var copyLabel = document.getElementById("copyLabel");
  var EMAIL = "EquinoxX1337@163.com";
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      function done(ok) {
        if (copyLabel) {
          copyLabel.textContent = ok ? "已复制 ✓" : "复制失败，请手动复制";
        }
        setTimeout(function () {
          if (copyLabel) copyLabel.textContent = "复制邮箱";
        }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(false); });
      } else {
        // 老浏览器回退
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
        } catch (e) {
          done(false);
        }
      }
    });
  }

  /* ---------- 年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 初始化数据 ---------- */
  loadJSON("./data/posts.json", renderPosts, postFail);
  loadJSON("./data/comments.json", renderComments, commentFail);
})();
