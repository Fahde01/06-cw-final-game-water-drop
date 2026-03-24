// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let timerCountdown;
let confettiCleanupTimeout;
let score = 0;
let timeLeft = 30;

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const endMessageElement = document.getElementById("end-message");

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("reset-btn").addEventListener("click", resetGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  endMessageElement.classList.add("hidden");
  clearConfetti();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);

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
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
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

  // About 1 in 4 drops are challenge drops that subtract points.
  const isChallengeDrop = Math.random() < 0.25;
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

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Good drops add points; green challenge drops remove points.
  drop.addEventListener(
    "click",
    () => {
      score += isChallengeDrop ? -1 : 1;
      scoreDisplay.textContent = score;
      drop.remove();
    },
    { once: true }
  );

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(timerCountdown);
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  
  // Display end-game message based on score
  const winningMessages = [
    "Woo! You are on fire",
    "Too good! keep going",
    "This is too easy for you"
  ];
  
  if (score >= 15) {
    // Show a random winning message
    const randomMessage = winningMessages[Math.floor(Math.random() * winningMessages.length)];
    endMessageElement.textContent = randomMessage;
    endMessageElement.classList.add("winning");
    launchConfetti();
  } else {
    // Show try again message
    endMessageElement.textContent = "Try again!";
    endMessageElement.classList.remove("winning");
    clearConfetti();
  }
  
  endMessageElement.classList.remove("hidden");
}
