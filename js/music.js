(function () {
  var btn = document.getElementById('music-toggle');
  var frame = document.getElementById('yt-audio');
  var loaded = false;
  var audible = false;
  // `list=RDm3stLwd1CnQ` (a YouTube-generated "Mix" playlist) throws
  // Error 153 when embedded on third-party sites -- Mixes are commonly
  // not embeddable outside youtube.com, unlike a single regular video.
  // Loop the plain video instead via loop=1 + playlist=<same id>
  // (YouTube requires the playlist param to loop a single video).
  var src = 'https://www.youtube.com/embed/m3stLwd1CnQ?autoplay=1&mute=1&playsinline=1&enablejsapi=1&modestbranding=1&rel=0&loop=1&playlist=m3stLwd1CnQ';

  // The iframe is audio-only (0x0, hidden) -- there's no video to show,
  // just background music. Autoplay muted (universally allowed), then
  // unmute via the YouTube postMessage API once a real interaction
  // happens. Note: Safari (iOS) ignores this postMessage-driven unmute
  // since it doesn't originate from a gesture inside the player's own
  // document, so sound may not play on some mobile browsers -- that's
  // an accepted tradeoff for keeping the player invisible. The button
  // label tracks audible state, not load state, so the visitor's first
  // tap on it unmutes rather than stopping a video they never heard.
  function postCommand(func) {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*');
  }
  function load() {
    if (loaded) return;
    frame.src = src;
    loaded = true;
  }
  function setAudible(on) {
    audible = on;
    btn.innerHTML = on ? '&#10074;&#10074; Pause Music' : '&#9658; Play Music';
  }
  function playAudible() {
    if (loaded) {
      postCommand('unMute');
      postCommand('playVideo');
    } else {
      // A fresh load needs the iframe to finish loading before it'll
      // accept postMessage commands; sending them immediately after
      // setting src is a no-op since the player isn't listening yet.
      frame.onload = function () {
        postCommand('unMute');
        postCommand('playVideo');
      };
      load();
    }
    setAudible(true);
  }
  function stopAudible() {
    frame.onload = null;
    frame.src = '';
    loaded = false;
    setAudible(false);
  }

  // Autoplay muted immediately on load; every browser allows this.
  load();

  // Unmute on the visitor's first interaction anywhere on the page.
  var kickoffEvents = ['click', 'scroll', 'keydown', 'touchstart'];
  function kickoff(e) {
    if (e.target === btn) return; // the toggle button's own handler covers this
    playAudible();
    kickoffEvents.forEach(function (evt) {
      document.removeEventListener(evt, kickoff);
    });
  }
  kickoffEvents.forEach(function (evt) {
    document.addEventListener(evt, kickoff, { passive: true });
  });

  btn.addEventListener('click', function () {
    if (audible) {
      stopAudible();
    } else {
      playAudible();
    }
  });
})();
