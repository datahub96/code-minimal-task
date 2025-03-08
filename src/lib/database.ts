import { supabase } from "./supabase";
import { User, Task, Category } from "@/types/app";

// Flag to determine if we should use Supabase or localStorage
const useSupabase =
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  // First, ensure the category exists
  let categoryId = null;

  if (taskData.category) {
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

  // Now create the task
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: taskData.title,
      description: taskData.description,
      deadline: taskData.deadline?.toISOString(),
      category_id: categoryId,
      completed: taskData.completed,
      timer_started: taskData.timerStarted,
      time_spent: taskData.timeSpent,
      user_id: taskData.userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId, taskData) {
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
  if (taskData.completed !== undefined)
    updateData.completed = taskData.completed;
  if (taskData.timerStarted !== undefined)
    updateData.timer_started = taskData.timerStarted;
  if (taskData.timeSpent !== undefined)
    updateData.time_spent = taskData.timeSpent;

  // Update the task
  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) throw error;
  return true;
}

// Category functions
export async function getCategories(userId) {
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
}

export async function createCategory(categoryData) {
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
}

export async function deleteCategory(categoryId) {
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
}
