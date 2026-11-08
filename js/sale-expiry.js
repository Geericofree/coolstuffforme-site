// Hides anything marked data-hide-after="YYYY-MM-DD" once that date arrives
// (local time), e.g. sold listings that should disappear after 30 days.
(function () {
  var now = new Date();
  document.querySelectorAll('[data-hide-after]').forEach(function (el) {
    var parts = el.getAttribute('data-hide-after').split('-');
    var cutoff = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (now >= cutoff) el.remove();
  });
})();
