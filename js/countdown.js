(function () {
  var el = document.getElementById('countdown-text');
  if (!el) return;

  function nextTarget() {
    var now = new Date();
    var target = new Date(now.getFullYear(), 8, 16, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target = new Date(now.getFullYear() + 1, 8, 16, 0, 0, 0);
    }
    return target;
  }

  function update() {
    var diff = nextTarget().getTime() - Date.now();
    if (diff <= 0) {
      el.textContent = '¡Feliz Día de la Independencia!';
      return;
    }
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    el.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
  }

  update();
  setInterval(update, 1000);
})();
