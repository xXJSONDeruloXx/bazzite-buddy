import React, { useEffect, useRef, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import { definePlugin } from "decky-frontend-lib";
import { marked } from "marked";
import DOMPurify from "dompurify";

function Content() {
  const [changelog, setChangelog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const changelogRef = useRef<HTMLDivElement | null>(null); // Reference to changelog div

  const fetchChangelog = async (signal?: AbortSignal) => {
    const url =
      "https://api.github.com/repos/ublue-os/bazzite/releases/tags/41.20250106.2";
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setChangelog(data.body);
      setError(null); // Clear previous errors
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching the changelog.";
      setError(errorMessage);
    }
  };

  const handleGamepadScroll = (event: KeyboardEvent) => {
    if (!changelogRef.current) return;

    if (event.key === "ArrowDown") {
      changelogRef.current.scrollBy({ top: 50, behavior: "smooth" });
    } else if (event.key === "ArrowUp") {
      changelogRef.current.scrollBy({ top: -50, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchChangelog(controller.signal);

    // Attach gamepad scroll listeners
    window.addEventListener("keydown", handleGamepadScroll);

    return () => {
      controller.abort(); // Cleanup on unmount
      window.removeEventListener("keydown", handleGamepadScroll);
    };
  }, []);

  const refreshChangelog = async () => {
    setIsRefreshing(true); // Start refresh animation or feedback
    setChangelog(null); // Clear existing changelog to show loading
    setError(null); // Clear any errors

    try {
      await fetchChangelog();
    } finally {
      setIsRefreshing(false); // End refresh animation
    }
  };

  return (
    <div
      style={{
        padding: "10px",
        width: "100%",
        maxWidth: "800px", // Limit the width
        margin: "0 auto", // Center the container
        height: "100%",
        overflowY: "auto",
        backgroundColor: "#121212",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        wordWrap: "break-word", // Break long words
        overflowX: "hidden", // Prevent horizontal scrolling
      }}
    >
      <h2>Bazzite Release Notes</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#0078D7",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
          onClick={() =>
            window.open(
              "https://github.com/ublue-os/bazzite/releases",
              "_blank"
            )
          }
          tabIndex={0} // Makes it focusable for gamepad
        >
          View All Release Notes
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: isRefreshing ? "#CCCCCC" : "#28A745",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            cursor: isRefreshing ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
          onClick={refreshChangelog}
          disabled={isRefreshing} // Disable while refreshing
          tabIndex={0} // Makes it focusable for gamepad
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error ? (
        <p style={{ color: "red" }} aria-live="polite">
          {error}
        </p>
      ) : changelog ? (
        <div
          ref={changelogRef} // Attach ref for scrolling
          style={{
            backgroundColor: "#1e1e1e",
            padding: "10px",
            borderRadius: "5px",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            maxHeight: "300px", // Prevent overflow
            overflowY: "auto", // Enable scrolling
            wordWrap: "break-word", // Prevent long text from overflowing
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