"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
const FALLBACK = "/images/pages/projects.svg";

type SafeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  fallbackSrc?: string;
};

export function SafeImage({
  src,
  alt,
  fallbackSrc = FALLBACK,
  className,
  onError,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);
  return (
    <Image
      {...props}
      src={failed ? fallbackSrc : currentSrc}
      alt={alt}
      className={className}
      onError={(event) => {
        if (!failed && currentSrc !== fallbackSrc) {
          setFailed(true);
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
