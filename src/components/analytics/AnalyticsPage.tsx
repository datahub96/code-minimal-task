import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  format,
  differenceInDays,
  isThisWeek,
  isThisMonth,
  isToday,
} from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Clock,
  Calendar,
  CheckCircle,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  timerStarted?: number;
  timeSpent?: number;
  createdAt?: string;
  completedAt?: string;
}

interface AnalyticsPageProps {
  userId?: string;
}

// Color palette for charts
const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeFrame, setTimeFrame] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("today");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tasks from localStorage
    const loadTasks = async () => {
      setLoading(true);
      try {
        // Get current user
        const userJson = localStorage.getItem("taskManagerUser");
        if (!userJson) {
          setTasks([]);
          setLoading(false);
          return;
        }

        try {
          const user = JSON.parse(userJson);
          const currentUserId = user.id;

          // Try to load from database first if available
          try {
            const { getTasks } = await import("@/lib/database");
            const dbTasks = await getTasks(currentUserId);

            if (dbTasks && dbTasks.length > 0) {
              // Process tasks from database
              const processedTasks = dbTasks.map((task: any) => ({
                ...task,
                deadline:
                  task.deadline instanceof Date
                    ? task.deadline
                    : task.deadline
                      ? new Date(task.deadline)
                      : undefined,
                createdAt:
                  task.createdAt ||
                  new Date(
                    Date.now() - Math.random() * 30 * 86400000,
                  ).toISOString(),
                completedAt: task.completed
                  ? task.completedAt ||
                    new Date(
                      Date.now() - Math.random() * 15 * 86400000,
                    ).toISOString()
                  : undefined,
              }));

              console.log(
                `Analytics loaded ${processedTasks.length} tasks from database, ${processedTasks.filter((t) => t.completed).length} completed`,
              );
              setTasks(processedTasks);
              setLoading(false);
              return;
            }
          } catch (dbError) {
            console.error("Error loading tasks from database:", dbError);
            // Fall back to localStorage
          }

          // Get tasks for the current user from localStorage
          const tasksJson =
            localStorage.getItem(`taskManagerTasks_${currentUserId}`) ||
            localStorage.getItem("taskManagerTasks");

          if (!tasksJson) {
            setTasks([]);
            setLoading(false);
            return;
          }

          const parsedTasks = JSON.parse(tasksJson);
          // Convert ISO date strings back to Date objects
          const tasksWithDates = parsedTasks.map((task: any) => ({
            ...task,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
            // Add created and completed dates if they don't exist (for demo purposes)
            createdAt:
              task.createdAt ||
              new Date(
                Date.now() - Math.random() * 30 * 86400000,
              ).toISOString(),
            completedAt: task.completed
              ? task.completedAt ||
                new Date(
                  Date.now() - Math.random() * 15 * 86400000,
                ).toISOString()
              : undefined,
          }));

          console.log(
            `Analytics loaded ${tasksWithDates.length} tasks from localStorage, ${tasksWithDates.filter((t) => t.completed).length} completed`,
          );
          setTasks(tasksWithDates);
        } catch (error) {
          console.error("Error parsing user data:", error);
          setTasks([]);
        }
      } catch (error) {
        console.error("Error loading tasks for analytics:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [userId]);

  // Filter tasks based on time frame
  const getFilteredTasks = () => {
    if (timeFrame === "all") return tasks;

    return tasks.filter((task) => {
      const taskDate =
        task.deadline ||
        (task.completedAt
          ? new Date(task.completedAt)
          : task.createdAt
            ? new Date(task.createdAt)
            : new Date());
      if (timeFrame === "today") return isToday(taskDate);
      if (timeFrame === "week") return isThisWeek(taskDate);
      if (timeFrame === "month") return isThisMonth(taskDate);
      if (
        timeFrame === "custom" &&
        customDateRange.from &&
        customDateRange.to
      ) {
        const from = new Date(customDateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(customDateRange.to);
        to.setHours(23, 59, 59, 999);
        return taskDate >= from && taskDate <= to;
      }
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // Calculate analytics data
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((task) => task.completed).length;
  console.log(
    `Analytics found ${completedTasks} completed tasks out of ${totalTasks} total tasks`,
  );
  const pendingTasks = totalTasks - completedTasks;
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate total time spent
  const totalTimeSpent = filteredTasks.reduce(
    (total, task) => total + (task.timeSpent || 0),
    0,
  );

  // Format time spent in hours and minutes
  const formatTimeSpent = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Calculate average completion time
  const completedTasksWithTime = filteredTasks.filter(
    (task) => task.completed && task.timeSpent,
  );
  const averageTimeSpent =
    completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce(
          (total, task) => total + (task.timeSpent || 0),
          0,
        ) / completedTasksWithTime.length
      : 0;

  // Calculate time spent by category
  const timeByCategory = filteredTasks.reduce(
    (acc: Record<string, number>, task) => {
      const categoryName = task.category?.name || "Uncategorized";
      if (!acc[categoryName]) acc[categoryName] = 0;
      acc[categoryName] += task.timeSpent || 0;
      return acc;
    },
    {},
  );

  const timeByCategoryData = Object.entries(timeByCategory).map(
    ([name, value]) => ({
      name,
      value,
      color:
        filteredTasks.find((task) => task.category?.name === name)?.category
          ?.color || COLORS[0],
    }),
  );

  // Calculate tasks by category
  const tasksByCategory = filteredTasks.reduce(
    (acc: Record<string, number>, task) => {
      const categoryName = task.category?.name || "Uncategorized";
      if (!acc[categoryName]) acc[categoryName] = 0;
      acc[categoryName] += 1;
      return acc;
    },
    {},
  );

  const tasksByCategoryData = Object.entries(tasksByCategory).map(
    ([name, value], index) => ({
      name,
      value,
      color:
        filteredTasks.find((task) => task.category?.name === name)?.category
          ?.color || COLORS[index % COLORS.length],
    }),
  );

  // Calculate completion rate by category
  const completionRateByCategory = filteredTasks.reduce(
    (acc: Record<string, { total: number; completed: number }>, task) => {
      const categoryName = task.category?.name || "Uncategorized";
      if (!acc[categoryName]) acc[categoryName] = { total: 0, completed: 0 };
      acc[categoryName].total += 1;
      if (task.completed) acc[categoryName].completed += 1;
      return acc;
    },
    {},
  );

  const completionRateByCategoryData = Object.entries(
    completionRateByCategory,
  ).map(([name, { total, completed }], index) => ({
    name,
    rate: total > 0 ? (completed / total) * 100 : 0,
    color:
      filteredTasks.find((task) => task.category?.name === name)?.category
        ?.color || COLORS[index % COLORS.length],
  }));

  // Calculate tasks by day of week
  const tasksByDayOfWeek = filteredTasks.reduce(
    (acc: Record<string, number>, task) => {
      const date =
        task.deadline ||
        (task.createdAt ? new Date(task.createdAt) : new Date());
      const dayOfWeek = format(date, "EEEE"); // Monday, Tuesday, etc.
      if (!acc[dayOfWeek]) acc[dayOfWeek] = 0;
      acc[dayOfWeek] += 1;
      return acc;
    },
    {},
  );

  // Ensure all days of the week are represented
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const tasksByDayOfWeekData = daysOfWeek.map((day) => ({
    name: day,
    tasks: tasksByDayOfWeek[day] || 0,
  }));

  // Calculate recent activity
  const recentActivity = [...filteredTasks]
    .sort((a, b) => {
      const dateA = a.completedAt
        ? new Date(a.completedAt)
        : a.createdAt
          ? new Date(a.createdAt)
          : new Date();
      const dateB = b.completedAt
        ? new Date(b.completedAt)
        : b.createdAt
          ? new Date(b.createdAt)
          : new Date();
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Function to download report
  const downloadReport = () => {
    // Generate CSV data
    const headers = [
      "Title",
      "Category",
      "Status",
      "Time Spent",
      "Created",
      "Completed",
    ];
    const rows = filteredTasks.map((task) => [
      task.title,
      task.category?.name || "Uncategorized",
      task.completed ? "Completed" : "Pending",
      formatTimeSpent(task.timeSpent || 0),
      task.createdAt ? format(new Date(task.createdAt), "yyyy-MM-dd") : "",
      task.completedAt ? format(new Date(task.completedAt), "yyyy-MM-dd") : "",
    ]);

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `task-report-${timeFrame}-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-background p-2 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your productivity and task management metrics
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <select
            className="bg-background border rounded-md px-2 py-1 text-xs md:text-sm max-w-[100px] md:max-w-none"
            value={timeFrame}
            onChange={(e) => {
              const value = e.target.value as
                | "all"
                | "today"
                | "week"
                | "month"
                | "custom";
              setTimeFrame(value);
              if (value !== "custom") {
                setCustomDateRange({ from: undefined, to: undefined });
              }
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date</option>
          </select>

          {timeFrame === "custom" && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                className="bg-background border rounded-md px-2 py-1 text-xs md:text-sm"
                value={
                  customDateRange.from
                    ? format(customDateRange.from, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value)
                    : undefined;
                  setCustomDateRange((prev) => ({ ...prev, from: date }));
                }}
              />
              <span className="text-xs">to</span>
              <input
                type="date"
                className="bg-background border rounded-md px-2 py-1 text-xs md:text-sm"
                value={
                  customDateRange.to
                    ? format(customDateRange.to, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value)
                    : undefined;
                  setCustomDateRange((prev) => ({ ...prev, to: date }));
                }}
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 px-2 md:px-3 h-8"
            onClick={downloadReport}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline text-xs md:text-sm">
              Download
            </span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4 overflow-x-auto">
          <TabsTrigger
            value="overview"
            className="text-xs md:text-sm px-2 md:px-4"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger value="time" className="text-xs md:text-sm px-2 md:px-4">
            Time
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="text-xs md:text-sm px-2 md:px-4"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger
            value="taskGroups"
            className="text-xs md:text-sm px-2 md:px-4"
          >
            Task Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingTasks} pending, {completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completionRate.toFixed(0)}%
                </div>
                <Progress value={completionRate} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Time Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTimeSpent(totalTimeSpent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across{" "}
                  {
                    filteredTasks.filter((t) => t.timeSpent && t.timeSpent > 0)
                      .length
                  }{" "}
                  tracked tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTimeSpent(averageTimeSpent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per completed task
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5" /> Hours by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {timeByCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={30}
                        cornerRadius={6}
                        paddingAngle={4}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {timeByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatTimeSpent(value as number),
                          "Hours Spent",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" /> Hours by Day of Week
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {(() => {
                  // Calculate hours by day of week and category
                  const hoursByDayOfWeekAndCategory: Record<
                    string,
                    Record<string, number>
                  > = {};
                  const categoryColors: Record<string, string> = {};

                  // Initialize days of the week
                  const daysOfWeek = [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ];

                  daysOfWeek.forEach((day) => {
                    hoursByDayOfWeekAndCategory[day] = {};
                  });

                  // Collect data by day and category
                  filteredTasks.forEach((task) => {
                    if (!task.timeSpent) return;

                    const date =
                      task.deadline ||
                      (task.createdAt ? new Date(task.createdAt) : new Date());
                    const dayOfWeek = format(date, "EEEE");
                    const categoryName = task.category?.name || "Uncategorized";

                    // Store category color
                    if (!categoryColors[categoryName] && task.category?.color) {
                      categoryColors[categoryName] = task.category.color;
                    } else if (!categoryColors[categoryName]) {
                      // Assign a color from the COLORS array if not already assigned
                      const existingCategories =
                        Object.keys(categoryColors).length;
                      categoryColors[categoryName] =
                        COLORS[existingCategories % COLORS.length];
                    }

                    // Add hours to the appropriate day and category
                    if (!hoursByDayOfWeekAndCategory[dayOfWeek][categoryName]) {
                      hoursByDayOfWeekAndCategory[dayOfWeek][categoryName] = 0;
                    }
                    hoursByDayOfWeekAndCategory[dayOfWeek][categoryName] +=
                      task.timeSpent;
                  });

                  // Format data for the stacked bar chart
                  const stackedData = daysOfWeek.map((day) => {
                    const dayData: Record<string, any> = { name: day };
                    Object.keys(categoryColors).forEach((category) => {
                      dayData[category] =
                        hoursByDayOfWeekAndCategory[day][category] || 0;
                    });
                    return dayData;
                  });

                  // Check if we have any data to display
                  const hasData = stackedData.some((day) =>
                    Object.keys(day).some(
                      (key) => key !== "name" && day[key] > 0,
                    ),
                  );

                  return hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stackedData}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis
                          tickFormatter={(value) =>
                            `${Math.floor(value / (1000 * 60 * 60))}h`
                          }
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatTimeSpent(value as number),
                            name as string,
                          ]}
                        />
                        <Legend />
                        {Object.keys(categoryColors).map((category) => (
                          <Bar
                            key={category}
                            dataKey={category}
                            stackId="a"
                            name={category}
                            fill={categoryColors[category]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Clock className="mr-2 h-5 w-5" /> Time Spent by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {timeByCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={30}
                        cornerRadius={6}
                        paddingAngle={4}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {timeByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatTimeSpent(value as number),
                          "Time Spent",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      No time tracking data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Activity className="mr-2 h-5 w-5" /> Most Time-Intensive
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {filteredTasks
                    .filter((task) => task.timeSpent && task.timeSpent > 0)
                    .sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0))
                    .slice(0, 10)
                    .map((task) => (
                      <div key={task.id} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">
                              {task.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {task.category?.name || "Uncategorized"} •{" "}
                              {task.completed ? "Completed" : "Pending"}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {formatTimeSpent(task.timeSpent || 0)}
                          </div>
                        </div>
                        <Progress
                          value={
                            ((task.timeSpent || 0) /
                              (filteredTasks[0]?.timeSpent || 1)) *
                            100
                          }
                          className="h-1 mt-2"
                        />
                      </div>
                    ))}
                  {filteredTasks.filter(
                    (task) => task.timeSpent && task.timeSpent > 0,
                  ).length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        No time tracking data available
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" /> Task Completion
                Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasksWithTime
                  .sort((a, b) => (a.timeSpent || 0) - (b.timeSpent || 0))
                  .slice(0, 6)
                  .map((task) => (
                    <Card key={task.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm truncate">
                          {task.title}
                        </h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {task.category?.name || "Uncategorized"}
                          </span>
                          <span className="text-xs font-medium">
                            {formatTimeSpent(task.timeSpent || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {completedTasksWithTime.length === 0 && (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      No completed tasks with time data
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taskGroups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Activity className="mr-2 h-5 w-5" /> Hours by Task Group
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {(() => {
                // Group tasks by their base name (removing phase information)
                const taskGroups: Record<
                  string,
                  {
                    totalTime: number;
                    tasks: Task[];
                    phases: number;
                    completed: number;
                    color?: string;
                  }
                > = {};

                // Process all tasks to identify groups
                filteredTasks.forEach((task) => {
                  // Extract base name by removing phase information
                  let baseName = task.title;
                  const phaseMatch = task.title.match(
                    /\s*\(Phase \d+( - Completed)?\)\s*/g,
                  );

                  if (phaseMatch) {
                    // Remove all phase information from the title
                    phaseMatch.forEach((match) => {
                      baseName = baseName.replace(match, "");
                    });

                    // Trim any extra whitespace
                    baseName = baseName.trim();
                  }

                  // Initialize group if it doesn't exist
                  if (!taskGroups[baseName]) {
                    taskGroups[baseName] = {
                      totalTime: 0,
                      tasks: [],
                      phases: 0,
                      completed: 0,
                      color:
                        task.category?.color ||
                        COLORS[Object.keys(taskGroups).length % COLORS.length],
                    };
                  }

                  // Add task to group
                  taskGroups[baseName].tasks.push(task);
                  taskGroups[baseName].totalTime += task.timeSpent || 0;
                  taskGroups[baseName].phases += 1;
                  if (task.completed) {
                    taskGroups[baseName].completed += 1;
                  }
                });

                // Convert to array for chart
                const taskGroupsArray = Object.entries(taskGroups)
                  .filter(([_, group]) => group.totalTime > 0) // Only include groups with time spent
                  .map(([name, group]) => ({
                    name:
                      name.length > 25 ? name.substring(0, 22) + "..." : name,
                    fullName: name,
                    hours: group.totalTime,
                    phases: group.phases,
                    completed: group.completed,
                    color: group.color,
                  }))
                  .sort((a, b) => b.hours - a.hours); // Sort by time spent

                return taskGroupsArray.length > 0 ? (
                  <div className="h-full flex flex-col">
                    <ResponsiveContainer width="100%" height="70%">
                      <BarChart
                        data={taskGroupsArray}
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <XAxis
                          type="number"
                          tickFormatter={(value) =>
                            `${Math.floor(value / (1000 * 60 * 60))}h`
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value, name, props) => [
                            formatTimeSpent(value as number),
                            "Hours Spent",
                          ]}
                          labelFormatter={(label) => {
                            const item = taskGroupsArray.find(
                              (item) => item.name === label,
                            );
                            return item?.fullName || label;
                          }}
                        />
                        <Bar dataKey="hours" name="Hours Spent">
                          {taskGroupsArray.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 overflow-auto max-h-[30%]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Task Group</th>
                            <th className="text-right py-2 px-2">Hours</th>
                            <th className="text-right py-2 px-2">Phases</th>
                            <th className="text-right py-2 px-2">Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskGroupsArray.map((group, index) => (
                            <tr
                              key={index}
                              className="border-b border-muted hover:bg-muted/50"
                            >
                              <td className="py-2 px-2 flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: group.color }}
                                />
                                <span
                                  className="truncate max-w-[200px]"
                                  title={group.fullName}
                                >
                                  {group.fullName}
                                </span>
                              </td>
                              <td className="text-right py-2 px-2">
                                {formatTimeSpent(group.hours)}
                              </td>
                              <td className="text-right py-2 px-2">
                                {group.phases}
                              </td>
                              <td className="text-right py-2 px-2">
                                {group.completed}/{group.phases}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      No task group data available
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" /> Task Group Completion
                Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Group tasks by their base name (removing phase information)
                const taskGroups: Record<
                  string,
                  {
                    totalTime: number;
                    tasks: Task[];
                    phases: number;
                    completed: number;
                    color?: string;
                    averageTimePerPhase: number;
                  }
                > = {};

                // Process all tasks to identify groups
                filteredTasks.forEach((task) => {
                  // Extract base name by removing phase information
                  let baseName = task.title;
                  const phaseMatch = task.title.match(
                    /\s*\(Phase \d+( - Completed)?\)\s*/g,
                  );

                  if (phaseMatch) {
                    // Remove all phase information from the title
                    phaseMatch.forEach((match) => {
                      baseName = baseName.replace(match, "");
                    });

                    // Trim any extra whitespace
                    baseName = baseName.trim();
                  }

                  // Initialize group if it doesn't exist
                  if (!taskGroups[baseName]) {
                    taskGroups[baseName] = {
                      totalTime: 0,
                      tasks: [],
                      phases: 0,
                      completed: 0,
                      color:
                        task.category?.color ||
                        COLORS[Object.keys(taskGroups).length % COLORS.length],
                      averageTimePerPhase: 0,
                    };
                  }

                  // Add task to group
                  taskGroups[baseName].tasks.push(task);
                  taskGroups[baseName].totalTime += task.timeSpent || 0;
                  taskGroups[baseName].phases += 1;
                  if (task.completed) {
                    taskGroups[baseName].completed += 1;
                  }
                });

                // Calculate average time per phase
                Object.values(taskGroups).forEach((group) => {
                  group.averageTimePerPhase =
                    group.phases > 0 ? group.totalTime / group.phases : 0;
                });

                // Convert to array for display
                const taskGroupsArray = Object.entries(taskGroups)
                  .filter(([_, group]) => group.phases > 1) // Only include groups with multiple phases
                  .map(([name, group]) => ({
                    name,
                    totalTime: group.totalTime,
                    phases: group.phases,
                    completed: group.completed,
                    averageTimePerPhase: group.averageTimePerPhase,
                    color: group.color,
                    completionRate:
                      group.phases > 0
                        ? (group.completed / group.phases) * 100
                        : 0,
                  }))
                  .sort((a, b) => b.totalTime - a.totalTime) // Sort by time spent
                  .slice(0, 6); // Show top 6 groups

                return taskGroupsArray.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taskGroupsArray.map((group, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: group.color }}
                            />
                            <h3
                              className="font-medium truncate"
                              title={group.name}
                            >
                              {group.name}
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Total Time
                              </p>
                              <p className="font-medium">
                                {formatTimeSpent(group.totalTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Phases
                              </p>
                              <p className="font-medium">{group.phases}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Avg Time/Phase
                              </p>
                              <p className="font-medium">
                                {formatTimeSpent(group.averageTimePerPhase)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Completion
                              </p>
                              <p className="font-medium">
                                {group.completed}/{group.phases}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex justify-between text-xs">
                              <span>Completion Rate</span>
                              <span>{group.completionRate.toFixed(0)}%</span>
                            </div>
                            <Progress
                              value={group.completionRate}
                              className="h-1 mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      No multi-phase task groups found
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Category Completion Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {completionRateByCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionRateByCategoryData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [
                          `${value.toFixed(0)}%`,
                          "Completion Rate",
                        ]}
                      />
                      <Bar
                        dataKey="rate"
                        name="Completion Rate"
                        radius={[4, 4, 0, 0]}
                      >
                        {completionRateByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      No category data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {Object.entries(tasksByCategory)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .map(([category, count]) => {
                      const categoryColor =
                        filteredTasks.find(
                          (task) => task.category?.name === category,
                        )?.category?.color || "#3b82f6";
                      const completed =
                        completionRateByCategory[category]?.completed || 0;
                      const total =
                        completionRateByCategory[category]?.total || 0;
                      const completionRate =
                        total > 0 ? (completed / total) * 100 : 0;

                      return (
                        <div key={category} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: categoryColor }}
                              />
                              <span className="font-medium text-sm">
                                {category}
                              </span>
                            </div>
                            <span className="text-sm">{count} tasks</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{completed} completed</span>
                            <span>
                              {completionRate.toFixed(0)}% completion rate
                            </span>
                          </div>
                          <Progress
                            value={completionRate}
                            className="h-1 mt-2"
                          />
                        </div>
                      );
                    })}
                  {Object.keys(tasksByCategory).length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        No category data available
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(tasksByCategory).map(([category, count]) => {
                  const categoryColor =
                    filteredTasks.find(
                      (task) => task.category?.name === category,
                    )?.category?.color || "#3b82f6";
                  const timeSpent = timeByCategory[category] || 0;
                  const completed =
                    completionRateByCategory[category]?.completed || 0;
                  const avgTimePerTask = count > 0 ? timeSpent / count : 0;

                  return (
                    <Card key={category} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <h3 className="font-medium">{category}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Tasks
                            </p>
                            <p className="font-medium">{count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Completed
                            </p>
                            <p className="font-medium">{completed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Time Spent
                            </p>
                            <p className="font-medium">
                              {formatTimeSpent(timeSpent)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Avg Time/Task
                            </p>
                            <p className="font-medium">
                              {formatTimeSpent(avgTimePerTask)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {Object.keys(tasksByCategory).length === 0 && (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      No category data available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
