(function () {
  var el = document.getElementById('big-three-rates');
  if (!el) return;

  fetch('https://etoro-readonly-mcp.guidorico.workers.dev/market-data/big-three')
    .then(function (res) {
      if (!res.ok) throw new Error('bad response');
      return res.json();
    })
    .then(function (data) {
      if (!data || data.dow == null || data.sp500 == null || data.nasdaq == null) return;
      var fmt = function (n) {
        return Math.round(n).toLocaleString('en-US');
      };
      var text = 'Dow ' + fmt(data.dow) + ' · S&P 500 ' + fmt(data.sp500) + ' · Nasdaq ' + fmt(data.nasdaq);
      if (data.eustx50 != null) text += ' · Euro Stoxx 50 ' + fmt(data.eustx50);
      el.textContent = text;
    })
    .catch(function () {
      // Leave the button as-is if the rates can't be fetched.
    });
})();
