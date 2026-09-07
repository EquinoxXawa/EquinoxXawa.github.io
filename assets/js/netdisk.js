/* =========================================================
   netdisk.js — 个人网盘（站长专属）
   两级验证：账号+密码 → 二级密码；文件存服务器
   ========================================================= */
(function () {
  "use strict";
  var API = "./api";
  var S1 = "eqx-drive-s1";
  var DT = "eqx-drive-dt";
  var overlay = document.getElementById("netOverlay");
  var body = document.getElementById("netBody");
  var stateEl = document.getElementById("netState");
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  function toast(msg, type) { if (window.__toast) window.__toast(msg, type); }
  function st1() { try { return sessionStorage.getItem(S1); } catch (e) { return null; } }
  function dtok() { try { return sessionStorage.getItem(DT); } catch (e) { return null; } }
  function setSt1(v) { try { v ? sessionStorage.setItem(S1, v) : sessionStorage.removeItem(S1); } catch (e) {} }
  function setDt(v) { try { v ? sessionStorage.setItem(DT, v) : sessionStorage.removeItem(DT); } catch (e) {} }

  function fieldHTML(k, label, type, val, ph, id) {
    return '<label class="auth-field"><span class="auth-label">' + label + "</span><input id=\"" + (id || k) + '" type="' + type + '" value="' + esc(val || "") + '" placeholder="' + esc(ph || "") + '" autocomplete="off" /></label>';
  }

  function renderLogin(err) {
    if (stateEl) stateEl.textContent = "";
    body.innerHTML =
      '<p class="auth-hint" style="margin-top:0">站长专属 · 访客无需使用</p>' +
      fieldHTML("u", "账号", "text", "EquinoxX", "站长账号") +
      fieldHTML("p", "密码", "password", "", "站长密码") +
      '<p class="auth-err">' + esc(err || "") + "</p>" +
      '<button class="btn primary auth-submit" id="nlGo" type="button"><span>进入</span></button>';
    document.getElementById("nlGo").addEventListener("click", doLogin);
    body.addEventListener("keydown", function (h) {
      if (h.key === "Enter") { h.preventDefault(); doLogin(); }
    });
  }
  function doLogin() {
    var err = body.querySelector(".auth-err");
    var u = body.querySelector("#u").value.trim();
    var p = body.querySelector("#p").value;
    err.textContent = "";
    if (!u || !p) { err.textContent = "请输入账号和密码"; return; }
    var btn = body.querySelector("#nlGo");
    btn.innerHTML = '<span class="spinner"></span>';
    fetch(API + "/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: u, pass: p }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok && j.token) { setSt1(j.token); renderCode(""); }
      else if (j.error) renderLogin(j.error);
      else renderLogin("账号或密码不对");
    }).catch(function () { renderLogin("连不上服务器（主站可用）"); });
  }

  function renderCode(err) {
    if (stateEl) stateEl.textContent = "二级验证";
    body.innerHTML =
      '<p class="auth-hint" style="margin-top:0">二级密码（仅站长本人使用）</p>' +
      fieldHTML("code", "二级密码", "password", "", "二级密码") +
      '<p class="auth-err">' + esc(err || "") + "</p>" +
      '<button class="btn primary auth-submit" id="ncGo" type="button"><span>解锁网盘</span></button>';
    document.getElementById("ncGo").addEventListener("click", doCode);
    body.addEventListener("keydown", function (h) {
      if (h.key === "Enter") { h.preventDefault(); doCode(); }
    });
  }
  function doCode() {
    var err = body.querySelector(".auth-err");
    var code = body.querySelector("#code").value;
    err.textContent = "";
    if (!code) { err.textContent = "请输入二级密码"; return; }
    var btn = body.querySelector("#ncGo");
    btn.innerHTML = '<span class="spinner"></span>';
    fetch(API + "/drive/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + (st1() || "") },
      body: JSON.stringify({ code: code }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok && j.token) { setSt1(null); setDt(j.token); showDrive(); }
      else if (j.error && j.error === "unauthorized") { setSt1(null); renderLogin("验证过期，请重新登录"); }
      else renderCode("二级密码不对");
    }).catch(function () { renderCode("连不上服务器"); });
  }

  function fmtSize(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  }
  function api(m, p, bodyObj) {
    var opt = { method: m, headers: { "Content-Type": "application/json", "X-Drive-Token": dtok() || "" } };
    if (bodyObj !== undefined) opt.body = JSON.stringify(bodyObj);
    return fetch(API + p, opt).then(function (r) { return r.json(); });
  }
  function showDrive() {
    if (stateEl) stateEl.textContent = "已解锁";
    renderDrive();
  }
  function renderDrive() {
    body.innerHTML =
      '<div class="drive-bar">' +
        '<button class="btn primary" id="upBtn" type="button">上传文件</button>' +
        '<span class="drive-note">上限 10MB / 300 个</span>' +
        '<input type="file" id="upFile" hidden />' +
      "</div>" +
      '<div class="drive-list" id="driveList"><p class="feed-empty">加载中…</p></div>';
    document.getElementById("upBtn").addEventListener("click", function () {
      document.getElementById("upFile").click();
    });
    var fileInput = document.getElementById("upFile");
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) { toast("文件超过 10MB", "err"); fileInput.value = ""; return; }
      var btn = document.getElementById("upBtn");
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;
      fetch(API + "/drive/upload", {
        method: "POST",
        headers: { "X-Drive-Token": dtok() || "", "X-File-Name": encodeURIComponent(f.name) },
        body: f,
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j.files) { renderList(j.files); toast("上传成功：" + f.name, "ok"); }
        else { toast(j.error || "上传失败", "err"); }
      }).catch(function () { toast("上传失败", "err"); })
        .finally(function () {
          btn.innerHTML = "上传文件"; btn.disabled = false;
          fileInput.value = "";
        });
    });
    loadList();
  }
  function loadList() {
    api("GET", "/drive/list").then(function (j) {
      if (j.ok) renderList(j.files || []);
      else if (j.error === "unauthorized") { setDt(null); open(); toast("解锁已过期，请重新验证", "err"); }
    }).catch(function () {});
  }
  function renderList(files) {
    var box = document.getElementById("driveList");
    if (!box) return;
    if (!files.length) { box.innerHTML = '<p class="feed-empty">还没有文件</p>'; return; }
    box.innerHTML = files.map(function (f) {
      return '<div class="drive-item">' +
        '<span class="drive-name">' + esc(f.name) + "</span>" +
        '<span class="drive-meta">' + fmtSize(f.size) + " · " + esc(f.date) + "</span>" +
        '<span class="drive-act">' +
          '<button class="tb-chip" data-d="1" data-id="' + f.id + '" type="button">下载</button>' +
          '<button class="tb-chip" data-d="0" data-id="' + f.id + '" type="button" style="color:#f87171">删除</button>' +
        "</span>" +
      "</div>";
    }).join("");
    box.querySelectorAll("[data-d]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-id");
        if (b.getAttribute("data-d") === "1") dl(id);
        else if (window.confirm("确定删除这个文件？")) {
          api("POST", "/drive/del", { id: id }).then(function (j) {
            if (j.ok) { renderList(j.files || []); toast("已删除", "ok"); }
            else toast("删除失败", "err");
          });
        }
      });
    });
  }
  function dl(id) {
    var name = "file";
    var meta = document.querySelectorAll(".drive-item");
    meta.forEach(function (it) {
      if (it.querySelector("[data-d=\"1\"]").getAttribute("data-id") === id) {
        name = it.querySelector(".drive-name").textContent;
      }
    });
    fetch(API + "/drive/file?id=" + encodeURIComponent(id), {
      headers: { "X-Drive-Token": dtok() || "" },
    }).then(function (r) {
      if (!r.ok) throw 0;
      return r.blob();
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }).catch(function () { toast("下载失败", "err"); });
  }

  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    if (dtok()) { showDrive(); }
    else if (st1()) { renderCode(""); }
    else renderLogin("");
  }
  function close() { overlay.hidden = true; document.body.style.overflow = ""; }

  document.querySelectorAll(".net-close").forEach(function (b) { b.addEventListener("click", close); });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  var netBtn = document.getElementById("netBtn");
  var mobileNet = document.getElementById("mobileNet");
  if (netBtn) netBtn.addEventListener("click", open);
  if (mobileNet) mobileNet.addEventListener("click", open);
})();
