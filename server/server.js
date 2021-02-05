const { exception } = require('console');
var express = require('express');
var cors = require('cors');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: true
});

app.use(cors());

app.use(express.static('assets', { maxAge: '3600000' }));

server.listen(8081, function () { // Listens to port 8081
    console.log('Listening on ' + server.address().port);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

let players = [];

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
                        monsterId: monsterId
                    };

                    players.push(player);

                    socket.emit('joinedGame', players);
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
