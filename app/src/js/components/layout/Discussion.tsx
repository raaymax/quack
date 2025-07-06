import { lazy } from "react";
import { isMobile } from "../../utils";

const Mobile = lazy(async () => {
  console.log("Loading Mobile Discussion component");
  const { Discussion } = await import("./Mobile");
  console.log("Mobile Discussion loaded");
  return { default: Discussion };
});
const Desktop = lazy(async () => {
  console.log("Loading Desktop Discussion component");
  const { Discussion } = await import("./Desktop");
  console.log("Desktop Discussion loaded");
  return { default: Discussion };
});

export const Discussion = ({ children }: { children?: React.ReactNode }) => {
  console.log("Rendering Discussion component");
  return (
    isMobile() ? <Mobile>{children}</Mobile> : <Desktop>{children}</Desktop>
  );
};
