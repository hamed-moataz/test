import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { MeetProvider } from "./context/MeetContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <MeetProvider>
      <App />
    </MeetProvider>
  </BrowserRouter>
);
