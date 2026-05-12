import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary",
        className
      )}
      {...p}
    />
  );
}
