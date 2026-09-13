import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-[0.08em] uppercase",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-muted-foreground",
        human: "border-human/40 bg-human-dim text-human",
        agent: "border-agent/40 bg-agent-dim text-agent",
        mixed: "border-mixed/40 bg-mixed-dim text-mixed",
        void: "border-dashed border-border bg-transparent text-muted-foreground",
        paper: "border-foreground/20 bg-foreground text-background",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
