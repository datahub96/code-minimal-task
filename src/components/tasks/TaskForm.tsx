import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock, Bell, Tag } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TaskFormProps {
  onSubmit?: (data: TaskFormValues) => void;
  onCancel?: () => void;
  initialData?: TaskFormValues;
  isEditing?: boolean;
}

interface TaskFormValues {
  title: string;
  description: string;
  deadline: Date | null;
  category: string;
  reminderTime: string;
  timeSpent?: number;
  expectedTime?: number;
}

// This will be replaced with categories from userSettings
const defaultCategories = [
  { value: "work", label: "Work", color: "bg-blue-500" },
  { value: "personal", label: "Personal", color: "bg-green-500" },
  { value: "errands", label: "Errands", color: "bg-yellow-500" },
  { value: "health", label: "Health", color: "bg-red-500" },
  { value: "learning", label: "Learning", color: "bg-purple-500" },
];

const reminderOptions = [
  { value: "0", label: "At time of deadline" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

// Import useContext to access user settings
import { useContext } from "react";

// Create a context in home.tsx and pass it here
// For now, we'll modify the component to accept categories as a prop
interface ExtendedTaskFormProps extends TaskFormProps {
  categories?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

const TaskForm: React.FC<ExtendedTaskFormProps> = ({
  onSubmit = () => {},
  onCancel = () => {},
  initialData = {
    title: "",
    description: "",
    deadline: null,
    category: "work",
    reminderTime: "0",
    timeSpent: 0,
    expectedTime: 3600000, // Default 1 hour
  },
  isEditing = false,
  categories = [],
}) => {
  const [date, setDate] = useState<Date | null>(initialData.deadline);

  const form = useForm<TaskFormValues>({
    defaultValues: initialData,
  });

  const handleSubmit = (data: TaskFormValues) => {
    // Include the selected date in the form data
    const formData = {
      ...data,
      deadline: date,
    };

    try {
      onSubmit(formData);
    } catch (error) {
      console.error("Error submitting task form:", error);
      // Continue anyway - the error will be handled by the parent component
    }
  };

  return (
    <div className="w-full max-w-md p-3 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-6 text-gray-800 dark:text-gray-100">
        {isEditing ? "Edit Task" : "Add New Task"}
      </h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-3 md:space-y-6"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter task title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter task description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 md:space-y-4">
            <FormLabel className="text-sm">Deadline</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-xs md:text-sm h-9"
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  {date ? format(date, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date || undefined}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Tag className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select a category" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length > 0
                      ? categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))
                      : defaultCategories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${category.color}`}
                              />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reminderTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reminder</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Set reminder time" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {reminderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  When should we remind you about this task?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Spent field - only show when editing an existing task */}
          {isEditing && (
            <FormField
              control={form.control}
              name="timeSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Spent (hours:minutes:seconds)</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Hours"
                      className="w-1/3"
                      value={Math.floor((field.value || 0) / (1000 * 60 * 60))}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        const minutes = Math.floor(
                          ((field.value || 0) % (1000 * 60 * 60)) / (1000 * 60),
                        );
                        const seconds = Math.floor(
                          ((field.value || 0) % (1000 * 60)) / 1000,
                        );
                        const newTimeSpent =
                          (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
                        field.onChange(newTimeSpent);
                      }}
                      min="0"
                    />
                    <Input
                      type="number"
                      placeholder="Minutes"
                      className="w-1/3"
                      value={Math.floor(
                        ((field.value || 0) % (1000 * 60 * 60)) / (1000 * 60),
                      )}
                      onChange={(e) => {
                        const hours = Math.floor(
                          (field.value || 0) / (1000 * 60 * 60),
                        );
                        const minutes = parseInt(e.target.value) || 0;
                        const seconds = Math.floor(
                          ((field.value || 0) % (1000 * 60)) / 1000,
                        );
                        const newTimeSpent =
                          (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
                        field.onChange(newTimeSpent);
                      }}
                      min="0"
                      max="59"
                    />
                    <Input
                      type="number"
                      placeholder="Seconds"
                      className="w-1/3"
                      value={Math.floor(
                        ((field.value || 0) % (1000 * 60)) / 1000,
                      )}
                      onChange={(e) => {
                        const hours = Math.floor(
                          (field.value || 0) / (1000 * 60 * 60),
                        );
                        const minutes = Math.floor(
                          ((field.value || 0) % (1000 * 60 * 60)) / (1000 * 60),
                        );
                        const seconds = parseInt(e.target.value) || 0;
                        const newTimeSpent =
                          (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
                        field.onChange(newTimeSpent);
                      }}
                      min="0"
                      max="59"
                    />
                  </div>
                  <FormDescription>
                    Manually adjust the time spent on this task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="expectedTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Time to Complete (hours:minutes)</FormLabel>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Hours"
                    className="w-1/2"
                    value={Math.floor((field.value || 0) / (1000 * 60 * 60))}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value) || 0;
                      const minutes = Math.floor(
                        ((field.value || 0) % (1000 * 60 * 60)) / (1000 * 60),
                      );
                      const newExpectedTime =
                        (hours * 60 * 60 + minutes * 60) * 1000;
                      field.onChange(newExpectedTime);
                    }}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Minutes"
                    className="w-1/2"
                    value={Math.floor(
                      ((field.value || 0) % (1000 * 60 * 60)) / (1000 * 60),
                    )}
                    onChange={(e) => {
                      const hours = Math.floor(
                        (field.value || 0) / (1000 * 60 * 60),
                      );
                      const minutes = parseInt(e.target.value) || 0;
                      const newExpectedTime =
                        (hours * 60 * 60 + minutes * 60) * 1000;
                      field.onChange(newExpectedTime);
                    }}
                    min="0"
                    max="59"
                  />
                </div>
                <FormDescription>
                  Estimate how long this task will take to complete
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TaskForm;
