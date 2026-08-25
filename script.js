const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameArea = document.getElementById("gameArea");

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


/* =========================
   GAME VARIABLES
========================= */

let playerName = "";

let level = 1;
let score = 0;
let lives = 3;

let maze = [];
let pellets = [];
let mines = [];
let chasers = [];

let gameRunning = false;

let lastTime = 0;
let playerTimer = 0;
let chaserTimer = 0;

let lastChaserName = "someone";


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
    speed: 285,
    mines: true,
    note: "WATCH OUT FOR MINES! 💣"
  },

  5: {
    chasers: 1,
    speed: 125,
    note: "Only one... but VERY FAST. ⚡"
  },

  6: {
    chasers: 2,
    speed: 145,
    note: "They're getting FAST! 🏃💨"
  },

  7: {
    chasers: 3,
    speed: 130,
    note: "FINAL LEVEL. GOOD LUCK. 💀"
  }

};


/* =========================
   NAME
========================= */

function getName() {

  const input =
    document.getElementById("playerName");

  const value =
    input.value.trim();

  if (!value) {

    input.focus();

    input.placeholder =
      "Nama dulu dong 😭";

    return false;
  }

  playerName = value;

  localStorage.setItem(
    "lskdPlayerName",
    playerName
  );

  document.getElementById(
    "welcomeName"
  ).textContent = playerName;

  return true;
}


/* =========================
   MAZE
========================= */

function createMaze() {

  maze = [];

  for (let y = 0; y < SIZE; y++) {

    maze[y] = [];

    for (let x = 0; x < SIZE; x++) {

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


  const walls = [

    [3, 2],
    [3, 3],
    [3, 4],
    [3, 5],
    [3, 6],

    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],

    [11, 2],
    [11, 3],
    [11, 4],
    [11, 5],

    [5, 8],
    [6, 8],
    [7, 8],
    [8, 8],
    [9, 8],

    [3, 11],
    [4, 11],
    [5, 11],

    [9, 11],
    [10, 11],
    [11, 11],

    [7, 12]

  ];


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


  // Keep starting area open

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

      if (maze[y][x] !== 0) continue;

      if (
        x === player.x &&
        y === player.y
      ) {
        continue;
      }

      // Keep chaser starting positions clear

      const chaserStart =
        (
          (x === 13 && y === 13) ||
          (x === 13 && y === 1) ||
          (x === 1 && y === 13)
        );

      if (chaserStart) continue;

      pellets.push({
        x,
        y
      });

    }

  }

}


/* =========================
   MINES
========================= */

function createMines() {

  mines = [];

  if (level !== 4) return;

  const possible =
    [...pellets];

  possible.sort(
    () => Math.random() - 0.5
  );


  for (
    let i = 0;
    i < 8 && i < possible.length;
    i++
  ) {

    const spot = possible[i];

    if (
      Math.abs(spot.x - player.x) +
      Math.abs(spot.y - player.y) > 3
    ) {

      mines.push({
        x: spot.x,
        y: spot.y
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

    const data =
      positions[i];

    chasers.push({

      name: data.name,

      x: data.x,
      y: data.y,

      image:
        chaserImages[data.name]

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


  document.getElementById(
    "levelNote"
  ).textContent =
    levelSettings[level].note;

}


/* =========================
   WALL
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


/* =========================
   DIRECTION
========================= */

function setDirection(direction) {

  player.direction =
    direction;


  let nx =
    player.x;

  let ny =
    player.y;


  if (direction === "up") ny--;

  if (direction === "down") ny++;

  if (direction === "left") nx--;

  if (direction === "right") nx++;


  if (!isWall(nx, ny)) {

    player.nextX = nx;
    player.nextY = ny;

  }

}


/* =========================
   PLAYER MOVEMENT
========================= */

function movePlayer() {

  if (
    !isWall(
      player.nextX,
      player.nextY
    )
  ) {

    player.x =
      player.nextX;

    player.y =
      player.nextY;

  }


  collectPellet();

  checkMine();

  checkChaserCollision();

}


/* =========================
   PELLET
========================= */

function collectPellet() {

  const index =
    pellets.findIndex(
      pellet =>
        pellet.x === player.x &&
        pellet.y === player.y
    );


  if (index !== -1) {

    pellets.splice(
      index,
      1
    );

    score += 10;

    updateHUD();

  }


  if (
    pellets.length === 0
  ) {

    nextLevel();

  }

}


/* =========================
   MINE
========================= */

function checkMine() {

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


  loseLife(
    "mine"
  );

}


/* =========================
   VALID CHASER MOVES
========================= */

function getValidMoves(x, y) {

  const moves = [];

  const directions = [

    { x: 0, y: -1 },

    { x: 0, y: 1 },

    { x: -1, y: 0 },

    { x: 1, y: 0 }

  ];


  for (const direction of directions) {

    const nx =
      x + direction.x;

    const ny =
      y + direction.y;


    if (
      !isWall(nx, ny)
    ) {

      moves.push({
        x: nx,
        y: ny
      });

    }

  }


  return moves;

}


/* =========================
   CHASER MOVEMENT
========================= */

function moveChaser(chaser) {

  const moves =
    getValidMoves(
      chaser.x,
      chaser.y
    );


  if (
    moves.length === 0
  ) return;


  moves.sort(
    (a, b) => {

      const distanceA =
        Math.abs(
          a.x - player.x
        ) +
        Math.abs(
          a.y - player.y
        );


      const distanceB =
        Math.abs(
          b.x - player.x
        ) +
        Math.abs(
          b.y - player.y
        );


      return (
        distanceA -
        distanceB
      );

    }
  );


  let chosen;


  if (
    Math.random() < 0.18
  ) {

    chosen =
      moves[
        Math.floor(
          Math.random() *
          moves.length
        )
      ];

  } else {

    chosen =
      moves[0];

  }


  chaser.x =
    chosen.x;

  chaser.y =
    chosen.y;


  checkChaserCollision();

}


/* =========================
   CHASER COLLISION
========================= */

function checkChaserCollision() {

  for (const chaser of chasers) {

    if (
      chaser.x === player.x &&
      chaser.y === player.y
    ) {

      loseLife(
        chaser.name
      );

      return;

    }

  }

}


/* =========================
   LOSE LIFE
========================= */

function loseLife(reason) {

  if (!gameRunning) return;


  gameRunning = false;

  lives--;

  updateHUD();


  if (reason === "mine") {

    lastChaserName =
      "ranjau";

  } else {

    lastChaserName =
      capitalize(reason);

  }


  showDeathPopup();


  // Respawn data

  player.x = 1;
  player.y = 1;

  player.nextX = 1;
  player.nextY = 1;

}


/* =========================
   DEATH POPUP
========================= */

function showDeathPopup() {

  const overlay =
    document.getElementById(
      "deathOverlay"
    );


  const message =
    document.getElementById(
      "deathMessage"
    );


  if (
    lastChaserName ===
    "ranjau"
  ) {

    message.textContent =
      "Kamu gagal melarikan diri dan kena ranjau! 💣";

  } else {

    message.textContent =
      `Kamu gagal melarikan diri dan digigit ${lastChaserName}! 😭`;

  }


  document.getElementById(
    "finalScore"
  ).textContent =
    score;


  document.getElementById(
    "finalLevel"
  ).textContent =
    level;


  const againBtn =
    document.getElementById(
      "againBtn"
    );


  if (lives > 0) {

    againBtn.textContent =
      `LANJUT LARI (${lives} ❤️)`;

  } else {

    againBtn.textContent =
      "COBA LAGI ✦";

  }


  overlay.classList.remove(
    "hidden"
  );

}


/* =========================
   CONTINUE
========================= */

function continueGame() {

  document
    .getElementById(
      "deathOverlay"
    )
    .classList.add(
      "hidden"
    );


  if (lives <= 0) {

    endGame();

    return;

  }


  createChasers();


  gameRunning = true;

  lastTime =
    performance.now();


  requestAnimationFrame(
    gameLoop
  );

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

  document.getElementById(
    "levelText"
  ).textContent =
    level;


  document.getElementById(
    "scoreText"
  ).textContent =
    score;


  document.getElementById(
    "livesText"
  ).textContent =
    "❤️".repeat(
      Math.max(
        0,
        lives
      )
    );

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

  ctx.fillStyle =
    "#F2CFBB";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // Maze

  for (
    let y = 0;
    y < SIZE;
    y++
  ) {

    for (
      let x = 0;
      x < SIZE;
      x++
    ) {

      if (
        maze[y][x] !== 1
      ) continue;


      ctx.fillStyle =
        "#8E9546";


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


  // Pellets

  for (
    const pellet of pellets
  ) {

    ctx.fillStyle =
      "#E9E29B";


    ctx.beginPath();


    ctx.arc(
      pellet.x * TILE +
        TILE / 2,

      pellet.y * TILE +
        TILE / 2,

      5,

      0,

      Math.PI * 2
    );


    ctx.fill();

  }


  // Mines

  for (
    const mine of mines
  ) {

    ctx.font =
      "23px Arial";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    ctx.fillText(
      "💣",

      mine.x * TILE +
        TILE / 2,

      mine.y * TILE +
        TILE / 2
    );

  }


  // Chasers

  for (
    const chaser of chasers
  ) {

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


/* =========================
   CHARACTER DRAW
========================= */

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

  } else {

    ctx.fillStyle =
      "#F28892";


    ctx.beginPath();


    ctx.arc(

      x * TILE +
        TILE / 2,

      y * TILE +
        TILE / 2,

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

function gameLoop(
  timestamp
) {

  if (!gameRunning)
    return;


  const delta =
    timestamp -
    lastTime;


  lastTime =
    timestamp;


  playerTimer +=
    delta;

  chaserTimer +=
    delta;


  if (
    playerTimer >= 130
  ) {

    movePlayer();

    playerTimer = 0;

  }


  const speed =
    levelSettings[
      level
    ].speed;


  if (
    chaserTimer >= speed
  ) {

    for (
      const chaser of chasers
    ) {

      moveChaser(
        chaser
      );

      if (!gameRunning)
        break;

    }

    chaserTimer = 0;

  }


  draw();


  requestAnimationFrame(
    gameLoop
  );

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
    .getElementById(
      "nameScreen"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "homeScreen"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "gameScreen"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "deathOverlay"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "winOverlay"
    )
    .classList.add(
      "hidden"
    );


  startLevel();


  lastTime =
    performance.now();


  requestAnimationFrame(
    gameLoop
  );

}


/* =========================
   END GAME
========================= */

function endGame() {

  gameRunning = false;

  saveRank();


  document
    .getElementById(
      "deathOverlay"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "gameScreen"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "homeScreen"
    )
    .classList.remove(
      "hidden"
    );


  displayRanks();

}


/* =========================
   WIN
========================= */

function winGame() {

  gameRunning = false;

  score += 500;

  saveRank();


  document
    .getElementById(
      "gameScreen"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "winOverlay"
    )
    .classList.remove(
      "hidden"
    );


  document.getElementById(
    "winScore"
  ).textContent =
    score;


  document.getElementById(
    "winRank"
  ).textContent =
    getRank(score);

}


/* =========================
   RANK SYSTEM
========================= */

function getRanks() {

  return JSON.parse(
    localStorage.getItem(
      "lskdRanks"
    ) || "[]"
  );

}


function saveRank() {

  const ranks =
    getRanks();


  ranks.push({

    name:
      playerName,

    score:
      score

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

  const ranks =
    getRanks();


  let position = 1;


  for (
    const rank of ranks
  ) {

    if (
      currentScore <
      rank.score
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


  const ranks =
    getRanks();


  if (
    ranks.length === 0
  ) {

    rankList.innerHTML = `

      <div class="rank-row">

        <span>
          🥇 Belum ada yang lari
        </span>

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


/* =========================
   SWIPE CONTROL
========================= */

let touchStartX = 0;
let touchStartY = 0;


gameArea.addEventListener(
  "touchstart",
  event => {

    const touch =
      event.touches[0];


    touchStartX =
      touch.clientX;

    touchStartY =
      touch.clientY;

  },
  {
    passive: true
  }
);


gameArea.addEventListener(
  "touchmove",
  event => {

    event.preventDefault();

  },
  {
    passive: false
  }
);


gameArea.addEventListener(
  "touchend",
  event => {

    const touch =
      event.changedTouches[0];


    const dx =
      touch.clientX -
      touchStartX;


    const dy =
      touch.clientY -
      touchStartY;


    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );


    // Ignore tiny taps

    if (
      distance < 25
    ) return;


    if (
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      if (dx > 0) {

        setDirection(
          "right"
        );

      } else {

        setDirection(
          "left"
        );

      }

    } else {

      if (dy > 0) {

        setDirection(
          "down"
        );

      } else {

        setDirection(
          "up"
        );

      }

    }

  },
  {
    passive: true
  }
);


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  event => {

    const keys = {

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
      keys[event.key]
    ) {

      event.preventDefault();

      setDirection(
        keys[event.key]
      );

    }

  }
);


/* =========================
   BUTTONS
========================= */

document
  .getElementById(
    "startBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        getName()
      ) {

        document
          .getElementById(
            "nameScreen"
          )
          .classList.add(
            "hidden"
          );

        document
          .getElementById(
            "homeScreen"
          )
          .classList.remove(
            "hidden"
          );

        displayRanks();

      }

    }
  );


document
  .getElementById(
    "playBtn"
  )
  .addEventListener(
    "click",
    startGame
  );


document
  .getElementById(
    "againBtn"
  )
  .addEventListener(
    "click",
    continueGame
  );


document
  .getElementById(
    "homeBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "deathOverlay"
        )
        .classList.add(
          "hidden"
        );


      document
        .getElementById(
          "gameScreen"
        )
        .classList.add(
          "hidden"
        );


      document
        .getElementById(
          "homeScreen"
        )
        .classList.remove(
          "hidden"
        );


      displayRanks();

    }
  );


document
  .getElementById(
    "winAgainBtn"
  )
  .addEventListener(
    "click",
    startGame
  );


/* =========================
   HELPER
========================= */

function capitalize(text) {

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );

}


function escapeHTML(text) {

  return text
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================
   LOAD SAVED NAME
========================= */

const savedName =
  localStorage.getItem(
    "lskdPlayerName"
  );


if (savedName) {

  document.getElementById(
    "playerName"
  ).value =
    savedName;

}


/* =========================
   INITIAL RANK
========================= */

displayRanks();
