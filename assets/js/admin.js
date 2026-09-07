/* =========================================================
   admin.js — 站长后台
   站长账号+密码 → 二级密码 → 总览/用户/动态/网盘 管理
   ========================================================= */
(function () {
  "use strict";
  var API = "./api";
  var overlay = document.getElementById("admOverlay");
  var body = document.getElementById("admBody");
  var stateEl = document.getElementById("admState");
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  function toast(msg, type) { if (window.__toast) window.__toast(msg, type); }
  function g(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) {} }
  function tok() { return g("eqx-admin"); }
  function fieldHTML(id, label, type, val, ph) {
    return '<label class="auth-field"><span class="auth-label">' + label + '</span><input id="' + id + '" type="' + type + '" value="' + esc(val || "") + '" placeholder="' + esc(ph || "") + '" autocomplete="off" /></label>';
  }
  function api(m, p, o) {
    var opt = { method: m, headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tok() || "") } };
    if (o !== undefined) opt.body = JSON.stringify(o);
    return fetch(API + p, opt).then(function (r) { return r.json(); });
  }

  function gate(err) {
    if (stateEl) stateEl.textContent = "";
    body.innerHTML =
      fieldHTML("au", "站长账号", "text", "EquinoxX") +
      fieldHTML("ap", "站长密码", "password", "", "密码") +
      '<p class="auth-err">' + esc(err || "") + "</p>" +
      '<button class="btn primary auth-submit" id="agGo" type="button"><span>下一步</span></button>';
    document.getElementById("agGo").addEventListener("click", step1);
    body.addEventListener("keydown", function (h) { if (h.key === "Enter") { h.preventDefault(); step1(); } });
  }
  function step1() {
    var e = body.querySelector(".auth-err");
    var u = body.querySelector("#au").value.trim();
    var p = body.querySelector("#ap").value;
    e.textContent = "";
    if (!u || !p) { e.textContent = "请输入账号密码"; return; }
    var b = body.querySelector("#agGo");
    b.innerHTML = '<span class="spinner"></span>';
    fetch(API + "/owner/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: u, pass: p }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok && j.token) {
        s("eqx-own1", j.token);
        step2("");
      } else if (j.error) gate(j.error);
      else gate("账号或密码不对");
    }).catch(function () { gate("连不上服务器（主站可用）"); });
  }
  function step2(err) {
    if (stateEl) stateEl.textContent = "二级验证";
    body.innerHTML =
      fieldHTML("ac", "二级密码", "password", "", "二级密码（仅站长）") +
      '<p class="auth-err">' + esc(err || "") + "</p>" +
      '<button class="btn primary auth-submit" id="agGo2" type="button"><span>进入后台</span></button>';
    document.getElementById("agGo2").addEventListener("click", function () { doCode(); });
    body.addEventListener("keydown", function (h) { if (h.key === "Enter") { h.preventDefault(); doCode(); } });
  }
  function doCode() {
    var e = body.querySelector(".auth-err");
    var code = body.querySelector("#ac").value;
    e.textContent = "";
    if (!code) { e.textContent = "请输入二级密码"; return; }
    var b = body.querySelector("#agGo2");
    b.innerHTML = '<span class="spinner"></span>';
    fetch(API + "/admin/token", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (g("eqx-own1") || "") },
      body: JSON.stringify({ code: code }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok && j.token) { s("eqx-own1", null); s("eqx-admin", j.token); dash("overview"); }
      else if (j.error === "unauthorized") { s("eqx-own1", null); gate("验证过期，请重新登录"); }
      else step2("二级密码不对");
    }).catch(function () { step2("连不上服务器"); });
  }

  function dash(tab) {
    if (stateEl) stateEl.textContent = "已登录";
    body.innerHTML =
      '<div class="adm-tabs">' +
        '<button class="tb-chip' + (tab === "overview" ? " is-on" : "") + '" data-tab="overview">总览</button>' +
        '<button class="tb-chip' + (tab === "users" ? " is-on" : "") + '" data-tab="users">用户</button>' +
        '<button class="tb-chip' + (tab === "posts" ? " is-on" : "") + '" data-tab="posts">动态</button>' +
        '<button class="tb-chip' + (tab === "drive" ? " is-on" : "") + '" data-tab="drive">网盘</button>' +
        '<button class="tb-chip adm-out" type="button">退出</button>' +
      "</div>" +
      '<div class="adm-content" id="admContent"><p class="feed-empty">加载中…</p></div>';
    body.querySelector(".adm-tabs").addEventListener("click", function (e) {
      var c = e.target.closest(".adm-out");
      if (c) { s("eqx-admin", null); toast("已退出后台", "ok"); close(); return; }
      var t = e.target.closest("[data-tab]");
      if (t) {
        body.querySelectorAll("[data-tab]").forEach(function (x) { x.classList.toggle("is-on", x === t); });
        loadTab(t.getAttribute("data-tab"));
      }
    });
    loadTab(tab);
  }
  function loadTab(tab) {
    var c = document.getElementById("admContent");
    if (!c) return;
    if (tab === "overview") {
      api("GET", "/admin/overview").then(function (j) {
        if (!j.ok) return needReauth();
        var o = j.overview;
        c.innerHTML = '<div class="adm-stats">' +
          stat("用户", o.users) + stat("动态", o.posts) + stat("今日动态", o.todayPosts) +
          stat("网盘文件", o.drive) + stat("网盘占用", fmt(o.driveBytes)) + stat("累计访问", o.visits) +
          "</div>";
      }).catch(needReauth);
    } else if (tab === "users") {
      api("GET", "/admin/users").then(function (j) {
        if (!j.ok) return needReauth();
        if (!j.users.length) { c.innerHTML = '<p class="feed-empty">暂无注册用户</p>'; return; }
        c.innerHTML = j.users.map(function (u) {
          return '<div class="adm-item"><div class="adm-ii"><b>' + esc(u.nick) + "</b><span>" + esc(u.email) + "</span></div>" +
            '<span class="adm-sub">' + esc(u.created || "") + "</span>" +
            '<button class="tb-chip" data-adel="user" data-em="' + esc(u.email) + '" type="button" style="color:#f87171">删除用户</button></div>';
        }).join("");
        bindDel("user");
      }).catch(needReauth);
    } else if (tab === "posts") {
      api("GET", "/admin/posts").then(function (j) {
        if (!j.ok) return needReauth();
        if (!j.posts.length) { c.innerHTML = '<p class="feed-empty">暂无动态</p>'; return; }
        c.innerHTML = j.posts.map(function (p) {
          return '<div class="adm-item"><div class="adm-ii"><b>' + esc(p.nick) + "</b><span>" + esc(p.email) + " · " + esc(p.date) + "</span></div>" +
            '<p class="adm-txt">' + esc(p.content) + "</p>" +
            '<button class="tb-chip" data-adel="post" data-id="' + p.id + '" type="button" style="color:#f87171">删除动态</button></div>';
        }).join("");
        bindDel("post");
      }).catch(needReauth);
    } else if (tab === "drive") {
      api("GET", "/admin/drive").then(function (j) {
        if (!j.ok) return needReauth();
        if (!j.files.length) { c.innerHTML = '<p class="feed-empty">网盘无文件</p>'; return; }
        c.innerHTML = j.files.map(function (f) {
          return '<div class="adm-item"><div class="adm-ii"><b>' + esc(f.name) + "</b></div>" +
            '<span class="adm-sub">' + fmt(f.size) + " · " + esc(f.date) + "</span>" +
            '<button class="tb-chip" data-adel="drive" data-id="' + f.id + '" type="button" style="color:#f87171">删除文件</button></div>';
        }).join("");
        bindDel("drive");
      }).catch(needReauth);
    }
  }
  function stat(k, v) {
    return '<div class="adm-stat"><b>' + v + "</b><span>" + k + "</span></div>";
  }
  function fmt(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  }
  function bindDel(kind) {
    var c = document.getElementById("admContent");
    c.querySelectorAll("[data-adel]").forEach(function (b) {
      b.addEventListener("click", function () {
        var conf = kind === "user" ? "删除该用户及其全部动态？" : kind === "post" ? "删除这条动态？" : "删除这个网盘文件？";
        if (!window.confirm(conf)) return;
        var p = kind === "user" ? "/admin/user-del" : kind === "post" ? "/admin/post-del" : "/admin/drive-del";
        var o = kind === "user" ? { email: b.getAttribute("data-em") } : { id: b.getAttribute("data-id") };
        api("POST", p, o).then(function (j) {
          if (j.ok) { toast("已删除", "ok"); loadTab(kind === "user" ? "users" : kind === "post" ? "posts" : "drive"); }
          else toast("操作失败", "err");
        }).catch(needReauth);
      });
    });
  }
  function needReauth() {
    s("eqx-admin", null);
    gate("登录已失效，请重新验证");
  }
  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    if (tok()) dash("overview");
    else if (g("eqx-own1")) step2("");
    else gate("");
  }
  function close() { overlay.hidden = true; document.body.style.overflow = ""; }

  document.querySelectorAll(".adm-close").forEach(function (b) { b.addEventListener("click", close); });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  var admBtn = document.getElementById("admBtn");
  var mobileAdm = document.getElementById("mobileAdm");
  if (admBtn) admBtn.addEventListener("click", open);
  if (mobileAdm) mobileAdm.addEventListener("click", open);
})();
