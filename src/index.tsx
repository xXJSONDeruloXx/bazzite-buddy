import { definePlugin } from "decky-frontend-lib";
import React, { useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import { marked } from "marked";
import DOMPurify from "dompurify";
import fs from "fs";

function Content() {
  const [version, setVersion] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch version from the JSON file
  const fetchVersion = () => {
    const filePath = "/usr/share/ublue-os/image-info.json";

    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf8");
        const json = JSON.parse(data);
        console.log("Version info:", json);
        setVersion(json.version || "unknown");
      } else {
        throw new Error("Version info file not found.");
      }
    } catch (err) {
      console.error("Error accessing version info:", err);
      setVersion("unknown");
    }
  };

  // Function to fetch changelog based on version
  const fetchChangelog = (version: string) => {
    const url = `https://api.github.com/repos/ublue-os/bazzite/releases/tags/${version}`;
    console.log("Fetching changelog from:", url);

    fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch changelog: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Changelog data:", data);
        setChangelog(data.body || "No changelog available.");
      })
      .catch((error) => {
        console.error("Error fetching changelog:", error);
        setError("Failed to fetch changelog.");
      });
  };

  useEffect(() => {
    fetchVersion(); // Fetch version when component mounts
  }, []);

  useEffect(() => {
    if (version && version !== "unknown") {
      fetchChangelog(version); // Fetch changelog after version is fetched
    }
  }, [version]);

  return (
    <div
      style={{
        padding: "10px",
        width: "100%",
        height: "100%",
        overflowY: "auto",
        backgroundColor: "#121212",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>Bazzite Release Notes</h2>
      <button
        style={{
          padding: "10px 20px",
          marginBottom: "15px",
          backgroundColor: "#0078D7",
          color: "#ffffff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
        onClick={() =>
          window.open("https://github.com/ublue-os/bazzite/releases", "_blank")
        }
      >
        View All Release Notes
      </button>
      {error ? (
        <p style={{ color: "red" }} aria-live="polite">
          {error}
        </p>
      ) : changelog ? (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            padding: "10px",
            borderRadius: "5px",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          <style>
            {`
              h1, h2, h3 {
                color: #61dafb;
                margin: 0 0 10px;
              }
              p {
                margin: 0 0 10px;
              }
              ul, ol {
                margin: 10px 0 10px 20px;
              }
              li {
                margin: 5px 0;
              }
              pre {
                background-color: #282c34;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                color: #dcdcdc;
              }
              a {
                color: #61dafb;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            `}
          </style>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked(changelog)),
            }}
          ></div>
        </div>
      ) : (
        <p aria-live="polite">Loading...</p>
      )}
    </div>
  );
}

export default definePlugin(() => {
  return {
    name: "Bazzite Changelog Viewer",
    title: <div>Bazzite Changelog</div>,
    icon: <FaClipboardList />,
    content: <Content />,
    onDismount() {},
  };
});