"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface IsMobileContextType {
  isMobile: boolean;
}

const IsMobileContext = createContext<IsMobileContextType>({ isMobile: false });

export function useIsMobile() {
  return useContext(IsMobileContext);
}

interface ProviderProps {
  children: ReactNode;
}

export function IsMobileProvider({ children }: ProviderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640); // breakpoint sm do tailwind
    }

    handleResize(); // verificar ao montar

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <IsMobileContext.Provider value={{ isMobile }}>
      {children}
    </IsMobileContext.Provider>
  );
}
