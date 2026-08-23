(function () {
  var views = {
    home: document.getElementById('view-home'),
    photos: document.getElementById('view-photos'),
    game: document.getElementById('view-game')
  };
  var navPhotos = document.getElementById('nav-photos');
  var navGame = document.getElementById('nav-game');
  var navHome = document.getElementById('nav-home');
  var navHomeGame = document.getElementById('nav-home-game');

  var mainVideo = document.getElementById('featured-video-iframe');
  var photosVideo = document.getElementById('photos-video-iframe');

  // The YouTube embed only starts listening for postMessage commands once
  // its player script has finished initializing, which can take a moment
  // after the iframe is created — retry briefly so a command sent right
  // after a view switch isn't silently dropped.
  function ytCommand(iframe, func, args) {
    if (!iframe) return;
    var payload = JSON.stringify({ event: 'command', func: func, args: args || [] });
    var attempts = 0;
    var send = function () {
      attempts++;
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(payload, '*');
      }
      if (attempts < 5) {
        setTimeout(send, 400);
      }
    };
    send();
  }

  // Only one of the two featured videos ever plays at a time: switching
  // views pauses whichever was playing and resumes/starts the other from
  // where it left off (the iframes stay in the DOM, so playback position
  // is preserved across visibility toggles).
  function syncVideos(name) {
    if (name === 'home') {
      ytCommand(photosVideo, 'pauseVideo');
      ytCommand(mainVideo, 'playVideo');
    } else if (name === 'photos') {
      ytCommand(mainVideo, 'pauseVideo');
      ytCommand(photosVideo, 'unMute');
      ytCommand(photosVideo, 'setVolume', [100]);
      ytCommand(photosVideo, 'playVideo');
    } else {
      ytCommand(mainVideo, 'pauseVideo');
      ytCommand(photosVideo, 'pauseVideo');
    }
  }

  function show(name) {
    Object.keys(views).forEach(function (key) {
      views[key].style.display = key === name ? 'block' : 'none';
    });
    var hash = name === 'home' ? '' : '#' + name;
    history.pushState(null, '', location.pathname + hash);
    window.scrollTo(0, 0);
    if (window.pongGame) {
      if (name === 'game') {
        window.pongGame.start();
      } else {
        window.pongGame.stop();
      }
    }
    syncVideos(name);
  }

  navPhotos.addEventListener('click', function (e) {
    e.preventDefault();
    show('photos');
  });
  navGame.addEventListener('click', function (e) {
    e.preventDefault();
    show('game');
  });
  navHome.addEventListener('click', function (e) {
    e.preventDefault();
    show('home');
  });
  navHomeGame.addEventListener('click', function (e) {
    e.preventDefault();
    show('home');
  });

  function syncToHash() {
    if (location.hash === '#photos') {
      show('photos');
    } else if (location.hash === '#game') {
      show('game');
    } else {
      show('home');
    }
  }
  window.addEventListener('popstate', syncToHash);
  window.addEventListener('hashchange', syncToHash);
  if (location.hash === '#photos' || location.hash === '#game') {
    syncToHash();
  }
})();
