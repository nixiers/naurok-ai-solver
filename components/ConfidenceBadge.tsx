import React from "react"

interface ConfidenceBadgeProps {
  confidence: number
  size?: "sm" | "md" | "lg"
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = "md"
}) => {
  const percent = Math.round(confidence * 100)

  const getColorClass = () => {
    if (percent >= 80) return "naurok-badge-green"
    if (percent >= 50) return "naurok-badge-yellow"
    return "naurok-badge-red"
  }

  const getSizeClass = () => {
    if (size === "sm") return "naurok-badge-sm"
    if (size === "lg") return "naurok-badge-lg"
    return "naurok-badge-md"
  }

  return (
    <span className={`naurok-badge ${getColorClass()} ${getSizeClass()}`}>
      {percent}%
    </span>
  )
}
