import React, { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import { StorageManager } from "@/components/storage/StorageManager";
import { supabase } from "@/lib/supabase";
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

  // Load user settings and tasks when component mounts
  useEffect(() => {
    // Force reload all tasks on initial load
    const forceReloadAllTasks = () => {
      try {
        // Clear any cached tasks in memory
        StorageManager.removeItem("taskManagerTasksCache");
      } catch (error) {
        console.error("Error clearing task cache:", error);
      }
    };

    forceReloadAllTasks();

    // Import database functions
    const loadData = async () => {
      try {
        // Get current user
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

          // Check URL parameters for status=Completed
          const urlParams = new URLSearchParams(window.location.search);
          const urlStatus = urlParams.get("status");
          const filterStatus =
            urlStatus === "Completed" ? "Completed" : "Pending";

          // Try to load from database first
          try {
            const { getTasks, getCategories } = await import("@/lib/database");

            // Load categories/settings
            const categories = await getCategories(user.id);
            if (categories && categories.length > 0) {
              // Update settings with categories from database
              const updatedSettings = {
                ...userSettings,
                categories: categories,
              };
              setUserSettings(updatedSettings);

              // Save to localStorage as backup
              StorageManager.setJSON("taskManagerSettings", updatedSettings);
            } else {
              // Load from localStorage as fallback
              loadSettingsFromLocalStorage();
            }

            // Load tasks with appropriate filter
            const tasks = await getTasks(user.id, { status: filterStatus });
            if (tasks && tasks.length > 0) {
              setTasks(tasks);
              console.log(
                `Loaded ${tasks.length} ${filterStatus.toLowerCase()} tasks from database`,
              );

              // Save to localStorage as backup
              StorageManager.setJSON("taskManagerTasks", tasks);

              // Also update filters state to match URL
              if (urlStatus === "Completed") {
                setFilters({ status: "Completed" });
              }
            } else {
              // Load from localStorage as fallback
              loadTasksFromLocalStorage(filterStatus);
            }
          } catch (dbError) {
            console.error("Error loading from database:", dbError);
            // Fall back to localStorage
            loadSettingsFromLocalStorage();
            loadTasksFromLocalStorage(filterStatus);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fall back to localStorage
        loadSettingsFromLocalStorage();
        loadTasksFromLocalStorage();
      }
    };

    // Helper function to load settings from localStorage
    const loadSettingsFromLocalStorage = () => {
      try {
        const savedSettings = StorageManager.getItem("taskManagerSettings");
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

          // Apply saved planner setting
          if (parsedSettings.showPlannerOnLogin !== undefined) {
            setShowPlannerOnLogin(parsedSettings.showPlannerOnLogin);
          }
        }
      } catch (error) {
        console.error("Error parsing settings:", error);
      }
    };

    // Helper function to load tasks from localStorage
    const loadTasksFromLocalStorage = (filterStatus = "Pending") => {
      try {
        // Try user-specific tasks first
        const userTasksKey = currentUser?.id
          ? `taskManagerTasks_${currentUser.id}`
          : "taskManagerTasks";

        const savedTasks =
          StorageManager.getItem(userTasksKey) ||
          StorageManager.getItem("taskManagerTasks");

        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          // Convert ISO date strings back to Date objects
          const tasksWithDates = parsedTasks.map((task: any) => ({
            ...task,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
          }));

          // Apply filter based on status
          let filteredTasks;
          if (filterStatus === "Completed") {
            filteredTasks = tasksWithDates.filter((task) => task.completed);
            console.log(
              `Loaded ${filteredTasks.length} completed tasks from localStorage`,
            );

            // Update filters state
            setFilters({ status: "Completed" });
          } else {
            filteredTasks = tasksWithDates.filter((task) => !task.completed);
            console.log(
              `Loaded ${filteredTasks.length} pending tasks from localStorage`,
            );
          }

          setTasks(filteredTasks);
        } else {
          console.log("No tasks found in localStorage");
          setTasks([]);
        }
      } catch (error) {
        console.error("Error parsing tasks:", error);
        setTasks([]);
      }
    };

    loadData();
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

    // Find the task to update
    const taskToUpdate = allTasks.find((task) => task.id === taskId);
    if (!taskToUpdate) {
      console.error("Task not found:", taskId);
      return;
    }

    // If completing a task with a running timer, stop the timer and calculate final time
    let finalTimeSpent = taskToUpdate.timeSpent || 0;
    if (taskToUpdate.timerStarted && !taskToUpdate.completed) {
      const now = Date.now();
      finalTimeSpent += now - taskToUpdate.timerStarted;
    }

    // Create updated task object
    const updatedTaskData = {
      completed: !taskToUpdate.completed,
      timerStarted: undefined, // Stop the timer when completing
      timeSpent: finalTimeSpent,
      completedAt: !taskToUpdate.completed
        ? new Date().toISOString()
        : undefined,
      userId: currentUser?.id,
    };

    // Try to update in database first
    try {
      if (currentUser) {
        const { updateTask } = await import("@/lib/database");
        await updateTask(taskId, updatedTaskData);
        console.log("Task completion status updated in database");
      }
    } catch (dbError) {
      console.error("Error updating task completion in database:", dbError);
      // Continue with local update even if database update fails
    }

    // Update the task completion status in local state
    const updatedTasks = allTasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          ...updatedTaskData,
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

      // Try StorageManager first (which now has memory fallback)
      const mainStorageSuccess = StorageManager.setJSON(
        "taskManagerTasks",
        tasksForStorage,
      );
      console.log(
        `${mainStorageSuccess ? "Successfully" : "Attempted to"} save ${tasksForStorage.length} tasks to storage`,
      );

      // Save to user-specific storage if user is logged in
      if (currentUser?.id) {
        StorageManager.setJSON(
          `taskManagerTasks_${currentUser.id}`,
          tasksForStorage,
        );
      }

      // As a last resort, try direct localStorage
      if (!mainStorageSuccess) {
        try {
          localStorage.setItem(
            "taskManagerTasks",
            JSON.stringify(tasksForStorage),
          );

          if (currentUser?.id) {
            localStorage.setItem(
              `taskManagerTasks_${currentUser.id}`,
              JSON.stringify(tasksForStorage),
            );
          }
        } catch (directStorageError) {
          console.error(
            "Both StorageManager and direct localStorage failed",
            directStorageError,
          );
          // Continue anyway - we'll use memory storage as fallback
        }
      }
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
      console.error("Error saving tasks to storage");
      // Don't show alert - we'll use the toast notification system instead
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
        // Try to delete from database first
        try {
          if (currentUser) {
            const { deleteTask } = await import("@/lib/database");
            await deleteTask(deleteTaskId, currentUser.id);
            console.log("Task deleted from database");
          }
        } catch (dbError) {
          console.error("Error deleting task from database:", dbError);
          // Continue with local deletion even if database deletion fails
        }

        // Update local state
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
    console.log("Task form submitted with data:", data);
    let updatedTasks;

    try {
      // Validate required fields
      if (!data.title || data.title.trim() === "") {
        console.error("Task title is required");
        alert("Task title is required");
        return;
      }

      // Import database functions
      const { updateTask, createTask } = await import("@/lib/database");

      if (editingTask) {
        console.log("Updating existing task:", editingTask.id);
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
          userId: currentUser?.id, // Add user ID for database operations
        };

        // Try to update in database first
        try {
          if (currentUser) {
            await updateTask(editingTask.id, updatedTask);
            console.log("Task updated in database");
          }
        } catch (dbError) {
          console.error("Error updating task in database:", dbError);
          // Continue with local update even if database update fails
        }

        // Update local state
        updatedTasks = tasks.map((task) =>
          task.id === editingTask.id ? { ...task, ...updatedTask } : task,
        );

        setEditingTask(null);
      } else {
        console.log("Creating new task");
        // Add new task
        const newTask: Task = {
          id: Date.now().toString(), // Generate a unique ID (will be replaced by DB if successful)
          title: data.title,
          description: data.description || "",
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

        console.log("New task object created:", newTask);

        // Try to create in database first
        try {
          if (currentUser) {
            console.log(
              "Attempting to save task to database for user:",
              currentUser.id,
            );
            const dbTask = await createTask({
              ...newTask,
              userId: currentUser.id,
            });
            console.log("Task created in database", dbTask);
            // Use the database-generated ID if available
            if (dbTask && dbTask.id) {
              newTask.id = dbTask.id;
            }
          }
        } catch (dbError) {
          console.error("Error creating task in database:", dbError);
          // Continue with local creation even if database creation fails
        }

        // Always add to local state
        updatedTasks = [...tasks, newTask];
        console.log("Updated tasks array with new task", updatedTasks.length);
      }

      // Update state
      setTasks(updatedTasks);
      console.log("State updated with new tasks");

      // Save to localStorage as backup
      try {
        const tasksForStorage = updatedTasks.map((task) => ({
          ...task,
          deadline: task.deadline ? task.deadline.toISOString() : undefined,
        }));

        // Direct localStorage save
        localStorage.setItem(
          "taskManagerTasks",
          JSON.stringify(tasksForStorage),
        );
        console.log("Saved tasks using direct localStorage");

        // Also try the StorageManager as backup
        try {
          saveTasksToLocalStorage(updatedTasks);
        } catch (storageManagerError) {
          console.log(
            "StorageManager failed but direct localStorage worked",
            storageManagerError,
          );
        }
      } catch (error) {
        console.error("Error saving tasks:", error);
        console.error("Warning: Tasks may not be saved to persistent storage");
        // Don't show alert - we'll use the toast notification system instead
      }

      // Close the form regardless
      setIsTaskFormOpen(false);
      console.log("Task form closed");
    } catch (error) {
      console.error("Error in task form submission:", error);
      console.error("Error creating task");
      alert("There was an error creating the task. Please try again.");
    }
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
  const handleFilterChange = async (newFilters: any) => {
    console.log("Filter change:", newFilters);
    setFilters(newFilters);

    try {
      // Check URL parameters for status=Completed
      const urlParams = new URLSearchParams(window.location.search);
      const urlStatus = urlParams.get("status");
      if (urlStatus === "Completed") {
        // Override filters to show completed tasks
        newFilters.status = "Completed";
      }

      // Get user ID for database queries
      if (!currentUser?.id) {
        console.error("No user ID available for filtering tasks");
        return;
      }

      // Try to load from database first if available
      let allTasks = [];
      try {
        if (supabase) {
          console.log("Loading tasks from Supabase for filtering");
          let query = supabase
            .from("tasks")
            .select("*, categories(*)")
            .eq("user_id", currentUser.id);

          // Apply database-side filters where possible
          if (newFilters.status === "Completed") {
            query = query.eq("completed", true);
          } else if (newFilters.status === "Pending") {
            query = query.eq("completed", false);
          } else if (newFilters.status === "Overdue") {
            const now = new Date().toISOString();
            query = query.lt("deadline", now).eq("completed", false);
          }

          // Execute the query
          const { data, error } = await query;

          if (error) throw error;

          // Transform the data to match the app's Task interface
          allTasks = data.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
            category: task.categories
              ? {
                  name: task.categories.name,
                  color: task.categories.color,
                }
              : undefined,
            completed: task.completed,
            timerStarted: task.timer_started,
            timeSpent: task.time_spent,
            expectedTime: task.expected_time,
            createdAt: task.created_at,
            completedAt: task.completed_at,
          }));

          console.log(
            `Loaded ${allTasks.length} tasks from database for filtering`,
          );
        } else {
          throw new Error("Supabase not available");
        }
      } catch (dbError) {
        console.error("Error loading tasks from database:", dbError);

        // Fall back to localStorage
        console.log("Falling back to localStorage for task filtering");
        const userTasksKey = `taskManagerTasks_${currentUser.id}`;
        const savedTasks =
          StorageManager.getItem(userTasksKey) ||
          StorageManager.getItem("taskManagerTasks");

        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          allTasks = parsedTasks.map((task: any) => ({
            ...task,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
          }));
          console.log(`Loaded ${allTasks.length} total tasks from storage`);
        } else {
          // If no tasks in storage, use current state
          allTasks = [...tasks];
        }
      }

      // If no filters are applied, show only non-completed tasks by default
      if (
        Object.keys(newFilters).length === 0 ||
        (!newFilters.category &&
          !newFilters.status &&
          !newFilters.dateRange &&
          !newFilters.searchTerm)
      ) {
        setTasks(allTasks.filter((task) => !task.completed));
        return;
      }

      // Apply client-side filters to tasks
      let filteredTasks = [...allTasks];

      // Filter by category (if not already filtered by database)
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

      // Apply status filters if not already applied at database level
      if (!supabase && newFilters.status) {
        if (newFilters.status === "Completed") {
          // Show completed tasks when explicitly filtered
          filteredTasks = filteredTasks.filter((task) => task.completed);
          console.log(`Showing ${filteredTasks.length} completed tasks`);

          // Update URL to reflect completed status
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("status", "Completed");
            window.history.pushState({}, "", url);
          } catch (error) {
            console.error("Error updating URL:", error);
          }
        } else if (newFilters.status === "Pending") {
          filteredTasks = filteredTasks.filter((task) => !task.completed);

          // Update URL to remove status parameter
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("status");
            window.history.pushState({}, "", url);
          } catch (error) {
            console.error("Error updating URL:", error);
          }
        } else if (newFilters.status === "Overdue") {
          const now = new Date();
          filteredTasks = filteredTasks.filter(
            (task) => !task.completed && task.deadline && task.deadline < now,
          );
        }
        // For "All" status, show all tasks (no filtering needed)
      } else if (
        !supabase &&
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

      console.log(`Setting ${filteredTasks.length} tasks after filtering`);
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error in filter handling:", error);
      // In case of error, try to show something reasonable
      setTasks(tasks.filter((task) => !task.completed));
    }
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
  const showCompleted =
    urlParams.get("status") === "Completed" ||
    (filters as any)?.status === "Completed";

  // Ensure filter state is consistent with URL parameters
  useEffect(() => {
    const statusParam = urlParams.get("status");
    if (
      statusParam === "Completed" &&
      (filters as any)?.status !== "Completed"
    ) {
      handleFilterChange({ status: "Completed" });
    }
  }, [urlParams.get("status")]);

  // Check URL on initial load to handle direct links to completed tasks
  useEffect(() => {
    if (urlParams.get("status") === "Completed") {
      handleFilterChange({ status: "Completed" });
    }
  }, []);

  // Handle adding tasks from daily planner
  const handleAddTasksFromPlanner = async (tasksToAdd: any[]) => {
    console.log("Adding tasks from planner:", tasksToAdd);
    const newTasks = [];

    // Process each task from the planner
    for (const taskToAdd of tasksToAdd) {
      try {
        // Try to save to database first
        if (currentUser) {
          const { createTask } = await import("@/lib/database");
          const dbTask = await createTask({
            ...taskToAdd,
            userId: currentUser.id,
          });

          if (dbTask && dbTask.id) {
            // Use the database ID if available
            newTasks.push({
              ...taskToAdd,
              id: dbTask.id,
            });
            console.log("Planner task saved to database:", dbTask.id);
          } else {
            newTasks.push(taskToAdd);
          }
        } else {
          newTasks.push(taskToAdd);
        }
      } catch (error) {
        console.error("Error saving planner task to database:", error);
        // Add the task anyway even if database save fails
        newTasks.push(taskToAdd);
      }
    }

    // Update state with all tasks
    const updatedTasks = [...tasks, ...newTasks];
    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
    console.log("Updated tasks with planner items:", updatedTasks.length);
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
