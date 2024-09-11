import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { serverUrl } from "../config.js";
import Loading from "./Loading.jsx";
import RequestStyles from "../css-modules/Requests.module.css";

export default function Requests() {
  const [sentRequests, setSentRequests] = useState(null);
  const [receivedRequests, setReceivedRequests] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { token } = useOutletContext();
  const navigate = useNavigate();
  useEffect(() => {
    if (!sentRequests || !receivedRequests) {
      fetch(`${serverUrl}/user/request`, {
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
        .then((requests) => {
          setSentRequests(requests.sentRequests);
          setReceivedRequests(requests.receivedRequests);
          setLoadingStatus(false);
        });
    }
  }, [sentRequests, receivedRequests]);

  // cancelling a sent friend request
  async function cancelRequest(requestId) {
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "DELETE",
      body: JSON.stringify({
        requestId,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 202) {
      setSentRequests(null);
      setReceivedRequests(null);
    } else {
      navigate("/serverError");
    }
  }

  // rejecting a received friend request
  async function rejectRequest(requestId) {
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "DELETE",
      body: JSON.stringify({
        requestId,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 202) {
      setSentRequests(null);
      setReceivedRequests(null);
    } else {
      navigate("/serverError");
    }
  }

  // accepting a friend request
  async function acceptRequest(friendId, requestId) {
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/chats`, {
      method: "POST",
      body: JSON.stringify({
        requestId,
        friendId,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      setSentRequests(null);
      setReceivedRequests(null);
    } else {
      navigate("/serverError");
    }
  }
  return (
    <div className={RequestStyles["requests"]}>
      {loadingStatus ? (
        <Loading />
      ) : (
        <>
          <h1>Requests</h1>
          <section className={RequestStyles["received-requests"]}>
            <h2>Received Requests</h2>
            <hr />
            {receivedRequests.map((request) => {
              return (
                <div
                  className={RequestStyles["received-request-card"]}
                  key={request.id}
                >
                  <img src={request.sentUser.profile.image} />
                  <p>
                    {request.sentUser.username}(
                    {request.sentUser.profile.relationshipStatus})
                  </p>
                  <div className={RequestStyles["buttons"]}>
                    <button
                      onClick={() => {
                        acceptRequest(request.sentUser.id, request.id);
                      }}
                    >
                      accept friend request
                    </button>
                    <button
                      onClick={() => {
                        rejectRequest(request.id);
                      }}
                    >
                      reject friend request
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
          <section className={RequestStyles["sent-requests"]}>
            <h2>Sent Requests</h2>
            <hr />
            {sentRequests.map((request) => {
              return (
                <div
                  className={RequestStyles["sent-request-card"]}
                  key={request.id}
                >
                  <img src={request.receivedUser.profile.image} />
                  <p>
                    {request.receivedUser.username}(
                    {request.receivedUser.profile.relationshipStatus})
                  </p>
                  <button
                    onClick={() => {
                      cancelRequest(request.id);
                    }}
                  >
                    cancel request
                  </button>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
