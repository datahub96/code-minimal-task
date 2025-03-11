import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Play, Pause, Timer, Split, Check } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskItemProps {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  completed: boolean;
  timerStarted?: number;
  timeSpent?: number;
  expectedTime?: number;
  phase?: number;
  onComplete?: () => void;
  onTimerToggle?: (id: string, isRunning: boolean) => void;
  onSplitTask?: (
    taskId: string,
    timeSpentOnCompleted: number,
    remainingTime: number,
  ) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  description,
  deadline,
  completed,
  timerStarted,
  timeSpent = 0,
  expectedTime = 3600000, // Default 1 hour
  phase = 1,
  onComplete = () => {},
  onTimerToggle = () => {},
  onSplitTask = () => {},
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(!!timerStarted);
  const [currentTimeSpent, setCurrentTimeSpent] = useState(timeSpent);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [splitTimeSpent, setSplitTimeSpent] = useState(
    Math.floor(timeSpent / (1000 * 60)),
  );

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

  const handleSplitTask = () => {
    // Stop timer if it's running
    if (isTimerRunning) {
      handleTimerToggle();
    }
    setIsSplitDialogOpen(true);
    // Initialize with current time spent in minutes
    setSplitTimeSpent(Math.floor(currentTimeSpent / (1000 * 60)));
  };

  const handleSplitConfirm = () => {
    // Convert minutes to milliseconds
    const timeSpentOnCompleted = splitTimeSpent * 60 * 1000;
    // Calculate remaining time for the new task
    const remainingTime = currentTimeSpent - timeSpentOnCompleted;

    // Stop timer if it's running
    if (isTimerRunning) {
      handleTimerToggle();
    }

    // Call the parent handler to actually split the task
    onSplitTask?.(id, timeSpentOnCompleted, remainingTime);
    setIsSplitDialogOpen(false);
  };

  return (
    <div className="flex flex-col p-3 md:p-4 bg-background border rounded-md">
      <div className="flex items-start gap-2 md:gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={onComplete}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm md:text-base truncate">
            {title}
            {phase > 1 && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Phase {phase})
              </span>
            )}
          </h3>
          {description && (
            <p className="text-muted-foreground text-xs md:text-sm mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!completed && currentTimeSpent > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
                    onClick={handleSplitTask}
                  >
                    <Split className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Split task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
                  onClick={handleTimerToggle}
                  disabled={completed}
                >
                  {isTimerRunning ? (
                    <Pause className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                  ) : (
                    <Play className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTimerRunning ? "Pause timer" : "Start timer"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground mt-2 ml-7">
        {(currentTimeSpent > 0 || isTimerRunning) && (
          <div className="flex items-center">
            <Timer className="h-3 w-3 mr-0.5 md:mr-1" />
            <span className={isTimerRunning ? "text-green-500" : ""}>
              {formatTimeSpent(currentTimeSpent)}
            </span>
          </div>
        )}

        {expectedTime > 0 && (
          <div className="flex items-center">
            <Timer className="h-3 w-3 mr-0.5 md:mr-1 text-blue-500" />
            <span className="text-blue-500">
              Est: {formatTimeSpent(expectedTime)}
            </span>
          </div>
        )}

        {deadline && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-0.5 md:mr-1" />
            {format(deadline, "M/d/yyyy")}
          </div>
        )}
      </div>

      {/* Split Task Dialog */}
      <Dialog open={isSplitDialogOpen} onOpenChange={setIsSplitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Split Task</DialogTitle>
            <DialogDescription>
              Divide this task into two parts. The first part will be marked as
              completed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="splitTime" className="col-span-4">
                Time spent on completed part (minutes):
              </Label>
              <Input
                id="splitTime"
                type="number"
                value={splitTimeSpent}
                onChange={(e) =>
                  setSplitTimeSpent(parseInt(e.target.value) || 0)
                }
                min={1}
                max={Math.floor(currentTimeSpent / (1000 * 60))}
                className="col-span-4"
              />
              <div className="col-span-4 text-sm text-muted-foreground">
                Total time spent: {formatTimeSpent(currentTimeSpent)}
                <br />
                Remaining for next phase:{" "}
                {formatTimeSpent(currentTimeSpent - splitTimeSpent * 60 * 1000)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSplitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSplitConfirm}>Split Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskItem;
