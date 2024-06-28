import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const JoinedRoom = ({ roomId, username }) => {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:5900");
    socket.emit("join room", roomId);

    socket.on("userJoined", (username) => {
      setParticipants((prevParticipants) => [...prevParticipants, username]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div className="joined-room-container">
      <h1>Room: {roomId}</h1>
      <h2>Participants:</h2>
      <ul>
        {participants.map((participant, index) => (
          <li key={index}>{participant}</li>
        ))}
      </ul>
    </div>
  );
};

export default JoinedRoom;
