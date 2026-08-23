(function () {
  var iframe = document.getElementById('featured-video-iframe');
  var btn = document.getElementById('video-sound-toggle');
  if (!iframe || !btn) return;

  // Browsers block autoplay with sound; the embed starts muted so it can
  // autoplay, and this button unmutes on click (a real user gesture).
  function postCommand(func, args) {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: func, args: args || [] }),
      '*'
    );
  }

  btn.addEventListener('click', function () {
    postCommand('unMute');
    postCommand('setVolume', [100]);
    postCommand('playVideo');
    btn.classList.add('is-hidden');
  });
})();
