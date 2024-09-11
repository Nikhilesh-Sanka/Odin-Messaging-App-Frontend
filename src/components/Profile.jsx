import { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import Loading from "./Loading.jsx";
import ProfileStyles from "../css-modules/Profile.module.css";
import { serverUrl } from "../config.js";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [fieldValues, setFieldValues] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { token } = useOutletContext();
  const navigate = useNavigate();
  const username = useRef(null);
  useEffect(() => {
    if (!profile) {
      fetch(`${serverUrl}/user/profile`, {
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
        .then((profile) => {
          setProfile(profile);
          setFieldValues(profile);
        });
    }
  }, [profile]);
  async function handleEditProfile(e) {
    e.preventDefault();
    if (fieldValues.username.trim() === "") {
      username.current.setCustomValidity("username cannot be empty");
      username.current.reportValidity();
      return;
    }
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/profile`, {
      method: "PUT",
      body: JSON.stringify({
        username: fieldValues.username.trim(),
        bio: fieldValues.bio.trim(),
        relationshipStatus: fieldValues.relationshipStatus,
      }),
      headers: {
        "Content-Type": "application/json",
        auth: token,
      },
    });
    if (response.status === 201) {
      setProfile(null);
    } else if (response.status === 409) {
      username.current.setCustomValidity("username already exists");
      username.current.reportValidity();
    } else {
      navigate("/serverError");
    }
    setLoadingStatus(false);
  }
  return (
    <div className={ProfileStyles["profile"]}>
      {!profile ? (
        <Loading />
      ) : (
        <>
          <h1>My Profile</h1>
          <form>
            <img src={profile.image} />
            <label>
              Username: <br />
              <input
                value={fieldValues["username"]}
                onChange={(e) => {
                  e.target.setCustomValidity("");
                  setFieldValues({
                    ...fieldValues,
                    username: e.target.value,
                  });
                }}
                ref={username}
              />
            </label>
            <label>
              Relationship Status: <br />
              <select
                defaultValue={profile.relationshipStatus}
                onChange={(e) => {
                  setFieldValues({
                    ...fieldValues,
                    relationshipStatus: e.target.value,
                  });
                }}
              >
                <option value="single">single</option>
                <option value="not-single">not single</option>
              </select>
            </label>
            <label>
              Bio: <br />
              <textarea
                value={fieldValues["bio"]}
                onChange={(e) => {
                  setFieldValues({ ...fieldValues, bio: e.target.value });
                }}
              ></textarea>
            </label>
            {loadingStatus ? (
              <Loading />
            ) : (
              <button onClick={handleEditProfile}>Edit Profile</button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
