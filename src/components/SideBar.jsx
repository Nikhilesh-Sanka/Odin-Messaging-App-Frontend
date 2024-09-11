import { Link } from "react-router-dom";
import SideBarStyles from "../css-modules/SideBar.module.css";

export default function SideBar() {
  return (
    <nav className={SideBarStyles["nav-bar"]}>
      <Link to="/profile">
        <img src="./sidebar-profile-icon.svg" title="profile" />
      </Link>
      <Link to="/chats">
        <img src="./sidebar-chat-icon.svg" title="chats" />
      </Link>
      <Link to="/requests">
        <img src="./sidebar-request-icon.svg" title="requests" />
      </Link>
      <Link to="/searchPeople">
        <img src="./sidebar-search-icon.svg" title="search-people" />
      </Link>
      <Link to="/logout">
        <img src="./sidebar-logout-icon.svg" title="logout" />
      </Link>
    </nav>
  );
}
