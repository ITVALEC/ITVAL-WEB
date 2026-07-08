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
  const subtitleColor = light ? "text-white/80" : "text-grey-dark";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <Heading id={id} className={`text-3xl font-bold tracking-tight sm:text-4xl ${titleColor}`}>
        {title}
      </Heading>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
