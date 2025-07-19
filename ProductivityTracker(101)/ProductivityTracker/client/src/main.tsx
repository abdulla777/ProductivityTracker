import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import i18n before rendering the app
import "./i18n/i18n";

// Create root and render the App component
createRoot(document.getElementById("root")!).render(<App />);
