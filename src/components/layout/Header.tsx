import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Settings,
  Calendar,
  List,
  Moon,
  Sun,
  LogOut,
  BarChart2,
  ClipboardList,
  CheckSquare,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface HeaderProps {
  onViewChange?: (view: "list" | "calendar" | "card" | "analytics") => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  currentView?: "list" | "calendar" | "card" | "analytics";
  onSettingsClick?: () => void;
  onPlannerClick?: () => void;
}

const Header = ({
  onViewChange = () => {},
  onThemeToggle = () => {},
  isDarkMode = false,
  currentView = "list",
  onSettingsClick = () => {},
  onPlannerClick = () => {},
}: HeaderProps) => {
  const [view, setView] = useState<"list" | "calendar" | "card" | "analytics">(
    currentView,
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const navigate = useNavigate();

  const handleViewChange = (
    newView: "list" | "calendar" | "card" | "analytics",
  ) => {
    setView(newView);
    onViewChange(newView);
  };

  const handleLogout = () => {
    localStorage.removeItem("taskManagerUser");
    navigate("/login");
  };

  const handleSubmitFeedback = () => {
    if (feedbackText.trim()) {
      // Log error report to database
      const errorReport = {
        userId: localStorage.getItem("taskManagerUser")
          ? JSON.parse(localStorage.getItem("taskManagerUser")).id
          : "anonymous",
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        feedback: feedbackText,
      };

      // Save to localStorage for demo purposes (in a real app, this would be sent to a database)
      const existingReports = JSON.parse(
        localStorage.getItem("feedbackReports") || "[]",
      );
      existingReports.push(errorReport);
      localStorage.setItem("feedbackReports", JSON.stringify(existingReports));

      console.log("Feedback submitted:", errorReport);
      setFeedbackText("");
      setIsFeedbackOpen(false);
    }
  };

  return (
    <>
      <header className="w-full h-20 px-4 md:px-6 flex items-center justify-between border-b bg-background">
        <div className="flex items-center">
          <Link
            to="/"
            className="hover:opacity-80 transition-opacity"
            onClick={() => handleViewChange("card")}
          >
            <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-baseline">
              <span className="text-2xl md:text-3xl">TASK</span>
              <span className="text-base md:text-lg font-medium ml-1">
                Manager
              </span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-1 md:space-x-4">
          {/* Daily Planner Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPlannerClick}
                  className="h-10 w-10 p-0"
                >
                  <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Daily Planner</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Report Error Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 md:h-6 md:w-6"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" x2="4" y1="22" y2="15" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Report Feedback</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Settings Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettingsClick}
                  className="h-10 w-10 p-0"
                >
                  <Settings className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Logout Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-10 w-10 p-0"
                >
                  <LogOut className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">
                Please describe what issue you're experiencing:
              </Label>
              <Textarea
                id="feedback"
                placeholder="Describe the issue in detail..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={feedbackText.trim() === ""}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
