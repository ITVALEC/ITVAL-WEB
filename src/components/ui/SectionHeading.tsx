import { AccentText } from "@/components/ui/AccentText";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  id?: string;
  as?: "h1" | "h2";
  rule?: boolean;
  accent?: string;
  accentClassName?: string;
};

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  light = false,
  id,
  as: Heading = "h2",
  rule = true,
  accent,
  accentClassName,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const titleColor = light ? "text-white" : "text-navy";
  const subtitleColor = light ? "text-white/80" : "text-ink/80";
  const defaultAccent = light ? "text-gold" : "text-gold-deep";
  const ruleClass = rule
    ? `gold-rule ${align === "center" ? "gold-rule-center" : ""}`
    : "";
  const titleSize =
    Heading === "h1"
      ? "text-[clamp(1.75rem,1rem+2.8vw,3rem)]"
      : "text-[clamp(1.5rem,0.95rem+2.2vw,3rem)]";

  return (
    <div className={`relative max-w-2xl ${alignClass}`}>
      <Heading
        id={id}
        className={`break-words font-display font-bold tracking-tight leading-[1.2] ${titleSize} ${titleColor} ${ruleClass}`}
      >
        <AccentText
          text={title}
          accent={accent}
          accentClassName={accentClassName ?? defaultAccent}
        />
      </Heading>
      {subtitle ? (
        <p className={`mt-6 break-words text-base leading-[1.5] sm:mt-8 sm:text-ds-body ${subtitleColor}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
