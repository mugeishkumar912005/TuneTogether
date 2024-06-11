const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 5900;

io.on("connection", function (socket) {
    console.log("User Connected");

    socket.on('join room', (code) => {
        socket.join(code);
    });

    // Event listener for receiving chat messages
    socket.on("chat message", ({ roomId, message, senderName }) => {
        // Emit the received message to all clients in the room
        io.to(roomId).emit("chat message", { text: message, sender: senderName, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
