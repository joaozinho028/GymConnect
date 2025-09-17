import useColorMode from "@/hooks/useColorMode";
import { ReactNode, createContext, useContext } from "react";

interface IColorProps {
  children: ReactNode;
}

interface IColorProviderData {
  colorMode: any;
  setColorMode: any;
}

type Color = "dark" | "light";

const ColorContext = createContext({} as IColorProviderData);

export const ColorProvider = ({ children }: IColorProps) => {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <ColorContext.Provider
      value={{
        colorMode,
        setColorMode,
      }}
    >
      {children}
    </ColorContext.Provider>
  );
};

export const useColorContext = () => {
  return useContext(ColorContext);
};
