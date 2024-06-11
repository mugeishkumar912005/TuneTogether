const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const MsgSchema = require('./schemaMsg.js');
const ConvoSchema = require('./schemaConvo.js');
const generateToken = require('./jwt.js');
const protectRoute = require('./protectroute.js');
const JWT = require('jsonwebtoken');
const moment = require('moment');
const { UserSchema } = require('./names.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'Content-Type', 'my-custom-header'],
    credentials: true,
  },
});


app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['authorization', 'Content-Type', 'my-custom-header'],
  credentials: true,
}));
app.use(cookieParser());

const Code = mongoose.model('Code', require('./schema.js').codes);
const Name = mongoose.model('Names', UserSchema);
const Msg = mongoose.model('Msg', MsgSchema);
const Convo = mongoose.model('Convo', ConvoSchema);

const dbConnection = async () => {
  try {
    await mongoose.connect('mongodb+srv://kmugeis2005:dontforgetit@mugeishhero.ggr3iod.mongodb.net/Tune?retryWrites=true&w=majority&AppName=mugeishhero');
    console.log('DB Connection Success');
  } catch (error) {
    console.error('Oops! Server Error:', error);
  }
};
app.post('/codegen', protectRoute, async (request, response) => {
  try {
    let code = generateUniqueCode();
    const existingCode = await Code.findOne({ code });
    if (existingCode) {
      return response.status(409).json({ Msg: 'Duplicate room code detected' });
    }
    await Code.create({ code });
    return response.status(200).json({ Msg: 'Success', code });
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ Msg: 'Server Error' });
  }
});

function generateUniqueCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

app.post('/verifycode', async (request, response) => {
  try {
    const { code } = request.body;
    
    if (typeof code !== 'string' || code.length !== 6) {
      return response.status(400).json({ Msg: 'Invalid room code length.' });
    }

    const foundRoom = await Code.findOne({ code: code.toString() });
    if (!foundRoom) {
      return response.status(404).json({ Msg: 'Room not found. Please create one.' });
    }

    const token = JWT.sign({ code }, "Y+88p4NldTYqVNWLSVKODcprx0g59PackkQWqGwxow0=", { expiresIn: '24h' });
    response.cookie('JWT', token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
    });

    io.emit('room created', code);
    return response.status(200).json({ Msg: 'Match Found', token });
  } catch (error) {
    console.error('Server Error:', error);
    return response.status(500).json({ Msg: 'Server Error' });
  }
});

app.post('/createUser', async (request, response) => {
  try {
    const { username } = request.body;
    if (!username) {
      return response.status(400).json({ Msg: 'Username is required.' });
    }
    const existingUser = await Name.findOne({ username });
    if (existingUser) {
      return response.status(409).json({ Msg: 'Username already exists.' });
    }
    const newUser = await Name.create({ username });
    return response.status(200).json({ Msg: 'User created successfully.', username: newUser.username });
  } catch (error) {
    console.error('Error creating user:', error);
    return response.status(500).json({ Msg: 'Server Error' });
  }
});

app.post('/MsgSend/:roomId', async (request, response) => {
  try {
    const { Msg: messageText, senderName } = request.body;
    const roomId = request.params.roomId;

    if (!roomId) {
      return response.status(400).json({ error: 'Room ID is required.' });
    }
    if (!messageText) {
      return response.status(400).json({ error: "'Msg' is a required field." });
    }
    let conversation = await Convo.findOne({ code: roomId });
    if (!conversation) {
      conversation = await Convo.create({ code: roomId, messages: [] });
    }
    const newMsg = new Msg({ Msg: messageText, sender: senderName, roomId });
    conversation.messages.push(newMsg);
    await conversation.save();
    io.to(roomId).emit('chat message', { text: messageText, sender: senderName, timestamp: new Date().toISOString() });

    return response.status(201).json({ Msg: newMsg });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Internal server error.' });
  }
});
app.post("/recmsg/:roomId", async (request, response) => {
  try {
    const { message, username } = request.body;
    const roomId = request.params.roomId;
    if (!roomId || !message || !username) {
      return response.status(400).json({ error: "Invalid message data." });
    }
    io.to(roomId).emit("chat message", { text: message, sender: username, timestamp: new Date().toISOString() });

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Internal server error." });
  }
});


dbConnection();

io.on('connection', (socket) => {
  console.log('User Connected');

  socket.on('join room', (code) => {
    socket.join(code);
    console.log(`User joined room: ${code}`);
  });

  socket.on('chat message', ({ roomId, message, username }) => {
    io.to(roomId).emit('chat message', { text: message, sender: username, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});

const port = process.env.PORT || 5900;
server.listen(port, () => console.log(`Server listening on port ${port}`));
