import { lazy } from "react";
import { isMobile } from "../../utils";

const Mobile = lazy(async () => {
  const { Discussion } = await import("./Mobile");
  return { default: Discussion };
});
const Desktop = lazy(async () => {
  const { Discussion } = await import("./Desktop");
  return { default: Discussion };
});

export const Discussion = ({ children }: { children?: React.ReactNode }) => {
  console.log("Rendering Discussion component");
  return (
    isMobile() ? <Mobile>{children}</Mobile> : <Desktop>{children}</Desktop>
  );
};
