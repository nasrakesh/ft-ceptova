const BODY_OUTLINE = (
  <path
    d="M32 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM20 26c1-4 6-7 12-7s11 3 12 7l3 14-6 2-2 16h-4l-1-14h-4l-1 14h-4l-2-16-6-2 3-14z"
    fill="none"
    stroke="var(--border)"
    strokeWidth="2"
    strokeLinejoin="round"
  />
);

const HIGHLIGHTS: Record<string, JSX.Element> = {
  Back: <path d="M23 23c2-2 6-3 9-3s7 1 9 3l2 9-3 8H24l-3-8z" opacity="0.85" />,
  Chest: <path d="M24 22c2-1.5 5-2 8-2s6 .5 8 2l1 8-4 3-5-2-5 2-4-3z" opacity="0.85" />,
  Shoulder: (
    <>
      <circle cx="21" cy="22" r="4.5" opacity="0.85" />
      <circle cx="43" cy="22" r="4.5" opacity="0.85" />
    </>
  ),
  Triceps: (
    <>
      <rect x="15" y="26" width="6" height="14" rx="3" opacity="0.85" />
      <rect x="43" y="26" width="6" height="14" rx="3" opacity="0.85" />
    </>
  ),
  Biceps: (
    <>
      <rect x="16" y="24" width="6" height="12" rx="3" opacity="0.85" />
      <rect x="42" y="24" width="6" height="12" rx="3" opacity="0.85" />
    </>
  ),
  Legs: (
    <>
      <rect x="24" y="46" width="6" height="18" rx="3" opacity="0.85" />
      <rect x="34" y="46" width="6" height="18" rx="3" opacity="0.85" />
    </>
  ),
  Abdomen: <rect x="26" y="30" width="12" height="12" rx="2" opacity="0.85" />,
  Cardio: <path d="M32 30c-3-4-10-2-10 3 0 5 10 10 10 10s10-5 10-10c0-5-7-7-10-3z" opacity="0.9" />,
};

export default function MuscleIllustration({ group, color }: { group: string; color: string }) {
  return (
    <svg width="64" height="72" viewBox="0 0 64 72" aria-hidden="true">
      {BODY_OUTLINE}
      <g fill={color} stroke={color}>
        {HIGHLIGHTS[group] ?? null}
      </g>
    </svg>
  );
}
