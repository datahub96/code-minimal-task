import React from "react";

interface TaskTimerBadgeProps {
  value: number;
  className?: string;
  showZero?: boolean;
}

const TaskTimerBadge: React.FC<TaskTimerBadgeProps> = ({
  value,
  className = "",
  showZero = false,
}) => {
  // If value is 0 and showZero is false, render with white text on yellow background
  // This makes the "0" visually hidden while keeping the yellow badge
  const isZero = value === 0;
  const textColor = isZero && !showZero ? "text-white" : "";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-medium ${textColor} ${className}`}
    >
      {value}
    </div>
  );
};

export default TaskTimerBadge;
