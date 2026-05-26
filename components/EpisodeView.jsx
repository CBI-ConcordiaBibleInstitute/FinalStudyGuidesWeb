"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Bookmark,
  Clock,
  FileText,
  Check,
  Plus,
  Youtube,
  Share2,
  Download,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useCart, GUIDE_PRICE } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { SITE } from "@/lib/catalog-shared";
import { notifyDownload } from "@/lib/notifications";
import PdfErrorBoundary from "@/components/PdfErrorBoundary";
import NotificationConsentModal from "@/components/NotificationConsentModal";

// react-pdf renders only in the browser — load the viewer client-side.
const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-maroon/15 bg-white text-sm text-ink">
      Loading study guide…
    </div>
  ),
});

// Shared style for the links in the "More resources" panel.
const RESOURCE_LINK =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-cream hover:text-maroon";

export default function EpisodeView({ episode, podcast, related }) {
  const { user, recordDownload, toggleBookmark, recordNotificationConsent } = useAuth();
  const { has, add } = useCart();
  const { push } = useToast();
  const [consentOpen, setConsentOpen] = useState(false);

  const unlocked =
    episode.free || (user?.downloads?.includes(episode.id) ?? false);
  const inCart = has(episode.id);
  const isBookmarked = user?.bookmarks?.includes(episode.id) ?? false;

  const completeDownload = (sendEmail) => {
    if (user) {
      recordDownload(episode.id);
      if (sendEmail) {
        try { notifyDownload({ ...user }, episode); } catch { /* best-effort */ }
      }
    }
    push(`Downloading “${episode.title}”.`);
  };

  const onDownload = () => {
    if (user && !user.notificationsConsentAt) {
      setConsentOpen(true);
      return;
    }
    completeDownload(true);
  };

  const onConsentAllow = async () => {
    setConsentOpen(false);
    await recordNotificationConsent(true);
    completeDownload(true);
  };
  const onConsentDecline = async () => {
    setConsentOpen(false);
    await recordNotificationConsent(false);
    completeDownload(false);
  };

  const onBookmark = async () => {
    if (!user) {
      push("Log in to save studies to your library.", "info");
      return;
    }
    const now = await toggleBookmark(episode.id);
    push(now ? "Saved to your library." : "Removed from your library.");
  };

  const onAddToCart = () => {
    add({
      episodeId: episode.id,
      title: episode.title,
      podcastSlug: episode.podcastSlug,
    });
    push("Added to cart.");
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: episode.title, url });
      else {
        await navigator.clipboard.writeText(url);
        push("Link copied to clipboard.");
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="py-8">
      <NotificationConsentModal
        open={consentOpen}
        trigger="download"
        onAllow={onConsentAllow}
        onDecline={onConsentDecline}
        onClose={() => setConsentOpen(false)}
      />
      {/* Episode header */}
      <div className="container-cb">
        <Link
          href={`/podcasts/${podcast.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline"
        >
          <ArrowLeft size={16} /> {podcast.name} series
        </Link>

        <div className="mt-5 flex items-center gap-2">
          <span className="rounded-full bg-maroon/10 px-2.5 py-1 text-xs font-bold text-maroon">
            Episode {episode.number}
          </span>
          {episode.free ? (
            <span className="badge-free">Free preview</span>
          ) : unlocked ? (
            <span className="badge-free">Unlocked</span>
          ) : (
            <span className="badge-locked">
              <Lock size={10} /> Locked
            </span>
          )}
        </div>

        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {episode.title} — Study Guide
        </h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink">
          <Clock size={14} /> {episode.duration} min · {SITE.podcast}
        </p>
      </div>

      {/* Study guide — container is 135 % of the page section width with a
          framed maroon border. On narrow screens (< 1100px) it falls back to
          100 % to avoid horizontal scrolling. */}
      <div className="container-cb mt-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FileText size={20} className="text-maroon" />
          <h2 className="font-serif text-2xl font-bold text-maroon">
            Companion Study Guide
          </h2>
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={onBookmark} className="btn-ghost">
              <Bookmark
                size={16}
                className={isBookmarked ? "fill-maroon" : ""}
              />
              {isBookmarked ? "Saved" : "Save study"}
            </button>
            <button onClick={onShare} className="btn-ghost">
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        {unlocked ? (
          <div className="mt-5">
            <div className="study-guide-wide">
              <PdfErrorBoundary src={`/api/guides/${episode.id}`} onDownload={onDownload}>
                <PdfViewer
                  src={`/api/guides/${episode.id}`}
                  title={`${episode.title} — Study Guide`}
                  onDownload={onDownload}
                />
              </PdfErrorBoundary>
            </div>
            <p className="mt-3 text-center text-xs text-ink">
              PDF study guide · displayed as authored · ready to print
            </p>
          </div>
        ) : (
          <div className="cb-gold-frame mt-5 max-w-xl">
            <div className="cb-gold-frame__inner p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="cb-gold-icon">
                  <FileText size={20} />
                </span>
                <span className="cb-gold-eyebrow">Premium Study</span>
              </div>
              <h3 className="mt-4 font-serif text-2xl font-bold text-maroon">
                Unlock this study guide
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                Get the full companion study guide and the episode video,
                yours to keep.
              </p>
              <div className="cb-gold-price mt-5">
                <span className="cb-gold-price__amt">${GUIDE_PRICE}</span>
                <span className="cb-gold-price__lbl">one-time · per episode</span>
              </div>
              <div className="mt-5 space-y-3">
                {inCart ? (
                  <Link href="/cart" className="btn-gold w-full">
                    <Check size={16} /> In cart — checkout
                  </Link>
                ) : (
                  <button onClick={onAddToCart} className="btn-primary w-full">
                    <Plus size={16} /> Buy this study guide · ${GUIDE_PRICE}
                  </button>
                )}
                <p className="text-center text-xs text-ink/60">
                  Secure checkout · instant access
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Episode video + more resources — at the end of the page */}
      <section className="container-cb mt-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="cb-gold-icon cb-gold-icon--sm">
                <Youtube size={16} />
              </span>
              <span className="cb-gold-eyebrow">Episode video</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-maroon">
              Watch the episode
            </h2>
            <div className="cb-gold-frame cb-gold-frame--video mt-4">
              {episode.youtubeId && unlocked ? (
                <div className="cb-gold-frame__media aspect-video">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${episode.youtubeId}`}
                    title={episode.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="cb-gold-frame__media flex aspect-video flex-col items-center justify-center bg-ink p-6 text-center text-white">
                  <span className="cb-gold-icon cb-gold-icon--lg">
                    <Lock size={22} />
                  </span>
                  <p className="mt-3 text-sm font-semibold tracking-wide">
                    Buy this study guide to watch the episode
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Includes the full PDF companion guide
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* More resources — beside the video */}
          <aside className="lg:col-span-1">
            <h2 className="font-serif text-2xl font-bold text-ink">
              More resources
            </h2>
            <div className="glow-border mt-4 space-y-1 rounded-xl border border-maroon/10 bg-white p-2 shadow-card">
              {episode.youtubeUrl && (
                <a
                  href={episode.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={RESOURCE_LINK}
                >
                  <Youtube size={16} className="text-maroon" />
                  Watch on YouTube
                </a>
              )}
              {unlocked && (
                <a
                  href={`/api/guides/${episode.id}`}
                  download
                  onClick={onDownload}
                  className={RESOURCE_LINK}
                >
                  <Download size={16} className="text-maroon" />
                  Download the study guide
                </a>
              )}
              <Link
                href={`/podcasts/${podcast.slug}`}
                className={RESOURCE_LINK}
              >
                <BookOpen size={16} className="text-maroon" />
                Browse the {podcast.name} series
              </Link>
              <a
                href={SITE.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className={RESOURCE_LINK}
              >
                <Youtube size={16} className="text-maroon" />
                Concordia YouTube channel
              </a>
              <Link href="/faq" className={RESOURCE_LINK}>
                <HelpCircle size={16} className="text-maroon" />
                Questions &amp; help
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* More from this series — at the end of the page */}
      {related.length > 0 && (
        <section className="container-cb mt-14">
          <h2 className="font-serif text-2xl font-bold text-ink">
            More from {podcast.name}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/episodes/${r.id}`}
                className="glow-border flex items-center gap-3 rounded-xl border border-maroon/10 bg-white p-3 shadow-card transition hover:border-maroon/30 hover:shadow-lift"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-maroon/10 text-sm font-bold text-maroon">
                  {r.number}
                </span>
                <span className="line-clamp-2 text-sm font-medium text-ink">
                  {r.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
