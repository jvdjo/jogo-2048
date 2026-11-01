// Estado do Jogo
const SIZE = 4;
let board = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem('2048_best_score') || '0', 10);
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
const dPadButtons = document.querySelectorAll('.d-btn');

// Inicialização
function init() {
  bestScoreDisplay.textContent = bestScore;
  restartGame();
  setupEventListeners();
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
    localStorage.setItem('2048_best_score', bestScore);
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
        tile.classList.add('tile');
        
        const colorClass = val <= 2048 ? `tile-${val}` : 'tile-super';
        tile.classList.add(colorClass);

        if (newTileCoord && newTileCoord.r === r && newTileCoord.c === c) {
          tile.classList.add('tile-new');
        } else if (mergedCoords.some(coord => coord.r === r && coord.c === c)) {
          tile.classList.add('tile-merged');
        }

        tile.textContent = val;
        
        // Posição percentual considerando o espaçamento (gap 12px em grid de 4)
        // Largura/altura: calc((100% - 36px) / 4)
        // Margem deslocamento: index * (tamanho + 12px)
        tile.style.top = `calc(${r} * (25% + 3px))`;
        tile.style.left = `calc(${c} * (25% + 3px))`;

        tileContainer.appendChild(tile);
      }
    }
  }
}

// Lógica de Movimento
function slideRow(row) {
  // Filtra zeros
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
  // Rotação 90 graus no sentido horário
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

  // Desfaz a rotação para voltar à orientação original
  const reverseRotations = (4 - rotations) % 4;
  for (let i = 0; i < reverseRotations; i++) {
    currentBoard = rotateBoard(currentBoard);
  }

  if (moved) {
    board = currentBoard;
    updateScore(pointsGained);

    // Converte as coordenadas mescladas de volta
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

    const newTile = addRandomTile();
    renderBoard(newTile, finalMerged);

    checkGameStatus();
    return true;
  }

  return false;
}

function checkGameStatus() {
  // Checa vitória (se atingiu 2048)
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

  // Checa se ainda há movimentos possíveis
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

// Configuração de Eventos
function setupEventListeners() {
  // Teclado
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      move(e.key);
    }
  });

  // Touch / Gestos de deslize (Swipe)
  let touchStartX = 0;
  let touchStartY = 0;
  const gameBoard = document.getElementById('game-board');

  gameBoard.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  gameBoard.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const minSwipeDistance = 30;

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
  }, { passive: true });

  // Botões de Ação
  restartBtn.addEventListener('click', restartGame);
  retryBtn.addEventListener('click', restartGame);
  winRestartBtn.addEventListener('click', restartGame);

  keepGoingBtn.addEventListener('click', () => {
    keepPlaying = true;
    winOverlay.classList.add('hidden');
  });

  // Botões Virtuais D-Pad
  dPadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      if (dir) move(dir);
    });
  });
}

// Inicia ao carregar a página
document.addEventListener('DOMContentLoaded', init);
