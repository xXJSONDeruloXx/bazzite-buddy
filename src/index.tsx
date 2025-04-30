import { useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import { definePlugin } from "decky-frontend-lib";
import remarkHtml from "remark-html"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import { unified } from "unified"
import { patchPartnerEventStore } from "./PartnerEventStorePatch";
import {staticClasses} from "@decky/ui";

function Content() {
  const [changelogHtml, setChangelogHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchChangelog = async (signal?: AbortSignal) => {
    const url = "https://api.github.com/repos/ublue-os/bazzite/releases/latest";
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
      const html = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkHtml)
            .process(data.body)

      setChangelogHtml(html.value as string);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching the changelog.";
      setError(errorMessage);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchChangelog(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const refreshChangelog = async () => {
    setIsRefreshing(true);
    setChangelogHtml(null);
    setError(null);

    try {
      await fetchChangelog();
    } finally {
      setIsRefreshing(false);
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
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error ? (
        <p style={{ color: "red" }} aria-live="polite">
          {error}
        </p>
      ) : changelogHtml ? (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            padding: "10px",
            borderRadius: "5px",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
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
              __html: changelogHtml,
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
  const patches = patchPartnerEventStore();

  return {
    name: "Bazzite Changelog Viewer",
    title: <div className={staticClasses.Title}>Bazzite Buddy</div>,
    icon: <FaClipboardList />,
    content: <Content />,
    onDismount() {
      patches.forEach(patch => {
        patch.unpatch();
      });
    },
  };
});
