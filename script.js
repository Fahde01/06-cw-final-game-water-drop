// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let timerCountdown;
let confettiCleanupTimeout;
let score = 0;
let timeLeft = 30;

const soundEffects = {
  collect: { src: "sounds/collect.mp3", volume: 0.35 },
  miss: { src: "sounds/miss.mp3", volume: 0.35 },
  button: { src: "sounds/click.mp3", volume: 0.45 },
  win: { src: "sounds/win.mp3", volume: 0.4 }
};

const difficultySettings = {
  easy: {
    winScore: 10,
    timeLimit: 40,
    spawnInterval: 1200,
    fallDurationRange: [4.4, 5.2],
    challengeChance: 0.15,
    challengePenalty: -1
  },
  normal: {
    winScore: 15,
    timeLimit: 30,
    spawnInterval: 1000,
    fallDurationRange: [3.6, 4.4],
    challengeChance: 0.25,
    challengePenalty: -1
  },
  hard: {
    winScore: 20,
    timeLimit: 22,
    spawnInterval: 700,
    fallDurationRange: [2.4, 3.2],
    challengeChance: 0.35,
    challengePenalty: -2
  }
};

let currentDifficulty = difficultySettings.normal;

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const endMessageElement = document.getElementById("end-message");
const difficultySelect = document.getElementById("difficulty");
const goalDisplay = document.getElementById("goal");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");

Object.values(soundEffects).forEach((effect) => {
  effect.audio = new Audio(effect.src);
  effect.audio.preload = "auto";
});

function playSound(name) {
  const effect = soundEffects[name];
  if (!effect || !effect.audio) return;

  const clip = effect.audio.cloneNode();
  clip.volume = effect.volume;
  clip.play().catch(() => {
    // Ignore autoplay block errors to keep gameplay uninterrupted.
  });
}

// Wait for button click to start the game
startButton.addEventListener("click", () => {
  playSound("button");
  startGame();
});

resetButton.addEventListener("click", () => {
  playSound("button");
  resetGame();
});

difficultySelect.addEventListener("change", applyDifficultyPreview);

function applyDifficultyPreview() {
  const selected = difficultySettings[difficultySelect.value] || difficultySettings.normal;
  currentDifficulty = selected;

  if (!gameRunning) {
    timeLeft = selected.timeLimit;
    timeDisplay.textContent = timeLeft;
    goalDisplay.textContent = selected.winScore;
  }
}

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  currentDifficulty = difficultySettings[difficultySelect.value] || difficultySettings.normal;
  gameRunning = true;
  difficultySelect.disabled = true;
  score = 0;
  timeLeft = currentDifficulty.timeLimit;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  goalDisplay.textContent = currentDifficulty.winScore;
  endMessageElement.classList.add("hidden");
  clearConfetti();

  // Create drops at a pace set by the selected difficulty.
  dropMaker = setInterval(createDrop, currentDifficulty.spawnInterval);

  // Run a 30-second countdown and stop the game at 0
  timerCountdown = setInterval(() => {
    timeLeft -= 1;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function resetGame() {
  clearInterval(dropMaker);
  clearInterval(timerCountdown);
  gameRunning = false;
  difficultySelect.disabled = false;
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  score = 0;
  currentDifficulty = difficultySettings[difficultySelect.value] || difficultySettings.normal;
  timeLeft = currentDifficulty.timeLimit;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  goalDisplay.textContent = currentDifficulty.winScore;
  endMessageElement.classList.add("hidden");
  clearConfetti();

  // Restart immediately to give player direct control over a fresh round.
  startGame();
}

function launchConfetti() {
  clearConfetti();

  const confettiColors = ["#FFC907", "#2E9DF7", "#4FCB53", "#FF902A", "#F16061"];
  const confettiCount = 90;

  for (let i = 0; i < confettiCount; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.animationDuration = `${2.4 + Math.random() * 1.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty("--tilt", `${Math.random() * 360}deg`);
    document.body.appendChild(piece);
  }

  confettiCleanupTimeout = setTimeout(clearConfetti, 5000);
}

function clearConfetti() {
  clearTimeout(confettiCleanupTimeout);
  document.querySelectorAll(".confetti-piece").forEach((piece) => piece.remove());
}

function createDrop() {
  if (!gameRunning) return;

  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Challenge drop frequency increases with difficulty.
  const isChallengeDrop = Math.random() < currentDifficulty.challengeChance;
  if (isChallengeDrop) {
    drop.classList.add("challenge-drop");
  }

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Harder modes make drops fall faster.
  const [minFallDuration, maxFallDuration] = currentDifficulty.fallDurationRange;
  const fallDuration = minFallDuration + Math.random() * (maxFallDuration - minFallDuration);
  drop.style.animationDuration = `${fallDuration}s`;

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Good drops add points; green challenge drops remove points.
  drop.addEventListener(
    "click",
    () => {
      score += isChallengeDrop ? currentDifficulty.challengePenalty : 1;
      scoreDisplay.textContent = score;
      playSound("collect");
      drop.remove();
    },
    { once: true }
  );

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    playSound("miss");
    drop.remove(); // Clean up drops that weren't caught
  });
}

function endGame() {
  gameRunning = false;
  difficultySelect.disabled = false;
  clearInterval(dropMaker);
  clearInterval(timerCountdown);
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  
  // Display end-game message based on score
  const winningMessages = [
    "Woo! You are on fire",
    "Too good! keep going",
    "This is too easy for you"
  ];
  
  if (score >= currentDifficulty.winScore) {
    // Show a random winning message
    const randomMessage = winningMessages[Math.floor(Math.random() * winningMessages.length)];
    endMessageElement.textContent = randomMessage;
    endMessageElement.classList.add("winning");
    playSound("win");
    launchConfetti();
  } else {
    // Show try again message
    endMessageElement.textContent = `Try again! Reach ${currentDifficulty.winScore} points.`;
    endMessageElement.classList.remove("winning");
    clearConfetti();
  }
  
  endMessageElement.classList.remove("hidden");
}

applyDifficultyPreview();
