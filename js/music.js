(function () {
  var btn = document.getElementById('music-toggle');
  var frame = document.getElementById('yt-audio');
  var loaded = false;
  var audible = false;
  var src = 'https://www.youtube.com/embed/m3stLwd1CnQ?list=RDm3stLwd1CnQ&autoplay=1&mute=1&playsinline=1&enablejsapi=1';

  // Safari (iOS) blocks unmuted autoplay through cross-origin iframes
  // almost unconditionally, even inside a user-gesture handler. The
  // reliable pattern is: autoplay muted (always allowed), then unmute
  // the already-playing video via the YouTube postMessage API once a
  // real click happens. The button label tracks audible state, not
  // load state, so the visitor's first tap on it unmutes rather than
  // stopping a video they were never able to hear.
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
