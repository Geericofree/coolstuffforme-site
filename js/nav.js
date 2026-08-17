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
