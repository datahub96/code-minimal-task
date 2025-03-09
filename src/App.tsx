import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import LoginPage from "./components/auth/LoginPage";
import AuthGuard from "./components/auth/AuthGuard";
import { Toaster } from "@/components/ui/toaster";
import { StorageErrorHandler } from "@/components/ui/toast-error-handler";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthGuard>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        <Toaster />
        <StorageErrorHandler />
      </AuthGuard>
    </Suspense>
  );
}

export default App;
