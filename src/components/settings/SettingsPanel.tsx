import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Moon, Sun, Bell, Trash2, Plus, Save } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface SettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  settings?: {
    darkMode: boolean;
    defaultView: string;
    notificationsEnabled: boolean;
    notificationTime: string;
    categories: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  onSettingsChange?: (settings: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen = true,
  onClose = () => {},
  settings = {
    darkMode: false,
    defaultView: "list",
    notificationsEnabled: true,
    notificationTime: "30",
    categories: [
      { id: "1", name: "Work", color: "#4f46e5" },
      { id: "2", name: "Personal", color: "#10b981" },
      { id: "3", name: "Urgent", color: "#ef4444" },
      { id: "4", name: "Learning", color: "#f59e0b" },
    ],
  },
  onSettingsChange = () => {},
}) => {
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [defaultView, setDefaultView] = useState(settings.defaultView);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled,
  );
  const [notificationTime, setNotificationTime] = useState(
    settings.notificationTime,
  );
  const [categories, setCategories] = useState(settings.categories);

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#4f46e5",
  });

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const updatedCategories = [
        ...categories,
        {
          id: Date.now().toString(),
          name: newCategory.name,
          color: newCategory.color,
        },
      ];
      setCategories(updatedCategories);
      setNewCategory({ name: "", color: "#4f46e5" });
      saveSettings({ categories: updatedCategories });
    }
  };

  const handleDeleteCategory = (id: string) => {
    const updatedCategories = categories.filter(
      (category) => category.id !== id,
    );
    setCategories(updatedCategories);
    saveSettings({ categories: updatedCategories });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    saveSettings({ darkMode: newDarkMode });
  };

  const handleDefaultViewChange = (value: string) => {
    setDefaultView(value);
    saveSettings({ defaultView: value });
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    saveSettings({ notificationsEnabled: enabled });
  };

  const handleNotificationTimeChange = (value: string) => {
    setNotificationTime(value);
    saveSettings({ notificationTime: value });
  };

  const saveSettings = (changedSettings: any) => {
    const newSettings = {
      darkMode,
      defaultView,
      notificationsEnabled,
      notificationTime,
      categories,
      ...changedSettings,
    };
    console.log("Saving settings:", newSettings);

    // Save settings to localStorage
    localStorage.setItem("taskManagerSettings", JSON.stringify(newSettings));

    onSettingsChange(newSettings);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-3 md:p-6">
        <CardTitle className="text-lg md:text-xl font-semibold">
          Settings
        </CardTitle>
        <CardDescription>
          Customize your task management experience
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="p-2 md:p-4">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label htmlFor="default-view">Default View</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose which view to show when the app loads
              </p>
              <Select
                value={defaultView}
                onValueChange={handleDefaultViewChange}
              >
                <SelectTrigger id="default-view" className="mt-2">
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="card">Card View</SelectItem>
                  <SelectItem value="calendar">Calendar View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  const updatedSettings = {
                    darkMode,
                    defaultView,
                    notificationsEnabled,
                    notificationTime,
                    categories,
                  };
                  console.log("Saving all settings:", updatedSettings);
                  onSettingsChange(updatedSettings);
                  onClose();
                }}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="p-2 md:p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-gray-500" />
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
                <Moon className="h-4 w-4 text-gray-500" />
              </div>
            </div>

            <Separator />

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  const updatedSettings = {
                    darkMode,
                    defaultView,
                    notificationsEnabled,
                    notificationTime,
                    categories,
                  };
                  console.log("Saving all settings:", updatedSettings);
                  onSettingsChange(updatedSettings);
                  onClose();
                }}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="p-2 md:p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive reminders for upcoming tasks
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsChange}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notification-time">Notification Time</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                How many minutes before deadline to send notification
              </p>
              <Select
                value={notificationTime}
                onValueChange={handleNotificationTimeChange}
                disabled={!notificationsEnabled}
              >
                <SelectTrigger id="notification-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  const updatedSettings = {
                    darkMode,
                    defaultView,
                    notificationsEnabled,
                    notificationTime,
                    categories,
                  };
                  console.log("Saving all settings:", updatedSettings);
                  onSettingsChange(updatedSettings);
                  onClose();
                }}
                disabled={!notificationsEnabled}
              >
                <Bell className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="p-2 md:p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Add New Category</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="flex-grow"
                />
                <div
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  style={{ backgroundColor: newCategory.color }}
                  onClick={() => {
                    // In a real app, this would open a color picker
                    const colors = [
                      "#4f46e5",
                      "#10b981",
                      "#ef4444",
                      "#f59e0b",
                      "#8b5cf6",
                      "#ec4899",
                    ];
                    const nextColorIndex =
                      colors.indexOf(newCategory.color) + 1;
                    setNewCategory({
                      ...newCategory,
                      color: colors[nextColorIndex % colors.length],
                    });
                  }}
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Manage Categories</Label>
              <ScrollArea className="h-[200px] rounded border p-2">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  const updatedSettings = {
                    darkMode,
                    defaultView,
                    notificationsEnabled,
                    notificationTime,
                    categories,
                  };
                  console.log("Saving all settings:", updatedSettings);
                  onSettingsChange(updatedSettings);
                  onClose();
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Categories
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default SettingsPanel;
