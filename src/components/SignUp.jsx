import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { serverUrl } from "../config.js";
import Loading from "./Loading.jsx";
import SignUpStyles from "../css-modules/SignUp.module.css";

export default function SignUp() {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const navigate = useNavigate();
  const firstName = useRef(null);
  const lastName = useRef(null);
  const username = useRef(null);
  const password = useRef(null);
  const confirmPassword = useRef(null);
  async function handleSignUp(e) {
    e.preventDefault();
    if (firstName.current.value.trim() === "") {
      firstName.current.setCustomValidity("first name cannot be empty");
      firstName.current.reportValidity();
      return;
    }
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
    if (
      confirmPassword.current.value.trim() !== password.current.value.trim()
    ) {
      confirmPassword.current.setCustomValidity(
        "password and confirm password fields are not matching"
      );
      confirmPassword.current.reportValidity();
      return;
    }
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/sign-up`, {
      method: "POST",
      body: JSON.stringify({
        firstName: firstName.current.value.trim(),
        lastName: lastName.current.value.trim(),
        username: username.current.value.trim(),
        password: password.current.value.trim(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      const { token } = await response.json();
      localStorage.setItem("token", token);
      navigate("/");
    } else if (response.status === 409) {
      setLoadingStatus(false);
      username.current.setCustomValidity(
        "username already exists please login or use another username"
      );
      username.current.reportValidity();
    } else {
      navigate("/serverError");
    }
  }
  return (
    <div className={SignUpStyles["sign-up"]}>
      <h1>Welcome to Odin Messenger</h1>
      <div>
        <main>
          <h2>Sign up</h2>
          <form>
            <label>
              First Name: <br />
              <input
                ref={firstName}
                onChange={(e) => e.target.setCustomValidity("")}
              />
            </label>
            <label>
              Last Name: <br />
              <input ref={lastName} />
            </label>
            <label>
              Username: <br />
              <input
                ref={username}
                onChange={(e) => e.target.setCustomValidity("")}
              />
            </label>
            <label>
              Password: <br />
              <input
                ref={password}
                onChange={(e) => e.target.setCustomValidity("")}
                type="password"
              />
            </label>
            <label>
              Confirm Password: <br />
              <input
                ref={confirmPassword}
                onChange={(e) => e.target.setCustomValidity("")}
                type="password"
              />
            </label>
            {loadingStatus ? (
              <Loading />
            ) : (
              <button onClick={handleSignUp}>Sign Up</button>
            )}
          </form>
          <p>
            already have a account?<Link to="/login">login</Link>
          </p>
        </main>
        <div className={SignUpStyles["preview-img"]}>
          <img src="./app-preview-img.jpeg" />
        </div>
      </div>
    </div>
  );
}
