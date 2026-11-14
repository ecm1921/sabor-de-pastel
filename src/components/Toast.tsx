import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const ContextoToast = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const mostrar = useCallback((msg: string) => {
    setMensagem(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMensagem(""), 2600);
  }, []);
  return (
    <ContextoToast.Provider value={mostrar}>
      {children}
      <div role="status" aria-live="polite">
        {mensagem && <div className="toast">{mensagem}</div>}
      </div>
    </ContextoToast.Provider>
  );
}

export const useToast = () => useContext(ContextoToast);
