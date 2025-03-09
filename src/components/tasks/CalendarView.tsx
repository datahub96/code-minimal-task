import React, { useState } from "react";
import {
  format,
  isSameDay,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: Date;
  category: {
    name: string;
    color: string;
  };
  completed: boolean;
}

interface CalendarViewProps {
  tasks?: Task[];
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (date: Date) => void;
  onDateChange?: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks = [],
  onTaskClick = () => {},
  onAddTask = () => {},
  onDateChange = () => {},
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [nextMonth, setNextMonth] = useState<Date>(addMonths(new Date(), 1));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setNextMonth(subMonths(nextMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setNextMonth(addMonths(nextMonth, 1));
  };

  // Function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => isSameDay(task.deadline, date));
  };

  // Generate calendar days for a month
  const generateCalendarDays = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const startDay = getDay(monthStart);

    // Create array for the days of the week header
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Create empty slots for days before the first day of the month
    const blanks = Array(startDay).fill(null);

    // Combine blanks and days
    const calendarDays = [...blanks, ...days];

    return { weekDays, calendarDays };
  };

  const renderMonthCalendar = (month: Date) => {
    const { weekDays, calendarDays } = generateCalendarDays(month);

    return (
      <div className="flex flex-col">
        <div className="text-xs font-semibold mb-2 text-center">
          {format(month, "MMMM yyyy")}
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-0.5">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="text-center text-[10px] font-medium text-gray-500 py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              // Empty cell for days before the start of the month
              return <div key={`empty-${index}`} className="h-10 p-1" />;
            }

            const dayTasks = getTasksForDate(day);
            const hasCompletedTasks = dayTasks.some((task) => task.completed);
            const hasIncompleteTasks = dayTasks.some((task) => !task.completed);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateSelect(day)}
                className={`h-8 p-0.5 relative flex flex-col items-center justify-center rounded-md transition-colors ${isCurrentDay ? "bg-primary/10 font-bold" : ""} ${isSelected ? "ring-1 ring-primary" : ""} hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <span
                  className={`text-xs ${isCurrentDay ? "text-primary" : ""}`}
                >
                  {format(day, "d")}
                </span>

                {/* Task indicators */}
                {(hasIncompleteTasks || hasCompletedTasks) && (
                  <div className="flex gap-0.5">
                    {hasIncompleteTasks && (
                      <div className="h-1 w-1 rounded-full bg-blue-500" />
                    )}
                    {hasCompletedTasks && (
                      <div className="h-1 w-1 rounded-full bg-green-500" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Calendar View</h2>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <span className="text-xs font-medium">
            {format(currentMonth, "MMM yyyy")} - {format(nextMonth, "MMM yyyy")}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-7 w-7"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 flex-1 h-[calc(100%-4rem)]">
        {/* Calendar section */}
        <div className="lg:col-span-5 p-2 md:p-4 overflow-auto border-r">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Current Month */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              {renderMonthCalendar(currentMonth)}
            </div>

            {/* Next Month */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              {renderMonthCalendar(nextMonth)}
            </div>
          </div>
        </div>

        {/* Selected day tasks */}
        <div className="lg:col-span-2 p-2 md:p-4 overflow-auto bg-gray-50 dark:bg-gray-800">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold">
                  {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() => onAddTask(selectedDate)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-3">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-2">
                  {getTasksForDate(selectedDate).length > 0 ? (
                    getTasksForDate(selectedDate).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task.id)}
                        className={`p-2 md:p-3 rounded-md border-l-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${task.completed ? "opacity-60" : ""}`}
                        style={{ borderLeftColor: task.category.color }}
                      >
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}
                          >
                            {task.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: `${task.category.color}20`,
                              borderColor: task.category.color,
                              color: task.category.color,
                            }}
                          >
                            {task.category.name}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No tasks for this date
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
