import { useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import { patchPartnerEventStore } from "./PartnerEventStorePatch";
import {
  staticClasses,
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Field,
  SteamSpinner,
} from "@decky/ui";
import { definePlugin } from "@decky/api";
import { fetchReleases } from "./FetchReleases";

function Content() {
  const [changelogHtml, setChangelogHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchChangelog = async (signal?: AbortSignal) => {
    try {
      const generator = fetchReleases(signal);
      const iterator = await generator.next();

      if (!iterator || iterator.done) {
        setError("An unknown error occurred while fetching the changelog.");
        return;
      }

      const html = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkHtml)
        .process(iterator.value.body);

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
    <PanelSection title="Bazzite Release Notes">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() =>
            window.open(
              "https://github.com/ublue-os/bazzite/releases",
              "_blank"
            )
          }
        >
          View All Release Notes
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={isRefreshing}
          onClick={refreshChangelog}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        {error ? (
          <Field label="Error">{error}</Field>
        ) : changelogHtml ? (
          <Field>
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto",
                fontSize: "13px",
                lineHeight: "1.4",
                color: "#dcdedf"
              }}
              dangerouslySetInnerHTML={{
                __html: `<style>
                  * {
                    max-width: 100% !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    box-sizing: border-box !important;
                  }
                  h1, h2, h3, h4, h5, h6 {
                    font-size: 14px !important;
                    color: #67a3ff !important;
                    margin: 8px 0 4px 0 !important;
                    font-weight: bold !important;
                  }
                  p {
                    margin: 4px 0 !important;
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                  }
                  ul, ol {
                    margin: 4px 0 !important;
                    padding-left: 16px !important;
                  }
                  li {
                    margin: 2px 0 !important;
                    font-size: 13px !important;
                  }
                  code {
                    background: rgba(255, 255, 255, 0.1) !important;
                    padding: 2px 4px !important;
                    border-radius: 3px !important;
                    font-size: 12px !important;
                    word-break: break-all !important;
                  }
                  pre {
                    background: rgba(255, 255, 255, 0.1) !important;
                    padding: 8px !important;
                    border-radius: 4px !important;
                    overflow-x: auto !important;
                    font-size: 12px !important;
                    white-space: pre-wrap !important;
                    word-break: break-all !important;
                  }
                  a {
                    color: #67a3ff !important;
                    text-decoration: underline !important;
                  }
                  blockquote {
                    border-left: 3px solid #67a3ff !important;
                    padding-left: 8px !important;
                    margin: 4px 0 !important;
                    opacity: 0.8 !important;
                  }
                  table {
                    width: 100% !important;
                    max-width: 100% !important;
                    border-collapse: collapse !important;
                    font-size: 12px !important;
                  }
                  td, th {
                    padding: 4px !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    word-break: break-word !important;
                  }
                  img {
                    max-width: 100% !important;
                    height: auto !important;
                  }
                </style>${changelogHtml}`,
              }}
            />
          </Field>
        ) : (
          <SteamSpinner />
        )}
      </PanelSectionRow>
    </PanelSection>
  );
}

// noinspection JSUnusedGlobalSymbols
export default definePlugin(() => {
  const patches = patchPartnerEventStore();

  return {
    name: "Bazzite Changelog Viewer",
    title: <div className={staticClasses.Title}>Bazzite Buddy</div>,
    icon: <FaClipboardList/>,
    content: <Content/>,
    onDismount() {
      patches.forEach(patch => {
        patch.unpatch();
      });
    },
  };
});
