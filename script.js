const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 40;
const SIZE = 15;

const playerImage = new Image();
playerImage.src = "5_20260825_165035_0003.png";

const chaserImages = {
  val: new Image(),
  taka: new Image(),
  nael: new Image()
};

chaserImages.val.src = "2_20260825_165035_0000.png";
chaserImages.taka.src = "3_20260825_165035_0001.png";
chaserImages.nael.src = "4_20260825_165035_0002.png";

const chaserNames = ["Val", "Taka", "Nael"];

let level = 1;
let score = 0;
let lives = 3;

let maze = [];
let pellets = [];
let mines = [];
let chasers = [];

let gameRunning = false;
let lastTime = 0;
let playerMoveTimer = 0;
let chaserMoveTimer = 0;

const player = {
  x: 1,
  y: 1,
  nextX: 1,
  nextY: 1,
  direction: "right"
};


/* =========================
   LEVEL SETTINGS
========================= */

const levelSettings = {
  1: {
    chasers: 1,
    speed: 360,
    note: "Val is coming... RUN! 👀"
  },

  2: {
    chasers: 2,
    speed: 320,
    note: "Taka joined the chase! 😭"
  },

  3: {
    chasers: 3,
    speed: 300,
    note: "THREE OF THEM?! 💀"
  },

  4: {
    chasers: 3,
    speed: 290,
    mines: true,
    note: "WATCH OUT FOR MINES! 💣"
  },

  5: {
    chasers: 1,
    speed: 130,
    note: "Only one... but VERY FAST. ⚡"
  },

  6: {
    chasers: 2,
    speed: 150,
    note: "They're getting FAST! 🏃💨"
  },

  7: {
    chasers: 3,
    speed: 140,
    note: "FINAL LEVEL. GOOD LUCK. 💀"
  }
};


/* =========================
   MAZE GENERATOR
========================= */

function createMaze() {

  maze = [];

  for (let y = 0; y < SIZE; y++) {

    maze[y] = [];

    for (let x = 0; x < SIZE; x++) {

      // Border
      if (
        x === 0 ||
        y === 0 ||
        x === SIZE - 1 ||
        y === SIZE - 1
      ) {
        maze[y][x] = 1;
      } else {
        maze[y][x] = 0;
      }

    }
  }


  // Main walls
  const walls = [

    [3, 2], [3, 3], [3, 4],
    [3, 5], [3, 6],

    [7, 2], [7, 3],
    [7, 4], [7, 5],

    [11, 2], [11, 3],
    [11, 4], [11, 5],

    [5, 8], [6, 8],
    [7, 8], [8, 8],
    [9, 8],

    [3, 11], [4, 11],
    [5, 11],

    [9, 11], [10, 11],
    [11, 11],

    [7, 12]
  ];


  // Add more walls as levels increase
  if (level >= 2) {

    walls.push(
      [2, 9],
      [2, 10],
      [12, 9],
      [12, 10]
    );
  }


  if (level >= 3) {

    walls.push(
      [6, 3],
      [6, 4],
      [8, 3],
      [8, 4]
    );
  }


  if (level >= 5) {

    walls.push(
      [4, 6],
      [5, 6],
      [9, 6],
      [10, 6]
    );
  }


  if (level >= 6) {

    walls.push(
      [2, 5],
      [12, 5],
      [2, 12],
      [12, 12]
    );
  }


  if (level >= 7) {

    walls.push(
      [5, 2],
      [5, 3],
      [9, 2],
      [9, 3],

      [5, 13],
      [9, 13]
    );
  }


  for (const [x, y] of walls) {
    maze[y][x] = 1;
  }


  // Keep starting area clear
  maze[1][1] = 0;
  maze[1][2] = 0;
  maze[2][1] = 0;
}


/* =========================
   PELLETS
========================= */

function createPellets() {

  pellets = [];

  for (let y = 1; y < SIZE - 1; y++) {

    for (let x = 1; x < SIZE - 1; x++) {

      if (
        maze[y][x] === 0 &&
        !(x === player.x && y === player.y)
      ) {

        pellets.push({
          x,
          y
        });

      }
    }
  }
}


/* =========================
   MINES
========================= */

function createMines() {

  mines = [];

  if (level !== 4) return;

  const possible = pellets.slice();

  // Randomly select 8 mines
  possible.sort(() => Math.random() - 0.5);

  for (let i = 0; i < 8 && i < possible.length; i++) {

    const mine = possible[i];

    // Don't put mine too close to player
    if (
      Math.abs(mine.x - player.x) +
      Math.abs(mine.y - player.y) > 3
    ) {
      mines.push({
        x: mine.x,
        y: mine.y
      });
    }
  }
}


/* =========================
   CHASERS
========================= */

function createChasers() {

  chasers = [];

  const positions = [
    { x: 13, y: 13 },
    { x: 13, y: 1 },
    { x: 1, y: 13 }
  ];


  const names = ["val", "taka", "nael"];

  const amount = levelSettings[level].chasers;

  for (let i = 0; i < amount; i++) {

    chasers.push({

      name: names[i],

      x: positions[i].x,
      y: positions[i].y,

      image: chaserImages[names[i]],

      moveTimer: 0

    });
  }
}


/* =========================
   START LEVEL
========================= */

function startLevel() {

  createMaze();

  player.x = 1;
  player.y = 1;

  player.nextX = 1;
  player.nextY = 1;

  player.direction = "right";

  createPellets();
  createMines();
  createChasers();

  updateHUD();

  document.getElementById("levelNote").textContent =
    levelSettings[level].note;
}


/* =========================
   COLLISION
========================= */

function isWall(x, y) {

  if (
    x < 0 ||
    y < 0 ||
    x >= SIZE ||
    y >= SIZE
  ) {
    return true;
  }

  return maze[y][x] === 1;
}


function samePosition(a, b) {

  return a.x === b.x && a.y === b.y;

}


/* =========================
   PLAYER MOVEMENT
========================= */

function setDirection(direction) {

  player.direction = direction;

  let nx = player.x;
  let ny = player.y;

  if (direction === "up") ny--;
  if (direction === "down") ny++;
  if (direction === "left") nx--;
  if (direction === "right") nx++;

  if (!isWall(nx, ny)) {

    player.nextX = nx;
    player.nextY = ny;

  }
}


function movePlayer() {

  if (!isWall(player.nextX, player.nextY)) {

    player.x = player.nextX;
    player.y = player.nextY;

  }

  collectPellet();
  checkMine();
  checkChaserCollision();
}


/* =========================
   COLLECT PELLET
========================= */

function collectPellet() {

  const index = pellets.findIndex(
    p => p.x === player.x && p.y === player.y
  );

  if (index !== -1) {

    pellets.splice(index, 1);

    score += 10;

    updateHUD();

  }


  if (pellets.length === 0) {

    nextLevel();

  }
}


/* =========================
   MINES
========================= */

function checkMine() {

  const mine = mines.find(
    m => m.x === player.x && m.y === player.y
  );

  if (mine) {

    mines = mines.filter(
      m => !(m.x === player.x && m.y === player.y)
    );

    loseLife();

  }
}


/* =========================
   CHASER AI
========================= */

function getValidMoves(x, y) {

  const moves = [];

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];


  for (const d of directions) {

    const nx = x + d.x;
    const ny = y + d.y;

    if (!isWall(nx, ny)) {

      moves.push({
        x: nx,
        y: ny
      });

    }
  }

  return moves;
}


function moveChaser(chaser) {

  const moves = getValidMoves(
    chaser.x,
    chaser.y
  );

  if (moves.length === 0) return;


  // Find closest move to player
  moves.sort((a, b) => {

    const distanceA =
      Math.abs(a.x - player.x) +
      Math.abs(a.y - player.y);

    const distanceB =
      Math.abs(b.x - player.x) +
      Math.abs(b.y - player.y);

    return distanceA - distanceB;

  });


  // Occasionally make a random move
  // so the chasers don't look too robotic
  if (Math.random() < 0.2) {

    const randomMove =
      moves[Math.floor(Math.random() * moves.length)];

    chaser.x = randomMove.x;
    chaser.y = randomMove.y;

  } else {

    chaser.x = moves[0].x;
    chaser.y = moves[0].y;

  }

  checkChaserCollision();
}


/* =========================
   CHASER COLLISION
========================= */

function checkChaserCollision() {

  for (const chaser of chasers) {

    if (samePosition(player, chaser)) {

      loseLife();
      return;

    }
  }
}


/* =========================
   LOSE LIFE
========================= */

function loseLife() {

  if (!gameRunning) return;

  lives--;

  updateHUD();


  if (lives <= 0) {

    gameOver();

    return;

  }


  // Respawn
  player.x = 1;
  player.y = 1;

  player.nextX = 1;
  player.nextY = 1;


  createChasers();

}


/* =========================
   NEXT LEVEL
========================= */

function nextLevel() {

  if (level >= 7) {

    winGame();

    return;

  }

  level++;

  score += 100;

  startLevel();

}


/* =========================
   HUD
========================= */

function updateHUD() {

  document.getElementById("levelText").textContent =
    level;

  document.getElementById("scoreText").textContent =
    score;

  document.getElementById("livesText").textContent =
    lives;

}


/* =========================
   DRAW
========================= */

function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // Background
  ctx.fillStyle = "#dff7ff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // Maze walls
  for (let y = 0; y < SIZE; y++) {

    for (let x = 0; x < SIZE; x++) {

      if (maze[y][x] === 1) {

        ctx.fillStyle = "#bca9ff";

        ctx.beginPath();

        ctx.roundRect(
          x * TILE + 3,
          y * TILE + 3,
          TILE - 6,
          TILE - 6,
          10
        );

        ctx.fill();

      }

    }
  }


  // Pellets
  for (const pellet of pellets) {

    ctx.fillStyle = "#fff1a6";

    ctx.beginPath();

    ctx.arc(
      pellet.x * TILE + TILE / 2,
      pellet.y * TILE + TILE / 2,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }


  // Mines
  for (const mine of mines) {

    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      "💣",
      mine.x * TILE + TILE / 2,
      mine.y * TILE + TILE / 2
    );

  }


  // Chasers
  for (const chaser of chasers) {

    drawCharacter(
      chaser.image,
      chaser.x,
      chaser.y,
      34
    );

  }


  // Player
  drawCharacter(
    playerImage,
    player.x,
    player.y,
    36
  );

}


function drawCharacter(image, x, y, size) {

  if (image.complete && image.naturalWidth > 0) {

    ctx.drawImage(
      image,
      x * TILE + (TILE - size) / 2,
      y * TILE + (TILE - size) / 2,
      size,
      size
    );

  } else {

    ctx.fillStyle = "#ff9fc7";

    ctx.beginPath();

    ctx.arc(
      x * TILE + TILE / 2,
      y * TILE + TILE / 2,
      size / 2,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }
}


/* =========================
   GAME LOOP
========================= */

function gameLoop(timestamp) {

  if (!gameRunning) return;


  const delta =
    timestamp - lastTime;

  lastTime = timestamp;


  playerMoveTimer += delta;
  chaserMoveTimer += delta;


  if (playerMoveTimer > 130) {

    movePlayer();

    playerMoveTimer = 0;

  }


  const chaserSpeed =
    levelSettings[level].speed;


  if (chaserMoveTimer > chaserSpeed) {

    for (const chaser of chasers) {

      moveChaser(chaser);

    }

    chaserMoveTimer = 0;

  }


  draw();

  requestAnimationFrame(gameLoop);

}


/* =========================
   START GAME
========================= */

function startGame() {

  level = 1;
  score = 0;
  lives = 3;

  gameRunning = true;

  document
    .getElementById("homeScreen")
    .classList.add("hidden");

  document
    .getElementById("endScreen")
    .classList.add("hidden");

  document
    .getElementById("gameScreen")
    .classList.remove("hidden");


  startLevel();

  lastTime = performance.now();

  requestAnimationFrame(gameLoop);

}


/* =========================
   GAME OVER
========================= */

function gameOver() {

  gameRunning = false;

  saveRank();

  document
    .getElementById("gameScreen")
    .classList.add("hidden");

  document
    .getElementById("endScreen")
    .classList.remove("hidden");


  document.getElementById("endTitle").textContent =
    "GAME OVER!";

  document.getElementById("endMessage").textContent =
    "You got bitten. 😭";

  document.getElementById("finalScore").textContent =
    score;

  document.getElementById("finalLevel").textContent =
    level;

  document.getElementById("finalRank").textContent =
    getRank(score);

}


/* =========================
   WIN
========================= */

function winGame() {

  gameRunning = false;

  score += 500;

  saveRank();

  document
    .getElementById("gameScreen")
    .classList.add("hidden");

  document
    .getElementById("endScreen")
    .classList.remove("hidden");


  document.getElementById("endTitle").textContent =
    "YOU ESCAPED! 🎉";

  document.getElementById("endMessage").textContent =
    "You survived all 7 levels!";

  document.getElementById("finalScore").textContent =
    score;

  document.getElementById("finalLevel").textContent =
    "7";

  document.getElementById("finalRank").textContent =
    getRank(score);

}


/* =========================
   RANK SYSTEM
========================= */

function getRanks() {

  return JSON.parse(
    localStorage.getItem("lskdRanks") || "[]"
  );

}


function saveRank() {

  const ranks = getRanks();

  ranks.push(score);

  ranks.sort((a, b) => b - a);

  localStorage.setItem(
    "lskdRanks",
    JSON.stringify(ranks.slice(0, 5))
  );

  displayRanks();

}


function getRank(currentScore) {

  const ranks = getRanks();

  let position = 1;

  for (const value of ranks) {

    if (currentScore < value) {
      position++;
    }

  }

  return "#" + position;

}


function displayRanks() {

  const rankList =
    document.getElementById("rankList");

  const ranks = getRanks();


  if (ranks.length === 0) {

    rankList.innerHTML = `
      <div class="rank-row">
        <span>🥇 No scores yet</span>
        <span>—</span>
      </div>
    `;

    return;

  }


  const medals = ["🥇", "🥈", "🥉", "🏅", "🏅"];

  rankList.innerHTML = ranks
    .map((value, index) => {

      return `
        <div class="rank-row">
          <span>${medals[index]} Player ${index + 1}</span>
          <strong>${value}</strong>
        </div>
      `;

    })
    .join("");

}


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  event => {

    const keys = {

      ArrowUp: "up",
      w: "up",
      W: "up",

      ArrowDown: "down",
      s: "down",
      S: "down",

      ArrowLeft: "left",
      a: "left",
      A: "left",

      ArrowRight: "right",
      d: "right",
      D: "right"

    };


    if (keys[event.key]) {

      event.preventDefault();

      setDirection(keys[event.key]);

    }

  }
);


/* =========================
   MOBILE BUTTONS
========================= */

document
  .querySelectorAll("[data-dir]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        setDirection(
          button.dataset.dir
        );

      }
    );

  });


/* =========================
   BUTTONS
========================= */

document
  .getElementById("playBtn")
  .addEventListener(
    "click",
    startGame
  );


document
  .getElementById("againBtn")
  .addEventListener(
    "click",
    startGame
  );


document
  .getElementById("homeBtn")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("endScreen")
        .classList.add("hidden");

      document
        .getElementById("homeScreen")
        .classList.remove("hidden");

      displayRanks();

    }
  );


/* Initial billboard */
displayRanks();
