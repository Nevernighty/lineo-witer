import * as React from "react";
import { cn } from "@/lib/utils";

interface ControlRowProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Unified 3-column row: [label | control | value]. Prevents the "crooked zoo" of
 * mismatched slider layouts across panels.
 */
export const ControlRow: React.FC<ControlRowProps> = ({ label, value, hint, className, children }) => (
  <div className={cn("min-w-0", className)}>
    <div
      className="grid items-center gap-2"
      style={{ gridTemplateColumns: "minmax(80px, 110px) 1fr minmax(40px, max-content)" }}
    >
      <label className="text-[11px] leading-tight text-muted-foreground truncate" title={typeof label === "string" ? label : undefined}>
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      {value !== undefined && (
        <span className="text-[11px] font-mono tabular-nums text-primary text-right whitespace-nowrap">
          {value}
        </span>
      )}
    </div>
    {hint && <p className="mt-1 text-[10px] leading-snug text-muted-foreground/70 pl-[calc(80px+0.5rem)]">{hint}</p>}
  </div>
);
