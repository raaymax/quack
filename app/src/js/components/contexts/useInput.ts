import { useContext } from "react";
import { InputContext, InputContextType } from "./input.tsx";

export const useInput = (): InputContextType => {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error("useInput must be used within a InputContext");
  }
  return context;
};
