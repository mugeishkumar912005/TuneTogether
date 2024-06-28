import React, { useState, useEffect } from 'react';

const ChatBox = ({ roomId, username, socket }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (socket) {
      socket.on('chat message', (message) => {
        console.log('Received message:', message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      socket.emit('join room', { roomId, username });
      return () => {
        socket.off('chat message');
      };
    }
  }, [socket, roomId, username]);

  const handleMessageChange = (e) => {
    setMessageInput(e.target.value);
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    const message = messageInput.trim();
    if (message !== '') {
      console.log('Sending message:', message);
      socket.emit('chat message', { roomId, message, username });
      setMessageInput('');
    }
  };

  return (
    <div className="chatbox-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender === username ? 'sent' : 'received'}`}>
            <span>{message.sender}:</span> {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleMessageSubmit} className="input-container">
        <input
          type="text"
          name="message"
          value={messageInput}
          onChange={handleMessageChange}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
