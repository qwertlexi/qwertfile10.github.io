(function () {
  /* ── Year ── */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ════════════════════════════════════════════════════
     MARK SCRAMBLE  — fixed width, no layout shift
     cycle: normal → glitch → normal → glitch → ...
     period 10s, glitch on/off phases ~1.5s each
  ════════════════════════════════════════════════════ */
  var MARK_TARGET = "qwertlexi";
  var SCRAMBLE_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*█░▒▓?/\\";
  var SCRAMBLE_COLORS = ["#ff3b6b","#ff8c00","#ffe600","#00e5ff","#b44fff","#00ff99","#ff00cc","#39ff14","#ff6600","#00bfff"];
  function rndColor() { return SCRAMBLE_COLORS[Math.floor(Math.random() * SCRAMBLE_COLORS.length)]; }
  function rndChar()  { return SCRAMBLE_POOL.charAt(Math.floor(Math.random() * SCRAMBLE_POOL.length)); }
  function renderMarkHtml(chars, colors) {
    var h = "";
    for (var i = 0; i < chars.length; i++) {
      if (colors[i]) h += '<span style="color:' + colors[i] + '">' + chars[i] + '</span>';
      else h += chars[i];
    }
    return h;
  }

  var markEl = document.getElementById("mark-text");
  var markState = "idle"; // idle | scrambling-in | scrambling-out
  var markFrameId = null;

  function clearMarkAnim() {
    if (markFrameId) { cancelAnimationFrame(markFrameId); markFrameId = null; }
  }

  /* Scramble OUT: left→right, each char dissolves into glitch in sequence */
  function runScrambleOut(onDone) {
    var n = MARK_TARGET.length;
    var chars = MARK_TARGET.split("");
    var colors = new Array(n).fill(null);
    var unlocked = new Array(n).fill(false);
    var frame = 0;
    // stagger: char j unlocks around frame j*5
    var STAGGER = 5;
    var maxFrames = n * STAGGER + 20;

    function tick() {
      frame++;
      var done = true;
      for (var j = 0; j < n; j++) {
        if (!unlocked[j]) {
          done = false;
          if (frame >= j * STAGGER && Math.random() < 0.5) {
            unlocked[j] = true; chars[j] = rndChar(); colors[j] = rndColor();
          }
        } else {
          chars[j] = rndChar(); colors[j] = rndColor();
        }
      }
      if (frame >= maxFrames) { for (var k = 0; k < n; k++) { chars[k] = rndChar(); colors[k] = rndColor(); unlocked[k] = true; } done = true; }
      if (markEl) markEl.innerHTML = renderMarkHtml(chars, colors);
      if (!done) { markFrameId = requestAnimationFrame(tick); }
      else { markFrameId = null; if (onDone) onDone(); }
    }
    markFrameId = requestAnimationFrame(tick);
  }

  /* Scramble IN: right→left, each char resolves from glitch to correct in reverse sequence */
  function runScrambleIn(onDone) {
    var n = MARK_TARGET.length;
    var chars = new Array(n);
    var colors = new Array(n);
    var locked = new Array(n).fill(false);
    for (var i = 0; i < n; i++) { chars[i] = rndChar(); colors[i] = rndColor(); }
    var frame = 0;
    var STAGGER = 6;
    var maxFrames = n * STAGGER + 24;

    function tick() {
      frame++;
      var done = true;
      for (var j = 0; j < n; j++) {
        // Reverse: start from the rightmost char (index n-1) and work left
        var revJ = n - 1 - j;
        if (!locked[revJ]) {
          done = false;
          if (frame >= j * STAGGER && Math.random() < 0.45) {
            locked[revJ] = true; chars[revJ] = MARK_TARGET[revJ]; colors[revJ] = null;
          } else { chars[revJ] = rndChar(); colors[revJ] = rndColor(); }
        }
      }
      if (frame >= maxFrames) { for (var k = 0; k < n; k++) { locked[k] = true; chars[k] = MARK_TARGET[k]; colors[k] = null; } done = true; }
      if (markEl) markEl.innerHTML = renderMarkHtml(chars, colors);
      if (!done) { markFrameId = requestAnimationFrame(tick); }
      else { markFrameId = null; if (onDone) onDone(); }
    }
    markFrameId = requestAnimationFrame(tick);
  }

  /* Cycle: idle 7s → scramble out 1s → scramble in 1.5s → idle 7s → … total ~10s */
  function startMarkCycle() {
    if (markEl) markEl.textContent = MARK_TARGET; // show plain first

    function doGlitch() {
      clearMarkAnim();
      runScrambleOut(function () {
        // hold glitch ~300ms
        setTimeout(function () {
          runScrambleIn(function () {
            // hold normal ~7s then repeat
            setTimeout(doGlitch, 6000);
          });
        }, 300);
      });
    }
    // first glitch after 1s so page loads cleanly
    setTimeout(doGlitch, 800);
  }
  startMarkCycle();

  /* ── Chrome clock / tick ── */
  var clockEl = document.getElementById("chrome-clock");
  var tickEl  = document.getElementById("chrome-tick");
  var tickN   = 0;
  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function updateChromeClock() {
    if (!clockEl) return;
    var d = new Date();
    clockEl.textContent = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
  }
  updateChromeClock();
  setInterval(updateChromeClock, 1000);
  setInterval(function () { tickN++; if (tickEl) tickEl.textContent = "tick " + tickN; }, 380);

  /* ── Millisecond clock ── */
  var msClockEl = document.getElementById("ms-clock-time");
  function updateMsClock() {
    if (!msClockEl) return;
    var d = new Date(), ms = d.getMilliseconds();
    msClockEl.textContent = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds()) + "." + (ms < 10 ? "00" : ms < 100 ? "0" : "") + ms;
  }
  updateMsClock();
  setInterval(updateMsClock, 50);

  /* ── Sidebar metrics ── */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  var NOISE_POOL = ["low","Δ","hiss","· · ·","████","~","??","null"];
  var MODE_POOL  = ["idle","drift","scan","ghost","wait","??","void"];
  function tickMetrics() {
    document.querySelectorAll("[data-metric]").forEach(function (el) {
      var k = el.getAttribute("data-metric");
      if (k === "noise") el.textContent = pick(NOISE_POOL);
      else if (k === "latency") el.textContent = "~" + Math.floor(4 + Math.random() * 140) + "ms";
      else if (k === "mode") el.textContent = pick(MODE_POOL);
    });
  }
  tickMetrics();
  setInterval(tickMetrics, 1600 + Math.random() * 2400);

  /* ════════════════════════════════════════════════════
     MATRIX RAIN CANVAS
     Inspired by rezmason/matrix reference renderer:
     - High-DPI aware (devicePixelRatio)
     - Dense column layout matching reference screenshot
     - Classic Matrix green palette (dark theme = black bg)
     - Per-column raindrop with bright head + fading trail
     - Glow pass via shadowBlur for bloom effect
     - Authentic half-width Katakana + digits character set
  ════════════════════════════════════════════════════ */
  var canvas = document.getElementById("code-canvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");

    // Full half-width Katakana + digits — authentic film glyph set
    var CHARS = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:<>|=+-*";

    // Cell size 20px = film-accurate large glyph density
    var FS = 36;
    var cols = [];
    var raf;
    var DPR = 1; // will be set in initMatrix

    // Theme-aware background. Dark = #000000 (pure black like the film)
    // Light = teal (#7fd9d0) — we store as [r,g,b]
    window._matrixBg = [0, 0, 0];
    window._matrixDark = true;

    // Palette inspired by reference config (classic version):
    // hsl(0.3, 0.9, 0.0)→(0.3,0.9,0.2)→(0.3,0.9,0.7)→(0.3,0.9,0.8)
    // = dark green → mid green → bright green → near-white green
    // Dark theme: classic Matrix green on black
    // Light theme: WHITE characters with glow on teal bg
    function getHeadColor(isDark) {
      return isDark ? { r:180, g:255, b:180 } : { r:255, g:255, b:255 };
    }
    function getMidColor(isDark) {
      return isDark ? { r:0, g:200, b:60 } : { r:200, g:255, b:250 };
    }
    function getDimColor(isDark) {
      return isDark ? { r:0, g:80, b:20 } : { r:100, g:180, b:170 };
    }

    function initMatrix() {
      DPR = window.devicePixelRatio || 1;
      var cssW = window.innerWidth;
      var cssH = window.innerHeight;
      canvas.width  = Math.round(cssW * DPR);
      canvas.height = Math.round(cssH * DPR);
      canvas.style.width  = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(1,0,0,1,0,0);
      ctx.scale(DPR, DPR);

      var numCols = Math.ceil(cssW / FS);
      cols = [];
      for (var i = 0; i < numCols; i++) {
        cols.push(makeCol(cssH, true));
      }
    }

    function makeCol(h, scatter) {
      var trailLen = Math.floor(12 + Math.random() * 26); // longer trails = denser look
      return {
        y: scatter ? (Math.random() * h * 1.5 - h * 0.5) : -FS * (2 + Math.random() * 8),
        speed: 0.7 + Math.random() * 2.2,
        trailLen: trailLen,
        trail: [],
        // Random char mutation timer per-col
        muteTick: 0,
        muteRate: Math.floor(2 + Math.random() * 4),
        // Rare bright/white columns
        bright: Math.random() < 0.12,
      };
    }

    function rndChar() {
      return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }

    function drawMatrix() {
      var cssW = canvas.width / DPR;
      var cssH = canvas.height / DPR;
      var isDark = window._matrixDark !== false;
      var bgArr  = window._matrixBg || [0, 0, 0];

      // Dark: semi-transparent fade = motion blur trails (~0.055 alpha)
      // Light: full clear each frame (prevents stripe artefacts), trails drawn via alpha
      ctx.fillStyle = "rgba(" + bgArr[0] + "," + bgArr[1] + "," + bgArr[2] + (isDark ? ",0.055)" : ",1)");
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.font      = FS + "px 'Courier Prime','Cutive Mono',monospace";
      ctx.textBaseline = "top";

      var head = getHeadColor(isDark);
      var mid  = getMidColor(isDark);
      var dim  = getDimColor(isDark);

      for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        var x   = i * FS;

        col.muteTick++;
        if (col.muteTick >= col.muteRate) {
          col.muteTick = 0;
          col.trail.push(rndChar());
          if (col.trail.length > col.trailLen) col.trail.shift();
        }
        if (col.trail.length === 0) col.trail.push(rndChar());

        var tLen = col.trail.length;

        for (var t = 0; t < tLen; t++) {
          var gy = col.y - (tLen - 1 - t) * FS;
          if (gy < -FS || gy > cssH) continue;

          var frac = t / Math.max(1, tLen - 1);
          var r, g, b, alpha;

          // On light theme: no inline shadowBlur (causes stripe artefacts).
          // Glow is added in a separate second pass below.
          if (t === tLen - 1) {
            // HEAD
            r = col.bright ? 255 : head.r;
            g = col.bright ? 255 : head.g;
            b = col.bright ? 255 : head.b;
            alpha = 1.0;
            ctx.shadowColor = isDark ? "rgba(100,255,140,1)" : "rgba(255,255,255,1)";
            ctx.shadowBlur = isDark ? 14 : 20;
          } else if (t >= tLen - 4) {
            // NEAR-HEAD
            var nf = (t - (tLen - 4)) / 3;
            r = Math.round(mid.r + nf * (head.r - mid.r));
            g = Math.round(mid.g + nf * (head.g - mid.g));
            b = Math.round(mid.b + nf * (head.b - mid.b));
            alpha = 0.5 + nf * 0.5;
            ctx.shadowColor = isDark ? "rgba(0,255,80,0.6)" : "rgba(255,255,255,0.75)";
            ctx.shadowBlur = isDark ? 7 : 10;
          } else {
            // TRAIL BODY
            var tf = frac * frac;
            r = Math.round(dim.r + tf * (mid.r - dim.r));
            g = Math.round(dim.g + tf * (mid.g - dim.g));
            b = Math.round(dim.b + tf * (mid.b - dim.b));
            alpha = isDark ? (0.06 + tf * 0.65) : (0.1 + tf * 0.7);
          }

          ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
          ctx.fillText(col.trail[t], x, gy);
          ctx.shadowBlur = 0;
        }

        col.y += col.speed;
        if (col.y > cssH + FS * 2) cols[i] = makeCol(cssH, false);
      }

      raf = requestAnimationFrame(drawMatrix);
    }

    // Fill initial bg
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    initMatrix();
    drawMatrix();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        cancelAnimationFrame(raf);
        ctx.setTransform(1,0,0,1,0,0); // reset transform before reinit
        initMatrix();
        drawMatrix();
      }, 150);
    });
  }

  /* ════════════════════════════════════════════════════
     PORTAL / PANEL SYSTEM
  ════════════════════════════════════════════════════ */
  var stage    = document.getElementById("main");
  var portal   = document.getElementById("portal");
  var backdrop = document.getElementById("stage-backdrop");
  var closeBtn = document.querySelector(".portal-close");
  var titleEl  = document.getElementById("portal-title-active");
  var navItems = document.querySelectorAll(".nav-item[data-open-panel]");
  var panels   = document.querySelectorAll(".panel[data-panel-id]");
  var titles = {
    photos:"摄影 · PHOTOS", cats:"猫 · CATS", notes:"手记 · NOTES",
    about:"关于 · ABOUT", links:"书签 · LINKS", signal:"信号 · SIGNAL",
    relay:"中继 · RELAY", tarot:"塔罗 · TAROT", scan:"扫描 · SCAN"
  };

  function setNavActive(id) {
    navItems.forEach(function (btn) {
      var on = !!id && btn.getAttribute("data-open-panel") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-expanded", String(on));
    });
  }

  function showPanel(id) {
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel-id") !== id; });
    if (titleEl) titleEl.textContent = titles[id] || "面板";
  }

  function openPortal(id) {
    if (!portal || !backdrop) return;
    showPanel(id); setNavActive(id);
    portal.hidden = false; backdrop.hidden = false;
    portal.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      portal.classList.add("is-open");
      backdrop.classList.add("is-visible");
    }); });
    document.body.classList.add("is-portal-open");
    if (titles[id] && location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    if (closeBtn) closeBtn.focus();
  }

  function closePortal() {
    if (!portal || !backdrop) return;
    portal.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    document.body.classList.remove("is-portal-open");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    setNavActive(null);
    setTimeout(function () {
      if (!portal.classList.contains("is-open")) {
        portal.hidden = true; portal.setAttribute("aria-hidden", "true");
        backdrop.hidden = true; backdrop.setAttribute("aria-hidden", "true");
        panels.forEach(function (p) { p.hidden = true; });
      }
    }, 480);
  }

  navItems.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-open-panel"); if (!id) return;
      if (portal && portal.classList.contains("is-open")) {
        var cur = document.querySelector(".panel:not([hidden])");
        if (cur && cur.getAttribute("data-panel-id") === id) { closePortal(); return; }
      }
      openPortal(id);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closePortal);
  if (backdrop) backdrop.addEventListener("click", closePortal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var lb = document.getElementById("lightbox");
      if (lb && lb.classList.contains("is-open")) return;
      closePortal();
    }
  });
  function openFromHash() { var h = (location.hash || "").replace(/^#/, ""); if (titles[h]) openPortal(h); }
  if (location.hash) openFromHash();
  window.addEventListener("hashchange", openFromHash);

  /* ════════════════════════════════════════════════════
     PHOTO ALBUM — location tabs + upload
  ════════════════════════════════════════════════════ */
  var photoUpload  = document.getElementById("photo-upload");
  var photoLocIn   = document.getElementById("photo-location-input");
  var photoDateIn  = document.getElementById("photo-date-input");
  var albumTabs    = document.getElementById("album-tabs");
  var photoGallery = document.getElementById("photo-gallery");
  var currentLoc   = "all";

  if (photoDateIn) {
    var today = new Date();
    photoDateIn.value = today.getFullYear() + "-" + pad2(today.getMonth() + 1) + "-" + pad2(today.getDate());
  }

  function buildAlbumTabs() {
    if (!albumTabs || !photoGallery) return;
    var locs = new Set(["all"]);
    photoGallery.querySelectorAll(".gallery-item[data-loc]").forEach(function (li) {
      var l = li.getAttribute("data-loc"); if (l) locs.add(l);
    });
    locs.forEach(function (loc) {
      if (!albumTabs.querySelector('[data-loc="' + loc + '"]')) {
        var btn = document.createElement("button");
        btn.type = "button"; btn.className = "album-tab";
        btn.setAttribute("data-loc", loc); btn.setAttribute("role", "tab");
        btn.textContent = loc === "all" ? "全部" : loc;
        btn.addEventListener("click", function () { filterAlbum(loc); });
        albumTabs.appendChild(btn);
      }
    });
    albumTabs.querySelectorAll(".album-tab[data-loc]").forEach(function (btn) {
      var l = btn.getAttribute("data-loc");
      if (l !== "all" && !locs.has(l)) btn.remove();
    });
    var allTab = albumTabs.querySelector('[data-loc="all"]');
    if (allTab) allTab.onclick = function () { filterAlbum("all"); };
  }

  function filterAlbum(loc) {
    currentLoc = loc;
    if (albumTabs) albumTabs.querySelectorAll(".album-tab").forEach(function (btn) {
      var active = btn.getAttribute("data-loc") === loc;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    if (photoGallery) photoGallery.querySelectorAll(".gallery-item").forEach(function (li) {
      li.classList.toggle("is-hidden", loc !== "all" && li.getAttribute("data-loc") !== loc);
    });
  }
  buildAlbumTabs(); filterAlbum("all");

  if (photoUpload) {
    photoUpload.addEventListener("change", function () {
      var files = Array.from(photoUpload.files);
      var loc  = (photoLocIn && photoLocIn.value.trim()) || "未知";
      var date = (photoDateIn && photoDateIn.value) || new Date().toISOString().slice(0, 10);
      files.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var li = document.createElement("li");
          li.className = "gallery-item";
          li.setAttribute("data-loc", loc); li.setAttribute("data-date", date);
          li.innerHTML = '<figure><button type="button" class="js-lightbox">'
            + '<img src="' + e.target.result + '" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover" loading="lazy"/>'
            + '</button><figcaption><span class="photo-loc">' + loc + '</span><span class="photo-date">' + date + '</span></figcaption></figure>';
          photoGallery.appendChild(li);
          var btn = li.querySelector(".js-lightbox");
          if (btn) btn.addEventListener("click", function (ev) { ev.stopPropagation(); var img = btn.querySelector("img"); if (img) openLb(img.src, ""); });
          buildAlbumTabs(); filterAlbum(currentLoc);
        };
        reader.readAsDataURL(file);
      });
      photoUpload.value = "";
    });
  }

  /* ════════════════════════════════════════════════════
     LIGHTBOX
  ════════════════════════════════════════════════════ */
  var lightbox = document.getElementById("lightbox");
  var lbImg, lbClose;
  if (lightbox) {
    lbImg   = lightbox.querySelector("img");
    lbClose = lightbox.querySelector(".lightbox-close");
    function openLb(src, alt) {
      if (!src || !lbImg) return;
      lbImg.src = src; lbImg.alt = alt || "";
      lightbox.hidden = false; lightbox.classList.add("is-open");
      document.body.classList.add("is-portal-open");
      if (lbClose) lbClose.focus();
    }
    function closeLb() {
      lightbox.classList.remove("is-open");
      if (lbImg) { lbImg.removeAttribute("src"); lbImg.alt = ""; }
      lightbox.hidden = true;
      var p = document.getElementById("portal");
      if (!p || !p.classList.contains("is-open")) document.body.classList.remove("is-portal-open");
    }
    document.querySelectorAll(".js-lightbox").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var img = btn.querySelector("img");
        if (!img || !img.src) return;
        openLb(img.currentSrc || img.src, img.getAttribute("alt") || "");
      });
    });
    if (lbClose) lbClose.addEventListener("click", function (e) { e.stopPropagation(); closeLb(); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLb(); });
    if (lbImg) lbImg.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  /* ════════════════════════════════════════════════════
     COMMENTS
  ════════════════════════════════════════════════════ */
  var COMMENT_KEY = "lexi-comments-v1";
  var commentList = document.getElementById("comment-list");
  var commentSubmit = document.getElementById("comment-submit");
  function loadComments() { try { var r = localStorage.getItem(COMMENT_KEY); var a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveComments(arr) { try { localStorage.setItem(COMMENT_KEY, JSON.stringify(arr)); } catch (e) {} }
  function renderComments() {
    if (!commentList) return;
    commentList.innerHTML = "";
    loadComments().forEach(function (c) {
      var li = document.createElement("li"); li.className = "comment-item";
      var meta = document.createElement("div"); meta.className = "comment-meta";
      meta.textContent = (c.name && c.name.trim() ? c.name.trim() : "访客") + " · " + new Date(c.t || Date.now()).toLocaleString("zh-CN", {hour12:false});
      var body = document.createElement("p"); body.className = "comment-body"; body.textContent = c.body || "";
      li.appendChild(meta); li.appendChild(body); commentList.appendChild(li);
    });
  }
  if (commentList) renderComments();
  if (commentSubmit) commentSubmit.addEventListener("click", function () {
    var nameEl = document.getElementById("comment-name");
    var bodyEl = document.getElementById("comment-body");
    if (!bodyEl) return;
    var body = String(bodyEl.value || "").trim(); if (!body) return;
    var arr = loadComments();
    arr.push({ name: nameEl ? String(nameEl.value || "").trim() : "", body: body, t: Date.now() });
    saveComments(arr); bodyEl.value = ""; renderComments();
  });

  /* ── Signal ── */
  var SIGNAL_LINES = ["∇ 03 · 未命名信道 · 无校验","……听……不清……（像猫踩过键盘）","4096 · void · 返回值为梦","坐标丢失。上次见到光，是昨天下午。","██████ · 已省略 · 原因不明","echo: silence","随机不是无意义，只是还没被读。","SIGNAL_OK · 概率 3.7%","∿∿∿ 潮声模拟中 ∿∿∿"];
  var signalTap = document.getElementById("signal-tap");
  var signalStream = document.getElementById("signal-stream");
  if (signalTap) signalTap.addEventListener("click", function () {
    if (!signalStream) return;
    if (signalStream.textContent) signalStream.textContent += "\n";
    signalStream.textContent += pick(SIGNAL_LINES);
    signalStream.scrollTop = signalStream.scrollHeight;
    signalStream.classList.remove("is-flicker"); void signalStream.offsetWidth; signalStream.classList.add("is-flicker");
  });

  /* ── Relay terminal ── */
  var relayOut   = document.getElementById("relay-output");
  var relayInput = document.getElementById("relay-input");
  function relayLine(text, kind) {
    if (!relayOut) return;
    var p = document.createElement("p"); p.className = "relay-line";
    if (kind === "sys") p.classList.add("relay-line--sys");
    if (kind === "err") p.classList.add("relay-line--err");
    p.textContent = text; relayOut.appendChild(p); relayOut.scrollTop = relayOut.scrollHeight;
  }
  if (relayOut) relayLine("relay v0.1 — 输入 help 查看指令", "sys");
  function runRelayCommand(raw) {
    var line = String(raw || "").trim(); if (!line) return;
    relayLine("> " + line);
    var parts = line.split(/\s+/), cmd = parts[0].toLowerCase();
    if (cmd === "help") { relayLine("help · clear · date · roll · echo · whoami · open <panel>", "sys"); }
    else if (cmd === "clear") { relayOut.innerHTML = ""; relayLine("cleared.", "sys"); }
    else if (cmd === "date")  { relayLine(new Date().toString(), "sys"); }
    else if (cmd === "roll")  { relayLine(String(Math.floor(Math.random() * 100) + 1), "sys"); }
    else if (cmd === "whoami"){ relayLine("qwertlexi · visitor · local session", "sys"); }
    else if (cmd === "echo")  { relayLine(parts.slice(1).join(" ") || "…", "sys"); }
    else if (cmd === "open" && parts[1]) {
      var t = parts[1].toLowerCase();
      if (titles[t]) { relayLine("opening " + t + " …", "sys"); openPortal(t); }
      else relayLine("unknown panel: " + parts[1], "err");
    } else relayLine("未知指令。试试 help", "err");
  }
  if (relayInput) relayInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); runRelayCommand(relayInput.value); relayInput.value = ""; relayInput.focus(); }
  });

  /* ════════════════════════════════════════════════════
     TAROT — full PNG card + back upload + GitHub path
  ════════════════════════════════════════════════════ */
  var TAROT_DECK = [
    {id:"0",cn:"愚者",desc:"新的开端或一次莽撞的跳跃；信任直觉，也记得看路。"},
    {id:"I",cn:"魔术师",desc:"把资源握在手中，专注能把想法落地。"},
    {id:"II",cn:"女祭司",desc:"静下来听内在声音；答案可能还没准备好现身。"},
    {id:"III",cn:"皇后",desc:"滋养、丰盛与感官之美；给自己一点温柔的空间。"},
    {id:"IV",cn:"皇帝",desc:"结构、边界与责任；秩序能托住混乱。"},
    {id:"V",cn:"教皇",desc:"传统与指引；适合向经验或师长借一双眼睛。"},
    {id:"VI",cn:"恋人",desc:"选择与契合；诚实面对心里真正想要的方向。"},
    {id:"VII",cn:"战车",desc:"意志与前进；把分散的力气拧成一股绳。"},
    {id:"VIII",cn:"力量",desc:"以柔克刚的勇气；耐心比硬扛更难得。"},
    {id:"IX",cn:"隐士",desc:"暂时退后、独自整理；有些路只能一个人走一截。"},
    {id:"X",cn:"命运之轮",desc:"周期与转折；顺势时别骄傲，逆势时别绝望。"},
    {id:"XI",cn:"正义",desc:"权衡与因果；做决定前把事实摊开来看。"},
    {id:"XII",cn:"倒吊人",desc:"暂停与视角转换；卡住时试试换个角度看。"},
    {id:"XIII",cn:"死神",desc:"结束与蜕变；旧壳脱落才有新芽。"},
    {id:"XIV",cn:"节制",desc:"调和与中庸；快慢、冷热之间找平衡。"},
    {id:"XV",cn:"恶魔",desc:"欲望与束缚；看清什么是习惯，什么是真的需要。"},
    {id:"XVI",cn:"高塔",desc:"突变与真相砸门；痛但可能必要。"},
    {id:"XVII",cn:"星星",desc:"希望与疗愈；远处有光，先把眼前一步走好。"},
    {id:"XVIII",cn:"月亮",desc:"迷雾与潜意识；别被想象吓到，也别完全轻信直觉。"},
    {id:"XIX",cn:"太阳",desc:"明朗与生命力；适合摊在阳光下的事就去做。"},
    {id:"XX",cn:"审判",desc:"觉醒与召唤；旧账可以结算，新章可以起笔。"},
    {id:"XXI",cn:"世界",desc:"圆满与旅程一圈；完成本身也是下一段的门票。"}
  ];

  /* Default back SVG */
  var DEFAULT_BACK_HTML = '<div class="tarot-back-svg"><svg viewBox="0 0 160 256" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="4" y="4" width="152" height="248" rx="10" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/><rect x="10" y="10" width="140" height="236" rx="7" stroke="currentColor" stroke-opacity=".18" stroke-width=".5"/><g transform="translate(80,128)" stroke="currentColor" fill="none"><circle r="42" stroke-opacity=".16" stroke-width=".5"/><circle r="28" stroke-opacity=".22" stroke-width=".5"/><circle r="12" stroke-opacity=".32" stroke-width=".5"/><path d="M0,-42 L0,42 M-42,0 L42,0" stroke-opacity=".18" stroke-width=".5"/><path d="M-30,-30 L30,30 M30,-30 L-30,30" stroke-opacity=".18" stroke-width=".5"/><path d="M0,-42 L-5,-32 L0,-36 L5,-32 Z" fill="currentColor" fill-opacity=".28"/><path d="M0,42 L-5,32 L0,36 L5,32 Z" fill="currentColor" fill-opacity=".28"/><path d="M-42,0 L-32,-5 L-36,0 L-32,5 Z" fill="currentColor" fill-opacity=".28"/><path d="M42,0 L32,-5 L36,0 L32,5 Z" fill="currentColor" fill-opacity=".28"/></g><g stroke="currentColor" stroke-opacity=".22" stroke-width=".7"><path d="M22 22 L34 22 M22 22 L22 34"/><path d="M138 22 L126 22 M138 22 L138 34"/><path d="M22 234 L34 234 M22 234 L22 222"/><path d="M138 234 L126 234 M138 234 L138 222"/></g></svg></div><span class="tarot-back-line">TAROT</span><span class="tarot-back-sub">major arcana</span>';

  /* Default front SVG art (22 cards) */
  var TAROT_SVG = [
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="50" cy="60" r="32" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><circle cx="50" cy="60" r="8" stroke="currentColor" stroke-opacity=".7" stroke-width="1"/><line x1="50" y1="28" x2="50" y2="92" stroke="currentColor" stroke-opacity=".3" stroke-width=".8"/><line x1="18" y1="60" x2="82" y2="60" stroke="currentColor" stroke-opacity=".3" stroke-width=".8"/><path d="M35 40 L50 28 L65 40" stroke="currentColor" stroke-opacity=".4" stroke-width="1" fill="none"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><line x1="50" y1="10" x2="50" y2="140" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/><path d="M30 55 Q50 40 70 55 Q50 70 30 55 Z" stroke="currentColor" stroke-opacity=".6" stroke-width="1" fill="currentColor" fill-opacity=".08"/><circle cx="50" cy="30" r="8" stroke="currentColor" stroke-opacity=".6" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="20" y="20" width="10" height="110" stroke="currentColor" stroke-opacity=".4" stroke-width="1"/><rect x="70" y="20" width="10" height="110" stroke="currentColor" stroke-opacity=".4" stroke-width="1"/><path d="M20 60 Q50 80 80 60" stroke="currentColor" stroke-opacity=".5" stroke-width="1" fill="none"/><circle cx="50" cy="40" r="12" stroke="currentColor" stroke-opacity=".5" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="50" cy="55" r="28" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><line x1="50" y1="83" x2="50" y2="120" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><line x1="35" y1="105" x2="65" y2="105" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="25" y="30" width="50" height="50" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><path d="M25 80 L50 120 L75 80" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2" fill="none"/><line x1="50" y1="30" x2="50" y2="80" stroke="currentColor" stroke-opacity=".3" stroke-width=".8"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><line x1="50" y1="10" x2="50" y2="140" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/><line x1="25" y1="40" x2="75" y2="40" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/><line x1="30" y1="65" x2="70" y2="65" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2"/><line x1="35" y1="88" x2="65" y2="88" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="36" cy="70" r="22" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/><circle cx="64" cy="70" r="22" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/><path d="M50 20 L55 35 M50 20 L45 35" stroke="currentColor" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/><line x1="50" y1="20" x2="50" y2="48" stroke="currentColor" stroke-opacity=".6" stroke-width="1.2"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M20 30 L80 30 L80 85 Q80 120 50 135 Q20 120 20 85 Z" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><line x1="50" y1="30" x2="50" y2="135" stroke="currentColor" stroke-opacity=".3" stroke-width=".8"/><line x1="20" y1="75" x2="80" y2="75" stroke="currentColor" stroke-opacity=".3" stroke-width=".8"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M25 60 Q30 40 50 60 Q70 80 75 60 Q70 40 50 60" stroke="currentColor" stroke-opacity=".55" stroke-width="1.5" fill="none"/><ellipse cx="50" cy="105" rx="25" ry="20" stroke="currentColor" stroke-opacity=".4" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="38" y="45" width="24" height="35" rx="3" stroke="currentColor" stroke-opacity=".5" stroke-width="1"/><path d="M38 45 L50 25 L62 45" stroke="currentColor" stroke-opacity=".5" stroke-width="1" fill="none"/><line x1="50" y1="80" x2="50" y2="130" stroke="currentColor" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="50" cy="75" r="36" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><circle cx="50" cy="75" r="18" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/><circle cx="50" cy="75" r="6" fill="currentColor" fill-opacity=".25"/><g stroke="currentColor" stroke-opacity=".3" stroke-width=".8"><line x1="50" y1="39" x2="50" y2="111"/><line x1="14" y1="75" x2="86" y2="75"/><line x1="24" y1="49" x2="76" y2="101"/><line x1="76" y1="49" x2="24" y2="101"/></g></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><line x1="50" y1="15" x2="50" y2="130" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/><line x1="25" y1="50" x2="75" y2="50" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><path d="M25 50 L15 75 Q25 85 35 75 Z" stroke="currentColor" stroke-opacity=".4" stroke-width="1" fill="currentColor" fill-opacity=".07"/><path d="M75 50 L65 75 Q75 85 85 75 Z" stroke="currentColor" stroke-opacity=".4" stroke-width="1" fill="currentColor" fill-opacity=".07"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M50 30 L20 90 L80 90 Z" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" fill="none"/><line x1="50" y1="90" x2="50" y2="130" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5"/><circle cx="50" cy="115" r="10" stroke="currentColor" stroke-opacity=".4" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M60 20 Q90 30 80 65 Q70 90 35 85" stroke="currentColor" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="35" y1="85" x2="30" y2="140" stroke="currentColor" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M22 40 L30 75 L14 75 Z" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/><path d="M78 40 L86 75 L70 75 Z" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/><path d="M30 60 Q50 45 70 60" stroke="currentColor" stroke-opacity=".55" stroke-width="1.5" fill="none"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M50 20 L63 58 L98 58 L68 80 L80 118 L50 96 L20 118 L32 80 L2 58 L37 58 Z" stroke="currentColor" stroke-opacity=".4" stroke-width="1" fill="none"/><circle cx="50" cy="75" r="14" stroke="currentColor" stroke-opacity=".5" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="30" y="50" width="40" height="80" rx="2" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><path d="M30 50 L50 20 L70 50" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" fill="none"/><path d="M65 10 L48 50 L58 50 L42 90" stroke="currentColor" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="50" cy="75" r="30" stroke="currentColor" stroke-opacity=".3" stroke-width=".8"/><g stroke="currentColor" stroke-opacity=".5" stroke-width="1"><line x1="50" y1="20" x2="50" y2="130"/><line x1="5" y1="75" x2="95" y2="75"/><line x1="15" y1="35" x2="85" y2="115"/><line x1="85" y1="35" x2="15" y2="115"/></g><circle cx="50" cy="75" r="8" fill="currentColor" fill-opacity=".25"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M60 25 Q30 40 30 75 Q30 110 60 125 Q10 110 10 75 Q10 40 60 25 Z" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" fill="currentColor" fill-opacity=".08"/><circle cx="72" cy="55" r="18" stroke="currentColor" stroke-opacity=".4" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="50" cy="65" r="24" stroke="currentColor" stroke-opacity=".6" stroke-width="1.5"/><circle cx="50" cy="65" r="14" fill="currentColor" fill-opacity=".15"/><g stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"><line x1="50" y1="20" x2="50" y2="32"/><line x1="50" y1="98" x2="50" y2="110"/><line x1="15" y1="65" x2="27" y2="65"/><line x1="73" y1="65" x2="85" y2="65"/><line x1="24" y1="39" x2="33" y2="48"/><line x1="67" y1="82" x2="76" y2="91"/><line x1="76" y1="39" x2="67" y2="48"/><line x1="33" y1="82" x2="24" y2="91"/></g></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M50 20 L65 35 Q75 55 50 65 Q25 55 35 35 Z" stroke="currentColor" stroke-opacity=".5" stroke-width="1" fill="none"/><path d="M50 65 Q30 80 25 105" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2" fill="none"/><path d="M50 65 Q70 80 75 105" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2" fill="none"/></svg>',
    '<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" fill="none"><ellipse cx="50" cy="75" rx="38" ry="55" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><ellipse cx="50" cy="75" rx="28" ry="45" stroke="currentColor" stroke-opacity=".25" stroke-width=".7"/><circle cx="50" cy="75" r="12" stroke="currentColor" stroke-opacity=".55" stroke-width="1"/></svg>'
  ];

  /* GitHub path auto-load: try tarot/XX.png for front, tarot/back.png for back */
  var customFrontImages = [];
  var customBackImage   = null;

  /* Try loading from tarot/ folder (GitHub) */
  function tryLoadGithubTarot() {
    var backImg = new Image();
    backImg.onload = function () {
      customBackImage = "tarot/back.png";
      renderTarotBack();
    };
    backImg.onerror = function () {};
    backImg.src = "tarot/back.png";

    for (var i = 0; i <= 21; i++) {
      (function (idx) {
        var fImg = new Image();
        var num = String(idx).padStart(2, "0");
        fImg.onload = function () { customFrontImages[idx] = "tarot/" + num + ".png"; };
        fImg.onerror = function () {};
        fImg.src = "tarot/" + num + ".png";
      })(i);
    }
  }
  tryLoadGithubTarot();

  var tarotBackFace = document.getElementById("tarot-back-face");
  var tarotCardImg  = document.getElementById("tarot-card-img");
  var tarotRoman    = document.getElementById("tarot-roman");
  var tarotName     = document.getElementById("tarot-name");
  var tarotDesc     = document.getElementById("tarot-desc");
  var tarotHint     = document.getElementById("tarot-hint");
  var tarotCube     = document.getElementById("tarot-cube");
  var tarotDraw     = document.getElementById("tarot-draw");
  var tarotUpload   = document.getElementById("tarot-upload");
  var tarotBackUp   = document.getElementById("tarot-back-upload");
  var tarotBusy     = false;

  function renderTarotBack() {
    if (!tarotBackFace) return;
    if (customBackImage) {
      tarotBackFace.innerHTML = '<img class="tarot-back-inner-img" src="' + customBackImage + '" alt="card back" />';
    } else {
      tarotBackFace.innerHTML = DEFAULT_BACK_HTML;
    }
  }
  renderTarotBack();

  /* Upload back */
  if (tarotBackUp) {
    tarotBackUp.addEventListener("change", function () {
      var file = tarotBackUp.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) { customBackImage = e.target.result; renderTarotBack(); };
      reader.readAsDataURL(file);
      tarotBackUp.value = "";
    });
  }

  /* Upload fronts */
  if (tarotUpload) {
    tarotUpload.addEventListener("change", function () {
      var files = Array.from(tarotUpload.files);
      var loaded = 0;
      files.forEach(function (file, i) {
        var reader = new FileReader();
        reader.onload = function (e) {
          customFrontImages[i] = e.target.result;
          loaded++;
          if (loaded === files.length && tarotHint) tarotHint.textContent = "已上传 " + files.length + " 张牌面。";
        };
        reader.readAsDataURL(file);
      });
      tarotUpload.value = "";
    });
  }

  function drawTarot() {
    if (!tarotCube || tarotBusy) return;
    tarotBusy = true;
    var idx = Math.floor(Math.random() * TAROT_DECK.length);
    var card = TAROT_DECK[idx];
    var reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    tarotCube.classList.remove("is-flipped");
    setTimeout(function () {
      if (tarotRoman) tarotRoman.textContent = "大阿卡纳 · " + card.id;
      if (tarotName)  tarotName.textContent  = card.cn;
      if (tarotDesc)  tarotDesc.textContent  = card.desc;
      if (tarotHint)  tarotHint.textContent  = "";
      // Render front image
      if (tarotCardImg) {
        tarotCardImg.innerHTML = "";
        if (customFrontImages[idx]) {
          var img = document.createElement("img");
          img.alt = card.cn;
          img.onerror = function () {
            // Image failed (e.g. CORS / missing) — fall back to SVG
            tarotCardImg.innerHTML = TAROT_SVG[idx] || TAROT_SVG[0];
            var svgEl = tarotCardImg.querySelector("svg");
            if (svgEl) { svgEl.style.width = "80%"; svgEl.style.opacity = ".65"; svgEl.style.color = "var(--ink)"; }
          };
          img.src = customFrontImages[idx];
          tarotCardImg.appendChild(img);
        } else {
          var svgStr = TAROT_SVG[idx] || TAROT_SVG[0];
          tarotCardImg.innerHTML = svgStr;
          var svgEl = tarotCardImg.querySelector("svg");
          if (svgEl) { svgEl.style.width = "80%"; svgEl.style.opacity = ".65"; svgEl.style.color = "var(--ink)"; }
        }
      }
      tarotCube.classList.add("is-flipped");
      tarotBusy = false;
    }, reduced ? 0 : 480);
  }
  if (tarotDraw) tarotDraw.addEventListener("click", drawTarot);

  /* ════════════════════════════════════════════════════
     FLOATING MUSIC PLAYER
  ════════════════════════════════════════════════════ */
  var TRACKS = [
    { title:"GO", artist:"BLACKPINK", src:"music/BLACKPINK - GO.mp3", cover:"走" },
    { title:"BIRDS OF A FEATHER", artist:"Billie Eilish", src:"music/Billie Eilish - BIRDS OF A FEATHER.mp3", cover:"🪶" },
    { title:"Best Part", artist:"Daniel Caesar / H.E.R.", src:"music/Daniel Caesar; H.E.R. - Best Part.mp3", cover:"💑" },
    { title:"Oblivion", artist:"Grimes", src:"music/Grimes - Oblivion.mp3", cover:"♾" },
    { title:"Realiti", artist:"Grimes", src:"music/Grimes - Realiti.mp3", cover:"🫧" },
    { title:"Episode 33", artist:"She Her Her Hers", src:"music/She Her Her Hers - Episode 33.mp3", cover:"🌊" },
    { title:"About You", artist:"The 1975", src:"music/The 1975 - About You.mp3", cover:"🫂" },
    { title:"Track 04", artist:"—", src:"music/04.mp3", cover:"🎹" },
    { title:"Track 05", artist:"—", src:"music/05.mp3", cover:"🎺" }
  ];

  var audio       = new Audio();
  var curTrackIdx = -1;
  var vizTimer    = null;

  var mFloatEl     = document.getElementById("music-float");
  var mFloatTitle  = document.getElementById("music-float-title");
  var mFloatArtist = document.getElementById("music-float-artist");
  var mFloatPlay   = document.getElementById("music-float-play");
  var mFloatToggle = document.getElementById("music-float-toggle");
  var mFloatPanel  = document.getElementById("music-float-panel");
  var mFloatEq     = document.getElementById("music-float-eq");
  var mPlayBtn     = document.getElementById("music-play");
  var mPrevBtn     = document.getElementById("music-prev");
  var mNextBtn     = document.getElementById("music-next");
  var mProgBar     = document.getElementById("music-progress-bar");
  var mProgFill    = document.getElementById("music-progress-fill");
  var mTimeCur     = document.getElementById("music-time-cur");
  var mTimeTot     = document.getElementById("music-time-tot");
  var mViz         = document.getElementById("music-viz");
  var mVolSlider   = document.getElementById("music-vol");
  var mTracklist   = document.getElementById("music-tracklist");

  function fmtTime(s) { if (!isFinite(s)||s<0) return "0:00"; var m=Math.floor(s/60),sec=Math.floor(s%60); return m+":"+(sec<10?"0":"")+sec; }

  /* Toggle expand */
  function toggleExpand() {
    var expanded = mFloatEl.classList.toggle("is-expanded");
    if (mFloatToggle) mFloatToggle.setAttribute("aria-expanded", String(expanded));
    if (mFloatPanel)  mFloatPanel.setAttribute("aria-hidden", String(!expanded));
  }
  if (mFloatToggle) mFloatToggle.addEventListener("click", function (e) { e.stopPropagation(); toggleExpand(); });
  var mFloatBar = document.getElementById("music-float-bar");
  if (mFloatBar) mFloatBar.addEventListener("click", function (e) {
    if (e.target === mFloatPlay || (mFloatPlay && mFloatPlay.contains(e.target))) return;
    if (e.target === mFloatToggle || (mFloatToggle && mFloatToggle.contains(e.target))) return;
    toggleExpand();
  });

  /* Build tracklist */
  if (mTracklist) TRACKS.forEach(function (t, i) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "music-track"; btn.dataset.idx = String(i);
    btn.innerHTML = '<span class="music-track-num">' + String(i+1).padStart(2,"0") + '</span>'
      + '<span class="music-track-info"><span class="music-track-name">' + t.cover + "  " + t.title + '</span>'
      + '<span class="music-track-sub">' + t.artist + '</span></span>'
      + '<span class="music-track-dur" id="music-dur-' + i + '">—:——</span>';
    btn.addEventListener("click", function () { loadTrack(i, true); });
    mTracklist.appendChild(btn);
  });

  function updateHighlight() {
    document.querySelectorAll(".music-track").forEach(function (row) {
      row.classList.toggle("is-current", parseInt(row.dataset.idx) === curTrackIdx);
    });
  }

  function loadTrack(idx, autoplay) {
    curTrackIdx = ((idx % TRACKS.length) + TRACKS.length) % TRACKS.length;
    var t = TRACKS[curTrackIdx];
    audio.src = t.src; audio.load();
    if (mFloatTitle)  mFloatTitle.textContent  = t.title;
    if (mFloatArtist) mFloatArtist.textContent = t.artist;
    if (mTimeCur) mTimeCur.textContent = "0:00";
    if (mTimeTot) mTimeTot.textContent = "—:——";
    if (mProgFill) mProgFill.style.width = "0%";
    updateHighlight();
    if (autoplay) audio.play().catch(function(){});
  }

  function setPlayUI(playing) {
    var sym = playing ? "⏸" : "▶";
    if (mPlayBtn)   { mPlayBtn.textContent = sym; mPlayBtn.classList.toggle("is-playing", playing); }
    if (mFloatPlay) { mFloatPlay.textContent = sym; }
    if (mViz)       mViz.classList.toggle("is-active", playing);
    if (mFloatEl)   mFloatEl.classList.toggle("is-playing", playing);
    if (mFloatEq)   mFloatEq.querySelectorAll("span").forEach(function (s) {
      s.style.animation = playing ? "eq-bar .8s ease-in-out infinite alternate" : "none";
      if (!playing) s.style.transform = "scaleY(.3)";
    });
    if (playing) {
      if (!vizTimer) vizTimer = setInterval(function () {
        if (!mViz) return;
        mViz.querySelectorAll(".music-viz-bar").forEach(function (b) { b.style.height = Math.floor(10+Math.random()*85)+"%"; });
      }, 90);
    } else { clearInterval(vizTimer); vizTimer = null; }
  }

  audio.addEventListener("play",    function(){ setPlayUI(true); });
  audio.addEventListener("pause",   function(){ setPlayUI(false); });
  audio.addEventListener("ended",   function(){ loadTrack(curTrackIdx+1, true); });
  audio.addEventListener("timeupdate", function(){
    if (!isFinite(audio.duration)) return;
    if (mProgFill) mProgFill.style.width = (audio.currentTime/audio.duration*100)+"%";
    if (mTimeCur)  mTimeCur.textContent  = fmtTime(audio.currentTime);
  });
  audio.addEventListener("loadedmetadata", function(){
    if (mTimeTot) mTimeTot.textContent = fmtTime(audio.duration);
    var d = document.getElementById("music-dur-"+curTrackIdx);
    if (d) d.textContent = fmtTime(audio.duration);
  });
  audio.addEventListener("error", function(){ if (mFloatTitle && TRACKS[curTrackIdx]) mFloatTitle.textContent = TRACKS[curTrackIdx].title+" (未找到)"; });

  function togglePlay() {
    if (curTrackIdx < 0) { loadTrack(0, true); return; }
    if (audio.paused) audio.play().catch(function(){}); else audio.pause();
  }
  if (mPlayBtn)   mPlayBtn.addEventListener("click", togglePlay);
  if (mFloatPlay) mFloatPlay.addEventListener("click", function(e){ e.stopPropagation(); togglePlay(); });
  if (mPrevBtn)   mPrevBtn.addEventListener("click", function(){ loadTrack(curTrackIdx-1, !audio.paused); });
  if (mNextBtn)   mNextBtn.addEventListener("click", function(){ loadTrack(curTrackIdx+1, !audio.paused); });
  if (mProgBar)   mProgBar.addEventListener("click", function(e){
    if (!isFinite(audio.duration)||audio.duration===0) return;
    var rect = mProgBar.getBoundingClientRect();
    audio.currentTime = Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*audio.duration;
  });
  if (mVolSlider) { audio.volume = parseFloat(mVolSlider.value)||0.8; mVolSlider.addEventListener("input", function(){ audio.volume = parseFloat(mVolSlider.value); }); }
  if (TRACKS.length) loadTrack(0, false);

  /* ════════════════════════════════════════════════════
     SYSTEM BUTTONS — theme toggle, rain toggle, fullscreen
  ════════════════════════════════════════════════════ */

  /* Rain toggle */
  var rainTag = document.getElementById("nav-rain-tag");
  var rainEnabled = true;
  var rainToggleBtn = document.getElementById("nav-rain-toggle");
  if (rainToggleBtn) {
    rainToggleBtn.addEventListener("click", function () {
      rainEnabled = !rainEnabled;
      var c = document.getElementById("code-canvas");
      if (c) c.style.opacity = rainEnabled ? "1" : "0";
      if (rainTag) rainTag.textContent = "RAIN";
    });
  }

  /* Fullscreen toggle */
  var fsBtn = document.getElementById("nav-fullscreen");
  if (fsBtn) {
    fsBtn.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });
  }

  /* Theme toggle — light (original #7fd9d0 bg) vs dark (current) */
  var themeTag = document.getElementById("nav-theme-tag");
  var themeBtn = document.getElementById("nav-theme-toggle");
  var isDark = true;
  var lightVars = {
    "--bg": "#7fd9d0",
    "--bg-surface": "#9ee6df",
    "--ink": "#012028",
    "--ink-soft": "rgba(1,32,40,0.45)",
    "--accent": "#7fd9d0",
    "--accent2": "#0d8a90",
    "--accent3": "#00bfff",
    "--glass": "rgba(255,255,255,0.72)",
    "--glass-bar": "rgba(255,255,255,0.55)",
    "--glass-border": "rgba(255,255,255,0.45)",
    "--portal-muted": "rgba(1,32,40,0.5)",
    "--portal-card": "rgba(255,255,255,0.35)",
  };
  var darkVars = {
    "--bg": "#010c10",
    "--bg-surface": "#051820",
    "--ink": "#7fd9d0",
    "--ink-soft": "rgba(127,217,208,0.45)",
    "--accent": "#7fd9d0",
    "--accent2": "#0d8a90",
    "--accent3": "#00e5ff",
    "--glass": "rgba(1,24,32,0.82)",
    "--glass-bar": "rgba(1,24,32,0.72)",
    "--glass-border": "rgba(127,217,208,0.18)",
    "--portal-muted": "rgba(127,217,208,0.5)",
    "--portal-card": "rgba(5,24,32,0.55)",
  };
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      isDark = !isDark;
      var vars = isDark ? darkVars : lightVars;
      var root = document.documentElement;
      Object.keys(vars).forEach(function(k){ root.style.setProperty(k, vars[k]); });
      // Toggle body class so CSS nav/portal/music theme selectors fire
      document.body.classList.toggle("theme-light", !isDark);
      if (themeTag) themeTag.textContent = isDark ? "DARK" : "LIGHT";
      // Switch matrix rain bg color and palette mode
      window._matrixDark = isDark;
      var bg = isDark ? [0, 0, 0] : [127, 217, 208];
      if (window._matrixBg) { window._matrixBg[0] = bg[0]; window._matrixBg[1] = bg[1]; window._matrixBg[2] = bg[2]; }
    });
  }

  /* ════════════════════════════════════════════════════
     ASCII SCAN — webcam → terminal ASCII art
  ════════════════════════════════════════════════════ */
  (function() {
    var scanStart   = document.getElementById("scan-start");
    var scanStop    = document.getElementById("scan-stop");
    var scanVideo   = document.getElementById("scan-video");
    var scanCanvas  = document.getElementById("scan-canvas");
    var scanAscii   = document.getElementById("scan-ascii");
    var scanDensity = document.getElementById("scan-density");
    if (!scanStart || !scanVideo || !scanCanvas || !scanAscii) return;

    var scanCtx    = scanCanvas.getContext("2d");
    var scanStream = null;
    var scanRaf    = null;
    var scanning   = false;

    // ASCII chars from dark→bright
    var DENSE  = "@%#*+=-:. ";
    var MED    = "@#*+=:. ";
    var SPARSE = "@*+: ";
    function getChars() {
      var d = scanDensity ? scanDensity.value : "med";
      return d === "high" ? DENSE : d === "low" ? SPARSE : MED;
    }

    function renderFrame() {
      if (!scanning) return;
      var cw = 100, ch = 50; // cols × rows
      scanCanvas.width = cw; scanCanvas.height = ch;
      scanCtx.drawImage(scanVideo, 0, 0, cw, ch);
      var data  = scanCtx.getImageData(0, 0, cw, ch).data;
      var chars = getChars();
      var len   = chars.length - 1;
      var lines = [];
      for (var y = 0; y < ch; y++) {
        var row = "";
        for (var x = 0; x < cw; x++) {
          var i = (y * cw + x) * 4;
          var lum = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) / 255;
          row += chars[Math.round((1 - lum) * len)];
        }
        lines.push(row);
      }
      scanAscii.textContent = lines.join("
");
      scanRaf = requestAnimationFrame(renderFrame);
    }

    scanStart.addEventListener("click", function() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
          scanStream = stream;
          scanVideo.srcObject = stream;
          scanVideo.play();
          scanning = true;
          scanStart.style.display = "none";
          scanStop.style.display  = "";
          scanAscii.textContent   = "// 正在扫描… //";
          scanVideo.addEventListener("playing", function startScan() {
            scanVideo.removeEventListener("playing", startScan);
            renderFrame();
          }, { once: true });
        })
        .catch(function(err) {
          scanAscii.textContent = "// 摄像头拒绝访问 — " + err.message + " //";
        });
    });

    scanStop.addEventListener("click", function() {
      scanning = false;
      if (scanRaf) cancelAnimationFrame(scanRaf);
      if (scanStream) scanStream.getTracks().forEach(function(t){ t.stop(); });
      scanStream = null;
      scanVideo.srcObject = null;
      scanAscii.textContent = "// 扫描已停止 //";
      scanStart.style.display = "";
      scanStop.style.display  = "none";
    });
  })();

})();