import React, { useState } from "react";
import { format, isAfter, isBefore, isSameDay, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompletedTasksDateFilterProps {
  onDateFilterChange: (dateRange: {
    startDate?: Date;
    endDate?: Date;
    filterType: "all" | "today" | "yesterday" | "week" | "custom";
  }) => void;
  taskDates?: Date[];
}

const CompletedTasksDateFilter: React.FC<CompletedTasksDateFilterProps> = ({
  onDateFilterChange,
  taskDates = [],
}) => {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "today" | "yesterday" | "week" | "custom"
  >("all");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Count tasks per date for the badge indicators
  const getTaskCountForDate = (date: Date): number => {
    return taskDates.filter((taskDate) => taskDate && isSameDay(taskDate, date))
      .length;
  };

  // Apply filter based on selection
  const applyFilter = (
    filterType: "all" | "today" | "yesterday" | "week" | "custom",
  ) => {
    setSelectedFilter(filterType);

    const today = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (filterType) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "yesterday":
        startDate = subDays(today, 1);
        endDate = subDays(today, 1);
        break;
      case "week":
        startDate = subDays(today, 7);
        endDate = today;
        break;
      case "custom":
        if (customDateRange.from) {
          startDate = customDateRange.from;
          endDate = customDateRange.to || customDateRange.from;
        } else if (customDate) {
          startDate = customDate;
          endDate = customDate;
        }
        break;
      case "all":
      default:
        startDate = undefined;
        endDate = undefined;
        break;
    }

    onDateFilterChange({ startDate, endDate, filterType });
  };

  // Handle single date selection
  const handleDateSelect = (date: Date | undefined) => {
    setCustomDate(date);
    if (date) {
      setCustomDateRange({ from: undefined, to: undefined });
      applyFilter("custom");
    }
  };

  // Handle date range selection
  const handleDateRangeSelect = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setCustomDateRange(range);
    if (range.from) {
      setCustomDate(undefined);
      applyFilter("custom");
    }
  };

  return (
    <div className="bg-background border rounded-md p-3 mb-4">
      <h3 className="text-sm font-medium mb-3">
        Filter Completed Tasks by Date
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => applyFilter("all")}
          className="text-xs h-8"
        >
          All Time
        </Button>
        <Button
          variant={selectedFilter === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => applyFilter("today")}
          className="text-xs h-8"
        >
          Today
        </Button>
        <Button
          variant={selectedFilter === "yesterday" ? "default" : "outline"}
          size="sm"
          onClick={() => applyFilter("yesterday")}
          className="text-xs h-8"
        >
          Yesterday
        </Button>
        <Button
          variant={selectedFilter === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => applyFilter("week")}
          className="text-xs h-8"
        >
          Last 7 Days
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={selectedFilter === "custom" ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {selectedFilter === "custom" && customDate
                ? format(customDate, "MMM d, yyyy")
                : selectedFilter === "custom" && customDateRange.from
                  ? `${format(customDateRange.from, "MMM d")}${customDateRange.to ? ` - ${format(customDateRange.to, "MMM d")}` : ""}`
                  : "Custom Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={handleDateSelect}
              initialFocus
              modifiers={{
                hasTasks: taskDates.filter(
                  (date) => date !== undefined,
                ) as Date[],
              }}
              modifiersStyles={{
                hasTasks: {
                  fontWeight: "bold",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                },
              }}
              components={{
                DayContent: ({ date }) => {
                  const count = getTaskCountForDate(date);
                  return (
                    <div className="relative">
                      {format(date, "d")}
                      {count > 0 && (
                        <Badge
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-primary text-primary-foreground"
                          variant="default"
                        >
                          {count}
                        </Badge>
                      )}
                    </div>
                  );
                },
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {selectedFilter === "custom" && (
        <div className="text-xs text-muted-foreground">
          {customDate
            ? `Showing tasks completed on ${format(customDate, "MMMM d, yyyy")}`
            : customDateRange.from
              ? `Showing tasks from ${format(customDateRange.from, "MMMM d, yyyy")}${customDateRange.to ? ` to ${format(customDateRange.to, "MMMM d, yyyy")}` : ""}`
              : "Select a date to filter tasks"}
        </div>
      )}
    </div>
  );
};

export default CompletedTasksDateFilter;
