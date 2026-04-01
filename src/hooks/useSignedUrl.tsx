import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extracts the storage path from a full Supabase public URL.
 * e.g. "https://xyz.supabase.co/storage/v1/object/public/exercise-videos/file.mp4"
 *   → "file.mp4"
 */
function extractStoragePath(url: string, bucket: string): string {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length));
  }
  // If it's already just a path, return as-is
  return url;
}

/**
 * Hook that generates a fresh signed URL for a private storage file.
 * Falls back gracefully if the URL is external (non-Supabase).
 */
export function useSignedUrl(bucket: string, urlOrPath: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!urlOrPath) {
      setSignedUrl(null);
      return;
    }

    // If it's an external URL (not from our Supabase storage), use directly
    if (urlOrPath.startsWith("http") && !urlOrPath.includes("supabase.co/storage")) {
      setSignedUrl(urlOrPath);
      return;
    }

    const path = urlOrPath.startsWith("http")
      ? extractStoragePath(urlOrPath, bucket)
      : urlOrPath;

    let cancelled = false;
    setLoading(true);

    supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRY)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(`Failed to create signed URL for ${bucket}/${path}:`, error.message);
          setSignedUrl(null);
        } else {
          setSignedUrl(data.signedUrl);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, urlOrPath]);

  return { signedUrl, loading };
}

/**
 * Generate a signed URL imperatively (for uploads where you need the URL once).
 */
export async function createSignedVideoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("exercise-videos")
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error) {
    console.error("Failed to create signed URL:", error.message);
    return null;
  }
  return data.signedUrl;
}
