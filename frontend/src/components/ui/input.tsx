import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[8px] border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 transition-colors outline-none placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-3 focus-visible:ring-zinc-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-3 aria-invalid:ring-red-100",
        className
      )}
      {...props}
    />
  )
}

export { Input }
