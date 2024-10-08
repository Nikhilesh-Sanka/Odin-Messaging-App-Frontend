import { useState, useEffect, useContext, createContext, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import { SocketContext, NotificationsContext } from "../App.jsx";
import GroupChatsStyles from "../css-modules/GroupChats.module.css";
import PropTypes from "prop-types";

const GroupChatsContext = createContext(null);

export default function GroupChats() {
  const [openedChat, setOpenedChat] = useState(null);
  const [chats, setChats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { token } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!chats) {
      fetch(`${serverUrl}/user/groupChats`, {
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
    }
  }, [chats]);

  // changing the name of the group
  async function changeGroupName(groupId, groupName) {
    const newChats = chats.map((chatObject) => {
      if (chatObject.id === groupId) {
        chatObject.name = groupName.trim();
        return chatObject;
      } else {
        return chatObject;
      }
    });
    if (openedChat) {
      if (openedChat.id === groupId) {
        const newChat = JSON.parse(JSON.stringify(openedChat));
        newChat.name = groupName.trim();
        setOpenedChat(newChat);
      }
    }
    setChats(newChats);
    const response = await fetch(`${serverUrl}/user/groupChat`, {
      method: "PUT",
      body: JSON.stringify({
        name: groupName,
        groupId: groupId,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div className={GroupChatsStyles["group-chats"]}>
      {chats ? (
        <GroupChatsContext.Provider
          value={{
            openedChat,
            setOpenedChat,
            chats,
            setChats,
            token,
            sidebarOpen,
            setSidebarOpen,
            changeGroupName,
          }}
        >
          <Sidebar />
          {openedChat === null ? null : openedChat === undefined ? (
            <Loading />
          ) : (
            <GroupChat />
          )}
        </GroupChatsContext.Provider>
      ) : (
        <Loading />
      )}
    </div>
  );
}

// sidebar components
function Sidebar() {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { setCurrentRoom } = useContext(SocketContext);
  const {
    chats,
    setChats,
    setOpenedChat,
    token,
    sidebarOpen,
    setSidebarOpen,
    changeGroupName,
  } = useContext(GroupChatsContext);
  const { notifications, setNotifications } = useContext(NotificationsContext);
  const navigate = useNavigate();

  // handling the creation of a group
  async function createGroup() {
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/groupChats`, {
      method: "POST",
      body: {},
      headers: {
        auth: token,
      },
    });
    if (response.status === 201) {
      const { chat } = await response.json();
      const newChats = JSON.parse(JSON.stringify(chats));
      newChats.unshift(chat);
      setChats(newChats);
    } else {
      navigate("/serverError");
    }
    setLoadingStatus(false);
  }

  // opening a group chat
  async function openGroupChat(id) {
    setOpenedChat(undefined);
    const response = await fetch(`${serverUrl}/user/groupChat?id=${id}`, {
      method: "GET",
      headers: {
        auth: token,
      },
    });
    if (response.status === 200) {
      const { chat } = await response.json();
      const newNotifications = JSON.parse(JSON.stringify(notifications));
      newNotifications.groupChats = newNotifications.groupChats.filter(
        (groupChatNotification) => groupChatNotification.groupChatId !== id
      );
      setNotifications(newNotifications);
      setOpenedChat(chat);
      setCurrentRoom(`group-${chat.id}`);
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div
      className={`${GroupChatsStyles["sidebar"]} ${
        !sidebarOpen ? GroupChatsStyles["close"] : ""
      }`}
    >
      {chats || loadingStatus ? (
        <>
          <img
            src="./close-arrow.svg"
            onClick={() => setSidebarOpen((sidebarOpen) => !sidebarOpen)}
            className={GroupChatsStyles["open-close-arrow"]}
          />
          <button
            onClick={createGroup}
            className={GroupChatsStyles["add-group-btn"]}
          >
            <img src="./plus-icon.svg" />
            create group
          </button>
          {chats.map((chat) => {
            return (
              <SidebarChatCard
                openGroupChat={openGroupChat}
                chat={chat}
                key={chat.id}
                changeGroupName={changeGroupName}
              />
            );
          })}
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}

function SidebarChatCard(props) {
  const [inputName, setInputName] = useState(props.chat.name);
  const [nameBeingEdited, setNameBeingEdited] = useState(false);
  const { notifications } = useContext(NotificationsContext);

  console.log(notifications);
  return (
    <div
      className={GroupChatsStyles["group-chat"]}
      onClick={() => {
        props.openGroupChat(props.chat.id);
      }}
    >
      <img src="./group-chat-icon.svg" />
      {nameBeingEdited ? (
        <input
          value={inputName}
          type="text"
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              if (inputName.trim() !== props.chat.name) {
                props.changeGroupName(props.chat.id, inputName.trim());
                setNameBeingEdited(false);
              } else {
                setNameBeingEdited(false);
              }
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setInputName(e.target.value)}
        />
      ) : (
        <p>{props.chat.name}</p>
      )}
      <img
        src="./edit-icon.svg"
        onClick={(e) => {
          e.stopPropagation();
          setInputName(props.chat.name);
          setNameBeingEdited((nameBeingEdited) => !nameBeingEdited);
        }}
      />
      {notifications.groupChats.find(
        (groupChatNotification) =>
          groupChatNotification.groupChatId === props.chat.id
      ) ? (
        <span className={GroupChatsStyles["notification-button"]}>
          {
            notifications.groupChats.find(
              (groupChatNotification) =>
                groupChatNotification.groupChatId === props.chat.id
            ).numOfMessages
          }
        </span>
      ) : null}
    </div>
  );
}

SidebarChatCard.propTypes = {
  chat: PropTypes.object,
  openGroupChat: PropTypes.func,
  changeGroupName: PropTypes.func,
};

// the group chat component
function GroupChat() {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { userId } = useContext(SocketContext);
  const { openedChat: chat } = useContext(GroupChatsContext);

  const userRole =
    chat.ownerId === userId
      ? "owner"
      : chat.admins.length !== 0
      ? "admin"
      : "member";

  return (
    <div className={`${GroupChatsStyles["main-display"]}`}>
      <div
        className={GroupChatsStyles["group-profile-bar"]}
        onClick={() => setDashboardOpen(true)}
      >
        <img src="./group-chat-icon.svg" />
        <h1>{chat.name}</h1>
      </div>
      {dashboardOpen ? (
        <Dashboard setDashboardOpen={setDashboardOpen} userRole={userRole} />
      ) : (
        <GroupChatDisplay userRole={userRole} />
      )}
    </div>
  );
}

GroupChat.propTypes = {
  chat: PropTypes.object,
};

function Dashboard(props) {
  const {
    openedChat: chat,
    chats,
    setChats,
    setOpenedChat,
    token,
    changeGroupName,
  } = useContext(GroupChatsContext);
  const [groupName, setGroupName] = useState(chat.name);
  const [users, setUsers] = useState(null);
  const [groupOwner, setGroupOwner] = useState(null);
  const [groupAdmins, setGroupAdmins] = useState(null);
  const [groupMembers, setGroupMembers] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { userId } = useContext(SocketContext);
  const navigate = useNavigate();

  // getting the members of the group
  useEffect(() => {
    if (!(groupMembers && groupAdmins && groupOwner)) {
      fetch(`${serverUrl}/user/groupChat/members?groupId=${chat.id}`, {
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
        .then(({ members, admins, owner }) => {
          setGroupOwner(owner);
          setGroupAdmins(admins);
          setGroupMembers(members);
          setLoadingStatus(false);
        });
    }
  }, [groupOwner, groupAdmins, groupMembers]);

  // deleting the group
  async function deleteGroup() {
    const isConfirmed = confirm(
      "Are You Sure You Wanna Delete This Group,This can't be undone"
    );
    if (isConfirmed) {
      const newChats = chats.filter((chatObject) => chatObject.id !== chat.id);
      setChats(newChats);
      setOpenedChat(null);
      const response = await fetch(`${serverUrl}/user/groupChat`, {
        method: "DELETE",
        body: JSON.stringify({
          groupId: chat.id,
        }),
        headers: {
          auth: token,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 204) {
        return;
      } else {
        navigate("/serverError");
      }
    }
  }

  // function getting the users for adding them
  async function getUsers() {
    setUsers(undefined);
    const response = await fetch(
      `${serverUrl}/user/groupChat/addUsers?groupId=${chat.id}`,
      {
        method: "GET",
        headers: {
          auth: token,
        },
      }
    );
    if (response.status === 200) {
      const { users } = await response.json();
      setUsers(users);
    } else {
      navigate("/serverError");
    }
  }

  // function to handle the adding of users
  async function handleAddUsers() {
    setLoadingStatus(true);
    const checkboxes = document.querySelectorAll(".add-user-checkbox");
    const usersToAdd = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        usersToAdd.push(checkbox.value);
      }
    });

    if (usersToAdd.length === 0) {
      setUsers(null);
      setLoadingStatus(false);
      return;
    }

    const response = await fetch(`${serverUrl}/user/groupChat/members`, {
      method: "PUT",
      body: JSON.stringify({
        usersToAdd: usersToAdd,
        groupId: chat.id,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      setUsers(null);
      setGroupMembers(null);
    } else {
      navigate("/serverError");
    }
  }

  // function to make a user admin
  async function makeAdmin(user) {
    const newAdmins = JSON.parse(JSON.stringify(groupAdmins));
    newAdmins.unshift(user);
    const newMembers = groupMembers.filter((member) => member.id !== user.id);
    setGroupMembers(newMembers);
    setGroupAdmins(newAdmins);
    const response = await fetch(`${serverUrl}/user/groupChat/members/admins`, {
      method: "PUT",
      body: JSON.stringify({
        userId: user.id,
        groupId: chat.id,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  // function to suspend a admin
  async function suspendAdmin(user) {
    const newMembers = JSON.parse(JSON.stringify(groupMembers));
    newMembers.unshift(user);
    const newAdmins = groupAdmins.filter((admin) => admin.id !== user.id);
    setGroupMembers(newMembers);
    setGroupAdmins(newAdmins);
    const response = await fetch(`${serverUrl}/user/groupChat/members/admins`, {
      method: "DELETE",
      body: JSON.stringify({
        userId: user.id,
        groupId: chat.id,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 204) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  // function to kick out a member of the group
  async function kickOutUser(user) {
    const newMembers = groupMembers.filter((member) => member.id !== user.id);
    const newAdmins = groupAdmins.filter((admin) => admin.id !== user.id);
    setGroupAdmins(newAdmins);
    setGroupMembers(newMembers);
    const response = await fetch(`${serverUrl}/user/groupChat/members`, {
      method: "DELETE",
      body: JSON.stringify({
        userId: user.id,
        groupId: chat.id,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 204) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div className={GroupChatsStyles["dashboard"]}>
      {!loadingStatus ? (
        <>
          <img
            value={groupName}
            src="./close-icon.svg"
            onClick={() => props.setDashboardOpen(false)}
            className={GroupChatsStyles["close-icon"]}
          />
          {props.userRole !== "member" ? (
            <div className={GroupChatsStyles["edit-group-name"]}>
              <label>
                Name
                <input
                  value={groupName}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      changeGroupName(chat.id, groupName);
                    }
                  }}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                  }}
                />
              </label>
              <button
                onClick={() => {
                  changeGroupName(chat.id, groupName);
                }}
              >
                <img src="./plain-tick-icon.svg" />
                edit
              </button>
            </div>
          ) : (
            <h2>{chat.name}</h2>
          )}
          <div className={GroupChatsStyles["delete-group"]}>
            <button onClick={deleteGroup}>
              <img src="./delete-icon.svg" />
              delete group
            </button>
          </div>
          {users === null ? (
            <button
              onClick={getUsers}
              className={GroupChatsStyles["add-users-btn"]}
            >
              <img src="./plus-icon.svg" /> users
            </button>
          ) : (
            <div className={GroupChatsStyles["add-users"]}>
              {users === undefined ? (
                <Loading />
              ) : (
                <>
                  <div className={GroupChatsStyles["buttons"]}>
                    <button onClick={() => setUsers(null)}>cancel</button>
                    <button onClick={() => handleAddUsers()}>add</button>
                  </div>
                  {users.map((user) => {
                    return (
                      <div className={GroupChatsStyles["user"]} key={user.id}>
                        <img src={user.profile.image} />
                        <p>{user.username}</p>
                        <input
                          type="checkbox"
                          value={user.id}
                          className="add-user-checkbox"
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
          <h2>Owner</h2>
          <div className={GroupChatsStyles["owner"]}>
            <img src={groupOwner.profile.image} />
            <p>{groupOwner.id === userId ? "you" : groupOwner.username}</p>
          </div>
          <h2>Admins</h2>
          {groupAdmins.map((admin) => {
            return (
              <div
                className={`${GroupChatsStyles["admin"]} ${
                  props.userRole !== "member"
                    ? GroupChatsStyles["extended"]
                    : ""
                }`}
                key={admin.id}
              >
                <img src={admin.profile.image} />
                <p>{admin.id === userId ? "you" : admin.username}</p>

                {props.userRole === "admin" || props.userRole === "owner" ? (
                  <div className={GroupChatsStyles["buttons"]}>
                    <button
                      onClick={() => {
                        suspendAdmin(admin);
                      }}
                    >
                      suspend as admin
                    </button>
                    <button
                      onClick={() => {
                        kickOutUser(admin);
                      }}
                    >
                      kick out
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          <h2>Members</h2>
          {groupMembers.map((member) => {
            return (
              <div
                className={`${GroupChatsStyles["member"]} ${
                  props.userRole !== "member"
                    ? GroupChatsStyles["extended"]
                    : ""
                }`}
                key={member.id}
              >
                <img src={member.profile.image} />
                <p>{member.id === userId ? "you" : member.username}</p>
                {props.userRole === "owner" || props.userRole === "admin" ? (
                  <div className={GroupChatsStyles["buttons"]}>
                    <button
                      onClick={() => {
                        makeAdmin(member);
                      }}
                    >
                      make admin
                    </button>
                    <button
                      onClick={() => {
                        kickOutUser(member);
                      }}
                    >
                      kick out
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      ) : null}
    </div>
  );
}

Dashboard.propTypes = {
  setDashboardOpen: PropTypes.func,
  userRole: PropTypes.string,
};

// main chat display for the messages
function GroupChatDisplay(props) {
  const { userId, username, socket } = useContext(SocketContext);
  const {
    openedChat: chat,
    setOpenedChat: setChat,
    token,
  } = useContext(GroupChatsContext);
  const navigate = useNavigate();
  const messageInput = useRef(null);

  useEffect(() => {
    socket.on(
      "receive-group-message",
      (message, sentUserId, username, userRole) => {
        const newChat = JSON.parse(JSON.stringify(chat));
        const date = new Date();
        const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
        const messageObject = {
          text: message,
          user: { id: sentUserId, username: username },
          time: dateString,
          userRole: userRole,
        };
        newChat.messages.push(messageObject);
        setChat(newChat);
      }
    );
    return () => {
      socket.off("receive-group-message");
    };
  }, [chat, socket, setChat]);

  useEffect(() => {
    scrollToLastMessage();
  }, []);

  // handling the sending of messages
  async function sendMessage() {
    const message = messageInput.current.value.trim();
    if (message === "") {
      return;
    }
    const newChat = JSON.parse(JSON.stringify(chat));
    const date = new Date();
    const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    const messageObject = {
      text: message,
      user: { id: userId, username: username },
      time: dateString,
      userRole: props.userRole,
    };
    newChat.messages.push(messageObject);
    setChat(newChat);
    messageInput.current.value = "";
    scrollToLastMessage();
    // sending the receive message event to the socket
    socket.emit(
      "send-group-message",
      message,
      `group-${chat.id}`,
      chat.id,
      props.userRole
    );
  }

  // function to scroll the most recent message
  function scrollToLastMessage() {
    const messages = document.querySelector(`.${GroupChatsStyles["messages"]}`);
    messages.scrollTop = messages.scrollHeight;
  }

  console.log("user id", userId);
  console.log("messages", chat.messages);

  return (
    <div className={GroupChatsStyles["group-chat-display"]}>
      <div className={GroupChatsStyles["messages"]}>
        {chat.messages.map((message, index) => {
          return (
            <div
              className={`${GroupChatsStyles["message"]} ${
                message.user.id === userId
                  ? GroupChatsStyles["client-message"]
                  : ""
              } ${
                index > 0
                  ? chat.messages[index - 1].user.id !== message.user.id
                    ? GroupChatsStyles["cluster-end"]
                    : ""
                  : ""
              }`}
              key={index}
            >
              {index !== 0 ? (
                chat.messages[index - 1].user.id === message.user.id ? (
                  <p></p>
                ) : (
                  <p>
                    {message.user.id === userId ? "you" : message.user.username}
                    <span>
                      (
                      {!message.userRole
                        ? message.user.createdGroupChats.length !== 0
                          ? "owner"
                          : message.user.adminRoledGroupChats.length !== 0
                          ? "admin"
                          : "member"
                        : message.userRole}
                      )
                    </span>
                  </p>
                )
              ) : (
                <p>
                  {message.user.id === userId ? "you" : message.user.username}
                  <span>
                    (
                    {!message.userRole
                      ? message.user.createdGroupChats.length !== 0
                        ? "owner"
                        : message.user.adminRoledGroupChats.length !== 0
                        ? "admin"
                        : "member"
                      : message.userRole}
                    )
                  </span>
                </p>
              )}
              <p>{message.text}</p>
              <p>{message.time}</p>
            </div>
          );
        })}
      </div>
      <div
        className={GroupChatsStyles["scroll-to-last"]}
        onClick={scrollToLastMessage}
      >
        <img src="./close-arrow.svg" />
      </div>
      <div className={GroupChatsStyles["send-message"]}>
        <input
          type="text"
          ref={messageInput}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <img src="./send-message-icon.svg" onClick={sendMessage} />
      </div>
    </div>
  );
}

GroupChatDisplay.propTypes = {
  userRole: PropTypes.string,
};
