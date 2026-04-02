/**
 * BunnyVideo — plays a Bunny Stream video.
 *
 * Accepts either:
 *   - a Bunny video GUID  (e.g. "80080d4b-7dfe-468d-bbc3-ea871e5090ec")
 *   - a legacy Supabase storage path/URL (falls back to SignedVideo)
 *
 * Uses the Bunny embed iframe which gives:
 *   - Adaptive bitrate HLS (starts instantly at low quality, scales up)
 *   - Built-in download prevention
 *   - No extra dependencies
 */

import { SignedVideo } from "@/components/ui/signed-video";

const BUNNY_LIBRARY_ID = "629602";
const BUNNY_CDN_HOST   = "vz-44ab0c3f-a96.b-cdn.net";

// A Bunny GUID looks like "80080d4b-7dfe-468d-bbc3-ea871e5090ec"
const BUNNY_GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBunnyGuid(url: string | null | undefined): boolean {
  return !!url && BUNNY_GUID_RE.test(url.trim());
}

interface BunnyVideoProps {
  /** Bunny video GUID or legacy Supabase URL/path */
  url: string | null | undefined;
  className?: string;
  autoplay?: boolean;
  /** Used only for legacy Supabase fallback */
  bucket?: string;
}

export function BunnyVideo({
  url,
  className = "w-full h-full",
  autoplay = false,
  bucket = "exercise-videos",
}: BunnyVideoProps) {
  if (!url) return null;

  // --- Bunny Stream path ---
  if (isBunnyGuid(url)) {
    const guid = url.trim();
    const embedUrl = [
      `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}`,
      `?autoplay=${autoplay}`,
      `&loop=false`,
      `&muted=false`,
      `&preload=true`,
      `&responsive=true`,
    ].join("");

    return (
      <div className="w-full" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={embedUrl}
          className={`w-full h-full rounded-2xl ${className}`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ border: "none", display: "block" }}
        />
      </div>
    );
  }

  // --- Legacy Supabase fallback (used during migration) ---
  return (
    <SignedVideo
      bucket={bucket}
      url={url}
      className={className}
    />
  );
}

/** Build a direct HLS URL from a Bunny GUID (for custom players) */
export function bunnyHlsUrl(guid: string): string {
  return `https://${BUNNY_CDN_HOST}/${guid}/playlist.m3u8`;
}

/** Build a Bunny embed URL from a GUID */
export function bunnyEmbedUrl(guid: string, autoplay = false): string {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}?autoplay=${autoplay}&preload=true&responsive=true`;
}
