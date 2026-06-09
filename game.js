const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

const W = canvas.width;
const H = canvas.height;

const friction = 0.985;
const minSpeed = 0.08;

let balls = [];
let pockets = [];
let cueBall;
let aiming = false;
let aimStart = null;
let mouse = { x: 0, y: 0 };
let score = 0;
let shots = 0;
let gameWon = false;

function createBall(x, y, color, isCue = false) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    r: 14,
    color,
    isCue,
    pocketed: false
  };
}

function resetGame() {
  score = 0;
  shots = 0;
  gameWon = false;

  pockets = [
    { x: 26, y: 26, r: 27 },
    { x: W / 2, y: 18, r: 24 },
    { x: W - 26, y: 26, r: 27 },
    { x: 26, y: H - 26, r: 27 },
    { x: W / 2, y: H - 18, r: 24 },
    { x: W - 26, y: H - 26, r: 27 }
  ];

  cueBall = createBall(210, H / 2, "#ffffff", true);

  balls = [
    cueBall,
    createBall(600, H / 2, "#f44336"),
    createBall(632, H / 2 - 22, "#ffeb3b"),
    createBall(632, H / 2 + 22, "#2196f3"),
    createBall(664, H / 2, "#9c27b0"),
    createBall(696, H / 2 - 22, "#ff9800"),
    createBall(696, H / 2 + 22, "#00e676")
  ];

  scoreEl.textContent = score;
  shotsEl.textContent = shots;
  messageEl.textContent = "Đưa tất cả bi màu vào lỗ để thắng!";
}

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function isMoving() {
  return balls.some(ball => Math.abs(ball.vx) > minSpeed || Math.abs(ball.vy) > minSpeed);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function updatePhysics() {
  for (const ball of balls) {
    if (ball.pocketed) continue;

    ball.x += ball.vx;
    ball.y += ball.vy;

    ball.vx *= friction;
    ball.vy *= friction;

    if (Math.abs(ball.vx) < minSpeed) ball.vx = 0;
    if (Math.abs(ball.vy) < minSpeed) ball.vy = 0;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx *= -0.9;
    }
    if (ball.x + ball.r > W) {
      ball.x = W - ball.r;
      ball.vx *= -0.9;
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy *= -0.9;
    }
    if (ball.y + ball.r > H) {
      ball.y = H - ball.r;
      ball.vy *= -0.9;
    }
  }

  handleBallCollisions();
  handlePockets();
}

function handleBallCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];

      if (a.pocketed || b.pocketed) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;

      if (dist > 0 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        a.x -= nx * overlap / 2;
        a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2;
        b.y += ny * overlap / 2;

        const tx = -ny;
        const ty = nx;

        const dpTanA = a.vx * tx + a.vy * ty;
        const dpTanB = b.vx * tx + b.vy * ty;

        const dpNormA = a.vx * nx + a.vy * ny;
        const dpNormB = b.vx * nx + b.vy * ny;

        a.vx = tx * dpTanA + nx * dpNormB;
        a.vy = ty * dpTanA + ny * dpNormB;
        b.vx = tx * dpTanB + nx * dpNormA;
        b.vy = ty * dpTanB + ny * dpNormA;
      }
    }
  }
}

function handlePockets() {
  for (const ball of balls) {
    if (ball.pocketed) continue;

    for (const pocket of pockets) {
      if (distance(ball, pocket) < pocket.r - 3) {
        if (ball.isCue) {
          ball.x = 210;
          ball.y = H / 2;
          ball.vx = 0;
          ball.vy = 0;
          messageEl.textContent = "Bi trắng rơi lỗ! Đã đặt lại vị trí.";
        } else {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          score += 10;
          scoreEl.textContent = score;
        }
      }
    }
  }

  const remainingColorBalls = balls.filter(ball => !ball.isCue && !ball.pocketed).length;
  if (remainingColorBalls === 0 && !gameWon) {
    gameWon = true;
    messageEl.textContent = `Bạn thắng! Tổng điểm: ${score}, số lượt bắn: ${shots}.`;
  }
}

function drawTable() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#147344";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 38, W - 76, H - 76);

  for (const pocket of pockets) {
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, pocket.r, 0, Math.PI * 2);
    ctx.fillStyle = "#07100b";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, pocket.r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawBalls() {
  for (const ball of balls) {
    if (ball.pocketed) continue;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x - 5, ball.y - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawAimLine() {
  if (!aiming || isMoving() || gameWon) return;

  const dx = cueBall.x - mouse.x;
  const dy = cueBall.y - mouse.y;
  const power = Math.min(Math.hypot(dx, dy), 130);

  ctx.beginPath();
  ctx.moveTo(cueBall.x, cueBall.y);
  ctx.lineTo(cueBall.x + (dx / Math.hypot(dx, dy)) * power, cueBall.y + (dy / Math.hypot(dx, dy)) * power);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(mouse.x, mouse.y);
  ctx.lineTo(cueBall.x, cueBall.y);
  ctx.strokeStyle = "rgba(255, 207, 58, 0.75)";
  ctx.lineWidth = 6;
  ctx.stroke();
}

function draw() {
  drawTable();
  drawAimLine();
  drawBalls();
}

function gameLoop() {
  updatePhysics();
  draw();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("mousedown", event => {
  if (gameWon || isMoving()) return;

  mouse = getMousePos(event);
  if (distance(mouse, cueBall) < 70) {
    aiming = true;
    aimStart = mouse;
  }
});

canvas.addEventListener("mousemove", event => {
  mouse = getMousePos(event);
});

canvas.addEventListener("mouseup", event => {
  if (!aiming || gameWon || isMoving()) return;

  mouse = getMousePos(event);

  const dx = cueBall.x - mouse.x;
  const dy = cueBall.y - mouse.y;
  const power = Math.min(Math.hypot(dx, dy), 130);
  const angle = Math.atan2(dy, dx);

  cueBall.vx = Math.cos(angle) * power * 0.18;
  cueBall.vy = Math.sin(angle) * power * 0.18;

  aiming = false;
  shots++;
  shotsEl.textContent = shots;
});

canvas.addEventListener("mouseleave", () => {
  aiming = false;
});

restartBtn.addEventListener("click", resetGame);

resetGame();
gameLoop();
