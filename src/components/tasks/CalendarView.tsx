import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

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
  tasks = [
    {
      id: "1",
      title: "Complete project proposal",
      description: "Finish the draft and send for review",
      deadline: new Date(2023, 5, 15),
      category: { name: "Work", color: "bg-blue-500" },
      completed: false,
    },
    {
      id: "2",
      title: "Grocery shopping",
      deadline: new Date(2023, 5, 16),
      category: { name: "Personal", color: "bg-green-500" },
      completed: false,
    },
    {
      id: "3",
      title: "Dentist appointment",
      deadline: new Date(2023, 5, 18),
      category: { name: "Health", color: "bg-red-500" },
      completed: false,
    },
    {
      id: "4",
      title: "Team meeting",
      deadline: new Date(2023, 5, 20),
      category: { name: "Work", color: "bg-blue-500" },
      completed: false,
    },
    {
      id: "5",
      title: "Birthday party",
      deadline: new Date(2023, 5, 22),
      category: { name: "Social", color: "bg-purple-500" },
      completed: false,
    },
  ],
  onTaskClick = () => {},
  onAddTask = () => {},
  onDateChange = () => {},
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateChange(date);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => isSameDay(task.deadline, date));
  };

  // Custom day renderer to show task indicators
  const renderDay = (day: Date) => {
    const dayTasks = getTasksForDate(day);
    const hasCompletedTasks = dayTasks.some((task) => task.completed);
    const hasIncompleteTasks = dayTasks.some((task) => !task.completed);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {day.getDate()}
        {dayTasks.length > 0 && (
          <div className="absolute -bottom-1 flex gap-1 justify-center">
            {hasIncompleteTasks && (
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            )}
            {hasCompletedTasks && (
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-md border">
      <div className="flex items-center justify-between p-2 md:p-4 border-b">
        <h2 className="text-lg md:text-xl font-semibold">Calendar View</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 flex-1 h-[calc(100%-4rem)]">
        <div className="lg:col-span-5 p-2 md:p-4 overflow-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full rounded-md border shadow-sm"
            components={{
              Day: ({ date, ...props }) => (
                <div {...props} className="p-3 relative">
                  {renderDay(date)}
                </div>
              ),
              DayContent: (props) => (
                <div className="h-10 w-10 p-0 font-normal aria-selected:opacity-100">
                  {props.children}
                </div>
              ),
            }}
          />
        </div>

        <div className="lg:col-span-2 border-l p-2 md:p-4 overflow-auto">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">
                  {selectedDate
                    ? format(selectedDate, "MMMM d, yyyy")
                    : "Select a date"}
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => selectedDate && onAddTask(selectedDate)}
                        className="p-1 rounded-full hover:bg-muted"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add task for this date</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
                  <div className="space-y-3">
                    {getTasksForDate(selectedDate).length > 0 ? (
                      getTasksForDate(selectedDate).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick(task.id)}
                          className={`p-3 rounded-md border cursor-pointer hover:bg-muted transition-colors ${task.completed ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <h3
                              className={`font-medium ${task.completed ? "line-through" : ""}`}
                            >
                              {task.title}
                            </h3>
                            <Badge
                              style={{ backgroundColor: task.category.color }}
                              className="text-white"
                            >
                              {task.category.name}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No tasks for this date
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a date to view tasks
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
