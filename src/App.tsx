import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { LoginPage } from "./auth/LoginPage";
import { NovaSenhaPage } from "./auth/NovaSenhaPage";
import { ToastProvider } from "./components/Toast";
import { AtendenteLayout } from "./features/atendente/AtendenteLayout";
import { CardapioPage } from "./features/cliente/CardapioPage";
import { AcompanharPage } from "./features/cliente/AcompanharPage";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<CardapioPage />} />
            <Route path="/pedido/:id" element={<AcompanharPage />} />
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
