import React, { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import { StorageManager } from "@/components/storage/StorageManager";
import Header from "./layout/Header";
import TaskList from "./tasks/TaskList";
import CalendarView from "./tasks/CalendarView";
import FilterBar from "./filters/FilterBar";
import TaskForm from "./tasks/TaskForm";
import SettingsPanel from "./settings/SettingsPanel";
import AnalyticsPage from "./analytics/AnalyticsPage";
import DailyPlanner from "./planner/DailyPlanner";
import { Button } from "./ui/button";
import { Plus, BarChart2, Calendar, List } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

// Define task interface
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
  timerStarted?: number; // timestamp when timer was started
  timeSpent?: number; // time spent in milliseconds
  expectedTime?: number; // expected time to complete in milliseconds
}

// Sample tasks data
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Complete project proposal",
    description: "Finish the draft and send for review",
    deadline: new Date(Date.now() + 86400000 * 2),
    category: { name: "Work", color: "#3b82f6" },
    completed: false,
  },
  {
    id: "2",
    title: "Buy groceries",
    description: "Milk, eggs, bread, and vegetables",
    deadline: new Date(Date.now() + 86400000),
    category: { name: "Personal", color: "#10b981" },
    completed: false,
  },
  {
    id: "3",
    title: "Schedule dentist appointment",
    deadline: new Date(Date.now() + 86400000 * 7),
    category: { name: "Health", color: "#ef4444" },
    completed: true,
  },
  {
    id: "4",
    title: "Review team presentation",
    deadline: new Date(Date.now() + 86400000 * 3),
    category: { name: "Work", color: "#3b82f6" },
    completed: false,
  },
  {
    id: "5",
    title: "Plan weekend trip",
    description: "Research hotels and activities",
    category: { name: "Personal", color: "#10b981" },
    completed: false,
  },
];

const Home = () => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<
    "list" | "calendar" | "card" | "analytics"
  >("card");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [showPlannerOnLogin, setShowPlannerOnLogin] = useState(true);
  const [userSettings, setUserSettings] = useState({
    darkMode: false,
    defaultView: "card",
    notificationsEnabled: true,
    notificationTime: "30",
    categories: [
      { id: "1", name: "Work", color: "#3b82f6" },
      { id: "2", name: "Personal", color: "#10b981" },
      { id: "3", name: "Health", color: "#ef4444" },
      { id: "4", name: "Errands", color: "#f59e0b" },
      { id: "5", name: "Learning", color: "#8b5cf6" },
    ],
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState({});
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // Check system preference for dark mode on initial load
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Load user settings and tasks from localStorage when component mounts
  useEffect(() => {
    // Get current user
    try {
      const userJson = StorageManager.getItem("taskManagerUser");
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);

        // Show planner on login if enabled and this is a fresh login
        const hasShownPlanner = StorageManager.getItem(
          "plannerShownForSession",
        );
        if (showPlannerOnLogin && !hasShownPlanner) {
          setIsPlannerOpen(true);
          // Mark that we've shown the planner for this session
          StorageManager.setItem("plannerShownForSession", "true");
        }
      }

      // Load settings
      const savedSettings = StorageManager.getItem("taskManagerSettings");
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setUserSettings(parsedSettings);

          // Apply saved dark mode setting
          if (parsedSettings.darkMode !== isDarkMode) {
            setIsDarkMode(parsedSettings.darkMode);
            if (parsedSettings.darkMode) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }

          // Apply saved default view
          if (parsedSettings.defaultView) {
            setCurrentView(parsedSettings.defaultView);
          }

          // Apply saved planner setting
          if (parsedSettings.showPlannerOnLogin !== undefined) {
            setShowPlannerOnLogin(parsedSettings.showPlannerOnLogin);
          }
        } catch (error) {
          console.error("Error parsing settings:", error);
        }
      }

      // Load tasks
      const savedTasks = StorageManager.getItem("taskManagerTasks");
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          // Convert ISO date strings back to Date objects
          const tasksWithDates = parsedTasks.map((task: any) => ({
            ...task,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
          }));

          // Load all tasks but only show non-completed tasks by default
          const activeTasks = tasksWithDates.filter((task) => !task.completed);
          setTasks(activeTasks);
          console.log("Loaded tasks from localStorage:", activeTasks.length);
        } catch (error) {
          console.error("Error parsing tasks:", error);
          setTasks([]);
        }
      } else {
        console.log("No tasks found in localStorage");
        setTasks([]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  // Handle view toggle
  const handleViewChange = (
    view: "list" | "calendar" | "card" | "analytics",
  ) => {
    setCurrentView(view);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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

  // Task operations
  const handleTaskComplete = async (taskId: string) => {
    // Get all tasks from localStorage to ensure we have the complete set
    let allTasks = [];

    try {
      const savedTasks = localStorage.getItem("taskManagerTasks");
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        allTasks = parsedTasks.map((task: any) => ({
          ...task,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
        }));
      } else {
        allTasks = [...tasks]; // Fallback to current state
      }
    } catch (error) {
      console.error("Error parsing saved tasks:", error);
      allTasks = [...tasks]; // Fallback to current state
    }

    // Update the task completion status
    const updatedTasks = allTasks.map((task) => {
      if (task.id === taskId) {
        // If completing a task with a running timer, stop the timer and calculate final time
        let finalTimeSpent = task.timeSpent || 0;
        if (task.timerStarted && !task.completed) {
          const now = Date.now();
          finalTimeSpent += now - task.timerStarted;
        }

        return {
          ...task,
          completed: !task.completed,
          timerStarted: undefined, // Stop the timer when completing
          timeSpent: finalTimeSpent,
          completedAt: !task.completed ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    // Save all tasks to localStorage
    saveTasksToLocalStorage(updatedTasks);

    // Apply current filters to the updated tasks
    if (Object.keys(filters).length > 0) {
      handleFilterChange(filters);
    } else {
      // If no filters, show only non-completed tasks by default
      setTasks(updatedTasks.filter((task) => !task.completed));
    }
  };

  // Handle timer toggle
  const handleTimerToggle = async (taskId: string, isRunning: boolean) => {
    const now = Date.now();
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        if (isRunning) {
          // Start the timer
          return {
            ...task,
            timerStarted: now,
            timeSpent: task.timeSpent || 0,
          };
        } else {
          // Stop the timer and calculate elapsed time
          const elapsed = task.timerStarted ? now - task.timerStarted : 0;
          return {
            ...task,
            timerStarted: undefined,
            timeSpent: (task.timeSpent || 0) + elapsed,
          };
        }
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
  };

  // Helper function to save tasks to localStorage
  const saveTasksToLocalStorage = (tasksToSave: Task[]) => {
    try {
      // Convert Date objects to ISO strings for storage
      const tasksForStorage = tasksToSave.map((task) => ({
        ...task,
        deadline: task.deadline ? task.deadline.toISOString() : undefined,
      }));

      // Save to localStorage using StorageManager
      const success = StorageManager.setJSON(
        "taskManagerTasks",
        tasksForStorage,
      );

      // Save to user-specific storage if user is logged in
      if (currentUser?.id) {
        StorageManager.setJSON(
          `taskManagerTasks_${currentUser.id}`,
          tasksForStorage,
        );
      }

      if (!success) {
        // Import error codes
        try {
          const { logError, ErrorCodes } = require("@/lib/errorCodes");
          logError(
            ErrorCodes.STORAGE_WRITE_FAILED,
            new Error("Failed to save tasks"),
            {
              tasksCount: tasksForStorage.length,
              userId: currentUser?.id,
            },
          );
        } catch (importError) {
          console.error("Error importing error codes:", importError);
        }
        console.error("Failed to save tasks to localStorage");
      } else {
        console.log(
          `Successfully saved ${tasksForStorage.length} tasks to localStorage`,
        );
      }
    } catch (error) {
      // Import error codes
      try {
        const { logError, ErrorCodes } = require("@/lib/errorCodes");
        logError(ErrorCodes.TASK_UPDATE_FAILED, error, {
          method: "saveTasksToLocalStorage",
          tasksCount: tasksToSave.length,
          userId: currentUser?.id,
        });
      } catch (importError) {
        console.error("Error importing error codes:", importError);
      }
      console.error("Error saving tasks to localStorage:", error);
    }
  };

  const handleTaskEdit = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setIsTaskFormOpen(true);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const confirmTaskDelete = async () => {
    if (deleteTaskId) {
      try {
        const updatedTasks = tasks.filter((task) => task.id !== deleteTaskId);
        setTasks(updatedTasks);
        saveTasksToLocalStorage(updatedTasks);
        setDeleteTaskId(null);
      } catch (error) {
        // Import error codes
        let errorCode = "UNKNOWN";
        try {
          const { logError, ErrorCodes } = require("@/lib/errorCodes");
          errorCode = logError(ErrorCodes.TASK_DELETE_FAILED, error, {
            taskId: deleteTaskId,
          });
        } catch (importError) {
          console.error("Error importing error codes:", importError);
        }
        console.error("Error deleting task:", error);
        alert(
          `There was an error deleting the task. Please try again. (Error code: ${errorCode})`,
        );
      }
    }
  };

  const handleTaskReorder = (startIndex: number, endIndex: number) => {
    // Special case for view toggle buttons in TaskList
    if (startIndex === -1 && endIndex === -2) {
      setCurrentView("list");
      return;
    } else if (startIndex === -2 && endIndex === -1) {
      setCurrentView("card");
      return;
    }

    // Normal reordering logic
    const reorderedTasks = [...tasks];
    const [movedTask] = reorderedTasks.splice(startIndex, 1);
    reorderedTasks.splice(endIndex, 0, movedTask);
    setTasks(reorderedTasks);
    saveTasksToLocalStorage(reorderedTasks);
  };

  const handleTaskFormSubmit = async (data: any) => {
    let updatedTasks;

    if (editingTask) {
      // Update existing task
      const updatedTask = {
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        category: data.category
          ? {
              name: data.category,
              color: getCategoryColor(data.category),
            }
          : undefined,
        timeSpent: data.timeSpent,
        expectedTime: data.expectedTime,
      };

      updatedTasks = tasks.map((task) =>
        task.id === editingTask.id ? { ...task, ...updatedTask } : task,
      );

      setEditingTask(null);
    } else {
      // Add new task
      const newTask: Task = {
        id: Date.now().toString(), // Generate a unique ID
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        category: data.category
          ? {
              name: data.category,
              color: getCategoryColor(data.category),
            }
          : undefined,
        completed: false,
        createdAt: new Date().toISOString(),
        expectedTime: data.expectedTime || 3600000, // Default 1 hour if not specified
      };

      updatedTasks = [...tasks, newTask];
    }

    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
    setIsTaskFormOpen(false);
  };

  // Helper function to get category color
  const getCategoryColor = (categoryName: string): string => {
    if (!categoryName) return "#6b7280";

    const category = userSettings.categories.find(
      (cat) => cat.name === categoryName,
    );
    return category ? category.color : "#6b7280";
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);

    // Get the original tasks from localStorage
    const savedTasks = localStorage.getItem("taskManagerTasks");
    let originalTasks = [];

    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        originalTasks = parsedTasks.map((task: any) => ({
          ...task,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
        }));
      } catch (error) {
        console.error("Error parsing saved tasks:", error);
        originalTasks = [];
      }
    } else {
      originalTasks = [];
    }

    // If no filters are applied, show only non-completed tasks by default
    if (
      Object.keys(newFilters).length === 0 ||
      (!newFilters.category &&
        !newFilters.status &&
        !newFilters.dateRange &&
        !newFilters.searchTerm)
    ) {
      setTasks(originalTasks.filter((task) => !task.completed));
      return;
    }

    // Apply filters to tasks
    let filteredTasks = [...originalTasks];

    // Filter by category
    if (newFilters.category) {
      // Check if the category still exists in userSettings
      const categoryExists = userSettings.categories.some(
        (cat) => cat.name === newFilters.category,
      );

      if (categoryExists) {
        filteredTasks = filteredTasks.filter(
          (task) => task.category?.name === newFilters.category,
        );
      }
    }

    // Filter by status
    if (newFilters.status) {
      if (newFilters.status === "Completed") {
        // Show completed tasks when explicitly filtered
        filteredTasks = filteredTasks.filter((task) => task.completed);
      } else if (newFilters.status === "Pending") {
        filteredTasks = filteredTasks.filter((task) => !task.completed);
      } else if (newFilters.status === "Overdue") {
        const now = new Date();
        filteredTasks = filteredTasks.filter(
          (task) => !task.completed && task.deadline && task.deadline < now,
        );
      } else if (newFilters.status === "All") {
        // For "All" status, show all tasks
        // No filtering needed
      }
    } else if (
      newFilters.status !== "All" &&
      newFilters.status !== "Completed"
    ) {
      // By default, show only active tasks if not explicitly showing all or completed
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    }

    // Filter by date
    if (newFilters.dateRange) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.deadline && isSameDay(task.deadline, newFilters.dateRange),
      );
    }

    // Filter by search term
    if (newFilters.searchTerm) {
      const searchLower = newFilters.searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower)),
      );
    }

    setTasks(filteredTasks);
  };

  // Handle adding task from calendar
  const handleAddTaskFromCalendar = (date: Date) => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
    // In a real app, this would pre-fill the date in the form
  };

  // Handle saving settings
  const handleSettingsChange = (newSettings: any) => {
    console.log("Received new settings:", newSettings);
    setUserSettings(newSettings);

    // Save settings to localStorage for current session using StorageManager
    StorageManager.setJSON("taskManagerSettings", newSettings);

    // Save settings to user-specific storage if user is logged in
    if (currentUser?.id) {
      StorageManager.setJSON(
        `taskManagerSettings_${currentUser.id}`,
        newSettings,
      );
    }

    // Apply dark mode setting
    if (newSettings.darkMode !== isDarkMode) {
      setIsDarkMode(newSettings.darkMode);
      if (newSettings.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Apply default view setting
    if (newSettings.defaultView !== currentView) {
      setCurrentView(
        newSettings.defaultView as "list" | "calendar" | "card" | "analytics",
      );
    }

    // Apply planner setting
    if (newSettings.showPlannerOnLogin !== showPlannerOnLogin) {
      setShowPlannerOnLogin(newSettings.showPlannerOnLogin);
    }
  };

  // Determine if we should show completed tasks based on URL parameters or filters
  const urlParams = new URLSearchParams(window.location.search);
  const showCompleted = urlParams.get("status") === "Completed";

  // Handle adding tasks from daily planner
  const handleAddTasksFromPlanner = (tasksToAdd: any[]) => {
    const updatedTasks = [...tasks, ...tasksToAdd];
    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <Header
        onViewChange={handleViewChange}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
        currentView={currentView}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onPlannerClick={() => setIsPlannerOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Time summary bar with view toggle - always visible */}
        <div className="bg-background border-b flex items-center justify-between overflow-x-auto">
          {currentView !== "analytics" && (
            <div className="flex items-center">
              <div className="flex items-center border-r px-2 md:px-3 py-1.5">
                <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-1 md:mr-2 flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-[8px] md:text-[10px] font-semibold">
                    T
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-300 whitespace-nowrap">
                    {formatTimeSpent(
                      tasks
                        .filter(
                          (task) =>
                            task.deadline &&
                            new Date(task.deadline).toDateString() ===
                              new Date().toDateString() &&
                            !task.completed,
                        )
                        .reduce(
                          (total, task) => total + (task.expectedTime || 0),
                          0,
                        ),
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center px-2 md:px-3 py-1.5">
                <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-1 md:mr-2 flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-300 text-[8px] md:text-[10px] font-semibold">
                    ALL
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-purple-600 dark:text-purple-300 whitespace-nowrap">
                    {formatTimeSpent(
                      tasks
                        .filter((task) => !task.completed)
                        .reduce(
                          (total, task) => total + (task.expectedTime || 0),
                          0,
                        ),
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          {currentView === "analytics" && <div className="flex-1"></div>}

          {/* View toggle - always visible */}
          <div className="flex items-center space-x-1 md:space-x-3 border rounded-md p-1.5 mr-2">
            <Button
              variant={currentView === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("calendar")}
              className="px-2 md:px-4 h-9"
            >
              <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              <span className="text-xs md:text-base hidden sm:inline">
                Calendar
              </span>
            </Button>

            <Button
              variant={currentView === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("card")}
              className="px-2 md:px-4 h-9"
            >
              <List className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              <span className="text-xs md:text-base hidden sm:inline">
                Tasks
              </span>
            </Button>

            <Button
              variant={currentView === "analytics" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("analytics")}
              className="px-2 md:px-4 h-9"
            >
              <BarChart2 className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              <span className="text-xs md:text-base hidden sm:inline">
                Analytics
              </span>
            </Button>
          </div>
        </div>

        {/* Filter bar - only show for task views, not analytics */}
        {currentView !== "analytics" && (
          <FilterBar
            onFilterChange={handleFilterChange}
            categories={userSettings.categories}
          />
        )}

        {/* Task management area */}
        <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden relative">
          {/* Add task button - fixed position, only show for task views */}
          {currentView !== "analytics" && (
            <div className="absolute bottom-6 right-6 z-10">
              <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    className="rounded-full h-14 w-14 md:h-16 md:w-16 shadow-lg bg-primary hover:bg-primary/90 text-white flex items-center justify-center p-0 aspect-square"
                    onClick={() => setEditingTask(null)}
                  >
                    <span className="text-3xl font-bold flex items-center justify-center h-full w-full">
                      +
                    </span>
                    <span className="sr-only">Add Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <TaskForm
                    onSubmit={handleTaskFormSubmit}
                    onCancel={() => setIsTaskFormOpen(false)}
                    initialData={
                      editingTask
                        ? {
                            title: editingTask.title,
                            description: editingTask.description || "",
                            deadline: editingTask.deadline || null,
                            category: editingTask.category?.name || "work",
                            reminderTime: "0",
                            timeSpent: editingTask.timeSpent || 0,
                            expectedTime: editingTask.expectedTime || 3600000,
                          }
                        : undefined
                    }
                    isEditing={!!editingTask}
                    categories={userSettings.categories}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Task views */}
          <div className="flex-1 overflow-hidden">
            {currentView === "analytics" ? (
              <AnalyticsPage userId={currentUser?.id} />
            ) : currentView === "list" ? (
              <TaskList
                tasks={tasks}
                onTaskComplete={handleTaskComplete}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                onTaskReorder={handleTaskReorder}
                onTimerToggle={handleTimerToggle}
                viewMode="list"
              />
            ) : currentView === "card" ? (
              <TaskList
                tasks={tasks}
                onTaskComplete={handleTaskComplete}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                onTaskReorder={handleTaskReorder}
                onTimerToggle={handleTimerToggle}
                viewMode="card"
              />
            ) : (
              <CalendarView
                tasks={tasks.map((task) => ({
                  ...task,
                  deadline: task.deadline || new Date(),
                  category: {
                    name: task.category?.name || "Uncategorized",
                    color: task.category?.color || "#6b7280",
                  },
                }))}
                onTaskClick={handleTaskEdit}
                onAddTask={handleAddTaskFromCalendar}
              />
            )}
          </div>
        </div>
      </div>

      {/* Settings panel dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={userSettings}
            onSettingsChange={handleSettingsChange}
          />
        </DialogContent>
      </Dialog>

      {/* Daily Planner dialog */}
      <Dialog open={isPlannerOpen} onOpenChange={setIsPlannerOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DailyPlanner
            onClose={() => setIsPlannerOpen(false)}
            onAddTasks={handleAddTasksFromPlanner}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTaskDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;
