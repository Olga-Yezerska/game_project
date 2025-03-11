class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw(c) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
    }
}

const socket = io('https://knights-of-the-hidden-grove.onrender.com');

const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');

const mapWidth = 1024;
const mapHeight = 1024;

function resizeCanvas() {
    canvas.width = mapWidth; // Масштабуємо ширину
    canvas.height = mapHeight; // Масштабуємо висоту
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const players = {};
let currentPlayer = null;

document.getElementById('startButton').addEventListener('click', () => 
{
    const username = document.getElementById('username').value;
    if (username) {
        socket.emit('register', username);
        document.getElementById('registration').style.display = 'none';
        document.getElementById('waiting').style.display = 'block';
    }
});

socket.on('startGame', (data) => {
    document.getElementById('waiting').style.display = 'none';
    document.getElementById('greeting').style.display = 'none';
    canvas.style.display = 'block';


    document.querySelector('.main').classList.remove('registration-state');
    document.querySelector('.main').classList.add('game-state');

    players[socket.id] = new Player(data.self.x, data.self.y, 10, data.self.color);
    players[data.opponent.id] = new Player(data.opponent.x, data.opponent.y, data.opponent.radius, data.opponent.color);

    currentPlayer = players[socket.id];

    resizeCanvas();

    animate();
});

socket.on('updatePlayers', (backendPlayers) => {
    for (const id in backendPlayers) {
        const backendPlayer = backendPlayers[id];
        if (!players[id]) {
            players[id] = new Player(backendPlayer.x, backendPlayer.y, backendPlayer.radius, backendPlayer.color);
        } else {
            players[id].x = backendPlayer.x;
            players[id].y = backendPlayer.y;
            players[id].radius = backendPlayer.radius;
            players[id].color = backendPlayer.color;
        }
    }
    if (players[socket.id]) {
        currentPlayer.x = players[socket.id].x;
        currentPlayer.y = players[socket.id].y;
    }
    console.log(players);
});

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    for (const id in players) {
        players[id].draw(c);
    }
}

document.addEventListener('keydown', (event) => {
    if (currentPlayer) {
        switch (event.key) {
            case 'ArrowUp':
                currentPlayer.y = Math.max(currentPlayer, currentPlayer.y - 5);
                break;
            case 'ArrowDown':
                currentPlayer.y = Math.min(mapHeight - currentPlayer.radius, currentPlayer.y + 5);
                break;
            case 'ArrowLeft':
                currentPlayer.x = Math.max(currentPlayer.radius, currentPlayer.x - 5);
                break;
            case 'ArrowRight':
                currentPlayer.x = Math.min(mapWidth - currentPlayer.radius, currentPlayer.x + 5);
                break;
        }
        socket.emit('move', { x: currentPlayer.x, y: currentPlayer.y });
    }
});