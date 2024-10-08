import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationsContext } from "../App.jsx";
import SideBarStyles from "../css-modules/SideBar.module.css";

export default function SideBar() {
  const { notifications } = useContext(NotificationsContext);
  const navigate = useNavigate();

  return (
    <nav className={SideBarStyles["nav-bar"]}>
      <Link to="/profile">
        <img src="./sidebar-profile-icon.svg" title="profile" />
      </Link>
      <Link to="/chats">
        <img src="./sidebar-chat-icon.svg" title="chats" />
        {notifications.chats.length === 0 ? null : (
          <span className={SideBarStyles["notification-bubble"]}>
            {notifications.chats.length}
          </span>
        )}
      </Link>
      <Link to="/groupChats">
        <img src="./group-chat-icon.svg" />
        {notifications.groupChats.length === 0 ? null : (
          <span className={SideBarStyles["notification-bubble"]}>
            {notifications.groupChats.length}
          </span>
        )}
      </Link>
      <Link to="/requests">
        <img src="./sidebar-request-icon.svg" title="requests" />
      </Link>
      <Link to="/searchPeople">
        <img src="./sidebar-search-icon.svg" title="search-people" />
      </Link>
      <Link
        to="/logout"
        onClick={(e) => {
          e.preventDefault();
          const isConfirmed = confirm(
            "Are you sure you wanna logout from the app ?"
          );
          if (isConfirmed) {
            navigate("/logout");
          }
        }}
      >
        <img src="./sidebar-logout-icon.svg" title="logout" />
      </Link>
    </nav>
  );
}
