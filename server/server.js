const { exception } = require('console');
var express = require('express');
var cors = require('cors');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: true
});

const configuration = { width: 800, height: 800 };

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

io.on('connection', function (socket) {
    console.log('new connection');
    let player = null;

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
                        size: 100
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
            socket.broadcast.emit('playerUpdatedPosition', player);
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
});
