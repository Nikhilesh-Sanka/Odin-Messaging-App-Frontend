import { useEffect, useState, createContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import SideBar from "./components/SideBar.jsx";
import Loading from "./components/Loading.jsx";
import createSocket from "./socket.js";
import { serverUrl } from "./config.js";

export const SocketContext = createContext(null);

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const socket = createSocket(token);
      setSocket(socket);
      socket.connect();

      // if there are any joined rooms and socket reconnects rejoining the rooms
      socket.on("connect", () => {
        if (currentRoom) {
          socket.emit("join-room", currentRoom);
        }
      });

      // disconnecting the socket
      return () => {
        socket.off("connect");
        socket.disconnect();
      };
    }
  }, [currentRoom, token]);

  // fetching the userId
  useEffect(() => {
    if (token) {
      fetch(`${serverUrl}/user/details`, {
        method: "GET",
        headers: {
          auth: token,
        },
      })
        .then((response) => response.json())
        .then(({ userDetails }) => setUserDetails(userDetails));
    }
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        currentRoom,
        setCurrentRoom,
        userId: userDetails ? userDetails.id : null,
        username: userDetails ? userDetails.username : null,
      }}
    >
      {token ? (
        <>
          {userDetails ? (
            <>
              <SideBar />
              <main>
                <Outlet context={{ token }} />
              </main>
            </>
          ) : (
            <Loading />
          )}
        </>
      ) : (
        <Navigate to="/login" />
      )}
    </SocketContext.Provider>
  );
}

export default App;
