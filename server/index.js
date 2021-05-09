const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const  PORT = 5000 || process.env.PORT;
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const cors = require('cors');


const router = require('./router');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server);

// app.use(function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', "*");
//     res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// });
app.use(router);

io.on('connection', (socket) => {
    console.log('We have a new Connection!!!');
    socket.on('join', ({name, room}, callback) => {
        const {error, user} = addUser({id:socket.id,name,room});
        if(error) return callback(error);
        socket.emit('message', {user: 'admin',text: `${user.name},welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin',text: `${user.name},has joined`});
        socket.join(user.room);
        io.to(user.room).emit('roomData', {room: user.room,users: getUsersInRoom(user.room)})
        callback();
    });
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', {user: user.name,text: message});
        io.to(user.room).emit('roomData', {room: user.room,text: message});
        
        callback();
    });
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left this chat`});
        }
    });
});
server.listen(PORT , () => {
    console.log(`server is running on ${PORT}`);
});
// server.listen(, () => console.log(`Server has started.`));