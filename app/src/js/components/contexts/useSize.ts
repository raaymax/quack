import { useContext } from "react";
import { SizeContext } from "./size";

export const useSize = (size?: number) => {
  const ctx = useContext(SizeContext);
  return size ?? ctx;
};
