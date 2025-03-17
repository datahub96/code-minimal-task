import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveTimerBannerProps {
  taskId: string;
  taskTitle: string;
  expectedTime: number;
  timeSpent: number;
  timerStarted: number;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
}

const ActiveTimerBanner = ({
  taskId,
  taskTitle,
  expectedTime = 3600000, // Default 1 hour
  timeSpent = 0,
  timerStarted,
  onPause,
  onResume,
  onClose,
}: ActiveTimerBannerProps) => {
  const [currentTimeSpent, setCurrentTimeSpent] = useState(timeSpent);
  const [isVisible, setIsVisible] = useState(true);

  // Format time in HH:MM:SS
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    const remaining = Math.max(0, expectedTime - currentTimeSpent);
    return formatTime(remaining);
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    return Math.min(100, (currentTimeSpent / expectedTime) * 100);
  };

  // Update timer every second
  useEffect(() => {
    let interval: number;

    if (timerStarted) {
      // Initialize with the current elapsed time
      const initialNow = Date.now();
      const initialElapsed = initialNow - timerStarted;
      setCurrentTimeSpent(timeSpent + initialElapsed);

      interval = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - timerStarted;
        setCurrentTimeSpent(timeSpent + elapsed);
      }, 1000);
    } else {
      // If timer is not running, just show the accumulated time
      setCurrentTimeSpent(timeSpent);
    }

    return () => clearInterval(interval);
  }, [timerStarted, timeSpent]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 w-[50%] md:w-[30%] bg-background border border-border rounded-lg p-2 md:p-3 shadow-lg z-50 transition-all duration-300 ease-in-out",
        timerStarted ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-medium text-xs md:text-sm truncate">
              {taskTitle}
            </h3>
          </div>

          <div className="flex items-center space-x-1 md:space-x-2">
            <span className="text-xs md:text-sm font-mono">
              {formatTime(currentTimeSpent)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={timerStarted ? onPause : onResume}
            >
              {timerStarted ? (
                <Pause className="h-3 w-3 md:h-4 md:w-4" />
              ) : (
                <Play className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onClose}
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Progress value={getProgressPercentage()} className="h-1.5" />
          <span className="text-xs text-muted-foreground min-w-[60px] text-right">
            -{getRemainingTime()}
          </span>
        </div>
      </div>
    </div>
  );
};

export { ActiveTimerBanner };
