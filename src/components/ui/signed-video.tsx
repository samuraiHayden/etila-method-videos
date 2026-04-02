import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Skeleton } from "@/components/ui/skeleton";

interface SignedVideoProps {
  bucket: string;
  url: string | null | undefined;
  className?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: string;
  controlsList?: string;
}

export function SignedVideo({
  bucket,
  url,
  className = "w-full h-full",
  controls = true,
  playsInline = true,
  preload = "auto",
  controlsList = "nodownload",
}: SignedVideoProps) {
  const { signedUrl, loading } = useSignedUrl(bucket, url);

  if (!url) return null;

  if (loading || !signedUrl) {
    return <Skeleton className={className} />;
  }

  return (
    <video
      src={signedUrl}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      className={className}
      controlsList={controlsList}
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
