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

  return (
    <div className={`relative max-w-2xl ${alignClass}`}>
      <Heading
        id={id}
        className={`font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-ds-h2 ${titleColor} ${ruleClass}`}
      >
        <AccentText
          text={title}
          accent={accent}
          accentClassName={accentClassName ?? defaultAccent}
        />
      </Heading>
      {subtitle ? (
        <p className={`mt-8 break-words text-ds-body leading-[1.5] ${subtitleColor}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
