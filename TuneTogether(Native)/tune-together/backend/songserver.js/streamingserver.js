const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const port = 5450;

app.use(cors());

app.get('/tracks', (req, res) => {
  const songsDir = path.join(__dirname, 'songs');
  fs.readdir(songsDir, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.mp3' || ext === '.wav';
    });
    const tracks = audioFiles.map(file => {
      return {
        title: path.basename(file, path.extname(file)),
        url: `http://localhost:${port}/stream/${encodeURIComponent(file)}`
      };
    });
    res.json(tracks);
  });
});

app.get('/stream/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'songs', fileName);
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error(err);
      return res.status(404).send('File not found');
    }
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
    stream.pipe(res);
  });
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join room', (roomCode) => {
    socket.join(roomCode);
    console.log(`User joined room: ${roomCode}`);
  });

  socket.on('leave room', (roomCode) => {
    socket.leave(roomCode);
    console.log(`User left room: ${roomCode}`);
  });

  socket.on('play song', ({ roomCode, trackIndex }) => {
    console.log(`Playing song in room ${roomCode}: ${trackIndex}`);
    io.to(roomCode).emit('play song', { trackIndex });
  });

  socket.on('pause song', ({ roomCode }) => {
    console.log(`Pausing song in room ${roomCode}`);
    io.to(roomCode).emit('pause song');
  });

  socket.on('next song', ({ roomCode, trackIndex }) => {
    console.log(`Next song in room ${roomCode}: ${trackIndex}`);
    io.to(roomCode).emit('next song', { trackIndex });
  });

  socket.on('previous song', ({ roomCode, trackIndex }) => {
    console.log(`Previous song in room ${roomCode}: ${trackIndex}`);
    io.to(roomCode).emit('previous song', { trackIndex });
  });

  socket.on('chat message', ({ roomCode, message }) => {
    console.log(`Message in room ${roomCode}: ${message}`);
    io.to(roomCode).emit('chat message', { message });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(port, () => console.log(`Music streaming server listening on port ${port}`));
