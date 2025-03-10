import React, { useState } from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Check, Clock, Edit, Trash2, Timer, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  category?: {
    name: string;
    color: string;
  };
  completed: boolean;
  timerStarted?: number;
  timeSpent?: number;
  expectedTime?: number;
}

interface TaskListProps {
  tasks?: Task[];
  onTaskComplete?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskReorder?: (startIndex: number, endIndex: number) => void;
  onTimerToggle?: (taskId: string, isRunning: boolean) => void;
  viewMode?: "list" | "card";
}

// Helper function to format time in HH:MM:SS
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// Animation duration in ms
const ANIMATION_DURATION = 500;

const TaskItem = ({
  task = {
    id: "1",
    title: "Example Task",
    description: "This is a placeholder task",
    deadline: new Date(Date.now() + 86400000), // tomorrow
    category: { name: "Work", color: "blue" },
    completed: false,
    timerStarted: undefined,
    timeSpent: 0,
    expectedTime: 3600000, // 1 hour
  },
  onComplete,
  onEdit,
  onDelete,
  onTimerToggle,
  viewMode = "list",
}: {
  task?: Task;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTimerToggle?: (isRunning: boolean) => void;
  viewMode?: "list" | "card";
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle completion with animation
  const handleComplete = () => {
    if (!task.completed) {
      setIsAnimating(true);

      // Call the completion handler after animation
      setTimeout(() => {
        onComplete?.();
      }, ANIMATION_DURATION);
    } else {
      // If already completed, just call the handler
      onComplete?.();
    }
  };

  // Show completed tasks differently
  const completedStyle = task.completed ? "opacity-60 line-through" : "";

  if (viewMode === "card") {
    return (
      <Card
        className={`mb-2 p-2 md:p-3 bg-white dark:bg-gray-800 border-t-4 flex flex-col gap-1 md:gap-2 group hover:shadow-md transition-all rounded-md ${isAnimating ? "opacity-0 scale-95 transform" : "opacity-100"} ${completedStyle}`}
        style={{
          borderTopColor: task.category?.color || "#cbd5e1",
          transition: `opacity ${ANIMATION_DURATION}ms ease-out, transform ${ANIMATION_DURATION}ms ease-out`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleComplete}
              className="h-5 w-5"
            />
            <h3
              className={cn(
                "font-medium text-xs md:text-sm",
                task.completed &&
                  "line-through text-gray-500 dark:text-gray-400",
              )}
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onTimerToggle?.(task.timerStarted ? false : true)
                    }
                    className="h-8 w-8"
                  >
                    {task.timerStarted ? (
                      <Pause className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Play className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.timerStarted ? "Pause timer" : "Start timer"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {task.category && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: `${task.category.color}20`,
                borderColor: task.category.color,
              }}
            >
              {task.category.name}
            </Badge>
          )}

          <div className="flex items-center gap-2">
            {task.timeSpent > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Timer className="h-3 w-3 mr-1" />
                      {formatTime(task.timeSpent)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Time spent on task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {task.expectedTime > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-blue-500 dark:text-blue-400">
                      <Timer className="h-3 w-3 mr-1" />
                      Est: {formatTime(task.expectedTime)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected time to complete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {task.deadline && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.deadline.toLocaleDateString()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Due {task.deadline.toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`mb-2 p-2 md:p-4 bg-white dark:bg-gray-800 border-l-4 flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 group hover:shadow-md transition-all ${isAnimating ? "opacity-0 transform -translate-x-10" : "opacity-100"} ${completedStyle}`}
      style={{
        borderLeftColor: task.category?.color || "#cbd5e1",
        transition: `opacity ${ANIMATION_DURATION}ms ease-out, transform ${ANIMATION_DURATION}ms ease-out`,
      }}
    >
      <div className="flex-shrink-0">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleComplete}
          className="h-5 w-5"
        />
      </div>

      <div className="flex-shrink-0 cursor-move opacity-50 hover:opacity-100">
        <DragHandleDots2Icon className="h-5 w-5" />
      </div>

      <div className="flex-grow min-w-[150px]">
        <h3
          className={cn(
            "font-medium text-xs md:text-sm",
            task.completed && "line-through text-gray-500 dark:text-gray-400",
          )}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 md:gap-2 w-full md:w-auto order-last md:order-none mt-2 md:mt-0">
        {task.category && (
          <Badge
            variant="outline"
            className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1"
            style={{
              backgroundColor: `${task.category.color}20`,
              borderColor: task.category.color,
            }}
          >
            {task.category.name}
          </Badge>
        )}

        {task.timeSpent > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                  <Timer className="h-3 w-3 mr-0.5 md:mr-1" />
                  {formatTime(task.timeSpent)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time spent on task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {task.expectedTime > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-[10px] md:text-xs text-blue-500 dark:text-blue-400">
                  <Timer className="h-3 w-3 mr-0.5 md:mr-1" />
                  Est: {formatTime(task.expectedTime)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expected time to complete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {task.deadline && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-0.5 md:mr-1" />
                  {task.deadline.toLocaleDateString()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Due {task.deadline.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  onTimerToggle?.(task.timerStarted ? false : true)
                }
                className="h-7 w-7 md:h-8 md:w-8 p-0"
              >
                {task.timerStarted ? (
                  <Pause className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                ) : (
                  <Play className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{task.timerStarted ? "Pause timer" : "Start timer"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-7 w-7 md:h-8 md:w-8 p-0"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 md:h-8 md:w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Function to filter tasks based on status
const filterTasks = (tasks: Task[], showCompleted: boolean = false): Task[] => {
  return tasks.filter((task) => (showCompleted ? true : !task.completed));
};

const TaskList = ({
  tasks = [
    {
      id: "1",
      title: "Complete project proposal",
      description: "Finish the draft and send for review",
      deadline: new Date(Date.now() + 86400000 * 2),
      category: { name: "Work", color: "#3b82f6" },
      completed: false,
      timeSpent: 0,
    },
    {
      id: "2",
      title: "Buy groceries",
      description: "Milk, eggs, bread, and vegetables",
      deadline: new Date(Date.now() + 86400000),
      category: { name: "Personal", color: "#10b981" },
      completed: false,
      timeSpent: 0,
    },
    {
      id: "3",
      title: "Schedule dentist appointment",
      deadline: new Date(Date.now() + 86400000 * 7),
      category: { name: "Health", color: "#ef4444" },
      completed: true,
      timeSpent: 3600000, // 1 hour
    },
    {
      id: "4",
      title: "Review team presentation",
      deadline: new Date(Date.now() + 86400000 * 3),
      category: { name: "Work", color: "#3b82f6" },
      completed: false,
      timeSpent: 0,
    },
    {
      id: "5",
      title: "Plan weekend trip",
      description: "Research hotels and activities",
      category: { name: "Personal", color: "#10b981" },
      completed: false,
      timeSpent: 0,
    },
  ],
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onTaskReorder,
  onTimerToggle,
  viewMode = "list",
}: TaskListProps) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null,
  );

  // Determine if we should show completed tasks based on URL parameters or filters
  const urlParams = new URLSearchParams(window.location.search);
  const showCompleted =
    urlParams.get("status") === "Completed" ||
    tasks.every((task) => task.completed);

  // Always show all tasks, regardless of completion status
  const visibleTasks = tasks;

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItemIndex(index);
  };

  const handleDrop = () => {
    if (
      draggedItemIndex !== null &&
      dragOverItemIndex !== null &&
      draggedItemIndex !== dragOverItemIndex
    ) {
      // Call the parent handler if provided
      onTaskReorder?.(draggedItemIndex, dragOverItemIndex);
    }
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-2 md:p-4 rounded-md overflow-y-auto">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
          {showCompleted ? "Completed Tasks" : "My Tasks"}
        </h2>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {visibleTasks.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              {showCompleted
                ? "No completed tasks yet."
                : "No tasks yet. Add your first task to get started!"}
            </div>
          ) : (
            visibleTasks.map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className={cn(
                  dragOverItemIndex === index
                    ? "border-2 border-dashed border-blue-400 rounded-md"
                    : "",
                )}
              >
                <TaskItem
                  task={task}
                  onComplete={() => onTaskComplete?.(task.id)}
                  onEdit={() => onTaskEdit?.(task.id)}
                  onDelete={() => onTaskDelete?.(task.id)}
                  onTimerToggle={(isRunning) =>
                    onTimerToggle?.(task.id, isRunning)
                  }
                  viewMode="card"
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {showCompleted
                ? "No completed tasks yet."
                : "No tasks yet. Add your first task to get started!"}
            </div>
          ) : (
            visibleTasks.map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className={cn(
                  dragOverItemIndex === index
                    ? "border-2 border-dashed border-blue-400 rounded-md"
                    : "",
                )}
              >
                <TaskItem
                  task={task}
                  onComplete={() => onTaskComplete?.(task.id)}
                  onEdit={() => onTaskEdit?.(task.id)}
                  onDelete={() => onTaskDelete?.(task.id)}
                  onTimerToggle={(isRunning) =>
                    onTimerToggle?.(task.id, isRunning)
                  }
                  viewMode="list"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;
