import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import ChatBox from './ChatBox';
import VotePoll from './VotePoll';
import MusicPlayer from './MusicPlayer';

const CreateRoom = () => {
  const location = useLocation();
  const { username, roomId } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const socket = io("http://localhost:5900");

  useEffect(() => {
    if (roomId) {
      socket.emit('joinRoom', { roomId, username });
    }

    socket.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("users updated", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, username]);

  const handleSendMessage = (message) => {
    const msg = { sender: username, text: message, timestamp: new Date() };
    socket.emit("chat message", msg);
    setMessages((prevMessages) => [...prevMessages, msg]);
  };

  return (
    <div className="joinroom-container">
      <div className="joinroom-nav">
        <h1>Tune Together</h1>
        <div className="roomcode">Room Code: {roomId || 'Loading...'}</div>
      </div>
      <div className="joinroom-subcontainer">
        <VotePoll usernames={users} name={username} />
        <MusicPlayer />
        <ChatBox messages={messages} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default CreateRoom;
