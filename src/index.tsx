import { definePlugin } from "decky-frontend-lib";
import React, { useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";

function Content() {
  const [changelog, setChangelog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url =
      "https://api.github.com/repos/ublue-os/bazzite/releases/tags/41.20250106.2";
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchChangelog = async () => {
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
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching the changelog.";
        setError(errorMessage);
      }
    };

    fetchChangelog();

    return () => {
      controller.abort(); // Cleanup on unmount
    };
  }, []);

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
        onClick={() => window.open("https://github.com/ublue-os/bazzite/releases", "_blank")}
      >
        View All Release Notes
      </button>
      {error ? (
        <p style={{ color: "red" }} aria-live="polite">
          {error}
        </p>
      ) : changelog ? (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {changelog}
        </pre>
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