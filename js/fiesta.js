(function () {
  function inFiestaWindow(now) {
    return now.getMonth() === 8 && (now.getDate() === 15 || now.getDate() === 16);
  }

  var override = new URLSearchParams(location.search).get('fiesta');
  var active = override === '1' ? true : override === '0' ? false : inFiestaWindow(new Date());
  if (!active) return;

  document.body.classList.add('fiesta');

  var banner = document.createElement('div');
  banner.className = 'papel-picado';
  for (var i = 0; i < 20; i++) {
    banner.appendChild(document.createElement('div')).className = 'flag';
  }
  document.body.appendChild(banner);

  var home = document.getElementById('view-home');
  if (home) {
    var h1 = home.querySelector('h1');
    if (h1) {
      var greet = document.createElement('p');
      greet.className = 'fiesta-banner';
      greet.textContent = '¡Feliz Independencia, México! 🇲🇽';
      h1.insertAdjacentElement('afterend', greet);
    }
  }

  var canvas = document.createElement('canvas');
  canvas.id = 'fiesta-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var COLORS = ['#006341', '#ffffff', '#ce1126'];
  var pieces = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initPieces() {
    pieces = [];
    var count = Math.floor((canvas.width * canvas.height) / 16000);
    for (var i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: 4 + Math.random() * 4,
        speed: 0.6 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.05
      });
    }
  }

  resize();
  initPieces();
  window.addEventListener('resize', function () {
    resize();
    initPieces();
  });

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(function (p) {
      p.y += p.speed;
      p.x += p.drift;
      p.spin += p.spinSpeed;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
