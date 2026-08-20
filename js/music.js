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

  // Safari (iOS) blocks unmuted autoplay through cross-origin iframes
  // almost unconditionally, even inside a user-gesture handler, and
  // ignores postMessage-driven unmute commands too since they don't
  // originate from a real tap inside the player's own document. The
  // iframe is kept genuinely visible (not 0x0) so that on browsers
  // where our postMessage trick is ignored, the visitor can fall back
  // to tapping YouTube's own native unmute icon directly on the video
  // -- a real same-document gesture, which is honored reliably. The
  // button label tracks audible state, not load state, so the
  // visitor's first tap on it unmutes rather than stopping a video
  // they were never able to hear.
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
