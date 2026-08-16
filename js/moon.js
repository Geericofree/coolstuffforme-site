(function () {
  var emojiEl = document.getElementById('moon-emoji');
  var nameEl = document.getElementById('moon-phase-name');
  var percentEl = document.getElementById('moon-percent');
  var barEl = document.getElementById('moon-bar-fill');

  if (!emojiEl || !nameEl || !percentEl || !barEl) return;

  var SYNODIC_MONTH = 29.530588853; // days
  var KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0); // a known new moon reference

  var PHASES = [
    { max: 0.02, name: 'New Moon', emoji: '🌑' },
    { max: 0.25, name: 'Waxing Crescent', emoji: '🌒' },
    { max: 0.27, name: 'First Quarter', emoji: '🌓' },
    { max: 0.48, name: 'Waxing Gibbous', emoji: '🌔' },
    { max: 0.52, name: 'Full Moon', emoji: '🌕' },
    { max: 0.73, name: 'Waning Gibbous', emoji: '🌖' },
    { max: 0.75, name: 'Last Quarter', emoji: '🌗' },
    { max: 0.98, name: 'Waning Crescent', emoji: '🌘' },
    { max: 1.01, name: 'New Moon', emoji: '🌑' }
  ];

  function getPhaseFraction(date) {
    var days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
    var fraction = (days % SYNODIC_MONTH) / SYNODIC_MONTH;
    if (fraction < 0) fraction += 1;
    return fraction;
  }

  function getPhaseInfo(fraction) {
    for (var i = 0; i < PHASES.length; i++) {
      if (fraction <= PHASES[i].max) return PHASES[i];
    }
    return PHASES[PHASES.length - 1];
  }

  function update() {
    var fraction = getPhaseFraction(new Date());
    var illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2; // 0 at new moon, 1 at full moon
    var illuminationPct = Math.round(illumination * 100);
    var info = getPhaseInfo(fraction);
    var trend = fraction < 0.5 ? 'waxing toward full' : 'waning toward new';

    emojiEl.textContent = info.emoji;
    nameEl.textContent = info.name;
    percentEl.textContent = illuminationPct + '% illuminated — ' + trend;
    barEl.style.width = illuminationPct + '%';
  }

  update();
  setInterval(update, 60000);
})();
