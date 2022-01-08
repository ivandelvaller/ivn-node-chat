const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const path = require('path');
const http = require('http');

const {
    generateMessages,
    generateLocationMessage,
} = require('./utils/messages');

const { 
    addUser,
    removeUser,
    getUser,
    getUsersInRoom, 
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const filter = new Filter();

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if(error) return callback(error);

        socket.join(user.room);

        socket.emit('message', generateMessages(user.username, 'Welcome!'));

        socket.broadcast.to(user.room).emit('message', generateMessages(user.username, `${user.username} has joined.`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        if(filter.isProfane(message)) return callback('Profanity is not allowed!');

        io.to(user.room).emit('message', generateMessages(user.username, message));
        callback();
    });

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id);

        const message = `http://google.com/maps?q=${latitude},${longitude}`;

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, message));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', generateMessages(`${user.username} has left.`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server up on http://localhost:${port}`);
});