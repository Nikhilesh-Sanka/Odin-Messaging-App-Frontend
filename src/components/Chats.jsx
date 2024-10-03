import { useState, useEffect, useRef, useContext } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { SocketContext } from "../App.jsx";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import ChatStyles from "../css-modules/Chats.module.css";
import PropTypes from "prop-types";

export default function Chats() {
  const [chats, setChats] = useState(null);
  const [openedChat, setOpenedChat] = useState(null);
  const [sidebarStatus, setSidebarStatus] = useState(true);
  const { socket, setCurrentRoom } = useContext(SocketContext);
  const { token } = useOutletContext();
  const navigate = useNavigate();

  // getting the chats from the api and connecting to the socket
  useEffect(() => {
    fetch(`${serverUrl}/user/chats`, {
      method: "GET",
      headers: {
        auth: token,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          navigate("/serverError");
        }
      })
      .then((chats) => {
        setChats(chats);
      });
    return () => {
      setCurrentRoom(null);
    };
  }, [token]);

  // handling opening of chats and joining the appropriate rooms
  function openChat(chatId) {
    setOpenedChat(chatId);
    setCurrentRoom(`chat-${chatId}`);
  }
  return (
    <div className={ChatStyles["chats"]}>
      {chats ? (
        <Sidebar
          openChat={openChat}
          chats={chats}
          sidebarStatus={sidebarStatus}
          setSidebarStatus={setSidebarStatus}
        />
      ) : (
        <Loading />
      )}
      {chats ? (
        openedChat ? (
          <ChatDisplay
            chatId={openedChat}
            sidebarStatus={sidebarStatus}
            token={token}
            socket={socket}
          />
        ) : null
      ) : null}
    </div>
  );
}

// chat sidebar
function Sidebar(props) {
  return (
    <div
      className={`${ChatStyles["sidebar"]} ${
        props.sidebarStatus ? "" : ChatStyles["close"]
      }`}
    >
      <img
        src="./close-arrow.svg"
        className={ChatStyles["close-icon"]}
        onClick={() => {
          props.setSidebarStatus(!props.sidebarStatus);
        }}
      />
      {props.chats.map((chat) => {
        return (
          <div
            className={ChatStyles["sidebar-chat"]}
            key={chat.id}
            onClick={() => {
              props.openChat(chat.id);
            }}
          >
            <img src={chat.receiverProfile.image} />
            <p>{chat.username}</p>
            <p>{chat.status > 0 ? "online" : "offline"}</p>
          </div>
        );
      })}
    </div>
  );
}

Sidebar.propTypes = {
  chats: PropTypes.array,
  openChat: PropTypes.func,
  setSidebarStatus: PropTypes.func,
  sidebarStatus: PropTypes.bool,
};

// chat main display
function ChatDisplay(props) {
  const [chat, setChat] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { socket, currentRoom, userId } = useContext(SocketContext);
  const navigate = useNavigate();
  const messageField = useRef(null);
  const messages = useRef(null);

  // fetching the chat details
  useEffect(() => {
    setChat(null);
    fetch(`${serverUrl}/user/chat?chatId=${props.chatId}`, {
      method: "GET",
      headers: {
        auth: props.token,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          navigate("/serverError");
        }
      })
      .then((chat) => {
        setChat(chat);
      });
    // hearing for receive messages
    socket.on("receive-message", (message, sentUserId) => {
      const date = new Date();
      const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;

      if (sentUserId === userId) {
        const date = new Date();
        const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
        messages.current.innerHTML += `
            <div class="${ChatStyles["message"]} ${ChatStyles["client-message"]}">
                <p>${message}</p>
                <p>${dateString}</p>
            </div>
        `;
      } else {
        messages.current.innerHTML += `
            <div class="${ChatStyles["message"]}">
                <p>${message}</p>
                <p>${dateString}</p>
            </div>
        `;
      }
      scrollToLastMessage();
    });

    return () => {
      socket.off("receive-message");
    };
  }, [props.chatId, userId]);

  // sending a message
  async function sendMessage() {
    if (messageField.current.value.trim() === "") {
      return;
    }
    const text = messageField.current.value.trim();
    socket.emit("send-message", text, currentRoom);
    messageField.current.value = "";
    const date = new Date();
    const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    messages.current.innerHTML += `
            <div class="${ChatStyles["message"]} ${ChatStyles["client-message"]}">
                <p>${text}</p>
                <p>${dateString}</p>
            </div>
        `;
    scrollToLastMessage();
    const response = await fetch(`${serverUrl}/user/chat/message`, {
      method: "POST",
      body: JSON.stringify({
        chatId: chat.id,
        text: text,
      }),
      headers: {
        auth: props.token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  //scrolling the messages to the last message
  function scrollToLastMessage() {
    const messages = document.querySelector(`.${ChatStyles["messages"]}`);
    messages.scrollTop = messages.scrollHeight;
  }

  // handling the open and close of profile
  function openProfile() {
    setProfileOpen(true);
  }

  function closeProfile() {
    setProfileOpen(false);
  }

  return (
    <div
      className={`${ChatStyles["chat-display"]} ${
        props.sidebarStatus ? ChatStyles["sidebar-open"] : ""
      }`}
    >
      {chat ? (
        <div className={ChatStyles["dummy"]}>
          <div className={ChatStyles["profile-bar"]} onClick={openProfile}>
            <img src={chat.receiverProfile.image} />
            <h1>{chat.receiverName}</h1>
          </div>
          <div
            className={`${
              profileOpen ? ChatStyles["profile"] : ChatStyles["messages"]
            }`}
            ref={messages}
          >
            {profileOpen ? (
              <>
                <div className={ChatStyles["close-icon"]}>
                  <img src="./close-icon.svg" onClick={closeProfile} />
                </div>
                <p>
                  <strong>Bio:</strong> <br />
                  {chat.receiverProfile.bio}
                </p>
                <p>
                  <strong>Relationship Status:</strong>
                  {chat.receiverProfile.relationshipStatus}
                </p>
              </>
            ) : (
              <>
                {chat.messages.map((message) => {
                  return (
                    <div
                      className={`${ChatStyles["message"]} ${
                        chat.clientId === message.userId
                          ? ChatStyles["client-message"]
                          : ""
                      }`}
                      key={message.id}
                    >
                      <p>{message.text}</p>
                      <p>{message.time}</p>
                    </div>
                  );
                })}
              </>
            )}
          </div>
          {profileOpen ? null : (
            <>
              <div className={ChatStyles["scroll-to-bottom"]}>
                <img src="./close-arrow.svg" onClick={scrollToLastMessage} />
              </div>
              <label>
                <input
                  placeholder="send message"
                  ref={messageField}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />
                <img src="./send-message-icon.svg" onClick={sendMessage} />
              </label>
            </>
          )}
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}

ChatDisplay.propTypes = {
  chatId: PropTypes.string,
  token: PropTypes.string,
  sidebarStatus: PropTypes.bool,
  socket: PropTypes.object,
};
