const { exception } = require('console');
var express = require('express');
var cors = require('cors');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: true
});

const configuration = { width: 1200, height: 1200 };

const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.static('assets', { maxAge: '3600000' }));

server.listen(port, function () { // Listens to port 8081
    console.log('Listening on ' + server.address().port);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/config.json', function (req, res) {
    res.send(configuration);
});

let players = [];
let stars = [];

// generate stars
if (!players.length) {
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.floor(Math.random() * configuration.width),
            y: Math.floor(Math.random() * configuration.height),
            size: Math.floor(Math.random() * 10 + 10)
        });
    }
}

setInterval(() => {
    if (stars.length < 200) {
        for (let i = 0; i < 200 - stars.length; i++) {
            stars.push({
                x: Math.floor(Math.random() * configuration.width),
                y: Math.floor(Math.random() * configuration.height),
                size: Math.floor(Math.random() * 10 + 10)
            });
        }
    }

    for (let player of players) {
        if (player.size > 50) {
            player.size -= 0.4;
        }
    }
}, 200);

io.on('connection', function (socket) {
    console.log('new connection');
    let player = null;

    let starsUpdateInterval = setInterval(() => {
        if (player) {
            socket.emit('starsUpdated', stars);
        }
    }, 500);

    let playerUpdateInterval = setInterval(() => {
        if (player) {
            socket.emit('updatedSize', player.size);
            socket.broadcast.emit('playerUpdatedSize', player);
        }
    }, 500);

    socket.on('joinGame', function (name, monsterId) {
        if (!player) {
            if (!players.find(p => p.name === name)) {
                if (name) {
                    console.log('new player', name);
                    player = {
                        name: name,
                        monsterId: monsterId,
                        x: Math.floor(Math.random() * configuration.width),
                        y: Math.floor(Math.random() * configuration.height),
                        speedX: 0,
                        speedY: 0,
                        size: 100,
                        energy: 100
                    };

                    players.push(player);

                    socket.emit('joinedGame', { self: player, otherPlayers: players.filter(p => p.name !== name), stars: stars });
                    socket.broadcast.emit('playerJoinedGame', player);
                } else {
                    socket.emit('error', 'Please enter a name.');
                }
            } else {
                socket.emit('error', 'Player with name ' + name + ' already exists. Please choose another name.');
            }
        } else {
            socket.emit('error', 'You have already joined the game.');
        }
    });

    socket.on('updatePosition', function (position) {
        if (player) {
            player.x = position.x;
            player.y = position.y;
            player.speedX = position.speedX;
            player.speedY = position.speedY;
            socket.broadcast.emit('playerUpdatedPosition', player);
        }
    });

    socket.on('eatStar', function (x, y) {
        const index = stars.findIndex(s => s.x === x && s.y === y);
        if (index >= 0) {
            player.size += stars[index].size / 10;
            stars.splice(index, 1);
            socket.emit('updatedSize', player.size);
            socket.broadcast.emit('playerUpdatedSize', player);
        }
    });

    socket.on('disconnect', function () {
        console.log('disconnected', player ? player.name : 'new player');

        clearInterval(starsUpdateInterval);
        clearInterval(playerUpdateInterval);

        if (player && player.name) {
            const index = players.findIndex(p => p.name === player.name);
            if (index >= 0) {
                players.splice(index, 1);
                socket.broadcast.emit('playerLeftGame', player);
            }
        }
    });
});
