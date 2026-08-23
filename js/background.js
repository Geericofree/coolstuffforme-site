(function () {
  var canvas = document.getElementById('bg-canvas');
  var ctx = canvas.getContext('2d');
  var MAX_ALPHA = 0.16;

  var lightQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
  var BG = '#0e0e0f';
  var FX = '255,255,255';
  function syncTheme() {
    var isLight = !!(lightQuery && lightQuery.matches);
    BG = isLight ? '#f7f7f7' : '#0e0e0f';
    FX = isLight ? '0,0,0' : '255,255,255';
  }
  syncTheme();
  if (lightQuery && lightQuery.addEventListener) lightQuery.addEventListener('change', syncTheme);

  var SCENES = ['matrix', 'mainframe', 'stocks', 'security'];
  var SCENE_HOLD = 7000;
  var FADE = 1600;
  var sceneIndex = 0;
  var sceneStart = 0;

  // ---------- matrix rain ----------
  var matrixChars = '01アイウエオカキクケコサシスセソタチツテト{}();=<>#&%'.split('');
  var streams = [];
  function initMatrix() {
    streams = [];
    var spacing = 34;
    var count = Math.floor(canvas.width / spacing);
    for (var i = 0; i < count; i++) {
      if (Math.random() > 0.55) continue;
      streams.push({
        x: i * spacing + spacing / 2,
        y: Math.random() * -canvas.height,
        speed: 1 + Math.random() * 1.5,
        len: 5 + Math.floor(Math.random() * 5)
      });
    }
  }
  function drawMatrix(a) {
    ctx.save();
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    streams.forEach(function (s) {
      s.y += s.speed;
      if (s.y - s.len * 18 > canvas.height) s.y = -Math.random() * 200;
      for (var j = 0; j < s.len; j++) {
        var yy = s.y - j * 18;
        if (yy < 0 || yy > canvas.height) continue;
        var fade = 1 - j / s.len;
        ctx.fillStyle = 'rgba(' + FX + ',' + (a * MAX_ALPHA * fade).toFixed(3) + ')';
        ctx.fillText(matrixChars[Math.floor(Math.random() * matrixChars.length)], s.x, yy);
      }
    });
    ctx.restore();
  }

  // ---------- mainframe terminal ----------
  var mainframeLines = [
    'BOOT: KERNEL LOADED', 'MEM CHECK... OK', 'MOUNT /dev/sda1',
    'PROC 0x4F2A SPAWNED', 'NET: LINK UP eth0', 'CACHE FLUSH COMPLETE',
    'INDEX REBUILD... OK', 'HEAP COMPACTED', 'THREAD POOL SCALED x4',
    'CRON JOB #118 EXEC', 'QUEUE DEPTH: 000', 'DB TXN COMMIT',
    'SNAPSHOT SAVED', 'DISK I/O NOMINAL', 'ROUTE TABLE SYNCED',
    'SESSION KEEPALIVE', 'LOAD AVG 0.42 0.38 0.31'
  ];
  var mfBuffer = [];
  var mfOffset = 0;
  var MF_LINE_H = 42;
  function randomMf(last) {
    var pick;
    do { pick = mainframeLines[Math.floor(Math.random() * mainframeLines.length)]; }
    while (pick === last);
    return pick;
  }
  function initMainframe() {
    mfBuffer = [];
    mfOffset = 0;
    var count = Math.ceil(canvas.height / MF_LINE_H) + 2;
    for (var i = 0; i < count; i++) mfBuffer.push(randomMf(mfBuffer[mfBuffer.length - 1]));
  }
  function drawMainframe(a) {
    mfOffset += 0.3;
    if (mfOffset >= MF_LINE_H) {
      mfOffset -= MF_LINE_H;
      mfBuffer.shift();
      mfBuffer.push(randomMf(mfBuffer[mfBuffer.length - 1]));
    }
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    for (var i = 0; i < mfBuffer.length; i++) {
      var y = i * MF_LINE_H - mfOffset;
      if (y < -MF_LINE_H || y > canvas.height + MF_LINE_H) continue;
      ctx.fillStyle = 'rgba(' + FX + ',' + (a * MAX_ALPHA * 0.45).toFixed(3) + ')';
      ctx.fillText(mfBuffer[i], 18, y);
    }
    ctx.restore();
  }

  // ---------- stock charts ----------
  var stockBands = [];
  function makeCandle(open) {
    var close = open + (Math.random() - 0.5) * 5;
    return {
      open: open,
      close: close,
      high: Math.max(open, close) + Math.random() * 2.5,
      low: Math.min(open, close) - Math.random() * 2.5
    };
  }
  function initStocks() {
    stockBands = [0.32, 0.62].map(function (yFrac) {
      var count = Math.ceil(canvas.width / 11) + 4;
      var candles = [];
      var price = 40 + Math.random() * 20;
      for (var i = 0; i < count; i++) {
        var c = makeCandle(price);
        candles.push(c);
        price = c.close;
      }
      return { yFrac: yFrac, candles: candles, offset: 0 };
    });
  }
  function drawStocks(a) {
    stockBands.forEach(function (band) {
      band.offset += 0.4;
      if (band.offset >= 11) {
        band.offset -= 11;
        band.candles.shift();
        band.candles.push(makeCandle(band.candles[band.candles.length - 1].close));
      }
      var vals = [];
      band.candles.forEach(function (c) { vals.push(c.high, c.low); });
      var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
      var range = Math.max(max - min, 1);
      var bandHeight = canvas.height * 0.09;
      var centerY = band.yFrac * canvas.height;
      var scale = bandHeight / range;
      function priceToY(p) { return centerY + bandHeight / 2 - (p - min) * scale; }
      ctx.save();
      ctx.lineWidth = 1;
      band.candles.forEach(function (c, i) {
        var x = i * 11 - band.offset;
        if (x < -11 || x > canvas.width + 11) return;
        ctx.strokeStyle = 'rgba(' + FX + ',' + (a * MAX_ALPHA * 0.9).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(x, priceToY(c.high));
        ctx.lineTo(x, priceToY(c.low));
        ctx.stroke();
        var oY = priceToY(c.open), cY = priceToY(c.close);
        ctx.strokeRect(x - 2.5, Math.min(oY, cY), 5, Math.max(Math.abs(cY - oY), 1));
      });
      ctx.restore();
    });
  }

  // ---------- cybersecurity ----------
  var nodes = [];
  function initSecurity() {
    nodes = [];
    var cols = 4, rows = 3;
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        nodes.push({
          x: (canvas.width / (cols + 1)) * (i + 1) + (Math.random() - 0.5) * 40,
          y: (canvas.height / (rows + 1)) * (j + 1) + (Math.random() - 0.5) * 40,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }
  function drawSecurity(a) {
    var t = Date.now() / 1000;
    ctx.save();
    ctx.lineWidth = 1;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var n1 = nodes[i], n2 = nodes[j];
        var d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (d < 260) {
          ctx.strokeStyle = 'rgba(' + FX + ',' + (a * MAX_ALPHA * 0.35).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach(function (n) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + n.phase);
      ctx.fillStyle = 'rgba(' + FX + ',' + (a * MAX_ALPHA * (0.5 + pulse * 0.6)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2 + pulse * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    var radius = 70, cx = canvas.width - radius - 24, cy = canvas.height - radius - 24;
    var sweep = (Date.now() / 1000) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + FX + ',' + (a * MAX_ALPHA * 0.4).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * radius, cy + Math.sin(sweep) * radius);
    ctx.stroke();
    ctx.restore();
  }

  var initFns = { matrix: initMatrix, mainframe: initMainframe, stocks: initStocks, security: initSecurity };
  var drawFns = { matrix: drawMatrix, mainframe: drawMainframe, stocks: drawStocks, security: drawSecurity };

  function initAll() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Object.keys(initFns).forEach(function (k) { initFns[k](); });
  }
  initAll();
  window.addEventListener('resize', initAll);

  function frame() {
    var now = Date.now();
    if (!sceneStart) sceneStart = now;
    var elapsed = now - sceneStart;
    var current = SCENES[sceneIndex];
    var next = SCENES[(sceneIndex + 1) % SCENES.length];

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (elapsed < SCENE_HOLD) {
      drawFns[current](1);
    } else if (elapsed < SCENE_HOLD + FADE) {
      var t = (elapsed - SCENE_HOLD) / FADE;
      drawFns[current](1 - t);
      drawFns[next](t);
    } else {
      sceneIndex = (sceneIndex + 1) % SCENES.length;
      sceneStart = now;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
