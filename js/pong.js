(function () {
  var canvas = document.getElementById('pong-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;

  var scorePlayerEl = document.getElementById('pong-score-player');
  var scoreCpuEl = document.getElementById('pong-score-cpu');
  var restartBtn = document.getElementById('pong-restart');
  var gameView = document.getElementById('view-game');

  var PW = 8, PH = 60;
  var PLAYER_X = 16;
  var CPU_X = W - 16 - PW;
  var BALL_R = 6;
  var WIN_SCORE = 7;

  var playerY, cpuY, playerTargetY;
  var ballX, ballY, ballVX, ballVY;
  var playerScore, cpuScore;
  var serving, servingTo, serveTimer;
  var gameOver, winner;
  var keyUp = false, keyDown = false;
  var running = false;
  var rafId = null;

  function resetBall(direction) {
    ballX = W / 2;
    ballY = H / 2;
    ballVX = 0;
    ballVY = 0;
    serving = true;
    servingTo = direction;
    serveTimer = 0;
  }

  function resetMatch() {
    playerY = H / 2;
    cpuY = H / 2;
    playerTargetY = H / 2;
    playerScore = 0;
    cpuScore = 0;
    gameOver = false;
    winner = null;
    updateScoreDom();
    resetBall(Math.random() < 0.5 ? 'player' : 'cpu');
  }

  function updateScoreDom() {
    scorePlayerEl.textContent = String(playerScore);
    scoreCpuEl.textContent = String(cpuScore);
  }

  function launchBall() {
    var baseSpeed = 4.6;
    ballVX = servingTo === 'player' ? -baseSpeed : baseSpeed;
    ballVY = (Math.random() * 2 - 1) * 2.4;
    serving = false;
  }

  function getCanvasY(clientY) {
    var rect = canvas.getBoundingClientRect();
    var scaleY = H / rect.height;
    return (clientY - rect.top) * scaleY;
  }

  function onPointerMove(clientY) {
    playerTargetY = getCanvasY(clientY);
  }

  canvas.addEventListener('mousemove', function (e) {
    onPointerMove(e.clientY);
  });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length) {
      onPointerMove(e.touches[0].clientY);
      e.preventDefault();
    }
  }, { passive: false });
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length) {
      onPointerMove(e.touches[0].clientY);
    }
    tryServe();
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('click', function () {
    tryServe();
  });

  function tryServe() {
    if (gameOver) return;
    if (serving && servingTo === 'player') {
      launchBall();
    }
  }

  window.addEventListener('keydown', function (e) {
    if (!gameView || gameView.style.display !== 'block') return;
    var key = e.key;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      keyUp = true;
      e.preventDefault();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      keyDown = true;
      e.preventDefault();
    } else if (key === ' ') {
      tryServe();
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', function (e) {
    var key = e.key;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') keyUp = false;
    if (key === 'ArrowDown' || key === 's' || key === 'S') keyDown = false;
  });

  restartBtn.addEventListener('click', function () {
    resetMatch();
  });

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function update() {
    if (gameOver) return;

    if (keyUp) playerTargetY -= 7;
    if (keyDown) playerTargetY += 7;
    playerTargetY = clamp(playerTargetY, PH / 2, H - PH / 2);
    playerY += (playerTargetY - playerY) * 0.4;
    playerY = clamp(playerY, PH / 2, H - PH / 2);

    if (serving) {
      if (servingTo === 'cpu') {
        serveTimer++;
        if (serveTimer > 45) launchBall();
      }
      cpuY += (ballY - cpuY) * 0.05;
      cpuY = clamp(cpuY, PH / 2, H - PH / 2);
      return;
    }

    var cpuTarget = ballY + (Math.random() - 0.5) * 14;
    var cpuSpeed = 4.4;
    if (Math.abs(cpuTarget - cpuY) > cpuSpeed) {
      cpuY += cpuTarget > cpuY ? cpuSpeed : -cpuSpeed;
    } else {
      cpuY = cpuTarget;
    }
    cpuY = clamp(cpuY, PH / 2, H - PH / 2);

    ballX += ballVX;
    ballY += ballVY;

    if (ballY - BALL_R <= 0) {
      ballY = BALL_R;
      ballVY = -ballVY;
    } else if (ballY + BALL_R >= H) {
      ballY = H - BALL_R;
      ballVY = -ballVY;
    }

    if (ballVX < 0 && ballX - BALL_R <= PLAYER_X + PW && ballX - BALL_R > PLAYER_X - 4 &&
        ballY >= playerY - PH / 2 - BALL_R && ballY <= playerY + PH / 2 + BALL_R) {
      ballX = PLAYER_X + PW + BALL_R;
      var offsetP = (ballY - playerY) / (PH / 2);
      ballVX = Math.min(Math.abs(ballVX) * 1.06, 11);
      ballVY = offsetP * 5;
    } else if (ballVX > 0 && ballX + BALL_R >= CPU_X && ballX + BALL_R < CPU_X + PW + 4 &&
        ballY >= cpuY - PH / 2 - BALL_R && ballY <= cpuY + PH / 2 + BALL_R) {
      ballX = CPU_X - BALL_R;
      var offsetC = (ballY - cpuY) / (PH / 2);
      ballVX = -Math.min(Math.abs(ballVX) * 1.06, 11);
      ballVY = offsetC * 5;
    }

    if (ballX < -BALL_R * 2) {
      cpuScore++;
      updateScoreDom();
      if (cpuScore >= WIN_SCORE) {
        endMatch('CPU');
      } else {
        resetBall('player');
      }
    } else if (ballX > W + BALL_R * 2) {
      playerScore++;
      updateScoreDom();
      if (playerScore >= WIN_SCORE) {
        endMatch('YOU');
      } else {
        resetBall('cpu');
      }
    }
  }

  function endMatch(who) {
    gameOver = true;
    winner = who;
  }

  function drawPaddle(x, y) {
    ctx.fillStyle = '#eafff0';
    ctx.shadowColor = 'rgba(62, 242, 92, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillRect(x, y - PH / 2, PW, PH);
    ctx.shadowBlur = 0;
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(234, 255, 240, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    drawPaddle(PLAYER_X, playerY);
    drawPaddle(CPU_X, cpuY);

    if (!gameOver && !(serving && servingTo === 'player')) {
      ctx.fillStyle = '#eafff0';
      ctx.shadowColor = 'rgba(62, 242, 92, 0.9)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (serving && servingTo === 'player') {
      ctx.fillStyle = '#eafff0';
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(234, 255, 240, 0.75)';
    ctx.textAlign = 'center';
    if (gameOver) {
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillStyle = '#3ef25c';
      ctx.fillText(winner + ' WIN' + (winner === 'YOU' ? '!' : 'S!'), W / 2, H / 2 - 10);
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = 'rgba(234, 255, 240, 0.75)';
      ctx.fillText('Press Restart to play again', W / 2, H / 2 + 18);
    } else if (serving && servingTo === 'player') {
      ctx.fillText('TAP / CLICK / SPACE TO SERVE', W / 2, H - 14);
    } else if (serving && servingTo === 'cpu') {
      ctx.fillText('CPU SERVING…', W / 2, H - 14);
    }
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    if (playerScore === undefined) resetMatch();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    keyUp = false;
    keyDown = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  resetMatch();
  draw();

  window.pongGame = { start: start, stop: stop };

  if (gameView && gameView.style.display === 'block') {
    start();
  }
})();
