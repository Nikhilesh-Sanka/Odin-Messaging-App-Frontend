import { io } from "socket.io-client";
import { serverUrl } from "./config.js";

const createSocket = (query) => {
  const socket = io(serverUrl, {
    autoConnect: false,
    query: { token: query },
  });
  return socket;
};

export default createSocket;
