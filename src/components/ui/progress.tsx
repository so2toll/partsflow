import * as React from "react"
import { cn } from "../../lib/utils"

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("progress", className)}
      {...props}
    >
      <div
        className="progress-value"
        style={{ transform: 'translateX(-' + (100 - value) + '%)' }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
