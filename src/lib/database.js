import { supabase } from "./supabase";
import { StorageManager } from "@/components/storage/StorageManager";

// Flag to determine if we should use Supabase or localStorage
const useSupabase = !!supabase;

// User functions
export async function createUser(userData) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating user in Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    const users = JSON.parse(localStorage.getItem("taskManagerUsers") || "[]");
    const newUser = { ...userData, id: `user-${Date.now()}` };
    users.push(newUser);
    localStorage.setItem("taskManagerUsers", JSON.stringify(users));
    return newUser;
  } catch (error) {
    console.error("Error creating user in localStorage:", error);
    throw error;
  }
}

export async function getUserByUsername(username) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error getting user from Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    const users = JSON.parse(localStorage.getItem("taskManagerUsers") || "[]");
    return users.find((user) => user.username === username) || null;
  } catch (error) {
    console.error("Error getting user from localStorage:", error);
    return null;
  }
}

// Task functions
export async function getTasks(userId) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, categories(*)")
        .eq("user_id", userId);

      if (error) throw error;

      // Transform the data to match the app's Task interface
      return data.map((task) => ({
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
    } catch (error) {
      console.error("Error getting tasks from Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    const tasks = JSON.parse(
      localStorage.getItem(`taskManagerTasks_${userId}`) || "[]",
    );
    return tasks.map((task) => ({
      ...task,
      deadline: task.deadline ? new Date(task.deadline) : undefined,
    }));
  } catch (error) {
    console.error("Error getting tasks from localStorage:", error);
    return [];
  }
}

export async function createTask(taskData) {
  console.log("createTask function called with data:", taskData);

  if (useSupabase) {
    try {
      console.log("Using Supabase to create task");
      // First, ensure the category exists
      let categoryId = null;

      if (taskData.category) {
        console.log("Processing category:", taskData.category.name);
        // Check if category exists
        try {
          const { data: existingCategory, error: categoryQueryError } =
            await supabase
              .from("categories")
              .select("id")
              .eq("name", taskData.category.name)
              .eq("user_id", taskData.userId);

          if (categoryQueryError) {
            console.error("Error querying category:", categoryQueryError);
            throw categoryQueryError;
          }

          if (existingCategory && existingCategory.length > 0) {
            categoryId = existingCategory[0].id;
            console.log("Found existing category with ID:", categoryId);
          } else {
            console.log("Category not found, creating new one");
            // Create new category
            const { data: newCategory, error: categoryError } = await supabase
              .from("categories")
              .insert({
                name: taskData.category.name,
                color: taskData.category.color,
                user_id: taskData.userId,
              })
              .select();

            if (categoryError) {
              console.error("Error creating category:", categoryError);
              throw categoryError;
            }

            if (newCategory && newCategory.length > 0) {
              categoryId = newCategory[0].id;
              console.log("Created new category with ID:", categoryId);
            }
          }
        } catch (categoryError) {
          console.error("Error handling category:", categoryError);
          // Continue without category if there's an error
        }
      }

      // Now create the task
      console.log("Creating task with category_id:", categoryId);
      const taskToInsert = {
        title: taskData.title,
        description: taskData.description || "",
        deadline: taskData.deadline?.toISOString(),
        category_id: categoryId,
        completed: taskData.completed || false,
        timer_started: taskData.timerStarted,
        time_spent: taskData.timeSpent || 0,
        expected_time: taskData.expectedTime || 3600000,
        user_id: taskData.userId,
        created_at: new Date().toISOString(),
      };

      console.log("Inserting task into database:", taskToInsert);
      const { data, error } = await supabase
        .from("tasks")
        .insert(taskToInsert)
        .select();

      if (error) {
        console.error("Error inserting task:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("No data returned from task creation");
        throw new Error("Task was created but no data was returned");
      }

      console.log("Task created successfully in Supabase:", data);

      // Also save to localStorage as backup
      try {
        const localTasks = JSON.parse(
          localStorage.getItem(`taskManagerTasks_${taskData.userId}`) || "[]",
        );
        localTasks.push({
          ...data[0],
          id: data[0].id,
          category: taskData.category, // Keep the category object for local use
          deadline: data[0].deadline, // Keep the ISO string
          createdAt: data[0].created_at,
        });
        localStorage.setItem(
          `taskManagerTasks_${taskData.userId}`,
          JSON.stringify(localTasks),
        );
        localStorage.setItem("taskManagerTasks", JSON.stringify(localTasks));
      } catch (localError) {
        console.warn("Could not save task to localStorage:", localError);
      }

      return data[0]; // Return the first task created
    } catch (error) {
      console.error("Error creating task in Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    console.log("Using localStorage fallback to create task");
    const tasks = JSON.parse(
      localStorage.getItem(`taskManagerTasks_${taskData.userId}`) || "[]",
    );
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description || "",
      deadline: taskData.deadline?.toISOString(),
      category: taskData.category,
      completed: taskData.completed || false,
      timerStarted: taskData.timerStarted,
      timeSpent: taskData.timeSpent || 0,
      expectedTime: taskData.expectedTime || 3600000,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);

    // Save to both user-specific and general storage
    localStorage.setItem(
      `taskManagerTasks_${taskData.userId}`,
      JSON.stringify(tasks),
    );
    localStorage.setItem("taskManagerTasks", JSON.stringify(tasks));

    console.log("Task created successfully in localStorage:", newTask);
    return newTask;
  } catch (error) {
    console.error("Error creating task in localStorage:", error);
    throw error;
  }
}

export async function updateTask(taskId, taskData) {
  if (useSupabase) {
    try {
      // Handle category update if needed
      let categoryId = null;

      if (taskData.category && taskData.userId) {
        // Check if category exists
        const { data: existingCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("name", taskData.category.name)
          .eq("user_id", taskData.userId)
          .single();

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from("categories")
            .insert({
              name: taskData.category.name,
              color: taskData.category.color,
              user_id: taskData.userId,
            })
            .select()
            .single();

          if (categoryError) throw categoryError;
          categoryId = newCategory.id;
        }
      }

      // Prepare update data
      const updateData = {};

      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined)
        updateData.description = taskData.description;
      if (taskData.deadline !== undefined)
        updateData.deadline = taskData.deadline?.toISOString();
      if (categoryId !== null) updateData.category_id = categoryId;
      if (taskData.completed !== undefined) {
        updateData.completed = taskData.completed;
        if (taskData.completed) {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
        }
      }
      if (taskData.timerStarted !== undefined)
        updateData.timer_started = taskData.timerStarted;
      if (taskData.timeSpent !== undefined)
        updateData.time_spent = taskData.timeSpent;
      if (taskData.expectedTime !== undefined)
        updateData.expected_time = taskData.expectedTime;

      // Update the task
      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating task in Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    const tasks = JSON.parse(
      localStorage.getItem(`taskManagerTasks_${taskData.userId}`) || "[]",
    );
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) throw new Error(`Task with ID ${taskId} not found`);

    const updatedTask = { ...tasks[taskIndex] };

    if (taskData.title !== undefined) updatedTask.title = taskData.title;
    if (taskData.description !== undefined)
      updatedTask.description = taskData.description;
    if (taskData.deadline !== undefined)
      updatedTask.deadline = taskData.deadline?.toISOString();
    if (taskData.category !== undefined)
      updatedTask.category = taskData.category;
    if (taskData.completed !== undefined) {
      updatedTask.completed = taskData.completed;
      if (taskData.completed) {
        updatedTask.completedAt = new Date().toISOString();
      } else {
        delete updatedTask.completedAt;
      }
    }
    if (taskData.timerStarted !== undefined)
      updatedTask.timerStarted = taskData.timerStarted;
    if (taskData.timeSpent !== undefined)
      updatedTask.timeSpent = taskData.timeSpent;
    if (taskData.expectedTime !== undefined)
      updatedTask.expectedTime = taskData.expectedTime;

    tasks[taskIndex] = updatedTask;
    localStorage.setItem(
      `taskManagerTasks_${taskData.userId}`,
      JSON.stringify(tasks),
    );
    return updatedTask;
  } catch (error) {
    console.error("Error updating task in localStorage:", error);
    throw error;
  }
}

export async function deleteTask(taskId, userId) {
  if (useSupabase) {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting task from Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    const tasks = JSON.parse(
      localStorage.getItem(`taskManagerTasks_${userId}`) || "[]",
    );
    const filteredTasks = tasks.filter((task) => task.id !== taskId);
    localStorage.setItem(
      `taskManagerTasks_${userId}`,
      JSON.stringify(filteredTasks),
    );
    return true;
  } catch (error) {
    console.error("Error deleting task from localStorage:", error);
    throw error;
  }
}

// Category functions
export async function getCategories(userId) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map((category) => ({
        id: category.id,
        name: category.name,
        color: category.color,
      }));
    } catch (error) {
      console.error("Error getting categories from Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback - get categories from settings
  try {
    const settings = JSON.parse(
      localStorage.getItem(`taskManagerSettings_${userId}`) || "{}",
    );
    return settings.categories || [];
  } catch (error) {
    console.error("Error getting categories from localStorage:", error);
    return [];
  }
}

export async function createCategory(categoryData) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: categoryData.name,
          color: categoryData.color,
          user_id: categoryData.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating category in Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback - update settings
  try {
    const settings = JSON.parse(
      localStorage.getItem(`taskManagerSettings_${categoryData.userId}`) ||
        "{}",
    );
    const categories = settings.categories || [];
    const newCategory = {
      id: `category-${Date.now()}`,
      name: categoryData.name,
      color: categoryData.color,
    };
    categories.push(newCategory);
    settings.categories = categories;
    localStorage.setItem(
      `taskManagerSettings_${categoryData.userId}`,
      JSON.stringify(settings),
    );
    return newCategory;
  } catch (error) {
    console.error("Error creating category in localStorage:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId, userId) {
  if (useSupabase) {
    try {
      // First update any tasks using this category to remove the category
      await supabase
        .from("tasks")
        .update({ category_id: null })
        .eq("category_id", categoryId);

      // Then delete the category
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting category from Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback - update settings and tasks
  try {
    // Update settings
    const settings = JSON.parse(
      localStorage.getItem(`taskManagerSettings_${userId}`) || "{}",
    );
    const categories = settings.categories || [];
    const categoryToDelete = categories.find((cat) => cat.id === categoryId);
    if (!categoryToDelete) return true; // Category not found

    settings.categories = categories.filter((cat) => cat.id !== categoryId);
    localStorage.setItem(
      `taskManagerSettings_${userId}`,
      JSON.stringify(settings),
    );

    // Update tasks
    const tasks = JSON.parse(
      localStorage.getItem(`taskManagerTasks_${userId}`) || "[]",
    );
    const updatedTasks = tasks.map((task) => {
      if (task.category?.name === categoryToDelete.name) {
        const { category, ...rest } = task;
        return rest;
      }
      return task;
    });
    localStorage.setItem(
      `taskManagerTasks_${userId}`,
      JSON.stringify(updatedTasks),
    );

    return true;
  } catch (error) {
    console.error("Error deleting category from localStorage:", error);
    throw error;
  }
}

// Daily planner functions
export async function saveDailyPlan(userId, date, planData) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("daily_planner")
        .upsert({
          user_id: userId,
          date: date,
          daily_goal: planData.dailyGoal,
          plan_items: planData.planItems,
          notes: planData.notes,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving daily plan to Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    localStorage.setItem(`dailyPlanner_${date}`, JSON.stringify(planData));
    return { ...planData, date, user_id: userId };
  } catch (error) {
    console.error("Error saving daily plan to localStorage:", error);
    throw error;
  }
}

export async function getDailyPlan(userId, date) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("daily_planner")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        return {
          dailyGoal: data.daily_goal,
          planItems: data.plan_items,
          notes: data.notes,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting daily plan from Supabase:", error);
      // Fall back to localStorage
    }
  }

  // localStorage fallback
  try {
    const planData = localStorage.getItem(`dailyPlanner_${date}`);
    return planData ? JSON.parse(planData) : null;
  } catch (error) {
    console.error("Error getting daily plan from localStorage:", error);
    return null;
  }
}
