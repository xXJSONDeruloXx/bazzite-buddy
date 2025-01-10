import { definePlugin } from "decky-frontend-lib";
import React from "react";
import { FaGlobe } from "react-icons/fa"; // Example icon

function Content() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <iframe
        src="https://github.com/ublue-os/bazzite/releases/" // Replace with your desired URL
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
  return {
    name: "WebPage Viewer",
    title: <div>WebPage Viewer</div>, // Title shown in Decky
    icon: <FaGlobe />,                // Icon for the plugin
    content: <Content />,
    onDismount() {},
  };
});