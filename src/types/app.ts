// User interface
export interface User {
  id: string;
  username: string;
  email?: string;
  created_at?: string;
  last_login?: string;
}

// Category interface
export interface Category {
  id: string;
  name: string;
  color: string;
}

// Task interface
export interface Task {
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

// Settings interface
export interface UserSettings {
  darkMode: boolean;
  defaultView: string;
  notificationsEnabled: boolean;
  notificationTime: string;
  categories: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}
