"use client";
import { Component } from "react";
import { Download, FileWarning } from "lucide-react";

// Keeps any runtime failure inside the PDF viewer from bubbling up to the
// route-level error boundary (which shows the full "Something interrupted
// your study" page). The user keeps the rest of the episode page and can
// still download the guide directly.
export default class PdfErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (typeof console !== "undefined") {
      console.error("PdfViewer failed:", error);
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { src, downloadName, onDownload } = this.props;
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 rounded-2xl border border-maroon/15 bg-white px-6 text-center text-ink">
        <FileWarning size={30} className="text-maroon" />
        <p className="text-sm font-semibold">
          The in-page reader couldn&rsquo;t open this study guide.
        </p>
        <p className="max-w-sm text-xs text-ink/70">
          You can download the file or open it in a new tab — your account and
          library aren&rsquo;t affected.
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <a
            href={src}
            download={downloadName}
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-maroon px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-maroon-dark"
          >
            <Download size={14} /> Download the PDF
          </a>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-maroon/30 px-3 py-1.5 text-xs font-semibold text-maroon transition hover:bg-maroon/5"
          >
            Open in a new tab
          </a>
        </div>
      </div>
    );
  }
}
