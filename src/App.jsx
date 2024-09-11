import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import SideBar from "./components/SideBar.jsx";
import { serverUrl } from "./config.js";

function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (token) {
      fetch(`${serverUrl}/user/status/online`, {
        method: "PUT",
        headers: {
          auth: token,
        },
      }).then((response) => {
        if (response.status === 201) {
          return;
        } else if (response.status === 409) {
          return;
        } else {
          navigate("/serverError");
        }
      });

      window.onbeforeunload = async () => {
        await fetch(`${serverUrl}/user/status/offline`, {
          method: "PUT",
          headers: {
            auth: token,
          },
        });
        return undefined;
      };

      return () => {
        fetch(`${serverUrl}/user/status/offline`, {
          method: "PUT",
          headers: {
            auth: token,
          },
        });
      };
    }
  }, []);
  return (
    <>
      {token ? (
        <>
          <SideBar />
          <main>
            <Outlet context={{ token }} />
          </main>
        </>
      ) : (
        <Navigate to="/login" />
      )}
    </>
  );
}

export default App;
