import React, { useState } from "react";
import {
  Filter,
  Calendar as CalendarIcon,
  CheckSquare,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StorageManager } from "@/components/storage/StorageManager";
import { supabase } from "@/lib/supabase";

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  category: string;
  status: string;
  dateRange: Date | undefined;
  searchTerm: string;
}

interface ExtendedFilterBarProps extends FilterBarProps {
  categories?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

const FilterBar = ({
  onFilterChange = () => {},
  categories = [
    { id: "1", name: "Work", color: "#3b82f6" },
    { id: "2", name: "Personal", color: "#10b981" },
    { id: "3", name: "Health", color: "#ef4444" },
    { id: "4", name: "Errands", color: "#f59e0b" },
    { id: "5", name: "Learning", color: "#8b5cf6" },
  ],
}: ExtendedFilterBarProps) => {
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    status: "Pending",
    dateRange: undefined,
    searchTerm: "",
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Use the categories passed from props

  const statuses = ["Pending", "Completed", "All", "Overdue"];

  // Add a special class to the Completed status to make it more visible
  const getStatusClass = (status: string) => {
    if (status === "Completed") return "text-green-600 font-medium";
    return "";
  };

  const handleCategoryChange = (value: string) => {
    // Convert "all-categories" to empty string internally
    const categoryValue = value === "all-categories" ? "" : value;
    const newFilters = { ...filters, category: categoryValue };
    setFilters(newFilters);
    updateActiveFilters("category", categoryValue);
    // Always pass the full filters object
    onFilterChange(newFilters);
  };

  const handleStatusChange = async (value: string) => {
    // When switching from Completed to Pending, we need to force a complete reset
    if (filters.status === "Completed" && value === "Pending") {
      // First reset all filters to default state
      const resetFilters = {
        category: filters.category, // Keep category filter
        status: "Pending",
        dateRange: filters.dateRange, // Keep date filter if any
        searchTerm: filters.searchTerm, // Keep search term if any
      };

      // Update state immediately
      setFilters(resetFilters);
      updateActiveFilters("status", "Pending");

      // Force a complete reload with pending tasks
      // Use a timeout to ensure state is updated before filter change is processed
      setTimeout(() => {
        onFilterChange({
          ...resetFilters,
          forceReset: true, // Add a flag to force reset
        });
      }, 0);

      // Update URL
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("status");
        window.history.pushState({}, "", url);
      } catch (error) {
        console.error("Error updating URL:", error);
      }

      return; // Exit early to avoid the rest of the function
    }

    // Normal behavior for other status changes
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    updateActiveFilters("status", value);
    onFilterChange(newFilters);

    // When switching to Completed view, ensure we load all completed tasks from database
    if (value === "Completed") {
      try {
        // Get current user ID from StorageManager for consistency
        const userJson = StorageManager.getItem("taskManagerUser");
        if (!userJson) return;

        const user = JSON.parse(userJson);
        const userId = user.id;

        // Try to load from database first if available
        try {
          if (supabase) {
            const { data, error } = await supabase
              .from("tasks")
              .select("*, categories(*)")
              .eq("user_id", userId)
              .eq("completed", true);

            if (error) throw error;
            console.log(`Found ${data.length} completed tasks in database`);
          }
        } catch (dbError) {
          console.error(
            "Error loading completed tasks from database:",
            dbError,
          );
        }
      } catch (error) {
        console.error("Error handling completed tasks view:", error);
      }
    }

    // Update URL with status parameter for direct linking
    try {
      const url = new URL(window.location.href);
      if (value === "Completed") {
        url.searchParams.set("status", "Completed");
      } else if (value === "All" || value === "Pending") {
        url.searchParams.delete("status");
      } else {
        url.searchParams.set("status", value);
      }
      window.history.pushState({}, "", url);
    } catch (error) {
      console.error("Error updating URL:", error);
      // Continue without updating URL if there's an error
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    const newFilters = { ...filters, dateRange: date };
    setFilters(newFilters);
    updateActiveFilters("date", date ? "Selected" : "");
    onFilterChange(date ? newFilters : {});
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newFilters = { ...filters, searchTerm: value };
    setFilters(newFilters);
    updateActiveFilters("search", value);
    onFilterChange(value ? newFilters : {});
  };

  const updateActiveFilters = (
    type: string,
    value: string | Date | undefined,
  ) => {
    if (!value) {
      setActiveFilters((prev) =>
        prev.filter((filter) => !filter.startsWith(type)),
      );
      return;
    }

    const filterLabel = `${type}:${typeof value === "string" ? value : "Selected"}`;

    if (!activeFilters.some((filter) => filter.startsWith(type))) {
      setActiveFilters((prev) => [...prev, filterLabel]);
    } else {
      setActiveFilters((prev) => [
        ...prev.filter((filter) => !filter.startsWith(type)),
        filterLabel,
      ]);
    }
  };

  const removeFilter = (filter: string) => {
    const [type, value] = filter.split(":");

    setActiveFilters((prev) => prev.filter((f) => f !== filter));

    // Reset the corresponding filter
    if (type === "category") {
      // When removing category filter, explicitly set to empty string (all categories)
      const newFilters = { ...filters, category: "" };
      setFilters(newFilters);
      // Use all-categories value for the select component
      document.querySelector('[data-value="all-categories"]')?.click();
      onFilterChange(newFilters);
    } else if (type === "status") {
      // When removing status filter, ALWAYS explicitly set to Pending and trigger filter change
      const newFilters = { ...filters, status: "Pending" };
      setFilters(newFilters);

      // Force reload tasks with Pending status if we were showing Completed
      if (value === "Completed") {
        // Create a reset filter object with force flag
        const resetFilters = {
          category: filters.category, // Keep category filter
          status: "Pending",
          dateRange: filters.dateRange, // Keep date filter if any
          searchTerm: filters.searchTerm, // Keep search term if any
          forceReset: true, // Add flag to force reset
        };

        // Use setTimeout to ensure state updates before filter change
        setTimeout(() => {
          // Force a complete reload with pending tasks
          onFilterChange(resetFilters);
        }, 0);
      } else {
        // For other status changes, just update normally
        onFilterChange(newFilters);
      }

      // Update URL to remove status parameter
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("status");
        window.history.pushState({}, "", url);
      } catch (error) {
        console.error("Error updating URL:", error);
      }
    } else if (type === "date") {
      setFilters((prev) => ({ ...prev, dateRange: undefined }));
      onFilterChange({ ...filters, dateRange: undefined });
    } else if (type === "search") {
      setFilters((prev) => ({ ...prev, searchTerm: "" }));
      onFilterChange({ ...filters, searchTerm: "" });
    }
  };

  const clearAllFilters = () => {
    const newFilters = {
      category: "",
      status: "Pending",
      dateRange: undefined,
      searchTerm: "",
    };

    setFilters(newFilters);
    setActiveFilters([]);

    // Explicitly pass the Pending status to ensure tasks are filtered correctly
    onFilterChange(newFilters);

    // Update URL to remove status parameter
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      window.history.pushState({}, "", url);
    } catch (error) {
      console.error("Error updating URL:", error);
    }
  };

  return (
    <div className="w-full h-auto bg-background border-b p-2 md:p-3 flex flex-col space-y-1 md:space-y-2">
      <div className="flex items-center justify-between">
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground ml-auto"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 md:gap-2 items-center">
        {/* Category filter */}
        <Select value={filters.category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[90px] md:w-[130px] h-7 md:h-8 text-xs md:text-sm">
            <div className="flex items-center gap-1 md:gap-2">
              <Tag className="h-3 w-3 md:h-4 md:w-4" />
              <SelectValue placeholder="Category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                All Categories
              </div>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-[90px] md:w-[130px] h-7 md:h-8 text-xs md:text-sm ${filters.status === "Completed" ? "bg-primary/10 border-primary text-primary font-medium" : ""}`}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <CheckSquare className="h-3 w-3 md:h-4 md:w-4" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                <span className={getStatusClass(status)}>{status}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date filter removed as users can access date filtering through calendar view */}

        {/* Search input */}
        <div className="flex-grow">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="h-7 md:h-8 text-xs md:text-sm"
          />
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {activeFilters.map((filter) => {
            const [type, value] = filter.split(":");
            let badgeVariant:
              | "default"
              | "secondary"
              | "destructive"
              | "outline" = "default";

            if (type === "category") badgeVariant = "secondary";
            if (type === "date") badgeVariant = "default";
            if (type === "search") badgeVariant = "destructive";

            // Skip showing status badges since the filter button already indicates this
            if (type === "status") return null;

            return (
              <Badge
                key={filter}
                variant={badgeVariant}
                className="flex items-center gap-1 py-0.5 px-1.5 md:py-1 md:px-2 text-[10px] md:text-xs"
              >
                <span className="truncate max-w-[100px] md:max-w-none">
                  {type === "category" && "Category:"}
                  {type === "date" && "Date:"}
                  {type === "search" && "Search:"} {value}
                </span>
                <X
                  className="h-3 w-3 cursor-pointer flex-shrink-0"
                  onClick={() => removeFilter(filter)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
