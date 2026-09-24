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
      greet.textContent = '🎃 Happy Halloween · ¡Comienza el Día de Muertos! 💀';
      h1.insertAdjacentElement('afterend', greet);
    }
  }

  // Oct 31 is also the first big night of Día de Muertos, so string papel picado too.
  var banner = document.createElement('div');
  banner.className = 'papel-picado muertos-picado';
  for (var f = 0; f < 20; f++) {
    banner.appendChild(document.createElement('div')).className = 'flag';
  }
  document.body.appendChild(banner);

  var fog = document.createElement('div');
  fog.className = 'halloween-fog';
  document.body.appendChild(fog);

  var canvas = document.createElement('canvas');
  canvas.id = 'halloween-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var bats = [], spiders = [], petals = [];
  var PETAL_COLORS = ['#ff8c00', '#ffb300', '#ff6f00', '#ffd54f'];

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

  function initPetals() {
    petals = [];
    var count = Math.floor((canvas.width * canvas.height) / 22000) + 10;
    for (var i = 0; i < count; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: 3 + Math.random() * 3,
        speed: 0.4 + Math.random() * 0.8,
        sway: Math.random() * Math.PI * 2,
        spin: Math.random() * Math.PI * 2,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
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

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function initAll() {
    resize();
    initBats();
    initSpiders();
    initPetals();
  }
  initAll();
  window.addEventListener('resize', initAll);

  function frame() {
    var t = Date.now() / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach(function (p) {
      p.y += p.speed;
      p.x += Math.sin(t + p.sway) * 0.4;
      p.spin += 0.02;
      if (p.y > canvas.height + 10) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      drawPetal(p);
    });

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
