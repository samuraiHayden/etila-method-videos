import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Skeleton } from "@/components/ui/skeleton";

interface SignedImageProps {
  bucket: string;
  url: string | null | undefined;
  alt?: string;
  className?: string;
}

export function SignedImage({ bucket, url, alt = "", className }: SignedImageProps) {
  const { signedUrl, loading } = useSignedUrl(bucket, url);

  if (!url) return null;

  if (loading || !signedUrl) {
    return <Skeleton className={className} />;
  }

  return <img src={signedUrl} alt={alt} className={className} />;
}
