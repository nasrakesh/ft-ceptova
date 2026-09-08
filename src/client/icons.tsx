import type { CSSProperties } from "react";

type IconProps = { size?: number; style?: CSSProperties };

function base(children: React.ReactNode, { size = 20, style }: IconProps = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

export const BoltIcon = (p: IconProps = {}) =>
  base(<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />, p);

export const DumbbellIcon = ({ size = 20, style }: IconProps = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <rect x="2" y="8" width="4" height="8" rx="1.5" />
    <rect x="18" y="8" width="4" height="8" rx="1.5" />
    <rect x="6" y="11" width="12" height="2" rx="1" />
  </svg>
);

export const SunIcon = (p: IconProps = {}) =>
  base(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
    p
  );

export const AppleIcon = (p: IconProps = {}) =>
  base(
    <>
      <path d="M12 8c-3 0-5.5 2.2-5.5 6 0 3.3 2.3 6.5 4 6.5.9 0 1.3-.5 2-.5s1.1.5 2 .5c1.7 0 4-3.2 4-6.5 0-2.4-1.2-4.2-2.8-5.2" />
      <path d="M12 8c0-2 1-3 2.5-3.5" />
      <path d="M11 5c.3-1 1.2-2 2.5-2" />
    </>,
    p
  );

export const BowlIcon = (p: IconProps = {}) =>
  base(
    <>
      <path d="M3 12h18a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z" />
      <path d="M9 12V7a3 3 0 0 1 6 0v5" />
    </>,
    p
  );

export const CookieIcon = (p: IconProps = {}) =>
  base(
    <>
      <path d="M12 3c1 2 3 2 3 2a4 4 0 0 0 4 4s0 2 2 3a9 9 0 1 1-9-9z" />
      <circle cx="9" cy="14" r="0.8" fill="currentColor" />
      <circle cx="13" cy="17" r="0.8" fill="currentColor" />
      <circle cx="15" cy="12" r="0.8" fill="currentColor" />
    </>,
    p
  );

export const MoonIcon = (p: IconProps = {}) =>
  base(<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />, p);

export const UtensilsIcon = (p: IconProps = {}) =>
  base(
    <>
      <path d="M6 3v7a2 2 0 0 0 2 2v9M6 3v9M9 3v7M6 3H4v7a2 2 0 0 0 2 2" />
      <path d="M17 3c-1.5 0-3 1.5-3 4v4c0 1 .5 2 1.5 2V21M17 3v18" />
    </>,
    p
  );

export const TargetIcon = (p: IconProps = {}) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>,
    p
  );

export const ChartIcon = (p: IconProps = {}) =>
  base(
    <>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </>,
    p
  );

export const ScaleIcon = (p: IconProps = {}) =>
  base(
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13l3-3M9 5h6M12 5v2" />
    </>,
    p
  );

export const LogIcon = ({ active, ...p }: IconProps & { active?: boolean }) =>
  base(
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>,
    p
  );

export const SettingsIcon = ({ active, ...p }: IconProps & { active?: boolean }) =>
  base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
    p
  );

const CATEGORY_ICON_MAP: { match: RegExp; icon: (p?: IconProps) => JSX.Element; color: string }[] = [
  { match: /pre.?workout/i, icon: BoltIcon, color: "var(--series-1)" },
  { match: /post.?workout/i, icon: DumbbellIcon, color: "var(--series-2)" },
  { match: /breakfast/i, icon: SunIcon, color: "var(--series-4)" },
  { match: /snack/i, icon: AppleIcon, color: "var(--series-3)" },
  { match: /lunch/i, icon: BowlIcon, color: "#e87ba4" },
  { match: /dinner/i, icon: MoonIcon, color: "#4a3aa7" },
];

export function categoryIconFor(name: string): { icon: (p?: IconProps) => JSX.Element; color: string } {
  for (const entry of CATEGORY_ICON_MAP) {
    if (entry.match.test(name)) return entry;
  }
  return { icon: UtensilsIcon, color: "var(--muted)" };
}
