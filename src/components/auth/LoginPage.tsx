import React, { useState } from "react";
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
import { Lock, User } from "lucide-react";

interface User {
  username: string;
  password: string;
}

// Hardcoded user for demo
const DEMO_USER: User = {
  username: "admin",
  password: "123456",
};

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      // Store user info in localStorage
      localStorage.setItem("taskManagerUser", JSON.stringify({ username }));

      // Store tasks in localStorage if they don't exist yet
      if (!localStorage.getItem("taskManagerTasks")) {
        // Initialize with sample tasks
        const sampleTasks = [
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
        localStorage.setItem("taskManagerTasks", JSON.stringify(sampleTasks));
      }

      // Redirect to home page
      navigate("/");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Task Manager
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access your tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter your username"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-center text-muted-foreground mt-4">
            Demo credentials: username "admin" password "123456"
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
