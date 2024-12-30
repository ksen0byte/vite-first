let timer = 0;
let score = 0;
let intervalId: number | undefined;

const startButton = document.querySelector<HTMLButtonElement>('#start-button')!;
const timerElement = document.querySelector<HTMLDivElement>('#timer')!;
const scoreElement = document.querySelector<HTMLDivElement>('#score')!;
const objectsContainer = document.querySelector<HTMLDivElement>('#objects')!;

// Start game logic
startButton.addEventListener('click', () => {
    timer = 0;
    score = 0;
    timerElement.textContent = '0';
    scoreElement.textContent = '0';
    objectsContainer.innerHTML = ''; // Clear previous objects

    createObjects();
    startTimer();
});

// Create game objects dynamically
function createObjects() {
    for (let i = 0; i < 10; i++) {
        const object = document.createElement('div');
        object.className = 'absolute w-12 h-12 bg-error rounded-full shadow-lg transition-transform hover:scale-125 hover:bg-success';
        object.style.top = `${Math.random() * 90}%`;
        object.style.left = `${Math.random() * 90}%`;
        object.addEventListener('click', () => {
            object.remove();
            score++;
            scoreElement.textContent = score.toString();
        });
        objectsContainer.appendChild(object);
    }
}

// Timer logic
function startTimer() {
    clearInterval(intervalId); // Clear any existing timer
    intervalId = setInterval(() => {
        timer++;
        timerElement.textContent = timer.toString();
        if (timer >= 30) {
            endGame();
        }
    }, 1000);
}

// End game
function endGame() {
    clearInterval(intervalId);
    alert(`Game Over! Your score is ${score}`);
}
