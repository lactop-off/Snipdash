/**
 * Inline icon component. The SVG files under `assets/icons/` are fetched from
 * the Iconify API (lucide set) as physical files and bundled at build time.
 * They use `currentColor`, so an inlined icon inherits the surrounding text
 * color and scales to the requested pixel size.
 */
const modules = import.meta.glob("../assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const ICONS: Record<string, string> = {};
for (const [path, svg] of Object.entries(modules)) {
  const name = path.split("/").pop()!.replace(/\.svg$/, "");
  ICONS[name] = svg;
}

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const svg = ICONS[name];
  if (!svg) return null;
  return (
    <span
      className={`icon${className ? " " + className : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
