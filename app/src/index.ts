// import './console';
import React from "react";
import "./js/setup.ts";
import "./assets/fontawesome/css/all.css";
import "./fonts.css";
import "./style.css";
import "./js/components/App.tsx";

declare global {
  interface Window {
    React: typeof React;
  }
}

window.React = React;
