(function () {
  var home = document.getElementById('view-home');
  var photos = document.getElementById('view-photos');
  var navPhotos = document.getElementById('nav-photos');
  var navHome = document.getElementById('nav-home');

  function showPhotos() {
    home.style.display = 'none';
    photos.style.display = 'block';
    history.pushState(null, '', '#photos');
    window.scrollTo(0, 0);
  }
  function showHome() {
    photos.style.display = 'none';
    home.style.display = 'block';
    history.pushState(null, '', location.pathname);
    window.scrollTo(0, 0);
  }
  navPhotos.addEventListener('click', function (e) {
    e.preventDefault();
    showPhotos();
  });
  navHome.addEventListener('click', function (e) {
    e.preventDefault();
    showHome();
  });
  function syncToHash() {
    if (location.hash === '#photos') {
      showPhotos();
    } else {
      showHome();
    }
  }
  window.addEventListener('popstate', syncToHash);
  window.addEventListener('hashchange', syncToHash);
  if (location.hash === '#photos') {
    showPhotos();
  }
})();
