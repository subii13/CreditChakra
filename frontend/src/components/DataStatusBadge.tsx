// Section 87/136: every important figure must visibly say what kind
// of data it is. This is the one place that mapping lives.
const LABELS: Record<string, string> = {
  VERIFIED_OFFICIAL: "Verified official data",
  VERIFIED: "Verified official data",
  DEMO_DATA: "Demo data",
  ESTIMATE: "Estimate",
  USER_PROVIDED: "Your input",
  UNVERIFIED: "Unverified — not yet confirmed",
};

const CLASSES: Record<string, string> = {
  VERIFIED_OFFICIAL: "badge--verified",
  VERIFIED: "badge--verified",
  DEMO_DATA: "badge--demo",
  ESTIMATE: "badge--estimate",
  USER_PROVIDED: "badge--demo",
  UNVERIFIED: "badge--unverified",
};

export function DataStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${CLASSES[status] ?? "badge--demo"}`}>{LABELS[status] ?? status}</span>;
}
