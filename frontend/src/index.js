import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const App = process.env.REACT_APP_PUBLIC_DEMO === "true"
  ? require("./PublicDemo").default
  : require("./App").default;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
