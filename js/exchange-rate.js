(function () {
  var el = document.getElementById('usd-mxn-rate');
  if (!el) return;

  fetch('https://api.frankfurter.app/latest?from=USD&to=MXN')
    .then(function (res) {
      if (!res.ok) throw new Error('bad response');
      return res.json();
    })
    .then(function (data) {
      var rate = data && data.rates && data.rates.MXN;
      if (!rate) return;
      el.textContent = '1 USD = ' + rate.toFixed(2) + ' MXN';
    })
    .catch(function () {
      // Leave the button as-is if the rate can't be fetched.
    });
})();
