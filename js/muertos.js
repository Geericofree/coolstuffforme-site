(function () {
  var section = document.getElementById('section-muertos');
  var list = document.getElementById('muertos-days');
  var text = document.getElementById('muertos-text');
  var label = document.getElementById('muertos-label');
  if (!section || !list || !text || !label) return;

  // Visible from the day after Independence Day through Nov 2.
  var SHOW_FROM = 8 * 100 + 17; // Sept 17
  var SHOW_UNTIL = 10 * 100 + 2; // Nov 2

  var days = Array.prototype.map.call(list.querySelectorAll('li'), function (li) {
    return {
      el: li,
      month: Number(li.dataset.month),
      day: Number(li.dataset.day),
      who: li.querySelector('.muertos-who').textContent
    };
  });

  function key(month, day) {
    return month * 100 + day;
  }

  function format(diff) {
    var totalSeconds = Math.floor(diff / 1000);
    var d = Math.floor(totalSeconds / 86400);
    var h = Math.floor((totalSeconds % 86400) / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    return d + 'd ' + h + 'h ' + m + 'm ' + s + 's';
  }

  var today = new Date();
  var todayKey = key(today.getMonth(), today.getDate());
  if (todayKey < SHOW_FROM || todayKey > SHOW_UNTIL) return;
  section.hidden = false;

  function update() {
    var now = new Date();
    var nowKey = key(now.getMonth(), now.getDate());
    var current = null;

    days.forEach(function (d) {
      var k = key(d.month, d.day);
      d.el.classList.toggle('is-today', k === nowKey);
      d.el.classList.toggle('is-past', k < nowKey);
      if (k === nowKey) current = d;
    });

    if (current) {
      text.textContent = 'Hoy recordamos 🕯️';
      label.textContent = current.who;
      return;
    }

    var first = days[0];
    var target = new Date(now.getFullYear(), first.month, first.day, 0, 0, 0);
    text.textContent = format(target.getTime() - now.getTime());
    label.textContent = 'until the first ofrenda';
  }

  update();
  setInterval(update, 1000);
})();
