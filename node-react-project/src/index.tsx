import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx"; // Import the main app component
import { CssBaseline } from "@mui/material"; // To ensure consistent styling with MUI

const rootElement = document.getElementById("root") as HTMLElement;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>
);
