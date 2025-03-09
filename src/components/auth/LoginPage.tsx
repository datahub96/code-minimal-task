import React, { useState } from "react";
import { StorageManager } from "@/components/storage/StorageManager";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserData {
  username: string;
  password: string;
  email?: string;
}

// Hardcoded user for demo
const DEMO_USER: UserData = {
  username: "admin",
  password: "123456",
};

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (username === DEMO_USER.username && password === DEMO_USER.password) {
        // Demo user login - no need for database
        // Store user info in localStorage using StorageManager
        try {
          const userData = {
            id: "demo-user-id",
            username,
          };

          // First check if localStorage is available
          if (!StorageManager.isLocalStorageAvailable()) {
            // Import error codes
            try {
              const { logError, ErrorCodes } = require("@/lib/errorCodes");
              logError(
                ErrorCodes.STORAGE_NOT_AVAILABLE,
                new Error("Local storage is not available"),
                { method: "handleLogin", username },
              );
            } catch (e) {
              console.error("Error importing error codes:", e);
            }
            throw new Error("Local storage is not available in your browser");
          }

          const success = StorageManager.setJSON("taskManagerUser", userData);

          if (!success) {
            // Import error codes
            try {
              const { logError, ErrorCodes } = require("@/lib/errorCodes");
              logError(
                ErrorCodes.AUTH_LOGIN_FAILED,
                new Error("Failed to save user data"),
                { method: "handleLogin", username },
              );
            } catch (e) {
              console.error("Error importing error codes:", e);
            }
            throw new Error("Failed to save user data");
          }
        } catch (error) {
          console.error("Error storing user data:", error);
          setError(
            `Unable to store user data. Please check your browser settings and ensure cookies/local storage are enabled. (Error code: ${error.code || "TM-AUTH-101"})`,
          );
          setLoading(false);
          return;
        }

        // Set default settings for demo user
        const defaultSettings = {
          darkMode: false,
          defaultView: "card",
          notificationsEnabled: true,
          notificationTime: "30",
          showPlannerOnLogin: true,
          categories: [
            { id: "1", name: "Work", color: "#3b82f6" },
            { id: "2", name: "Personal", color: "#10b981" },
            { id: "3", name: "Health", color: "#ef4444" },
            { id: "4", name: "Errands", color: "#f59e0b" },
            { id: "5", name: "Learning", color: "#8b5cf6" },
            { id: "6", name: "Daily Plan", color: "#8b5cf6" },
          ],
        };

        StorageManager.setJSON("taskManagerSettings", defaultSettings);

        // Set default tasks for demo user
        const defaultTasks = [
          {
            id: "1",
            title: "Complete project proposal",
            description: "Finish the draft and send for review",
            deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
            category: { name: "Work", color: "#3b82f6" },
            completed: false,
          },
          {
            id: "2",
            title: "Buy groceries",
            description: "Milk, eggs, bread, and vegetables",
            deadline: new Date(Date.now() + 86400000).toISOString(),
            category: { name: "Personal", color: "#10b981" },
            completed: false,
          },
          {
            id: "3",
            title: "Schedule dentist appointment",
            deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
            category: { name: "Health", color: "#ef4444" },
            completed: true,
          },
        ];

        StorageManager.setJSON("taskManagerTasks", defaultTasks);
        StorageManager.setJSON(
          `taskManagerTasks_${"demo-user-id"}`,
          defaultTasks,
        );

        // Clear the planner shown flag so it shows on fresh login
        StorageManager.removeItem("plannerShownForSession");

        // Redirect to home page
        navigate("/");
      } else {
        // Check if user exists in localStorage
        try {
          const users = JSON.parse(
            localStorage.getItem("taskManagerUsers") || "[]",
          );
          const user = users.find(
            (u: any) => u.username === username && u.password === password,
          );

          if (user) {
            // Store user info in localStorage
            StorageManager.setJSON("taskManagerUser", {
              id: user.id,
              username: user.username,
            });

            // Load user's settings
            try {
              const userSettings = JSON.parse(
                localStorage.getItem(`taskManagerSettings_${user.id}`) || "{}",
              );
              StorageManager.setJSON("taskManagerSettings", userSettings);

              // Load user's tasks
              const userTasks = JSON.parse(
                localStorage.getItem(`taskManagerTasks_${user.id}`) || "[]",
              );
              StorageManager.setJSON("taskManagerTasks", userTasks);
            } catch (error) {
              console.error("Error loading user data:", error);
              StorageManager.setJSON("taskManagerSettings", {});
              StorageManager.setJSON("taskManagerTasks", []);
            }

            // Clear the planner shown flag so it shows on fresh login
            StorageManager.removeItem("plannerShownForSession");

            // Redirect to home page
            navigate("/");
          } else {
            setError("Invalid username or password");
          }
        } catch (error) {
          console.error("Error checking user credentials:", error);
          setError("An error occurred during login. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate form
      if (!username || !email || !password || !confirmPassword) {
        setError("All fields are required");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Check if username already exists
      try {
        const users = JSON.parse(
          localStorage.getItem("taskManagerUsers") || "[]",
        );
        if (users.some((u: any) => u.username === username)) {
          setError("Username already exists");
          setLoading(false);
          return;
        }

        // Create new user
        const userId = `user-${Date.now()}`;
        const newUser = {
          id: userId,
          username,
          email,
          password, // In a real app, this would be hashed
          created_at: new Date().toISOString(),
        };

        // Add user to users list
        users.push(newUser);
        StorageManager.setJSON("taskManagerUsers", users);
      } catch (error) {
        console.error("Error checking username:", error);
        setError("An error occurred during registration. Please try again.");
        setLoading(false);
        return;
      }

      // Store user info in localStorage for current session
      try {
        StorageManager.setJSON("taskManagerUser", {
          id: userId,
          username,
        });
      } catch (error) {
        console.error("Error storing user data:", error);
        // Fallback to direct localStorage
        try {
          localStorage.setItem(
            "taskManagerUser",
            JSON.stringify({
              id: userId,
              username,
            }),
          );
        } catch (fallbackError) {
          console.error("Fallback storage also failed:", fallbackError);
          alert("Unable to store user data. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Set default settings for new user
      const defaultSettings = {
        darkMode: false,
        defaultView: "card",
        notificationsEnabled: true,
        notificationTime: "30",
        showPlannerOnLogin: true,
        categories: [
          { id: "1", name: "Work", color: "#3b82f6" },
          { id: "2", name: "Personal", color: "#10b981" },
          { id: "3", name: "Health", color: "#ef4444" },
          { id: "4", name: "Errands", color: "#f59e0b" },
          { id: "5", name: "Learning", color: "#8b5cf6" },
          { id: "6", name: "Daily Plan", color: "#8b5cf6" },
        ],
      };

      // Save settings both for current session and user-specific storage
      StorageManager.setJSON("taskManagerSettings", defaultSettings);
      StorageManager.setJSON(`taskManagerSettings_${userId}`, defaultSettings);

      // Create empty tasks array for new user
      StorageManager.setJSON("taskManagerTasks", []);
      StorageManager.setJSON(`taskManagerTasks_${userId}`, []);

      // Clear the planner shown flag so it shows on fresh login
      StorageManager.removeItem("plannerShownForSession");

      // Redirect to home page
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-2 md:p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Task Manager
          </CardTitle>
          <CardDescription className="text-center">
            {activeTab === "login"
              ? "Sign in to access your tasks"
              : "Create a new account"}
          </CardDescription>
        </CardHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="username" className="text-sm">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 md:top-3 md:h-4 md:w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      className="pl-10 h-9 text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 md:top-3 md:h-4 md:w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10 h-9 text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-xs text-center text-muted-foreground mt-4">
                Demo credentials: username "admin" password "123456"
              </p>
            </CardFooter>
          </TabsContent>

          <TabsContent value="register">
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-username"
                      placeholder="Choose a username"
                      className="pl-10"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
