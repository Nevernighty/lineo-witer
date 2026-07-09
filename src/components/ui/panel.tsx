import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  density?: "compact" | "comfortable";
}

/**
 * Unified glass panel primitive. Replaces the ad-hoc panel styles scattered across
 * BladeLab, WindSimulation3D, GeneratorSettings. 12px inner padding, 8px row gap.
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ title, actions, collapsible, defaultOpen = true, density = "compact", className, children, ...rest }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen);
    const pad = density === "compact" ? "p-3" : "p-4";
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[10px] border border-border/60 bg-background/70 backdrop-blur-md shadow-[0_1px_0_hsl(var(--border)/0.3)_inset]",
          className,
        )}
        {...rest}
      >
        {(title || actions) && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40">
            <button
              type="button"
              disabled={!collapsible}
              onClick={() => collapsible && setOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-[12px] font-semibold tracking-wide uppercase text-foreground/85",
                collapsible && "hover:text-primary transition-colors cursor-pointer",
              )}
            >
              {collapsible && (
                <ChevronDown
                  size={12}
                  className={cn("transition-transform duration-200", !open && "-rotate-90")}
                />
              )}
              {title}
            </button>
            {actions && <div className="flex items-center gap-1">{actions}</div>}
          </div>
        )}
        {open && <div className={cn(pad, "space-y-2")}>{children}</div>}
      </div>
    );
  },
);
Panel.displayName = "Panel";
