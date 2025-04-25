// import './console';
import React from "react";
import "./assets/fontawesome/css/all.css";
import "./fonts.css";
import "./style.css";

declare global {
  interface Window {
    React: typeof React;
  }
  type client = true;
}
import "./js/setup.ts";
import "./js/components/App.tsx";

window.React = React;
