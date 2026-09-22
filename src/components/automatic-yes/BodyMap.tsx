import type { MouseEvent } from "react";

/**
 * The body outline, for marking where something is felt.
 *
 * Tapping the outline adds a dot; tapping a dot removes it. The textarea
 * beside it is the keyboard route and carries the same question — the outline
 * is an extra way in, never the only one, so the SVG is labelled and the
 * answer can be written in words by anyone who cannot or would rather not
 * point at a drawing.
 */

/** viewBox units, so a dot lands where it was tapped at any size. */
export type Dot = [number, number];

const OUTLINE =
  "M75 8c-14 0-24 12-24 29 0 14 7 25 16 29v12c-2 5-12 8-26 12-18 5-28 16-29 34l-2 106h130l-2-106c-1-18-11-29-29-34-14-4-24-7-26-12V66c9-4 16-15 16-29 0-17-10-29-24-29z";

const DOT_RADIUS = 6;

interface BodyMapProps {
  label: string;
  dots: Dot[];
  onChange: (next: Dot[]) => void;
}

const BodyMap = ({ label, dots, onChange }: BodyMapProps) => {
  const place = (event: MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 150;
    const y = ((event.clientY - rect.top) / rect.height) * 230;

    const hitIndex = dots.findIndex(
      ([dx, dy]) => Math.hypot(dx - x, dy - y) <= DOT_RADIUS + 2,
    );

    onChange(
      hitIndex >= 0 ? dots.filter((_, index) => index !== hitIndex) : [...dots, [x, y] as Dot],
    );
  };

  return (
    // Styled by `.map svg` from the page's stylesheet; no class of its own,
    // as in the prototype.
    <svg
      viewBox="0 0 150 230"
      role="img"
      aria-label={label}
      onClick={place}
    >
      <path d={OUTLINE} fill="#EFE7DC" stroke="#CDBFAE" strokeWidth="1.5" />
      {dots.map(([x, y], index) => (
        <circle
          key={`${x}-${y}-${index}`}
          cx={x}
          cy={y}
          r={DOT_RADIUS}
          fill="#D17147"
          fillOpacity="0.85"
          stroke="#FAF8F5"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
};

export default BodyMap;
