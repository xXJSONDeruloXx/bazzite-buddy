import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Navigation,
  staticClasses
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  callable,
  definePlugin,
  toaster,
  // routerHook
} from "@decky/api"
import { useState } from "react";
import { FaShip } from "react-icons/fa";

// import logo from "../assets/logo.png";

// This function calls the python function "add", which takes in two numbers and returns their sum (as a number)
// Note the type annotations:
//  the first one: [first: number, second: number] is for the arguments
//  the second one: number is for the return value
const add = callable<[first: number, second: number], number>("add");

// This function calls the python function "start_timer", which takes in no arguments and returns nothing.
// It starts a (python) timer which eventually emits the event 'timer_event'
const startTimer = callable<[], void>("start_timer");

function Content() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <iframe
        src="https://example.com" // Replace with your desired URL
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="WebPage Viewer"
      ></iframe>
    </div>
  );
}

export default definePlugin(() => {
  console.log("WebPage Viewer plugin initializing");

  return {
    name: "WebPage Viewer",
    titleView: <div className={staticClasses.Title}>WebPage Viewer</div>,
    content: <Content />,
    icon: <FaShip />,
    onDismount() {
      console.log("WebPage Viewer plugin unloaded");
    },
  };
});
