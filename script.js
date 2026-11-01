// Audio Context e efeito sonoro de latidinho de filhote
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPuppyBark() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Latidinho duplo curto e agudo de filhotinho ('au-au!')
    const barks = [0, 0.08];
    barks.forEach((delay, idx) => {
      const startTime = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = idx === 0 ? 850 : 980;
      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, startTime + 0.07);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.075);
    });
  } catch (e) {
    // Silencia caso o navegador bloqueie audio antes de interacao
  }
}

// Lista dos Memes de Filhotes de Cachorro (Figurinhas clássicas)
const PUPPY_MEMES = {
  2:    { name: "Oi posso fala?",  img: "assets/dogs-reais/1.png" },
  4:    { name: "Num quedito...",  img: "assets/dogs-reais/2.png" },
  8:    { name: "Quem disse?",     img: "assets/dogs-reais/3.png" },
  16:   { name: "Tô de castigo",   img: "assets/dogs-reais/4.png" },
  32:   { name: "Mim dê papai",    img: "assets/dogs-reais/5.png" },
  64:   { name: "Passada!",        img: "assets/dogs-reais/6.png" },
  128:  { name: "Cão de Óculos",   img: "assets/dogs-reais/7.png" },
  256:  { name: "Penso, logo au",  img: "assets/dogs-reais/8.png" },
  512:  { name: "Hummm sei não",   img: "assets/dogs-reais/9.png" },
  1024: { name: "Caramelo Neném",  img: "assets/dogs-reais/10.png" },
  2048: { name: "Doge Lendário",   img: "assets/dogs-reais/11.png" }
};

// Estado do Jogo
const SIZE = 4;
let board = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem('2048_puppymeme_best') || '0', 10);
let hasWon = false;
let keepPlaying = false;
let isGameOver = false;

// Elementos da DOM
const scoreDisplay = document.getElementById('score');
const bestScoreDisplay = document.getElementById('best-score');
const tileContainer = document.getElementById('tile-container');
const gameOverOverlay = document.getElementById('game-over-overlay');
const winOverlay = document.getElementById('win-overlay');
const restartBtn = document.getElementById('restart-btn');
const retryBtn = document.getElementById('retry-btn');
const winRestartBtn = document.getElementById('win-restart-btn');
const keepGoingBtn = document.getElementById('keep-going-btn');
const guideList = document.getElementById('guide-list');

// Inicialização
function init() {
  bestScoreDisplay.textContent = bestScore;
  renderGuide();
  restartGame();
  setupEventListeners();
}

function renderGuide() {
  if (!guideList) return;
  guideList.innerHTML = '';
  Object.keys(PUPPY_MEMES).forEach(val => {
    const meme = PUPPY_MEMES[val];
    const item = document.createElement('div');
    item.className = 'guide-item';
    item.innerHTML = `
      <img src="${meme.img}" alt="${meme.name}" />
      <span class="guide-num">${val}</span>
      <span class="guide-name">${meme.name}</span>
    `;
    guideList.appendChild(item);
  });
}

function restartGame() {
  board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  score = 0;
  hasWon = false;
  keepPlaying = false;
  isGameOver = false;
  
  updateScore(0);
  gameOverOverlay.classList.add('hidden');
  winOverlay.classList.add('hidden');
  
  addRandomTile();
  addRandomTile();
  renderBoard();
}

function updateScore(pointsAdded) {
  score += pointsAdded;
  scoreDisplay.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    bestScoreDisplay.textContent = bestScore;
    localStorage.setItem('2048_puppymeme_best', bestScore);
  }
}

// Adiciona uma nova peça aleatória (90% chance de 2, 10% chance de 4)
function addRandomTile() {
  const emptyCells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }

  if (emptyCells.length > 0) {
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { r, c };
  }
  return null;
}

// Renderiza as peças na tela
function renderBoard(newTileCoord = null, mergedCoords = []) {
  tileContainer.innerHTML = '';

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      if (val > 0) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (val >= 2048) {
          tile.classList.add('tile-2048');
        }

        const meme = PUPPY_MEMES[val] || { name: `Filhote ${val}`, img: PUPPY_MEMES[2048].img };

        if (newTileCoord && newTileCoord.r === r && newTileCoord.c === c) {
          tile.classList.add('tile-new');
        } else if (mergedCoords.some(coord => coord.r === r && coord.c === c)) {
          tile.classList.add('tile-merged');
        }

        tile.innerHTML = `
          <img class="tile-img" src="${meme.img}" alt="${meme.name}" />
          <div class="tile-header">
            <span class="tile-badge">${val}</span>
          </div>
          <div class="tile-caption">
            <span>${meme.name}</span>
          </div>
        `;
        
        // Posição percentual considerando o gap de 12px
        tile.style.top = `calc(${r} * (25% + (var(--grid-gap) / 4)))`;
        tile.style.left = `calc(${c} * (25% + (var(--grid-gap) / 4)))`;

        tileContainer.appendChild(tile);
      }
    }
  }
}

// Lógica de Movimento
function slideRow(row) {
  let arr = row.filter(val => val !== 0);
  let points = 0;
  let mergedIndices = [];

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      points += arr[i];
      mergedIndices.push(i);
      arr.splice(i + 1, 1);
    }
  }

  while (arr.length < SIZE) {
    arr.push(0);
  }

  return { newRow: arr, points, mergedIndices };
}

function rotateBoard(matrix) {
  return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
}

function move(direction) {
  if (isGameOver) return false;

  let rotations = 0;
  if (direction === 'ArrowLeft') rotations = 0;
  else if (direction === 'ArrowDown') rotations = 1;
  else if (direction === 'ArrowRight') rotations = 2;
  else if (direction === 'ArrowUp') rotations = 3;
  else return false;

  let currentBoard = board.map(row => [...row]);
  for (let i = 0; i < rotations; i++) {
    currentBoard = rotateBoard(currentBoard);
  }

  let moved = false;
  let pointsGained = 0;
  let mergedInRotated = [];

  for (let r = 0; r < SIZE; r++) {
    const { newRow, points, mergedIndices } = slideRow(currentBoard[r]);
    pointsGained += points;
    mergedIndices.forEach(c => mergedInRotated.push({ r, c }));

    for (let c = 0; c < SIZE; c++) {
      if (currentBoard[r][c] !== newRow[c]) {
        moved = true;
      }
    }
    currentBoard[r] = newRow;
  }

  const reverseRotations = (4 - rotations) % 4;
  for (let i = 0; i < reverseRotations; i++) {
    currentBoard = rotateBoard(currentBoard);
  }

  if (moved) {
    board = currentBoard;
    updateScore(pointsGained);

    const finalMerged = [];
    for (const pos of mergedInRotated) {
      let r = pos.r;
      let c = pos.c;
      for (let i = 0; i < reverseRotations; i++) {
        let tempR = c;
        let tempC = SIZE - 1 - r;
        r = tempR;
        c = tempC;
      }
      finalMerged.push({ r, c });
    }

    if (finalMerged.length > 0) {
      playPuppyBark();
    }

    const newTile = addRandomTile();
    renderBoard(newTile, finalMerged);

    checkGameStatus();
    return true;
  }

  return false;
}

function checkGameStatus() {
  if (!hasWon && !keepPlaying) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 2048) {
          hasWon = true;
          winOverlay.classList.remove('hidden');
          return;
        }
      }
    }
  }

  if (!canMove()) {
    isGameOver = true;
    gameOverOverlay.classList.remove('hidden');
  }
}

function canMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
    }
  }
  return false;
}

function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      move(e.key);
    }
  });

  // Touch / Gestos de deslize (Swipe) com bloqueio anti pull-to-refresh
  let touchStartX = 0;
  let touchStartY = 0;
  const gameBoard = document.getElementById('game-board');

  gameBoard.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: false });

  gameBoard.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Previne recarregar a página
  }, { passive: false });

  gameBoard.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const minSwipeDistance = 25;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          move(deltaX > 0 ? 'ArrowRight' : 'ArrowLeft');
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          move(deltaY > 0 ? 'ArrowDown' : 'ArrowUp');
        }
      }
    }
  }, { passive: false });

  restartBtn.addEventListener('click', restartGame);
  retryBtn.addEventListener('click', restartGame);
  winRestartBtn.addEventListener('click', restartGame);

  keepGoingBtn.addEventListener('click', () => {
    keepPlaying = true;
    winOverlay.classList.add('hidden');
  });
}

document.addEventListener('DOMContentLoaded', init);
