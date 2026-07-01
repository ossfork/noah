// Canonical brand mark — the monochrome wrench app-icon tile, auto-synced
// from /brand/noah-icon.svg via /brand/sync.sh (the plated near-black tile
// is written to this path so the mark reads on any theme). A single,
// self-contained mark — no tide/ring parts, no theme toggle. Do not
// replace with a hand-edited PNG/SVG.
import noahIcon from "../assets/noah-icon.svg";

interface NoahIconProps {
  className?: string;
  alt?: string;
}

export function NoahIcon({
  className = "w-8 h-8 rounded-lg",
  alt = "Noah icon",
}: NoahIconProps) {
  return <img src={noahIcon} alt={alt} className={className} />;
}
