import { useContext } from "react";
import { SizeContext } from "./size.tsx";

export const useSize = (size?: number) => {
  const ctx = useContext(SizeContext);
  return size ?? ctx;
};
