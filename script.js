import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwXe1N_-VEBHoWzph5suGOiCiQR9kV6Mg",
  authDomain: "lksd-3f39f.firebaseapp.com",
  projectId: "lksd-3f39f",
  storageBucket: "lksd-3f39f.firebasestorage.app",
  messagingSenderId: "994524156071",
  appId: "1:994524156071:web:ba59a04cef48360e42cb82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameArea = document.getElementById("gameArea");

const TILE = 40;
const SIZE = 15;


/* =====================================================
   IMAGES
===================================================== */

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


/* =====================================================
   GAME STATE
===================================================== */

let playerName = "";
let level = 1;
let score = 0;
let lives = 3;

let maze = [];
let pellets = [];
let mines = [];
let chasers = [];

let gameRunning = false;
let levelChanging = false;

let lastTime = 0;
let playerTimer = 0;
let chaserTimer = 0;


/* =====================================================
   PLAYER
===================================================== */

const player = {
  x: 1,
  y: 1,

  direction: "right",
  wantedDirection: "right"
};


/* =====================================================
   LEVEL SETTINGS
===================================================== */

const levelSettings = {

  1: {
    chasers: 1,
    playerSpeed: 150,
    chaserSpeed: 520,
    note: "Val is coming... RUN! 👀"
  },

  2: {
    chasers: 2,
    playerSpeed: 145,
    chaserSpeed: 470,
    note: "Taka joined the chase! 😭"
  },

  3: {
    chasers: 3,
    playerSpeed: 140,
    chaserSpeed: 440,
    note: "THREE OF THEM?! 💀"
  },

  4: {
    chasers: 3,
    playerSpeed: 140,
    chaserSpeed: 420,
    mines: true,
    note: "WATCH OUT FOR MINES! 💣"
  },

  5: {
    chasers: 1,
    playerSpeed: 130,
    chaserSpeed: 180,
    note: "Only one... BUT VERY FAST! ⚡"
  },

  6: {
    chasers: 2,
    playerSpeed: 125,
    chaserSpeed: 165,
    note: "They're getting faster! 🏃💨"
  },

  7: {
    chasers: 3,
    playerSpeed: 120,
    chaserSpeed: 150,
    note: "FINAL LEVEL. GOOD LUCK. 💀"
  }

};


/* =====================================================
   NAME
===================================================== */

function getName() {

  const input = document.getElementById("playerName");
  const name = input.value.trim();

  if (!name) {
    input.focus();
    input.placeholder = "Nama dulu dong 😭";
    return false;
  }

  playerName = name;

  localStorage.setItem(
    "lskdPlayerName",
    playerName
  );

  document.getElementById(
    "welcomeName"
  ).textContent = playerName;

  return true;
}


/* =====================================================
   MAZE
===================================================== */

function createMaze() {

  maze = [];

  for (let y = 0; y < SIZE; y++) {

    maze[y] = [];

    for (let x = 0; x < SIZE; x++) {

      maze[y][x] =
        x === 0 ||
        y === 0 ||
        x === SIZE - 1 ||
        y === SIZE - 1
          ? 1
          : 0;

    }
  }


  const walls = [

    [3,2],[3,3],[3,4],[3,5],[3,6],

    [7,2],[7,3],[7,4],[7,5],

    [11,2],[11,3],[11,4],[11,5],

    [5,8],[6,8],[7,8],[8,8],[9,8],

    [3,11],[4,11],[5,11],

    [9,11],[10,11],[11,11],

    [7,12]

  ];


  if (level >= 2) {
    walls.push(
      [2,9],[2,10],
      [12,9],[12,10]
    );
  }


  if (level >= 3) {
    walls.push(
      [6,3],[6,4],
      [8,3],[8,4]
    );
  }


  if (level >= 5) {
    walls.push(
      [4,6],[5,6],
      [9,6],[10,6]
    );
  }


  if (level >= 6) {
    walls.push(
      [2,5],[12,5],
      [2,12],[12,12]
    );
  }


  if (level >= 7) {
    walls.push(
      [5,2],[5,3],
      [9,2],[9,3],
      [5,13],[9,13]
    );
  }


  for (const [x, y] of walls) {
    maze[y][x] = 1;
  }


  // Starting area

  maze[1][1] = 0;
  maze[1][2] = 0;
  maze[2][1] = 0;
}


/* =====================================================
   WALL CHECK
===================================================== */

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


/* =====================================================
   PELLETS
===================================================== */

function createPellets() {

  pellets = [];

  for (let y = 1; y < SIZE - 1; y++) {

    for (let x = 1; x < SIZE - 1; x++) {

      if (maze[y][x] === 1) continue;

      if (x === 1 && y === 1) continue;

      if (
        (x === 13 && y === 13) ||
        (x === 13 && y === 1) ||
        (x === 1 && y === 13)
      ) {
        continue;
      }

      pellets.push({ x, y });
    }
  }
}


/* =====================================================
   MINES
===================================================== */

function createMines() {

  mines = [];

  if (level !== 4) return;

  const spots = [...pellets];

  spots.sort(() => Math.random() - 0.5);

  for (const spot of spots) {

    if (mines.length >= 8) break;

    const distance =
      Math.abs(spot.x - player.x) +
      Math.abs(spot.y - player.y);

    if (distance <= 3) continue;

    mines.push({
      x: spot.x,
      y: spot.y
    });
  }
}


/* =====================================================
   CHASERS
===================================================== */

function createChasers() {

  chasers = [];

  const starts = [

    {
      x: 13,
      y: 13,
      name: "val"
    },

    {
      x: 13,
      y: 1,
      name: "taka"
    },

    {
      x: 1,
      y: 13,
      name: "nael"
    }

  ];


  const amount =
    levelSettings[level].chasers;


  for (let i = 0; i < amount; i++) {

    chasers.push({
      x: starts[i].x,
      y: starts[i].y,
      name: starts[i].name,
      image: chaserImages[starts[i].name]
    });
  }
}


/* =====================================================
   START LEVEL
===================================================== */

function startLevel() {

  createMaze();

  player.x = 1;
  player.y = 1;

  player.direction = "right";
  player.wantedDirection = "right";

  createPellets();
  createMines();
  createChasers();

  playerTimer = 0;
  chaserTimer = 0;

  updateHUD();

  document.getElementById(
    "levelNote"
  ).textContent =
    levelSettings[level].note;

  draw();
}


/* =====================================================
   DIRECTION
===================================================== */

function setDirection(direction) {

  /*
    We DON'T immediately move the player.

    We simply remember the direction.
    When the path opens, the character
    automatically turns.
  */

  player.wantedDirection = direction;
}


/* =====================================================
   NEXT POSITION
===================================================== */

function getNextPosition(
  x,
  y,
  direction
) {

  let nx = x;
  let ny = y;

  if (direction === "up") ny--;
  if (direction === "down") ny++;
  if (direction === "left") nx--;
  if (direction === "right") nx++;

  return {
    x: nx,
    y: ny
  };
}


/* =====================================================
   PLAYER MOVEMENT
===================================================== */

function movePlayer() {

  /*
    Try the direction requested
    by the latest swipe.
  */

  const wanted =
    getNextPosition(
      player.x,
      player.y,
      player.wantedDirection
    );


  if (
    !isWall(
      wanted.x,
      wanted.y
    )
  ) {

    player.direction =
      player.wantedDirection;
  }


  /*
    Continue moving automatically.
  */

  const next =
    getNextPosition(
      player.x,
      player.y,
      player.direction
    );


  if (
    !isWall(
      next.x,
      next.y
    )
  ) {

    player.x = next.x;
    player.y = next.y;

  }


  collectPellet();
  checkMine();
  checkChaserCollision();
}


/* =====================================================
   PELLET
===================================================== */

function collectPellet() {

  const index =
    pellets.findIndex(
      pellet =>
        pellet.x === player.x &&
        pellet.y === player.y
    );


  if (index !== -1) {

    pellets.splice(index, 1);

    score += 10;

    updateHUD();
  }


  if (
    pellets.length === 0 &&
    !levelChanging
  ) {

    nextLevel();
  }
}


/* =====================================================
   MINE COLLISION
===================================================== */

function checkMine() {

  if (!gameRunning) return;

  const mine =
    mines.find(
      item =>
        item.x === player.x &&
        item.y === player.y
    );


  if (!mine) return;

  mines =
    mines.filter(
      item =>
        !(
          item.x === player.x &&
          item.y === player.y
        )
    );


  loseLife("mine");
}


/* =====================================================
   CHASER MOVEMENT
===================================================== */

function getValidMoves(x, y) {

  const directions = [

    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }

  ];


  return directions

    .map(direction => ({
      x: x + direction.x,
      y: y + direction.y
    }))

    .filter(
      position =>
        !isWall(
          position.x,
          position.y
        )
    );
}


function moveChaser(chaser) {

  const moves =
    getValidMoves(
      chaser.x,
      chaser.y
    );


  if (!moves.length) return;


  moves.sort((a, b) => {

    const distanceA =
      Math.abs(a.x - player.x) +
      Math.abs(a.y - player.y);

    const distanceB =
      Math.abs(b.x - player.x) +
      Math.abs(b.y - player.y);

    return distanceA - distanceB;
  });


  let chosen;

  /*
    15% chance of a random move.
    Otherwise chase the player.
  */

  if (Math.random() < 0.15) {

    chosen =
      moves[
        Math.floor(
          Math.random() * moves.length
        )
      ];

  } else {

    chosen = moves[0];
  }


  chaser.x = chosen.x;
  chaser.y = chosen.y;

  checkChaserCollision();
}


/* =====================================================
   CHASER COLLISION
===================================================== */

function checkChaserCollision() {

  if (!gameRunning) return;


  for (const chaser of chasers) {

    if (
      chaser.x === player.x &&
      chaser.y === player.y
    ) {

      loseLife(chaser.name);

      return;
    }
  }
}


/* =====================================================
   LOSE LIFE
===================================================== */

function loseLife(reason) {

  if (!gameRunning) return;

  gameRunning = false;

  lives--;

  updateHUD();

  showDeathPopup(reason);
}


/* =====================================================
   DEATH POPUP
===================================================== */

function showDeathPopup(reason) {

  const message =
    document.getElementById(
      "deathMessage"
    );


  if (reason === "mine") {

  message.textContent =
    "Kamu malah nginjek ranjau! 💣😭";

} else {

  const name =
    capitalize(reason);

  const messages = {

    Val:
      "Val berhasil nangkep kamu! 💀",

    Taka:
      "Taka akhirnya dapet kamu! 😭",

    Nael:
      "Nael berhasil nyusul kamu! 💀"

  };

  message.textContent =
    messages[name] ||
    `${name} berhasil nangkep kamu! 😭`;
}

  document.getElementById(
    "finalScore"
  ).textContent = score;


  document.getElementById(
    "finalLevel"
  ).textContent = level;


  const againBtn =
    document.getElementById(
      "againBtn"
    );


  againBtn.textContent =
    lives > 0
      ? `LANJUT LARI (${lives} ❤️)`
      : "COBA LAGI ✦";


  document
    .getElementById("deathOverlay")
    .classList.remove("hidden");
}


/* =====================================================
   CONTINUE
===================================================== */

function continueGame() {

  document
    .getElementById("deathOverlay")
    .classList.add("hidden");


  if (lives <= 0) {

    endGame();

    return;
  }


  /*
    Respawn.
    Score and remaining pellets stay.
  */

  player.x = 1;
  player.y = 1;

  player.direction = "right";
  player.wantedDirection = "right";

  createChasers();

  gameRunning = true;

  lastTime = performance.now();

  requestAnimationFrame(gameLoop);
}


/* =====================================================
   NEXT LEVEL
===================================================== */

function nextLevel() {

  if (levelChanging) return;

  levelChanging = true;


  if (level >= 7) {

    winGame();

    return;
  }


  level++;

  score += 100;

  startLevel();

  levelChanging = false;
}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

  document.getElementById(
    "levelText"
  ).textContent = level;


  document.getElementById(
    "scoreText"
  ).textContent = score;


  document.getElementById(
    "livesText"
  ).textContent =
    "❤️".repeat(
      Math.max(0, lives)
    );
}


/* =====================================================
   DRAW
===================================================== */

function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /*
    Background
  */

  ctx.fillStyle = "#F2CFBB";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /*
    Walls
  */

  for (let y = 0; y < SIZE; y++) {

    for (let x = 0; x < SIZE; x++) {

      if (maze[y][x] !== 1) continue;

      ctx.fillStyle = "#8E9546";

      ctx.beginPath();

      ctx.roundRect(
        x * TILE + 3,
        y * TILE + 3,
        TILE - 6,
        TILE - 6,
        9
      );

      ctx.fill();
    }
  }


  /*
    Pellets
  */

  ctx.fillStyle = "#E85D68";

  for (const pellet of pellets) {

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


  /*
    Mines
  */

  for (const mine of mines) {

    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      "💣",
      mine.x * TILE + TILE / 2,
      mine.y * TILE + TILE / 2
    );
  }


  /*
    Chasers
  */

  for (const chaser of chasers) {

    drawCharacter(
      chaser.image,
      chaser.x,
      chaser.y,
      34
    );
  }


  /*
    Player
  */

  drawCharacter(
    playerImage,
    player.x,
    player.y,
    36
  );
}


/* =====================================================
   DRAW CHARACTER
===================================================== */

function drawCharacter(
  image,
  x,
  y,
  size
) {

  if (
    image.complete &&
    image.naturalWidth > 0
  ) {

    ctx.drawImage(

      image,

      x * TILE +
        (TILE - size) / 2,

      y * TILE +
        (TILE - size) / 2,

      size,
      size
    );

    return;
  }


  ctx.fillStyle = "#F28892";

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


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop(timestamp) {

  if (!gameRunning) return;


  const delta =
    timestamp - lastTime;

  lastTime = timestamp;


  playerTimer += delta;
  chaserTimer += delta;


  /*
    Player movement
  */

  if (
    playerTimer >=
    levelSettings[level].playerSpeed
  ) {

    movePlayer();

    playerTimer = 0;
  }


  /*
    Chaser movement
  */

  if (
    chaserTimer >=
    levelSettings[level].chaserSpeed
  ) {

    for (const chaser of chasers) {

      moveChaser(chaser);

      if (!gameRunning) break;
    }

    chaserTimer = 0;
  }


  draw();

  requestAnimationFrame(gameLoop);
}


/* =====================================================
   START GAME
===================================================== */

function startGame() {

  level = 1;
  score = 0;
  lives = 3;

  levelChanging = false;
  gameRunning = true;


  document
    .getElementById("nameScreen")
    .classList.add("hidden");


  document
    .getElementById("homeScreen")
    .classList.add("hidden");


  document
    .getElementById("gameScreen")
    .classList.remove("hidden");


  document
    .getElementById("deathOverlay")
    .classList.add("hidden");


  document
    .getElementById("winOverlay")
    .classList.add("hidden");


  startLevel();

  lastTime = performance.now();

  requestAnimationFrame(gameLoop);
}


/* =====================================================
   END GAME
===================================================== */

function endGame() {

  gameRunning = false;

  saveRank();


  document
    .getElementById("deathOverlay")
    .classList.add("hidden");


  document
    .getElementById("gameScreen")
    .classList.add("hidden");


  document
    .getElementById("homeScreen")
    .classList.remove("hidden");


  displayRanks();
}


/* =====================================================
   WIN
===================================================== */

function winGame() {

  gameRunning = false;

  score += 500;

  saveRank();


  document
    .getElementById("gameScreen")
    .classList.add("hidden");


  document
    .getElementById("winOverlay")
    .classList.remove("hidden");


  document.getElementById(
    "winScore"
  ).textContent = score;


  document.getElementById(
    "winRank"
  ).textContent =
    getRank(score);
}


/* =====================================================
   RANK
===================================================== */

function getRanks() {

  return JSON.parse(
    localStorage.getItem(
      "lskdRanks"
    ) || "[]"
  );
}


function saveRank() {

  const ranks = getRanks();

  ranks.push({
    name: playerName,
    score: score
  });


  ranks.sort(
    (a, b) =>
      b.score - a.score
  );


  localStorage.setItem(
    "lskdRanks",
    JSON.stringify(
      ranks.slice(0, 5)
    )
  );


  displayRanks();
}


function getRank(currentScore) {

  const ranks = getRanks();

  let position = 1;

  for (const rank of ranks) {

    if (
      currentScore < rank.score
    ) {
      position++;
    }
  }

  return "#" + position;
}


function displayRanks() {

  const rankList =
    document.getElementById(
      "rankList"
    );


  if (!rankList) return;


  const ranks = getRanks();


  if (!ranks.length) {

    rankList.innerHTML = `
      <div class="rank-row">
        <span>🥇 Belum ada yang lari</span>
        <span>—</span>
      </div>
    `;

    return;
  }


  const medals = [
    "🥇",
    "🥈",
    "🥉",
    "🏅",
    "🏅"
  ];


  rankList.innerHTML =
    ranks
      .map(
        (rank, index) => `
          <div class="rank-row">
            <span>
              ${medals[index]}
              ${escapeHTML(rank.name)}
            </span>

            <strong>
              ${rank.score}
            </strong>
          </div>
        `
      )
      .join("");
}


/* =====================================================
   MOBILE SWIPE — POINTER EVENTS
===================================================== */

let swipeStartX = 0;
let swipeStartY = 0;
let pointerActive = false;


gameArea.addEventListener(
  "pointerdown",
  event => {

    if (!gameRunning) return;

    pointerActive = true;

    swipeStartX =
      event.clientX;

    swipeStartY =
      event.clientY;


    if (
      gameArea.setPointerCapture
    ) {

      gameArea.setPointerCapture(
        event.pointerId
      );
    }


    event.preventDefault();

  },
  {
    passive: false
  }
);


gameArea.addEventListener(
  "pointermove",
  event => {

    if (!pointerActive) return;

    event.preventDefault();

  },
  {
    passive: false
  }
);


gameArea.addEventListener(
  "pointerup",
  event => {

    if (!pointerActive) return;

    pointerActive = false;


    const dx =
      event.clientX -
      swipeStartX;

    const dy =
      event.clientY -
      swipeStartY;


    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );


    if (distance < 25) {
      return;
    }


    if (
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      setDirection(
        dx > 0
          ? "right"
          : "left"
      );

    } else {

      setDirection(
        dy > 0
          ? "down"
          : "up"
      );
    }

  },
  {
    passive: false
  }
);


gameArea.addEventListener(
  "pointercancel",
  () => {

    pointerActive = false;

  }
);


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener(
  "keydown",
  event => {

    const directions = {

      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",

      w: "up",
      W: "up",

      s: "down",
      S: "down",

      a: "left",
      A: "left",

      d: "right",
      D: "right"

    };


    if (
      directions[event.key]
    ) {

      event.preventDefault();

      setDirection(
        directions[event.key]
      );
    }
  }
);


/* =====================================================
   BUTTONS
===================================================== */

document
  .getElementById("startBtn")
  .addEventListener(
    "click",
    () => {

      if (!getName()) return;


      document
        .getElementById("nameScreen")
        .classList.add("hidden");


      document
        .getElementById("homeScreen")
        .classList.remove("hidden");


      displayRanks();
    }
  );


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
    continueGame
  );


document
  .getElementById("homeBtn")
  .addEventListener(
    "click",
    () => {

      gameRunning = false;


      document
        .getElementById("deathOverlay")
        .classList.add("hidden");


      document
        .getElementById("gameScreen")
        .classList.add("hidden");


      document
        .getElementById("homeScreen")
        .classList.remove("hidden");


      displayRanks();
    }
  );


document
  .getElementById("winAgainBtn")
  .addEventListener(
    "click",
    startGame
  );


/* =====================================================
   HELPERS
===================================================== */

function capitalize(text) {

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}


function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   LOAD SAVED NAME
===================================================== */

const savedName =
  localStorage.getItem(
    "lskdPlayerName"
  );


if (savedName) {

  playerName = savedName;

  document.getElementById(
    "playerName"
  ).value = savedName;
}


/* =====================================================
   INITIAL
===================================================== */

displayRanks();
