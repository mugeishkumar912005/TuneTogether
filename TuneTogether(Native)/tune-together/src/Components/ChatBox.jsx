import React, { useState } from 'react';

const ChatBox = ({ messages, onSendMessage }) => {
  const [messageInput, setMessageInput] = useState('');

  const handleMessageChange = (e) => {
    setMessageInput(e.target.value);
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    const message = messageInput.trim();
    if (message !== '') {
      onSendMessage(message);
      setMessageInput(''); // Clear the input field after sending the message
    }
  };

  return (
    <div className="chatbox-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <span>{message.sender}:</span> {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleMessageSubmit}>
        <input
          type="text"
          name="message"
          value={messageInput}
          onChange={handleMessageChange}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;
