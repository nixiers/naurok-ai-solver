import React from "react"

interface ProgressBarProps {
  current: number
  total: number
  status: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  status
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0

  const getBarClass = () => {
    if (status === "error") return "naurok-progress-error"
    if (status === "done") return "naurok-progress-done"
    return "naurok-progress-active"
  }

  return (
    <div className="naurok-progress-wrap">
      <div className="naurok-progress-info">
        <span>
          {current}/{total}
        </span>
        <span className="naurok-progress-status">{status}</span>
      </div>
      <div className="naurok-progress-track">
        <div
          className={`naurok-progress-bar ${getBarClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
