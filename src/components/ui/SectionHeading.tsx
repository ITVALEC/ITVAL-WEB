type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  id?: string;
  as?: "h1" | "h2";
};

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  light = false,
  id,
  as: Heading = "h2",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const titleColor = light ? "text-white" : "text-navy";
  const subtitleColor = light ? "text-white" : "text-grey-dark";
  const textShadow = light
    ? { textShadow: "0 2px 12px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.45)" }
    : undefined;

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <Heading
        id={id}
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${titleColor}`}
        style={textShadow}
      >
        {title}
      </Heading>
      {subtitle ? (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${subtitleColor}`}
          style={textShadow}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
