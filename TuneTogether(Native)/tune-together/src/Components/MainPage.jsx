import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import io from "socket.io-client";
import ChatBox from "./ChatBox"; // Import ChatBox component

const MainPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [enteredName, setEnteredName] = useState("");
  const [code, setRoomCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  const getAuthToken = () => {
    return Cookies.get("authToken");
  };

  useEffect(() => {
    const newSocket = io("http://localhost:5900");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleJoinClick = () => {
    setShowPopup(true);
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
        socket.emit('join room', data.code.toString()); // Emit room code as string
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

  const generateCode = async () => {
    try {
      const response = await axios.post("http://localhost:5900/codegen");
      const roomCode = response.data.code;
      setGeneratedCode(roomCode);
    } catch (error) {
      console.error("Error generating room code:", error.message || error);
    }
  };

  useEffect(() => {
    if (generatedCode) {
      navigate(`/CreateRoom/${generatedCode}`, {
        state: { username: name, roomId: generatedCode }, 
      });
    }
  }, [generatedCode, navigate, name]);

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
        Cookies.set("authToken", response.data.authToken, { expires: 1 });
        fetchUsers(); // Fetch users after setting the name
      } else {
        console.error("Error storing name:", response.data.Msg);
      }
    } catch (error) {
      console.error("Error storing name:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5900/users");
      setUsernames(response.data.users.map((user) => user.username));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers(); // Fetch users on component mount
  }, []);

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
      <div className="content-container">
        <div className="main-content">
          <div className="btn-container">
            <button className="join" onClick={handleJoinClick}>
              JOIN ROOM
            </button>
            <button className="create" onClick={generateCode}>
              CREATE ROOM
            </button>
          </div>
        </div>
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
      {name && code && (
        <ChatBox roomId={code} username={name} socket={socket} />
      )}
    </div>
  );
};

export default MainPage;
