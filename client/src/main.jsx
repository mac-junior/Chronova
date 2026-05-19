import React from "react";
import ReactDom from "react-dom/client";

import App from "./App";

import "./index.css";

import { AuthProvider } from "./context/AuthContext";

import { Toaster } from "react-hot-toast";

ReactDom.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </React.StrictMode>
);