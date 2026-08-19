(function () {
  var el = document.getElementById('usd-mxn-rate');
  if (!el) return;

  fetch('/api/usd-mxn')
    .then(function (res) {
      if (!res.ok) throw new Error('bad response');
      return res.json();
    })
    .then(function (data) {
      var rate = data && data.rate;
      if (!rate) return;
      el.textContent = '1 USD = ' + rate.toFixed(2) + ' MXN (DOF)';
    })
    .catch(function () {
      // Leave the button as-is if the rate can't be fetched.
    });
})();
