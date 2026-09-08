import { useState, type ReactNode } from "react";

export default function CollapsibleSection({
  title,
  icon,
  accentColor,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: ReactNode;
  accentColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="settings-section" style={accentColor ? { borderLeftColor: accentColor } : undefined}>
      <button type="button" className="settings-section-header" onClick={() => setOpen((o) => !o)}>
        <span className={open ? "chevron" : "chevron collapsed"}>▾</span>
        {icon && (
          <span className="section-icon" style={accentColor ? { color: accentColor } : undefined}>
            {icon}
          </span>
        )}
        <span className="section-title">{title}</span>
      </button>
      {open && <div className="settings-section-body">{children}</div>}
    </div>
  );
}
