import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { LoginPage } from "./auth/LoginPage";
import { NovaSenhaPage } from "./auth/NovaSenhaPage";
import { ToastProvider } from "./components/Toast";
import { AtendenteLayout } from "./features/atendente/AtendenteLayout";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<h1 className="conteudo">Sabor de Pastel</h1>} />
            <Route path="/atendente/login" element={<LoginPage />} />
            <Route path="/atendente/nova-senha" element={<NovaSenhaPage />} />
            <Route
              path="/atendente/*"
              element={
                <RequireAuth>
                  <AtendenteLayout />
                </RequireAuth>
              }
            />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
