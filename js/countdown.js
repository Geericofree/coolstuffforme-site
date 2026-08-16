(function () {
  var TARGETS = [
    {
      id: 'countdown-text',
      month: 8, // September
      day: 16,
      reachedText: '¡Feliz Día de la Independencia!'
    },
    {
      id: 'countdown-halloween-text',
      month: 9, // October
      day: 31,
      reachedText: 'Happy Halloween! 🎃👻'
    }
  ];

  function nextTarget(month, day) {
    var now = new Date();
    var target = new Date(now.getFullYear(), month, day, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target = new Date(now.getFullYear() + 1, month, day, 0, 0, 0);
    }
    return target;
  }

  function format(diff) {
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    return days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
  }

  var active = TARGETS.map(function (t) {
    return { el: document.getElementById(t.id), config: t };
  }).filter(function (item) {
    return !!item.el;
  });

  if (!active.length) return;

  function update() {
    active.forEach(function (item) {
      var diff = nextTarget(item.config.month, item.config.day).getTime() - Date.now();
      item.el.textContent = diff <= 0 ? item.config.reachedText : format(diff);
    });
  }

  update();
  setInterval(update, 1000);
})();
