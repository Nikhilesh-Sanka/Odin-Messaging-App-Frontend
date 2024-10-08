import { useEffect, useState, createContext } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import SideBar from "./components/SideBar.jsx";
import Loading from "./components/Loading.jsx";
import createSocket from "./socket.js";
import { serverUrl } from "./config.js";

export const SocketContext = createContext(null);
export const NotificationsContext = createContext(null);

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const navigate = useNavigate();
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

      // listening to chat notifications
      socket.on("chats-notification", (chatId) => {
        console.log("notification received");
        if (currentRoom !== `chat-${chatId}`) {
          const newNotifications = JSON.parse(JSON.stringify(notifications));
          const chatAlreadyBeingNotified = newNotifications.chats.find(
            (chatNotification) => chatNotification.chatId === chatId
          );
          if (chatAlreadyBeingNotified) {
            newNotifications.chats = newNotifications.chats.map(
              (chatNotification) => {
                if (chatNotification.chatId === chatId) {
                  return {
                    ...chatNotification,
                    numOfMessages: chatNotification.numOfMessages + 1,
                  };
                } else {
                  return chatNotification;
                }
              }
            );
          } else {
            newNotifications.chats.push({ chatId: chatId, numOfMessages: 1 });
          }
          setNotifications(newNotifications);
        }
      });

      // listening to group chats notification
      socket.on("group-chats-notification", (groupId) => {
        if (currentRoom !== `group-${groupId}`) {
          const newNotifications = JSON.parse(JSON.stringify(notifications));
          const groupChatAlreadyBeingNotified =
            newNotifications.groupChats.find(
              (groupChatNotification) =>
                groupChatNotification.groupChatId === groupId
            );
          if (groupChatAlreadyBeingNotified) {
            newNotifications.groupChats = newNotifications.groupChats.map(
              (groupChatNotification) => {
                if (groupChatNotification.groupChatId === groupId) {
                  return {
                    ...groupChatNotification,
                    numOfMessages: groupChatNotification.numOfMessages + 1,
                  };
                } else {
                  return groupChatNotification;
                }
              }
            );
          } else {
            newNotifications.groupChats.push({
              groupChatId: groupId,
              numOfMessages: 1,
            });
          }
          setNotifications(newNotifications);
        }
      });

      // listening to errors
      socket.on("error", () => {
        navigate("/serverError");
      });

      // disconnecting the socket
      return () => {
        socket.off("connect");
        socket.off("chats-notification");
        socket.off("error");
        socket.disconnect();
      };
    }
  }, [currentRoom, token, notifications]);

  // fetching the userId, username and the notifications
  useEffect(() => {
    if (token) {
      fetch(`${serverUrl}/user/details`, {
        method: "GET",
        headers: {
          auth: token,
        },
      })
        .then((response) => response.json())
        .then(({ userDetails }) => {
          setUserDetails({
            username: userDetails.username,
            userId: userDetails.id,
          });
          setNotifications(userDetails.notifications);
        });
    }
  }, [token]);

  return (
    <>
      {token ? (
        <>
          {userDetails && socket ? (
            <NotificationsContext.Provider
              value={{ notifications, setNotifications }}
            >
              <SocketContext.Provider
                value={{
                  socket,
                  currentRoom,
                  setCurrentRoom,
                  userId: userDetails.userId,
                  username: userDetails.username,
                }}
              >
                <SideBar />
                <main>
                  <Outlet context={{ token }} />
                </main>
              </SocketContext.Provider>
            </NotificationsContext.Provider>
          ) : (
            <Loading />
          )}
        </>
      ) : (
        <Navigate to="/login" />
      )}
    </>
  );
}

export default App;
