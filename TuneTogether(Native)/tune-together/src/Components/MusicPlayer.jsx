import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
const socket = io("http://localhost:5450");
const MusicPlayer = ({ roomCode }) => {
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const audioRef = useRef();
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get("http://localhost:5450/tracks");
        setTracks(response.data);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      }
    };

    fetchTracks();
  }, []);

  useEffect(() => {
    socket.emit('join room', roomCode);

    socket.on('play song', ({ trackIndex }) => {
      setCurrentTrackIndex(trackIndex);
      setIsPlaying(true);
    });

    socket.on('pause song', () => {
      setIsPlaying(false);
    });

    socket.on('next song', ({ trackIndex }) => {
      setCurrentTrackIndex(trackIndex);
    });

    socket.on('previous song', ({ trackIndex }) => {
      setCurrentTrackIndex(trackIndex);
    });

    socket.on('chat message', ({ message }) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    return () => {
      socket.emit('leave room', roomCode);
      socket.off('play song');
      socket.off('pause song');
      socket.off('next song');
      socket.off('previous song');
      socket.off('chat message');
    };
  }, [roomCode]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const playNextTrack = () => {
    const nextTrackIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
    setCurrentTrackIndex(nextTrackIndex);
    socket.emit('next song', { roomCode, trackIndex: nextTrackIndex });
  };

  const playPreviousTrack = () => {
    const previousTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    setCurrentTrackIndex(previousTrackIndex);
    socket.emit('previous song', { roomCode, trackIndex: previousTrackIndex });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      socket.emit('play song', { roomCode, trackIndex: currentTrackIndex });
    } else {
      socket.emit('pause song', { roomCode });
    }
  };

  const handleEnded = () => {
    playNextTrack();
  };

  const handleSendMessage = (message) => {
    socket.emit('chat message', { roomCode, message });
  };

  return (
    <div className="music-player">
      <div className="music-info">
        <img src="../src/imgs/album-leo2.jpg" alt="Album Art" className="album-art" /> 
        <div className="track-info">
          <h2>{tracks[currentTrackIndex]?.title}</h2>
          <p>{tracks[currentTrackIndex]?.artist}</p>
        </div>
      </div>
      <div className="controls">
        <button onClick={playPreviousTrack}>Previous</button>
        <button onClick={handlePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
        <button onClick={playNextTrack}>Next</button>
      </div>
      <div className="equalizer">
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
        <div className={`bar ${isPlaying ? "active" : ""}`}></div>
      </div>
      <audio
        ref={audioRef}
        src={tracks[currentTrackIndex]?.url}
        onEnded={handleEnded}
        autoPlay={isPlaying}
      />
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
