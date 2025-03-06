import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Settings, Calendar, List, Moon, Sun, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface HeaderProps {
  onViewChange?: (view: "list" | "calendar" | "card") => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  currentView?: "list" | "calendar" | "card";
  onSettingsClick?: () => void;
}

const Header = ({
  onViewChange = () => {},
  onThemeToggle = () => {},
  isDarkMode = false,
  currentView = "list",
  onSettingsClick = () => {},
}: HeaderProps) => {
  const [view, setView] = useState<"list" | "calendar" | "card">(currentView);
  const navigate = useNavigate();

  const handleViewChange = (newView: "list" | "calendar" | "card") => {
    setView(newView);
    onViewChange(newView);
  };

  const handleLogout = () => {
    localStorage.removeItem("taskManagerUser");
    navigate("/login");
  };

  return (
    <header className="w-full h-16 px-3 md:px-6 flex items-center justify-between border-b bg-background">
      <div className="flex items-center">
        <h1 className="text-lg md:text-xl font-semibold">Task Manager</h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* View Toggle */}
        <div className="flex items-center space-x-1 md:space-x-2 border rounded-md p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={view === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewChange("calendar")}
                  className="px-3"
                >
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  <span className="text-xs md:text-sm">Calendar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View tasks on a calendar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Theme Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch checked={isDarkMode} onCheckedChange={onThemeToggle} />
                <Moon className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle dark/light mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Settings Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                <Settings className="h-5 w-5" />
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
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};

export default Header;
