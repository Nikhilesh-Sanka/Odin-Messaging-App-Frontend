import { io } from "socket.io-client";
import { serverUrl } from "./config.js";

const socket = io(serverUrl, {
  autoConnect: false,
});

export default socket;
