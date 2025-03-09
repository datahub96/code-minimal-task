import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Save, Trash2, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StorageManager } from "@/components/storage/StorageManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logError, ErrorCodes } from "@/lib/errorCodes";

interface DailyPlannerProps {
  onClose?: () => void;
  onAddTasks?: (tasks: any[]) => void;
}

interface PlanItem {
  id: string;
  text: string;
  completed: boolean;
}

const DailyPlannerErrorHandler: React.FC<DailyPlannerProps> = ({
  onClose = () => {},
  onAddTasks = () => {},
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [dailyGoal, setDailyGoal] = useState<string>("");
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [newItemText, setNewItemText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load saved planner data when component mounts or date changes
  useEffect(() => {
    const loadPlannerData = () => {
      setLoading(true);
      setError("");
      try {
        const dateKey = format(date, "yyyy-MM-dd");
        const savedData = StorageManager.getItem(`dailyPlanner_${dateKey}`);

        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setDailyGoal(parsedData.dailyGoal || "");
            setPlanItems(parsedData.planItems || []);
            setNotes(parsedData.notes || "");
          } catch (parseError) {
            console.error("Error parsing planner data:", parseError);
            logError(ErrorCodes.STORAGE_READ_FAILED, parseError, {
              method: "loadPlannerData",
              dateKey,
            });
            setError(
              "There was an error loading your planner data. The data may be corrupted.",
            );
            // Reset form as fallback
            setDailyGoal("");
            setPlanItems([]);
            setNotes("");
          }
        } else {
          // Reset form for new date
          setDailyGoal("");
          setPlanItems([]);
          setNotes("");
        }
      } catch (error) {
        console.error("Error loading planner data:", error);
        logError(ErrorCodes.TASK_LOAD_FAILED, error, {
          method: "loadPlannerData",
          date: date.toISOString(),
        });
        setError(
          "There was an error loading your planner data. Please try again.",
        );
        // Reset form as fallback
        setDailyGoal("");
        setPlanItems([]);
        setNotes("");
      } finally {
        setLoading(false);
      }
    };

    loadPlannerData();
  }, [date]);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: PlanItem = {
        id: Date.now().toString(),
        text: newItemText,
        completed: false,
      };
      setPlanItems([...planItems, newItem]);
      setNewItemText("");
    }
  };

  const handleRemoveItem = (id: string) => {
    setPlanItems(planItems.filter((item) => item.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setPlanItems(
      planItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleSave = () => {
    setLoading(true);
    setError("");
    setSaveSuccess(false);

    try {
      // Save to localStorage with error handling
      const dateKey = format(date, "yyyy-MM-dd");
      const dataToSave = {
        dailyGoal,
        planItems,
        notes,
      };

      // First check if localStorage is available
      if (!StorageManager.isLocalStorageAvailable()) {
        throw new Error("Local storage is not available in your browser");
      }

      // Try to save the data
      const success = StorageManager.setJSON(
        `dailyPlanner_${dateKey}`,
        dataToSave,
      );

      if (!success) {
        throw new Error("Failed to save planner data to storage");
      }

      // Convert plan items to tasks and add them to the task list
      const tasksToAdd = planItems
        .filter((item) => !item.completed) // Only add uncompleted items as tasks
        .map((item) => {
          // Create a date for tomorrow by adding 1 day to the selected date
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          return {
            id: `planner-${item.id}`,
            title: item.text,
            description: `Added from daily planner (${format(date, "MMM d, yyyy")})`,
            deadline: nextDay,
            category: { name: "Daily Plan", color: "#8b5cf6" }, // Purple color for planner tasks
            completed: false,
          };
        });

      if (tasksToAdd.length > 0) {
        onAddTasks(tasksToAdd);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error saving planner data:", error);
      logError(ErrorCodes.TASK_UPDATE_FAILED, error, {
        method: "handleSave",
        date: date.toISOString(),
      });
      setError(
        "There was an error saving your planner data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-3 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <CardTitle className="text-lg md:text-2xl font-semibold">
            Daily Planner
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[240px] justify-start text-left font-normal text-xs md:text-sm"
              >
                <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="p-3 md:p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <AlertDescription>Planner saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Today's Main Goal</h3>
              <Input
                placeholder="What's your main focus for today?"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full"
                disabled={loading}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Today's Plan</h3>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Add a task to your plan"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={handleAddItem} disabled={loading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[200px] rounded border p-2">
                <div className="space-y-2">
                  {planItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No items added yet. Add some tasks to plan your day!
                    </p>
                  ) : (
                    planItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleComplete(item.id)}
                            className="h-4 w-4 rounded border-gray-300"
                            disabled={loading}
                          />
                          <span
                            className={
                              item.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {item.text}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8 p-0"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Notes & Thoughts</h3>
            <Textarea
              placeholder="Any additional notes, thoughts or ideas for today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[250px] w-full"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Add Tasks
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPlannerErrorHandler;
