import { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import socket from "../socket.js";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import ChatStyles from "../css-modules/Chats.module.css";
import PropTypes from "prop-types";

export default function Chats() {
  const [chats, setChats] = useState(null);
  const [openedChat, setOpenedChat] = useState(null);
  const [sidebarStatus, setSidebarStatus] = useState(true);
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

    // connecting to the socket
    socket.connect();

    return () => {
      // disconnecting the socket
      socket.disconnect();
    };
  }, []);

  // handling opening of chats and joining the appropriate rooms
  function openChat(chatId) {
    setOpenedChat(chatId);
    socket.emit("join-chat", `chat-${chatId}`);
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
            <p>{chat.status}</p>
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
  const navigate = useNavigate();
  const messageField = useRef(null);
  const messages = useRef(null);

  // fetching the chat details
  useEffect(() => {
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
    props.socket.on("receive-message", (message) => {
      const date = new Date();
      const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;

      messages.current.innerHTML += `
            <div class="${ChatStyles["message"]}">
                <p>${message}</p>
                <p>${dateString}</p>
            </div>
        `;
    });

    console.log(messages);

    return () => {
      props.socket.off("receive-message");
    };
  }, []);

  // sending a message
  async function sendMessage() {
    if (messageField.current.value.trim() === "") {
      return;
    }
    const text = messageField.current.value.trim();
    props.socket.emit("send-message", text, `chat-${chat.id}`);
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
      const date = new Date();
      const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
      messages.current.innerHTML += `
            <div class="${ChatStyles["message"]} ${ChatStyles["client-message"]}">
                <p>${text}</p>
                <p>${dateString}</p>
            </div>
        `;
      scrollToLastMessage();
      messageField.current.value = "";
    } else {
      navigate("/serverError");
    }
  }

  //scrolling the messages to the last message
  function scrollToLastMessage() {
    const y =
      messages.current.lastElementChild.getBoundingClientRect().top -
      messages.current.getBoundingClientRect().top;
    messages.current.scroll(0, y, {
      behavior: "smooth",
    });
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
