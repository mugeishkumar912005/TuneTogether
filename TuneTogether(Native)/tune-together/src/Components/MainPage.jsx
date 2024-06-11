import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MainPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [enteredName, setEnteredName] = useState("");
  const [code, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoinClick = () => {
    setShowPopup(true);
  };

  const handlePopupClose = async () => {
    try {
      const response = await axios.post("http://localhost:5900/verifycode", {
        code,
        name,
      });
      const data = response.data;
      if (response.status === 200) {
        navigate(`/JoinRoom/${data.code}`, {
          state: { username: name, roomId: data.code },
        });
      } else {
        console.log("Verification failed:", data.Msg);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  };

  const generateCode = async () => {
    try {
      const response = await axios.post("http://localhost:5900/codegen");
      const roomCode = response.data.code;
      setRoomCode(roomCode);
      navigate(`/CreateRoom/${roomCode}`, {
        state: { username: name, roomId: roomCode },
      });
    } catch (error) {
      console.error("Error generating room code:", error);
    }
  };

  const handleNameChange = (event) => {
    setEnteredName(event.target.value);
  };

  const handleNameSubmit = async () => {
    try {
      const response = await axios.post("http://localhost:5900/createUser", {
        username: enteredName,
      });
      if (response.status === 200) {
        setName(enteredName);
        setEnteredName("");
        setShowPopup(true);
      } else {
        console.error("Error storing name:", response.data.Msg);
      }
    } catch (error) {
      console.error("Error storing name:", error);
    }
  };

  return (
    <div className="mainpage-container">
      <nav className="mainpage-nav">
        <h1 className="title">Tune Together</h1>
        <div className="profile">
          {name ? (
            <>
              <span style={{ fontWeight: "bold" }}>{name}</span>
              <button onClick={() => setName("")}>Change</button>
            </>
          ) : (
            <div>
              <input
                type="text"
                value={enteredName}
                onChange={handleNameChange}
                placeholder="Enter your name"
              />
              <button onClick={handleNameSubmit}>Submit</button>
            </div>
          )}
        </div>
      </nav>
      <div className="btn-container">
        <button className="join" onClick={handleJoinClick}>
          JOIN ROOM
        </button>
        <button className="create" onClick={generateCode}>
          CREATE ROOM
        </button>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Enter Room Code</h2>
            <input
              type="text"
              value={code}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <div>
              <button onClick={handlePopupClose}>Submit</button>
              <button onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
