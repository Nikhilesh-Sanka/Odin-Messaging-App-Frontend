import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import SignUp from "./components/SignUp.jsx";
import Login from "./components/Login.jsx";
import Profile from "./components/Profile.jsx";
import SearchPeople from "./components/SearchPeople.jsx";
import Requests from "./components/Requests.jsx";
import Chats from "./components/Chats.jsx";
import Logout from "./components/Logout.jsx";
import ServerError from "./components/ServerError.jsx";
import UnknownError from "./components/UnknownError.jsx";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <UnknownError />,
    children: [
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/searchPeople",
        element: <SearchPeople />,
      },
      {
        path: "/requests",
        element: <Requests />,
      },
      {
        path: "/chats",
        element: <Chats />,
      },
    ],
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "logout",
    element: <Logout />,
  },
  {
    path: "/serverError",
    element: <ServerError />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
