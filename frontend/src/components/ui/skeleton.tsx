import * as React from "react"

import { cn } from "@/lib/utils"

/** Pulsing placeholder block shown in place of content that is still loading. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-slate-200/80", className)}
      {...props}
    />
  )
}

export { Skeleton }
