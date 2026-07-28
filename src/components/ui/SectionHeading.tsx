type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  id?: string;
  as?: "h1" | "h2";
  /** Línea decorativa oro bajo el título. */
  rule?: boolean;
};

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  light = false,
  id,
  as: Heading = "h2",
  rule = true,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const titleColor = light ? "text-white" : "text-navy";
  const subtitleColor = light ? "text-white/80" : "text-grey-dark";
  const textShadow = light
    ? { textShadow: "0 2px 12px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.45)" }
    : undefined;
  const ruleClass = rule
    ? `gold-rule ${align === "center" ? "gold-rule-center" : ""}`
    : "";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <Heading
        id={id}
        className={`font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight ${titleColor} ${ruleClass}`}
        style={textShadow}
      >
        {title}
      </Heading>
      {subtitle ? (
        <p
          className={`mt-6 text-base leading-relaxed sm:text-lg ${subtitleColor}`}
          style={textShadow}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
