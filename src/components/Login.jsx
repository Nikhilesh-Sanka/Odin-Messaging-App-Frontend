import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import LoginStyles from "../css-modules/Login.module.css";

export default function Login() {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const navigate = useNavigate();
  const username = useRef(null);
  const password = useRef(null);
  async function handleLogin(e) {
    e.preventDefault();
    if (username.current.value.trim() === "") {
      username.current.setCustomValidity("username cannot be empty");
      username.current.reportValidity();
      return;
    }
    if (password.current.value.trim() === "") {
      password.current.setCustomValidity("password cannot be empty");
      password.current.reportValidity();
      return;
    }
    setLoadingStatus(true);
    const response = await fetch(
      `${serverUrl}/login?username=${username.current.value.trim()}&password=${password.current.value.trim()}`,
      {
        method: "GET",
      }
    );
    if (response.status === 200) {
      const { token } = await response.json();
      localStorage.setItem("token", token);
      navigate("/");
    } else if (response.status === 404) {
      username.current.setCustomValidity("username does not exists");
      username.current.reportValidity();
    } else if (response.status === 403) {
      password.current.setCustomValidity("password is incorrect");
      password.current.reportValidity();
    } else {
      navigate("/serverError");
    }
    setLoadingStatus(false);
  }
  return (
    <div className={LoginStyles["login"]}>
      <h1>Odin Messenger </h1>
      <h2>Welcome Back , Please Login !</h2>
      <form>
        <label>
          Username: <br />
          <input
            ref={username}
            onChange={(e) => {
              e.target.setCustomValidity("");
            }}
          />
        </label>
        <label>
          Password: <br />
          <input
            type="password"
            ref={password}
            onChange={(e) => {
              e.target.setCustomValidity("");
            }}
          />
        </label>
        {loadingStatus ? (
          <Loading />
        ) : (
          <button onClick={handleLogin}>login</button>
        )}
        <p>
          don&apos;t have a account? <Link to="/sign-up">sign-up</Link>
        </p>
        <p>login with demo account 1</p>
        <p>login with demo account 2</p>
      </form>
    </div>
  );
}
