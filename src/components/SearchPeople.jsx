import { useState, useRef, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import SearchPeopleStyles from "../css-modules/SearchPeople.module.css";

export default function SearchPeople() {
  const [searchResults, setSearchResults] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { token } = useOutletContext();
  const navigate = useNavigate();
  const search = useRef(null);

  //adding the necessary event listeners to the search bar
  useEffect(() => {
    function keyPressEventListener(e) {
      if (e.keyCode === 13) {
        handleSearch();
      }
    }
    search.current.addEventListener("keypress", keyPressEventListener);
  }, []);

  // handling the search
  async function handleSearch() {
    const searchQuery = search.current.value.trim();
    if (searchQuery === "") {
      setSearchResults(null);
      return;
    }
    setLoadingStatus(true);
    const response = await fetch(
      `${serverUrl}/user/searchPeople?searchQuery=${searchQuery}`,
      {
        method: "GET",
        headers: {
          auth: token,
        },
      }
    );
    if (response.status === 200) {
      const searchResults = await response.json();
      console.log(searchResults);
      setSearchResults(searchResults);
      setLoadingStatus(false);
    } else {
      navigate("/serverError");
    }
  }

  // handling friend requests
  async function sendFriendRequest(friendId) {
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "POST",
      body: JSON.stringify({
        friendId: friendId,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      setSearchResults(null);
      setLoadingStatus(false);
      search.current.value = "";
    } else {
      navigate("/serverError");
    }
  }

  // browsing people
  async function handleBrowsePeople() {
    setLoadingStatus(true);
    const response = await fetch(
      `${serverUrl}/user/searchPeople/browsePeople`,
      {
        method: "GET",
        headers: {
          auth: token,
        },
      }
    );
    if (response.status === 200) {
      const users = await response.json();
      setSearchResults(users);
      setLoadingStatus(false);
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div className={SearchPeopleStyles["search-people"]}>
      <h1>Find People</h1>
      <label>
        <input ref={search} />
        <img
          src="./sidebar-search-icon.svg"
          width="20px"
          onClick={handleSearch}
        />
      </label>
      {loadingStatus ? (
        <Loading />
      ) : searchResults ? (
        <>
          {searchResults.map((user) => {
            return (
              <div
                className={SearchPeopleStyles["search-result-card"]}
                key={user.id}
              >
                <img src={user.profile.image} />
                <p>
                  {user.username}({user.profile.relationshipStatus})
                </p>
                <div className={SearchPeopleStyles["buttons"]}>
                  {user.sentRequests.length === 0 ? (
                    user.receivedRequests.length === 0 ? (
                      <button
                        onClick={() => {
                          sendFriendRequest(user.id);
                        }}
                      >
                        send friend request
                      </button>
                    ) : (
                      "you have already sent a friend request to this user"
                    )
                  ) : (
                    "The user has sent a friend request to you"
                  )}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <a
          className={SearchPeopleStyles["browse-people"]}
          onClick={handleBrowsePeople}
        >
          Browse People
        </a>
      )}
    </div>
  );
}
