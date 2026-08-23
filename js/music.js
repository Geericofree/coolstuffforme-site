(function () {
  var btn = document.getElementById('music-toggle');
  var frame = document.getElementById('yt-audio');
  var loaded = false;
  var audible = false;
  // `list=RDm3stLwd1CnQ` (a YouTube-generated "Mix" playlist) throws
  // Error 153 when embedded on third-party sites -- loop the plain
  // video instead via loop=1 + playlist=<same id>.
  var src = 'https://www.youtube.com/embed/m3stLwd1CnQ?autoplay=1&mute=1&playsinline=1&enablejsapi=1&loop=1&playlist=m3stLwd1CnQ';

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
    load();
    postCommand('unMute');
    postCommand('playVideo');
    setAudible(true);
  }
  function stopAudible() {
    frame.src = '';
    loaded = false;
    setAudible(false);
  }

  // Nothing plays until the visitor explicitly clicks the button --
  // no autoplay attempt on page load, no play-on-first-interaction.
  btn.addEventListener('click', function () {
    if (audible) {
      stopAudible();
    } else {
      playAudible();
    }
  });
})();
