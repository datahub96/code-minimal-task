import React, { useState, useEffect } from "react";
import TaskList from "./TaskList";
import CompletedTasksDateFilter from "./CompletedTasksDateFilter";
import { StorageManager } from "@/components/storage/StorageManager";
import { isAfter, isBefore, isSameDay, subDays } from "date-fns";

interface CompletedTasksViewProps {
  tasks: any[];
  onTaskComplete?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskReorder?: (startIndex: number, endIndex: number) => void;
  onTimerToggle?: (taskId: string, isRunning: boolean) => void;
  onSplitTask?: (
    taskId: string,
    timeSpentOnCompleted: number,
    remainingTime: number,
  ) => void;
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({
  tasks,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onTaskReorder,
  onTimerToggle,
  onSplitTask,
}) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [dateFilter, setDateFilter] = useState<{
    startDate?: Date;
    endDate?: Date;
    filterType: "all" | "today" | "yesterday" | "week" | "custom";
  }>({ filterType: "all" });

  // Extract all completion dates from tasks for the date filter
  const taskDates = tasks
    .map((task) => (task.completedAt ? new Date(task.completedAt) : undefined))
    .filter((date) => date !== undefined) as Date[];

  // Apply date filtering when tasks or date filter changes
  useEffect(() => {
    if (dateFilter.filterType === "all") {
      setFilteredTasks(tasks);
      return;
    }

    const { startDate, endDate } = dateFilter;

    if (startDate && endDate) {
      // Filter tasks within date range
      const filtered = tasks.filter((task) => {
        const taskDate = task.completedAt
          ? new Date(task.completedAt)
          : task.deadline || new Date();

        return (
          (isSameDay(taskDate, startDate) || isAfter(taskDate, startDate)) &&
          (isSameDay(taskDate, endDate) || isBefore(taskDate, endDate))
        );
      });
      setFilteredTasks(filtered);
    } else if (startDate) {
      // Filter tasks for a specific day
      const filtered = tasks.filter((task) => {
        const taskDate = task.completedAt
          ? new Date(task.completedAt)
          : task.deadline || new Date();
        return isSameDay(taskDate, startDate);
      });
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  }, [tasks, dateFilter]);

  const handleDateFilterChange = (newDateFilter: {
    startDate?: Date;
    endDate?: Date;
    filterType: "all" | "today" | "yesterday" | "week" | "custom";
  }) => {
    setDateFilter(newDateFilter);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <CompletedTasksDateFilter
        onDateFilterChange={handleDateFilterChange}
        taskDates={taskDates}
      />

      <TaskList
        tasks={filteredTasks}
        onTaskComplete={onTaskComplete}
        onTaskEdit={onTaskEdit}
        onTaskDelete={onTaskDelete}
        onTaskReorder={onTaskReorder}
        onTimerToggle={onTimerToggle}
        onSplitTask={onSplitTask}
        viewMode="card"
      />
    </div>
  );
};

export default CompletedTasksView;
