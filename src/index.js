// Imported modules.
const socketio = require('socket.io');
const Filter = require('bad-words');
const path = require('path');
const http = require('http');
const express = require('express');

// Imported modules from utils directory.
const { generateMessages,
    generateLocationMessage } = require('./utils/messages');

const { addUser,
    removeUser,
    getUser,
    getUsersInRoom } = require('./utils/users');

// Instances.
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const filter = new Filter();

// Variables and constants.
const port = process.env.PORT;
const publicDirectoryPath = path.join(__dirname, '../public');

// Middlewares.
app.use(express.static(publicDirectoryPath));


// When a new connection is stablished.
io.on('connection', (socket) => {
    // A new message for each new connection.
    console.log('New WebSocket connection');

    // LISTENERS.
    // EVENT join.
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) return callback(error);

        socket.join(user.room);

        socket.emit('message', generateMessages(user.username, 'Welcome!'));

        socket.broadcast.to(user.room).emit('message', generateMessages(user.username, `${user.username} has joined.`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        callback();
    });

    // EVENT sendMessage.
    socket.on('sendMessage', (message, callback) => {
        // Get the user.
        const user = getUser(socket.id);

        // This is a filter for bad words.
        // If a bad word is encountered by the filter, the message will not be sent.
        if (filter.isProfane(message)) return callback('Profanity is not allowed!');


        // Otherwise, call message event, and pass the message like parameter.
        io.to(user.room).emit('message', generateMessages(user.username, message));
        callback();
    });

    // EVENT sendLocation.
    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        // Get the user.
        const user = getUser(socket.id);

        // Generating the url.
        const message = `http://google.com/maps?q=${latitude},${longitude}`;

        // Calling the locationMessahe event.
        io.to(user.room).emit('locationMessage', generateLocationMessage( user.username , message));
        callback();
    });

    // EVENT disconnect.
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user){
            io.to(user.room).emit('message', generateMessages(`${user.username} has left.`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }


    });
});

// Server.
server.listen(port, () => {
    console.log(`Server up on localhost:${port}`);
});