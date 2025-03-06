import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Play, Pause, Timer } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskItemProps {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  completed: boolean;
  timerStarted?: number;
  timeSpent?: number;
  onComplete?: () => void;
  onTimerToggle?: (id: string, isRunning: boolean) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  description,
  deadline,
  completed,
  timerStarted,
  timeSpent = 0,
  onComplete = () => {},
  onTimerToggle = () => {},
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(!!timerStarted);
  const [currentTimeSpent, setCurrentTimeSpent] = useState(timeSpent);

  // Format time spent in a readable format (HH:MM:SS)
  const formatTimeSpent = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate current time spent if timer is running
  React.useEffect(() => {
    let interval: number;

    if (isTimerRunning && timerStarted) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - timerStarted;
        setCurrentTimeSpent(timeSpent + elapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timerStarted, timeSpent]);

  const handleTimerToggle = () => {
    const newIsRunning = !isTimerRunning;
    setIsTimerRunning(newIsRunning);
    onTimerToggle(id, newIsRunning);
  };
  return (
    <div className="flex flex-col p-4 bg-background border rounded-md">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={onComplete}
          className="mt-1"
        />
        <div className="flex-1">
          <h3 className="font-medium text-base">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleTimerToggle}
                disabled={completed}
              >
                {isTimerRunning ? (
                  <Pause className="h-4 w-4 text-amber-500" />
                ) : (
                  <Play className="h-4 w-4 text-green-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isTimerRunning ? "Pause timer" : "Start timer"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 ml-7">
        {(currentTimeSpent > 0 || isTimerRunning) && (
          <div className="flex items-center">
            <Timer className="h-3 w-3 mr-1" />
            <span className={isTimerRunning ? "text-green-500" : ""}>
              {formatTimeSpent(currentTimeSpent)}
            </span>
          </div>
        )}

        {deadline && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {format(deadline, "M/d/yyyy")}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
