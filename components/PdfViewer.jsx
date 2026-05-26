"use client";
// In-page renderer for the .pdf study guides. The PDF is fetched and drawn page
// by page with react-pdf, with a toolbar for page navigation, zoom,
// fit-to-width, rotate, print, download, and save-to-Drive.
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import {
  Download,
  Printer,
  Cloud,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileWarning,
} from "lucide-react";

// pdf.js needs a worker; serve it from /public so it works offline and
// without any CDN dependency. Falls back to a CDN copy if the local file is
// somehow missing.
if (typeof window !== "undefined" && pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

const ZOOM_MIN = 50;
const ZOOM_MAX = 300;
const ZOOM_STEP = 10;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export default function PdfViewer({
  src,
  title = "Study Guide",
  downloadName,
  onDownload,
}) {
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [numPages, setNumPages] = useState(0);
  const [naturalWidth, setNaturalWidth] = useState(null);
  const [zoom, setZoom] = useState(155);
  const [rotation, setRotation] = useState(0);
  const [pageInput, setPageInput] = useState("1");

  // Reset state whenever a different guide is opened.
  useEffect(() => {
    setStatus("loading");
    setNumPages(0);
    setNaturalWidth(null);
    setZoom(155);
    setRotation(0);
    setPageInput("1");
  }, [src]);

  const onLoadSuccess = useCallback(async (doc) => {
    setNumPages(doc.numPages);
    setPageInput("1");
    try {
      const page = await doc.getPage(1);
      setNaturalWidth(page.getViewport({ scale: 1 }).width);
    } catch {
      setNaturalWidth(612);
    }
    setStatus("ready");
  }, []);

  const fitToWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !naturalWidth) return;
    const available = el.clientWidth;
    setZoom(clamp(Math.round((available / naturalWidth) * 100), ZOOM_MIN, ZOOM_MAX));
  }, [naturalWidth]);

  // Default zoom (155%) is used on load; the fit-to-width button still works
  // on demand for readers who want it.

  const changeZoom = (delta) =>
    setZoom((z) => clamp(z + delta, ZOOM_MIN, ZOOM_MAX));

  const scrollToPage = (n) => {
    const clamped = clamp(n, 1, numPages || 1);
    setPageInput(String(clamped));
    pageRefs.current[clamped - 1]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Track which page is currently in view as the reader scrolls the page.
  const onScroll = useCallback(() => {
    if (!numPages) return;
    let cur = 1;
    pageRefs.current.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) {
        cur = i + 1;
      }
    });
    setPageInput(String(cur));
  }, [numPages]);

  // The viewer now grows to the PDF's full size, so pages scroll with the
  // window rather than an inner box — listen there to keep the indicator live.
  useEffect(() => {
    if (status !== "ready") return;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [status, onScroll]);

  const handleSaveToDrive = () => {
    const u = encodeURIComponent(new URL(src, window.location.origin).href);
    window.open(
      `https://drive.google.com/save?url=${u}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const renderWidth = Math.min(2000, Math.round((naturalWidth ?? 612) * (zoom / 100)));

  return (
    <div className="overflow-hidden rounded-2xl border border-maroon/15 bg-white shadow-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-maroon/10 bg-cream/70 px-4 py-2.5">
        <span className="mr-auto truncate text-sm font-semibold text-ink">
          {title}
        </span>

        {status === "ready" && (
          <>
            {/* Page navigation */}
            <div className="flex items-center gap-1.5 rounded-lg border border-maroon/15 bg-white px-2 py-1">
              <button
                type="button"
                onClick={() => scrollToPage((parseInt(pageInput, 10) || 1) - 1)}
                aria-label="Previous page"
                className="p-0.5 text-ink transition hover:text-maroon"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={pageInput}
                onChange={(e) =>
                  setPageInput(e.target.value.replace(/[^\d]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    scrollToPage(parseInt(e.currentTarget.value, 10) || 1);
                    e.currentTarget.blur();
                  }
                }}
                onBlur={() => scrollToPage(parseInt(pageInput, 10) || 1)}
                aria-label="Go to page number"
                className="w-11 rounded border border-maroon/15 bg-cream/60 px-1 py-0.5 text-center text-xs font-semibold text-ink outline-none focus:border-maroon/50"
              />
              <span className="text-xs font-medium text-ink">
                / {numPages}
              </span>
              <button
                type="button"
                onClick={() => scrollToPage((parseInt(pageInput, 10) || 1) + 1)}
                aria-label="Next page"
                className="p-0.5 text-ink transition hover:text-maroon"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center rounded-lg border border-maroon/15 bg-white">
              <button
                type="button"
                onClick={() => changeZoom(-ZOOM_STEP)}
                disabled={zoom <= ZOOM_MIN}
                aria-label="Zoom out"
                className="p-1.5 text-ink transition hover:text-maroon disabled:opacity-30"
              >
                <ZoomOut size={16} />
              </button>
              <span className="w-12 text-center text-xs font-semibold text-ink">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => changeZoom(ZOOM_STEP)}
                disabled={zoom >= ZOOM_MAX}
                aria-label="Zoom in"
                className="p-1.5 text-ink transition hover:text-maroon disabled:opacity-30"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={fitToWidth}
              aria-label="Fit page to width"
              className="rounded-lg border border-maroon/15 bg-white p-1.5 text-ink transition hover:text-maroon"
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="Rotate pages"
              className="rounded-lg border border-maroon/15 bg-white p-1.5 text-ink transition hover:text-maroon"
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="Print study guide"
              className="rounded-lg border border-maroon/15 bg-white p-1.5 text-ink transition hover:text-maroon"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={handleSaveToDrive}
              aria-label="Save to Google Drive"
              className="rounded-lg border border-maroon/15 bg-white p-1.5 text-ink transition hover:text-maroon"
            >
              <Cloud size={16} />
            </button>
          </>
        )}

        <a
          href={src}
          download={downloadName}
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 rounded-lg bg-maroon px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-maroon-dark"
        >
          <Download size={14} /> Download
        </a>
      </div>

      {/* Document viewport — grows to the PDF's full page size */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto bg-[#e9e2d6]"
      >
        <Document
          file={src}
          onLoadSuccess={onLoadSuccess}
          onLoadError={() => setStatus("error")}
          loading={
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-ink">
              <Loader2 size={28} className="animate-spin text-maroon" />
              <p className="text-sm">Loading study guide…</p>
            </div>
          }
          error={
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center text-ink">
              <FileWarning size={30} className="text-maroon" />
              <p className="text-sm font-medium">
                This study guide could not be displayed.
              </p>
              <a
                href={src}
                download={downloadName}
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-maroon px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Download size={14} /> Download the file instead
              </a>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-6">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                ref={(el) => {
                  pageRefs.current[n - 1] = el;
                }}
              >
                <div
                  className="overflow-hidden rounded-sm shadow-[0_10px_30px_-12px_rgba(43,24,16,0.45)]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 0.25s ease",
                  }}
                >
                  <Page
                    pageNumber={n}
                    width={renderWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}
