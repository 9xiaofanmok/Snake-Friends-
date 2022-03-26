const BG_COLOUR = "#231f20";
const SNAKE_COLOUR = ["#FFE900", "#FB5012", "#01FDF6", "#CBBAED", "#03FCBA"];
const FOOD_COLOUR = "#fff";

const socket = io("https://limitless-hollows-28517.herokuapp.com/");

socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("startCountdown", handleStartCountdown);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknownGame", handleUnknownGame);
socket.on("tooManyPlayers", handleTooManyPlayers);
socket.on("addScore", handleNewScore);

let canvas, ctx, playerNumber, players;
let gameActive = false;
const startingMinutes = 1;
let time = startingMinutes * 60;
let intervalId;

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const noOfPlayers = document.getElementById("noOfPlayers");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");

const backBtn = document.getElementById("backButton");
const countdownTimer = document.getElementById("timer");
const score = document.getElementById("score");

players = parseInt(noOfPlayers.value);

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);
backBtn.addEventListener("click", back);
noOfPlayers.addEventListener("change", (e) => {
    players = parseInt(e.target.value);
});

function newGame() {
    socket.emit("newGame", players);
    init();
}

function joinGame() {
    const gameCode = gameCodeInput.value;
    socket.emit("joinGame", gameCode);
    gameCodeDisplay.innerText = gameCode;
    init();
}

function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    switch (players) {
        case 2:
            canvas.width = canvas.height = 500;
            break;
        case 3:
            canvas.width = canvas.height = 600;
            break;
        case 4:
            canvas.width = canvas.height = 650;
            break;
        case 5:
            canvas.width = canvas.height = 700;
            break;
        default:
            canvas.width = canvas.height = 500;
            break;
    }
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener("keydown", keydown);
    gameActive = true;
}

function handleStartCountdown() {
    intervalId = setInterval(() => {
        let minutes = Math.floor(time / 60);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        let seconds = time % 60;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        countdownTimer.innerText = `${minutes}:${seconds}`;
        time--;

        if (time < 0) {
            clearInterval(intervalId);
            socket.emit("timerEnd");
        }
    }, 1000);
}

function keydown(e) {
    socket.emit("keydown", e.keyCode);
}

function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    for (let id of state.activePlayers) {
        paintPlayer(state.players[id - 1], size, SNAKE_COLOUR[id - 1]);
    }
}

function paintPlayer(playerState, size, colour) {
    const snake = playerState.snake;

    ctx.fillStyle = colour;
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleInit(number, noOfPlayers) {
    playerNumber = number;
    players = noOfPlayers;
}

function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }

    data = JSON.parse(data);

    if (data.winner === playerNumber) {
        alert("You win!");
    } else {
        alert("You lost!");
    }
    clearInterval(intervalId);
    gameActive = false;
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleUnknownGame() {
    reset();
    alert("Unknown game code"); // TODO: change to show on UI
}

function handleTooManyPlayers() {
    reset();
    alert("This game is already in progress"); // TODO: change to show on UI
}

function handleNewScore(newScore) {
    score.innerText = newScore;
}

function reset() {
    gameActive = false;
    playerNumber = null;
    noOfPlayers.value = 2;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "grid";
    gameScreen.style.display = "none";
    clearInterval(intervalId);
    time = startingMinutes * 60;
    countdownTimer.innerText = `01:00`;
    score.innerText = 0;

    socket.emit("resetGame");
}

function back() {
    reset();
}
