(function () {
  var TARGETS = [
    {
      id: 'countdown-text',
      sectionId: 'section-independence',
      month: 8, // September
      day: 16,
      showFrom: [7, 1], // Aug 1 through the day itself
      reachedText: '¡Feliz Día de la Independencia!'
    },
    {
      id: 'countdown-halloween-text',
      month: 9, // October
      day: 31,
      reachedText: 'Happy Halloween! 🎃👻'
    },
    {
      id: 'countdown-revolution-text',
      sectionId: 'section-revolution',
      month: 10, // November
      day: 20,
      showFrom: [8, 17], // right after Independence Day through the day itself
      reachedText: '¡Viva la Revolución Mexicana! 🇲🇽'
    }
  ];

  // A section with showFrom is only visible from that date through its target day.
  function inWindow(config, now) {
    if (!config.showFrom) return true;
    var today = now.getMonth() * 100 + now.getDate();
    var from = config.showFrom[0] * 100 + config.showFrom[1];
    var to = config.month * 100 + config.day;
    return today >= from && today <= to;
  }

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

  var now = new Date();
  var active = TARGETS.map(function (t) {
    return { el: document.getElementById(t.id), config: t };
  }).filter(function (item) {
    if (!item.el) return false;
    var section = item.config.sectionId && document.getElementById(item.config.sectionId);
    var visible = inWindow(item.config, now);
    if (section) section.hidden = !visible;
    return visible;
  });

  if (!active.length) return;

  function update() {
    active.forEach(function (item) {
      var now = new Date();
      if (now.getMonth() === item.config.month && now.getDate() === item.config.day) {
        item.el.textContent = item.config.reachedText;
        return;
      }
      item.el.textContent = format(nextTarget(item.config.month, item.config.day).getTime() - now.getTime());
    });
  }

  update();
  setInterval(update, 1000);
})();
