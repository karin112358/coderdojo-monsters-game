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

server.listen(port, function () {
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
let lastUpdated = Math.floor((new Date()) / 1000);

// generate stars
if (!players.length) {
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.floor(Math.random() * configuration.width),
            y: Math.floor(Math.random() * configuration.height),
            size: Math.floor(Math.random() * 15 + 10)
        });
    }
}

io.on('connection', function (socket) {
    console.log('new connection');
    let player = null;

    socket.on('joinGame', function (name, monsterId) {
        if (!player) {
            if (!players.find(p => p.name === name)) {
                if (name) {
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

                    console.log('new player', name);

                    updateStatus();

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
            if (position.speedX > 4 || position.speedY > 4) {
                socket.emit('error', 'You are cheating!');
                socket.disconnect();
            } else {
                player.x = position.x;
                player.y = position.y;
                player.speedX = position.speedX;
                player.speedY = position.speedY;
                socket.broadcast.emit('playerUpdatedPosition', player);

                updateStatus();
                socket.emit('starsUpdated', stars);
                socket.emit('updatedSize', player.size);
                socket.broadcast.emit('playerUpdatedSize', player);
            }
        } else {
            socket.emit('error', 'Player not valid')
        }
    });

    socket.on('eatStar', function (x, y) {
        if (player) {
            const index = stars.findIndex(s => s.x === x && s.y === y);
            if (index >= 0 && player.size < 500) {
                player.size += stars[index].size / 10;
                stars.splice(index, 1);
                socket.emit('updatedSize', player.size);
                socket.broadcast.emit('playerUpdatedSize', player);
            }
        }
    });

    socket.on('eatPlayer', function (name) {
        if (player) {
            const playerToEat = players.find(s => s.name === name);
            if (playerToEat && playerToEat.size < player.size) {
                const dist = Math.sqrt(Math.pow(player.x - playerToEat.x, 2) + Math.pow(player.y - playerToEat.y, 2));
                console.log(playerToEat, dist);

                if (dist < player.size / 2) {
                    console.log('eat');
                    const index = players.indexOf(playerToEat);
                    players.splice(index, 1);

                    player.size += playerToEat.size / 2;
                    socket.emit('updatedSize', player.size);
                    socket.emit('gameOver', playerToEat);
                    socket.broadcast.emit('gameOver', playerToEat);
                }
            }
        }
    });

    socket.on('disconnect', function () {
        console.log('disconnected', player ? player.name : 'new player');

        if (player && player.name) {
            const index = players.findIndex(p => p.name === player.name);
            if (index >= 0) {
                players.splice(index, 1);
                socket.broadcast.emit('playerLeftGame', player);
            }
        }
    });

    function updateStatus() {
        if (stars.length < 200) {
            for (let i = 0; i < 200 - stars.length; i++) {
                stars.push({
                    x: Math.floor(Math.random() * configuration.width),
                    y: Math.floor(Math.random() * configuration.height),
                    size: Math.floor(Math.random() * 15 + 10)
                });
            }
        }

        let newUpdated = Math.floor((new Date()) / 1000);
        for (let player of players) {
            if (player.size > 50) {
                player.size -= (newUpdated - lastUpdated) * Math.pow((player.size / 100), 3);
            }
        }

        lastUpdated = newUpdated;
    }
});
