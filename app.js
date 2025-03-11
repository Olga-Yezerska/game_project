const express = require('express');
const app = express();
const port = 3000;

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const mapHeight = 1024;
const mapWidth = 1024;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const players = {};
const waitingPlayers = [];

io.on('connection', (socket) => {
    console.log('A new user connected');

    socket.on('register', (username) => {
        players[socket.id] = {
            id: socket.id,
            username: username,
            x: Math.floor(Math.random() * (mapWidth - 20) + 10), 
            y: Math.floor(Math.random() * (mapHeight - 20) + 10), 
            radius: 10,
            color: 'white'
        };

        waitingPlayers.push(socket.id);

        if (waitingPlayers.length >= 2) {
            const player1 = waitingPlayers.shift();
            const player2 = waitingPlayers.shift();

            players[player1].color = 'red';
            players[player2].color = 'green';

            io.to(player1).emit('startGame', {
                self: players[player1],
                opponent: players[player2]
            });
            io.to(player2).emit('startGame', {
                self: players[player2],
                opponent: players[player1]
            });
        }
    });

    socket.on('move', (data) => {
        const player = players[socket.id];
        if (player) {
            const radius = player.radius;
            player.x = Math.max(radius, Math.min(mapWidth - radius, data.x));
            player.y = Math.max(radius, Math.min(mapHeight - radius,data.y));
            if (player.x + radius > mapWidth || player.x - radius < 0 || player.y + radius > mapHeight || player.y < 0) {
            console.log(`Player ${socket.id} out of bounds: x=${player.x}, y=${player.y}`);
        }
            io.emit('updatePlayers', players);

        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete players[socket.id];
        const index = waitingPlayers.indexOf(socket.id);
        if (index !== -1) {
            waitingPlayers.splice(index, 1);
        }
        io.emit('updatePlayers', players);
    });
});

server.listen(port, () => {
    console.log("Server is running on port 3000");
});