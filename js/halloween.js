(function () {
  function inHalloweenWindow(now) {
    return now.getMonth() === 9 && now.getDate() === 31;
  }

  var override = new URLSearchParams(location.search).get('halloween');
  var active = override === '1' ? true : override === '0' ? false : inHalloweenWindow(new Date());
  if (!active) return;

  document.body.classList.add('halloween');

  var home = document.getElementById('view-home');
  if (home) {
    var h1 = home.querySelector('h1');
    if (h1) {
      var greet = document.createElement('p');
      greet.className = 'halloween-banner';
      greet.textContent = '🧬 Happy Halloween — Containment Breach in Sector 7 👁️';
      h1.insertAdjacentElement('afterend', greet);
    }
  }

  var fog = document.createElement('div');
  fog.className = 'halloween-fog';
  document.body.appendChild(fog);

  var canvas = document.createElement('canvas');
  canvas.id = 'halloween-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var bats = [], spiders = [], strands = [], eyes = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initBats() {
    bats = [];
    var count = Math.floor(canvas.width / 220) + 3;
    for (var i = 0; i < count; i++) {
      bats.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.55,
        s: 9 + Math.random() * 7,
        speed: 0.5 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        dir: Math.random() < 0.5 ? 1 : -1
      });
    }
  }

  function initSpiders() {
    spiders = [];
    var count = Math.floor(canvas.width / 300) + 2;
    for (var i = 0; i < count; i++) {
      spiders.push({
        x: (i + 1) * (canvas.width / (count + 1)),
        threadLen: 50 + Math.random() * 130,
        t: Math.random() * 100,
        size: 5 + Math.random() * 4
      });
    }
  }

  function initStrands() {
    strands = [];
    for (var i = 0; i < 3; i++) {
      strands.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        speed: 0.15 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function initEyes() {
    eyes = [];
    for (var i = 0; i < 4; i++) {
      eyes.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.3 + Math.random() * canvas.height * 0.6,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawBat(b, t) {
    var flap = Math.sin(t * 6 + b.phase) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(15,15,15,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-b.s, -b.s * flap, -b.s * 2, 0);
    ctx.quadraticCurveTo(-b.s, b.s * 0.3, 0, 0);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(b.s, -b.s * flap, b.s * 2, 0);
    ctx.quadraticCurveTo(b.s, b.s * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawSpider(s) {
    var y = 15 + (s.t % s.threadLen);
    ctx.save();
    ctx.strokeStyle = 'rgba(200,200,200,0.22)';
    ctx.beginPath();
    ctx.moveTo(s.x, 0);
    ctx.lineTo(s.x, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(10,10,10,0.7)';
    ctx.beginPath();
    ctx.arc(s.x, y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,10,0.55)';
    for (var i = 0; i < 3; i++) {
      var lx = s.size * 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x - lx, y - 3 + i * 3);
      ctx.lineTo(s.x - lx - 6, y - 6 + i * 4);
      ctx.moveTo(s.x + lx, y - 3 + i * 3);
      ctx.lineTo(s.x + lx + 6, y - 6 + i * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStrand(st, t) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,140,0.16)';
    ctx.fillStyle = 'rgba(0,255,140,0.22)';
    ctx.lineWidth = 1.3;
    for (var i = 0; i < 90; i += 6) {
      var yy = st.y - i;
      if (yy < -20 || yy > canvas.height + 20) continue;
      var ang = i * 0.35 + st.phase + t;
      var dx = Math.sin(ang) * 10;
      ctx.beginPath();
      ctx.arc(st.x + dx, yy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      if (i % 12 === 0) {
        ctx.beginPath();
        ctx.moveTo(st.x + dx, yy);
        ctx.lineTo(st.x - dx, yy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawEye(e, t) {
    var blink = Math.sin(t * 0.7 + e.phase) > 0.96 ? 0.15 : 1;
    ctx.save();
    ctx.fillStyle = 'rgba(170,255,120,0.45)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 6, 3 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(e.x + 16, e.y, 6, 3 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function initAll() {
    resize();
    initBats();
    initSpiders();
    initStrands();
    initEyes();
  }
  initAll();
  window.addEventListener('resize', initAll);

  function frame() {
    var t = Date.now() / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strands.forEach(function (st) {
      st.y -= st.speed;
      if (st.y < -100) st.y = canvas.height + Math.random() * 100;
      drawStrand(st, t);
    });

    eyes.forEach(function (e) { drawEye(e, t); });

    spiders.forEach(function (s) {
      s.t += 0.3 + Math.sin(t * 0.5 + s.x) * 0.2;
      drawSpider(s);
    });

    bats.forEach(function (b) {
      b.x += b.speed * b.dir;
      b.y += Math.sin(t * 2 + b.phase) * 0.4;
      if (b.x > canvas.width + 30) b.x = -30;
      if (b.x < -30) b.x = canvas.width + 30;
      drawBat(b, t);
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
