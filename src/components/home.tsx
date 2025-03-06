import React, { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import Header from "./layout/Header";
import TaskList from "./tasks/TaskList";
import CalendarView from "./tasks/CalendarView";
import FilterBar from "./filters/FilterBar";
import TaskForm from "./tasks/TaskForm";
import SettingsPanel from "./settings/SettingsPanel";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
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
  const [currentView, setCurrentView] = useState<"list" | "calendar" | "card">(
    "list",
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState({
    darkMode: false,
    defaultView: "list",
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
    // Load settings
    const savedSettings = localStorage.getItem("taskManagerSettings");
    if (savedSettings) {
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
    }

    // Load tasks
    const savedTasks = localStorage.getItem("taskManagerTasks");
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Convert ISO date strings back to Date objects
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
        }));
        setTasks(tasksWithDates);
      } catch (error) {
        console.error("Error parsing saved tasks:", error);
        setTasks(sampleTasks);
      }
    } else {
      setTasks(sampleTasks);
    }
  }, []);

  // Handle view toggle
  const handleViewChange = (view: "list" | "calendar" | "card") => {
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

  // Task operations
  const handleTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
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
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    // Save to localStorage
    saveTasksToLocalStorage(updatedTasks);
  };

  // Handle timer toggle
  const handleTimerToggle = (taskId: string, isRunning: boolean) => {
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
    // Convert Date objects to ISO strings for storage
    const tasksForStorage = tasksToSave.map((task) => ({
      ...task,
      deadline: task.deadline ? task.deadline.toISOString() : undefined,
    }));
    localStorage.setItem("taskManagerTasks", JSON.stringify(tasksForStorage));
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

  const confirmTaskDelete = () => {
    if (deleteTaskId) {
      const updatedTasks = tasks.filter((task) => task.id !== deleteTaskId);
      setTasks(updatedTasks);
      saveTasksToLocalStorage(updatedTasks);
      setDeleteTaskId(null);
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

  const handleTaskFormSubmit = (data: any) => {
    let updatedTasks;

    if (editingTask) {
      // Update existing task
      updatedTasks = tasks.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: data.title,
              description: data.description,
              deadline: data.deadline,
              category: data.category
                ? {
                    name: data.category,
                    color: getCategoryColor(data.category),
                  }
                : undefined,
            }
          : task,
      );
      setEditingTask(null);
    } else {
      // Add new task
      const newTask: Task = {
        id: Date.now().toString(),
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
        originalTasks = sampleTasks;
      }
    } else {
      originalTasks = sampleTasks;
    }

    // If no filters are applied, show all tasks
    if (
      Object.keys(newFilters).length === 0 ||
      (!newFilters.category &&
        !newFilters.status &&
        !newFilters.dateRange &&
        !newFilters.searchTerm)
    ) {
      setTasks(originalTasks);
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
      }
      // 'All' status shows all tasks
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <Header
        onViewChange={handleViewChange}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
        currentView={currentView}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter bar */}
        <FilterBar
          onFilterChange={handleFilterChange}
          categories={userSettings.categories}
        />

        {/* Task management area */}
        <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden relative">
          {/* Add task button - fixed position */}
          <div className="absolute bottom-6 right-6 z-10">
            <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full h-12 w-12 md:h-14 md:w-14 shadow-lg bg-primary hover:bg-primary/90 text-white flex items-center justify-center"
                >
                  <span className="text-2xl font-bold">+</span>
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
                        }
                      : undefined
                  }
                  isEditing={!!editingTask}
                  categories={userSettings.categories}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Task views */}
          <div className="flex-1 overflow-hidden">
            {currentView === "list" ? (
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
            onSettingsChange={(newSettings) => {
              console.log("Received new settings:", newSettings);
              setUserSettings(newSettings);

              // Save settings to localStorage
              localStorage.setItem(
                "taskManagerSettings",
                JSON.stringify(newSettings),
              );

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
                  newSettings.defaultView as "list" | "calendar" | "card",
                );
              }

              // Don't close the dialog automatically - let the user close it with the save button
            }}
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
