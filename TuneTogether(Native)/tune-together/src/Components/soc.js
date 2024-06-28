import React from 'react';
import io from 'socket.io-client';
import ChatBox from './ChatBox'; 
const socket = io('http://localhost:5900');

function soc() {
  return (
    <ChatBox roomId="your-room-id" username="your-username" socket={socket} />
  );
}

export default soc;
