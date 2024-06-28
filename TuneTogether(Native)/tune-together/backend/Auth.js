const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const MsgSchema = require('./schemaMsg.js');
const ConvoSchema = require('./schemaConvo.js');
const JWT = require('jsonwebtoken');
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
    await mongoose.connect('mongodb+srv://kmugeis2005:dontforgetit@mugeishhero.ggr3iod.mongodb.net/Tune?retryWrites=true&w=majority&AppName=mugeishhero', {
    });
    console.log('DB Connection Success');
  } catch (error) {
    console.error('Oops! Server Error:', error);
  }
};

app.post('/codegen', async (req, res) => {
  try {
    let code = generateUniqueCode();
    const existingCode = await Code.findOne({ code });
    if (existingCode) {
      return res.status(409).json({ Msg: 'Duplicate room code detected' });
    }
    await Code.create({ code });
    return res.status(200).json({ Msg: 'Success', code });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ Msg: 'Server Error' });
  }
});
app.get('/users', async (req, res) => {
  try {
    const users = await Name.find(); // Corrected to use Name model
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


function generateUniqueCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

app.post('/verifycode', async (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ Msg: 'Invalid room code length.' });
    }
    const foundRoom = await Code.findOne({ code: code.toString() });
    if (!foundRoom) {
      return res.status(404).json({ Msg: 'Room not found. Please create one.' });
    }
    const token = JWT.sign({ code }, "your_jwt_secret", { expiresIn: '24h' });
    res.cookie('JWT', token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
    });
    io.emit('room created', code);
    return res.status(200).json({ Msg: 'Match Found', code });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ Msg: 'Server Error' });
  }
});

app.post('/createUser', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ Msg: 'Username is required.' });
    }
    const existingUser = await Name.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ Msg: 'Username already exists.' });
    }
    const newUser = await Name.create({ username });
    const token = JWT.sign({ username }, "your_jwt_secret", { expiresIn: '24h' });
    return res.status(200).json({ Msg: 'User created successfully.', username: newUser.username, authToken: token });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ Msg: 'Server Error' });
  }
});

app.post('/MsgSend/:roomId', async (req, res) => {
  try {
    const { Msg: messageText, senderName } = req.body;
    const roomId = req.params.roomId;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required.' });
    }
    if (!messageText) {
      return res.status(400).json({ error: "'Msg' is a required field." });
    }
    let conversation = await Convo.findOne({ code: roomId });
    if (!conversation) {
      conversation = await Convo.create({ code: roomId, messages: [] });
    }
    const newMsg = new Msg({ Msg: messageText, sender: senderName, roomId });
    await newMsg.save();
    conversation.messages.push(newMsg);
    await conversation.save();
    io.to(roomId).emit('chat message', { text: messageText, sender: senderName, timestamp: new Date().toISOString() });
    return res.status(201).json({ Msg: newMsg });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post("/recmsg/:roomId", async (req, res) => {
  try {
    const { message, username } = req.body;
    const roomId = req.params.roomId;
    if (!roomId || !message || !username) {
      return res.status(400).json({ error: "Invalid message data." });
    }
    io.to(roomId).emit("chat message", { text: message, sender: username, timestamp: new Date().toISOString() });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

dbConnection();

io.on('connection', (socket) => {
  console.log('User Connected');
  
  socket.on('join room', async (roomId) => {
    try {
      const foundRoom = await Code.findOne({ code: roomId.toString() }); // Ensure roomId is a string
      if (!foundRoom) {
        throw new Error('Room not found');
      }
      socket.join(roomId.toString()); // Ensure roomId is a string when joining
      console.log(`User ${socket.username} joined room: ${roomId}`);
      // Emit event to update users in room
      io.to(roomId).emit('users updated', getUsersInRoom(roomId));
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('join room error', { error: 'Room not found' });
    }
  });
  
  const getUsersInRoom = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
      const clientSocket = io.sockets.sockets.get(socketId);
      return clientSocket.username; 
    });
  };
  

  const handlePopupClose = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }
  
      const response = await axios.post(
        "http://localhost:5900/verifycode",
        { code, name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      if (response.status === 200) {
        socket.emit('join room', data.code); // Emit join room event with correct roomId
        navigate(`/CreateRoom/${data.code}`, {
          state: { username: name, roomId: data.code },
        });
      } else {
        console.log("Verification failed:", data.Msg);
      }
    } catch (error) {
      console.error("Error verifying code:", error.message || error);
    }
  };
  
  
  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});

const port = process.env.PORT || 5900;
server.listen(port, () => console.log(`Server listening on port ${port}`));
