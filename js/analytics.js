(function () {
  var KEY_STORAGE_KEY = 'cf-analytics-key';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var gate = document.getElementById('gate');
  var gateKeyInput = document.getElementById('gate-key');
  var gateUnlockBtn = document.getElementById('gate-unlock');
  var gateError = document.getElementById('gate-error');
  var loadError = document.getElementById('load-error');
  var dashboard = document.getElementById('dashboard');
  var statusNote = document.getElementById('status-note');
  var rangeGroup = document.getElementById('range-group');
  var lockBtn = document.getElementById('lock-btn');
  var tableToggle = document.getElementById('table-toggle');
  var trendSvg = document.getElementById('trend-svg');
  var trendTable = document.getElementById('trend-table');
  var trendTableBody = document.getElementById('trend-table-body');
  var tooltip = document.getElementById('tooltip');
  var statsEl = document.getElementById('stats');

  var state = {
    days: 7,
    data: null,
    showTable: false
  };

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function numberFmt(n) {
    return Math.round(n).toLocaleString();
  }

  function getKey() {
    try {
      return sessionStorage.getItem(KEY_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setKey(key) {
    try {
      sessionStorage.setItem(KEY_STORAGE_KEY, key);
    } catch (e) {
      // sessionStorage unavailable (private mode, etc.) — the fetch below
      // still works for the current call, it just won't persist.
    }
  }

  function clearKey() {
    try {
      sessionStorage.removeItem(KEY_STORAGE_KEY);
    } catch (e) {}
  }

  function showGate(message) {
    dashboard.style.display = 'none';
    gate.style.display = 'block';
    gateError.textContent = message || '';
  }

  function showDashboard() {
    gate.style.display = 'none';
    loadError.style.display = 'none';
    dashboard.style.display = 'block';
  }

  function showLoadError(message) {
    loadError.textContent = message;
    loadError.style.display = 'block';
  }

  // --- data fetch -----------------------------------------------------

  function fetchAnalytics(days, key) {
    dashboard.classList.add('is-loading');
    return fetch('/api/analytics?days=' + encodeURIComponent(days), {
      headers: { 'x-dashboard-key': key }
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        dashboard.classList.remove('is-loading');
        if (result.status === 401) {
          clearKey();
          showGate('Incorrect key.');
          return null;
        }
        if (result.status === 503) {
          showDashboard();
          statusNote.textContent = '';
          showLoadError('Analytics API isn’t configured yet — see the setup notes at the top of cloudflare/security-headers-worker.js.');
          return null;
        }
        if (!result.ok) {
          showDashboard();
          statusNote.textContent = '';
          showLoadError('Could not load analytics (' + (result.body && result.body.error ? result.body.error : result.status) + ').');
          return null;
        }
        return result.body;
      })
      .catch(function (err) {
        dashboard.classList.remove('is-loading');
        showDashboard();
        statusNote.textContent = '';
        showLoadError('Network error loading analytics: ' + err.message);
        return null;
      });
  }

  function load(days) {
    var key = getKey();
    if (!key) {
      showGate('');
      return;
    }
    statusNote.textContent = 'Loading…';
    fetchAnalytics(days, key).then(function (data) {
      if (!data) return;
      showDashboard();
      state.data = data;
      state.days = days;
      renderAll();
    });
  }

  // --- dimension helpers ------------------------------------------------
  // Field names follow Cloudflare's documented rumPageloadEventsAdaptiveGroups
  // schema; if Cloudflare renames a field these fall back to "(unknown)"
  // instead of breaking the page.

  function dimLabel(row, field, fallback) {
    var d = row.dimensions || {};
    var v = d[field];
    return (v === undefined || v === null || v === '') ? fallback : String(v);
  }

  // --- rendering ----------------------------------------------------

  function renderAll() {
    var days = state.days;
    Array.prototype.forEach.call(rangeGroup.children, function (btn) {
      btn.classList.toggle('is-active', parseInt(btn.getAttribute('data-days'), 10) === days);
    });
    renderStats();
    renderTrend();
    renderBarList('panel-paths', state.data.topPaths, function (r) { return dimLabel(r, 'requestPath', '(unknown page)'); });
    renderBarList('panel-referers', state.data.topReferers, function (r) { return dimLabel(r, 'refererHost', '(direct / none)'); });
    renderBarList('panel-countries', state.data.topCountries, function (r) { return dimLabel(r, 'countryName', '(unknown)'); });
    renderBarList('panel-devices', state.data.byDevice, function (r) { return dimLabel(r, 'deviceType', '(unknown)'); });
    statusNote.textContent = 'Last ' + days + (days === 1 ? ' day' : ' days') + ', through ' + new Date(state.data.range.until).toLocaleString();
  }

  function renderStats() {
    var daily = state.data.daily || [];
    var totalPageviews = daily.reduce(function (sum, r) { return sum + (r.count || 0); }, 0);
    var totalVisits = daily.reduce(function (sum, r) { return sum + ((r.sum && r.sum.visits) || 0); }, 0);
    var avgVisits = daily.length ? totalVisits / daily.length : 0;
    var topCountries = state.data.topCountries || [];
    var topCountry = topCountries.length ? dimLabel(topCountries[0], 'countryName', '(unknown)') : '—';

    var tiles = [
      { label: 'Visits', value: numberFmt(totalVisits) },
      { label: 'Pageviews', value: numberFmt(totalPageviews) },
      { label: 'Avg visits / day', value: numberFmt(avgVisits) },
      { label: 'Top country', value: topCountry }
    ];

    clearChildren(statsEl);
    tiles.forEach(function (tile) {
      var card = document.createElement('div');
      card.className = 'card';
      var value = document.createElement('div');
      value.className = 'stat-value';
      value.textContent = tile.value;
      var label = document.createElement('div');
      label.className = 'stat-label';
      label.textContent = tile.label;
      card.appendChild(value);
      card.appendChild(label);
      statsEl.appendChild(card);
    });
  }

  // Fills in zero-value days so a quiet day reads as "0", not a gap.
  function buildDailySeries(daily, days) {
    var byDate = {};
    (daily || []).forEach(function (r) {
      var date = dimLabel(r, 'date', null);
      if (date) {
        byDate[date] = { visits: (r.sum && r.sum.visits) || 0, pageviews: r.count || 0 };
      }
    });
    var series = [];
    var until = new Date(state.data.range.until);
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(until.getTime() - i * 86400000);
      var key = d.toISOString().slice(0, 10);
      var entry = byDate[key] || { visits: 0, pageviews: 0 };
      series.push({ date: key, visits: entry.visits, pageviews: entry.pageviews });
    }
    return series;
  }

  function renderTrend() {
    var series = buildDailySeries(state.data.daily, state.days);
    renderTrendTable(series);
    renderTrendChart(series);
  }

  function renderTrendTable(series) {
    clearChildren(trendTableBody);
    series.forEach(function (row) {
      var tr = document.createElement('tr');
      var cells = [row.date, numberFmt(row.visits), numberFmt(row.pageviews)];
      cells.forEach(function (val) {
        var td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      trendTableBody.appendChild(tr);
    });
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function renderTrendChart(series) {
    clearChildren(trendSvg);
    var wrap = trendSvg.parentElement.getBoundingClientRect();
    var width = Math.max(wrap.width, 280);
    var height = 220;
    var padLeft = 34;
    var padBottom = 24;
    var padTop = 10;
    var plotW = width - padLeft - 8;
    var plotH = height - padTop - padBottom;

    trendSvg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    var maxVal = 1;
    series.forEach(function (d) {
      maxVal = Math.max(maxVal, d.visits, d.pageviews);
    });

    var muted = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#8f8f8f';
    var border = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#262626';
    var series1 = getComputedStyle(document.documentElement).getPropertyValue('--series-1').trim() || '#3987e5';
    var series2 = getComputedStyle(document.documentElement).getPropertyValue('--series-2').trim() || '#d95926';

    // gridlines + y-axis labels (0, mid, max)
    [0, 0.5, 1].forEach(function (frac) {
      var y = padTop + plotH * (1 - frac);
      trendSvg.appendChild(svgEl('line', {
        x1: padLeft, x2: width - 8, y1: y, y2: y,
        stroke: border, 'stroke-width': 1
      }));
      var label = svgEl('text', {
        x: padLeft - 6, y: y + 4, 'text-anchor': 'end',
        'font-size': 10, fill: muted
      });
      label.textContent = numberFmt(maxVal * frac);
      trendSvg.appendChild(label);
    });

    var n = series.length;
    var groupW = plotW / n;
    var barW = Math.max(2, Math.min(14, groupW * 0.32));
    var labelEvery = Math.ceil(n / 8);

    series.forEach(function (d, i) {
      var groupX = padLeft + i * groupW;
      var gap = 2;
      var visitsH = (d.visits / maxVal) * plotH;
      var pvH = (d.pageviews / maxVal) * plotH;
      var visitsX = groupX + groupW / 2 - barW - gap / 2;
      var pvX = groupX + groupW / 2 + gap / 2;

      var group = svgEl('g', { tabindex: '0' });
      group.setAttribute('aria-label', d.date + ': ' + d.visits + ' visits, ' + d.pageviews + ' pageviews');

      var hit = svgEl('rect', {
        class: 'bar', x: groupX, y: padTop, width: groupW, height: plotH,
        fill: 'transparent'
      });

      var barVisits = svgEl('rect', {
        x: visitsX, y: padTop + plotH - visitsH, width: barW, height: Math.max(visitsH, 1),
        rx: 2, fill: series1
      });
      var barPv = svgEl('rect', {
        x: pvX, y: padTop + plotH - pvH, width: barW, height: Math.max(pvH, 1),
        rx: 2, fill: series2
      });

      group.appendChild(hit);
      group.appendChild(barVisits);
      group.appendChild(barPv);

      function show(evt) {
        tooltip.style.display = 'block';
        clearChildren(tooltip);
        var title = document.createElement('div');
        title.className = 't-title';
        title.textContent = d.date;
        tooltip.appendChild(title);
        [{ label: 'Visits', value: d.visits, color: series1 }, { label: 'Pageviews', value: d.pageviews, color: series2 }].forEach(function (row) {
          var r = document.createElement('div');
          r.className = 't-row';
          var key = document.createElement('span');
          key.className = 't-key';
          key.style.background = row.color;
          var label = document.createElement('span');
          label.textContent = row.label + ':';
          var num = document.createElement('span');
          num.className = 't-num';
          num.textContent = numberFmt(row.value);
          r.appendChild(key);
          r.appendChild(label);
          r.appendChild(num);
          tooltip.appendChild(r);
        });
        var clientX = evt.clientX || (groupX);
        var clientY = evt.clientY || 0;
        tooltip.style.left = Math.min(clientX + 12, window.innerWidth - 180) + 'px';
        tooltip.style.top = Math.max(clientY - 60, 8) + 'px';
      }
      function hide() {
        tooltip.style.display = 'none';
      }

      group.addEventListener('pointermove', show);
      group.addEventListener('pointerenter', show);
      group.addEventListener('pointerleave', hide);
      group.addEventListener('focus', function (e) { show({ clientX: groupX, clientY: padTop }); });
      group.addEventListener('blur', hide);

      trendSvg.appendChild(group);

      if (i % labelEvery === 0) {
        var xLabel = svgEl('text', {
          x: groupX + groupW / 2, y: height - 6, 'text-anchor': 'middle',
          'font-size': 9, fill: muted
        });
        xLabel.textContent = d.date.slice(5);
        trendSvg.appendChild(xLabel);
      }
    });
  }

  function renderBarList(containerId, rows, labelFn) {
    var el = document.getElementById(containerId);
    clearChildren(el);
    rows = rows || [];
    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'No data for this range.';
      el.appendChild(empty);
      return;
    }
    var max = rows.reduce(function (m, r) { return Math.max(m, r.count || 0); }, 1);
    rows.forEach(function (row) {
      var wrapper = document.createElement('div');
      wrapper.className = 'bar-row';

      var label = document.createElement('span');
      label.className = 'bar-label';
      label.textContent = labelFn(row);
      label.title = label.textContent;

      var count = document.createElement('span');
      count.className = 'bar-count';
      count.textContent = numberFmt(row.count || 0);

      var track = document.createElement('div');
      track.className = 'bar-track';
      var fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = (((row.count || 0) / max) * 100).toFixed(1) + '%';
      track.appendChild(fill);

      wrapper.appendChild(label);
      wrapper.appendChild(count);
      wrapper.appendChild(track);
      el.appendChild(wrapper);
    });
  }

  // --- wiring ---------------------------------------------------------

  gateUnlockBtn.addEventListener('click', function () {
    var key = gateKeyInput.value.trim();
    if (!key) return;
    setKey(key);
    load(state.days);
  });
  gateKeyInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') gateUnlockBtn.click();
  });

  lockBtn.addEventListener('click', function () {
    clearKey();
    showGate('');
    gateKeyInput.value = '';
    gateKeyInput.focus();
  });

  Array.prototype.forEach.call(rangeGroup.children, function (btn) {
    btn.addEventListener('click', function () {
      load(parseInt(btn.getAttribute('data-days'), 10));
    });
  });

  tableToggle.addEventListener('click', function () {
    state.showTable = !state.showTable;
    trendSvg.style.display = state.showTable ? 'none' : 'block';
    trendTable.style.display = state.showTable ? 'table' : 'none';
    tableToggle.textContent = state.showTable ? 'View as chart' : 'View as table';
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (state.data) renderTrendChart(buildDailySeries(state.data.daily, state.days));
    }, 150);
  });

  load(state.days);
})();
