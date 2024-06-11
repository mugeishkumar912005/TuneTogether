import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import ChatBox from './ChatBox';
import VotePoll from './VotePoll';
import MusicPlayer from './MusicPlayer';

const JoinRoom = () => {
  const { state } = useLocation();
  const { username, roomId } = state || {};  
  const [messages, setMessages] = useState([]);
  const socket = io("http://localhost:5900");

  useEffect(() => {
    socket.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures the effect runs only once

  const handleSendMessage = (message) => {
    const msg = { sender: username, text: message, timestamp: new Date() };
    socket.emit("chat message", msg);
    setMessages((prevMessages) => [...prevMessages, msg]);
  };

  return (
    <div className="joinroom-container">
      <div className="joinroom-nav">
        <h1>Tune Together</h1>
        <div className="roomcode">Room Code: {roomId}</div>
      </div>
      <div className="joinroom-subcontainer">
        <VotePoll/>
        <MusicPlayer/>
        <ChatBox messages={messages} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default JoinRoom;
