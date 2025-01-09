import { definePlugin } from "decky-frontend-lib";
import React from "react";

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
  return {
    name: "WebPage Viewer",
    content: <Content />,
    onDismount() {},
  };
});