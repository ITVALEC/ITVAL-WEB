import Image from "next/image";
import { IMAGES } from "@/lib/assets";

const LOGO_WIDTH = 992;
const LOGO_HEIGHT = 328;

type LogoProps = {
  variant?: "white" | "color";
  className?: string;
  priority?: boolean;
  alt?: string;
};

export function Logo({
  variant = "white",
  className = "h-10 w-auto sm:h-11",
  priority = false,
  alt = "ITVAL — Vidrio y aluminio",
}: LogoProps) {
  const src =
    variant === "white" ? IMAGES.site.logoWhite : IMAGES.site.logoColor;

  return (
    <Image
      src={src}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={className}
      priority={priority}
      sizes="(max-width: 640px) 140px, 180px"
    />
  );
}
