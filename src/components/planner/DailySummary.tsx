import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { StorageManager } from "@/components/storage/StorageManager";

interface DailySummaryProps {
  onClose?: () => void;
  onTaskClick?: (taskId: string) => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  category?: {
    name: string;
    color: string;
  };
  completed: boolean;
  timeSpent?: number;
  expectedTime?: number;
}

const DailySummary: React.FC<DailySummaryProps> = ({
  onClose = () => {},
  onTaskClick = () => {},
}) => {
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpectedTime, setTotalExpectedTime] = useState(0);
  const [totalRemainingTime, setTotalRemainingTime] = useState(0);

  // Format time spent in a readable format (HH:MM:SS)
  const formatTimeSpent = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours === 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Load tasks due today
  useEffect(() => {
    const loadTasks = () => {
      setLoading(true);
      try {
        // Get current user
        const userJson = StorageManager.getItem("taskManagerUser");
        if (!userJson) {
          setTodaysTasks([]);
          setLoading(false);
          return;
        }

        const user = JSON.parse(userJson);
        const currentUserId = user.id;

        // Get tasks for the current user
        const tasksJson =
          StorageManager.getItem(`taskManagerTasks_${currentUserId}`) ||
          StorageManager.getItem("taskManagerTasks");

        if (!tasksJson) {
          setTodaysTasks([]);
          setLoading(false);
          return;
        }

        const parsedTasks = JSON.parse(tasksJson);
        // Convert ISO date strings back to Date objects
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
        }));

        // Filter for tasks due today and not completed
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");

        const tasksForToday = tasksWithDates.filter((task: Task) => {
          if (!task.deadline || task.completed) return false;
          const taskDate = format(task.deadline, "yyyy-MM-dd");
          return taskDate === todayString;
        });

        // Calculate total expected time and remaining time
        let expectedTimeTotal = 0;
        let remainingTimeTotal = 0;

        tasksForToday.forEach((task: Task) => {
          const expected = task.expectedTime || 0;
          const spent = task.timeSpent || 0;
          const remaining = Math.max(0, expected - spent);

          expectedTimeTotal += expected;
          remainingTimeTotal += remaining;
        });

        setTotalExpectedTime(expectedTimeTotal);
        setTotalRemainingTime(remainingTimeTotal);
        setTodaysTasks(tasksForToday);
      } catch (error) {
        console.error("Error loading tasks:", error);
        setTodaysTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Today's Summary
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Expected Time
                </div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {formatTimeSpent(totalExpectedTime)}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Remaining Time
                </div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  {formatTimeSpent(totalRemainingTime)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4 text-amber-500" />
                Tasks Due Today ({todaysTasks.length})
              </h3>

              {todaysTasks.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 rounded-md">
                  No tasks due today
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {todaysTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => onTaskClick(task.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {task.description}
                              </div>
                            )}
                          </div>

                          {task.category && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs"
                              style={{
                                backgroundColor: `${task.category.color}20`,
                                borderColor: task.category.color,
                                color: task.category.color,
                              }}
                            >
                              {task.category.name}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          <span className="mr-2">
                            {formatTimeSpent(task.expectedTime || 0)}
                          </span>

                          {task.timeSpent && task.timeSpent > 0 && (
                            <>
                              <span className="mx-1">•</span>
                              <span>
                                {formatTimeSpent(task.timeSpent)} spent
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySummary;
