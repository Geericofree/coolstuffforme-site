// Cloudflare Web Analytics (already loaded at the bottom of the page) has no
// custom-event API — it only auto-tracks page views, including SPA route
// changes made via history.pushState. So a click on a [data-track] element
// is logged by briefly pushing a synthetic "/e/<name>" path and immediately
// replacing it back to the real URL: Cloudflare's route-change listener
// picks up the push, and the replace keeps the address bar and back button
// pointed at the real page instead of the synthetic one.
(function () {
  if (!window.history || !history.pushState) return;

  function trackEvent(name) {
    var realUrl = location.pathname + location.search + location.hash;
    history.pushState(null, '', '/e/' + name);
    history.replaceState(null, '', realUrl);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (el) trackEvent(el.getAttribute('data-track'));
  });

  window.trackEvent = trackEvent;
})();
