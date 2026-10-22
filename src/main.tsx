import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import LoginPage from "./pages/LoginPage.tsx";

const router = createBrowserRouter([
  { path: "*", element: <App /> },
  { path: "/login", element: <LoginPage></LoginPage> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
