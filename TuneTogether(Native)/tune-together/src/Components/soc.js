import { io } from "socket.io-client";
const socket = io("http://localhost:5900", {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  }
});

export default socket;
