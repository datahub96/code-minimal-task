/**
 * Error code system for tracking and diagnosing issues
 * Format: TM-[AREA]-[CODE]
 *
 * Areas:
 * AUTH: Authentication related errors
 * STOR: Storage related errors
 * DB: Database related errors
 * TASK: Task management related errors
 * UI: UI related errors
 */

export const ErrorCodes = {
  // Authentication errors (100-199)
  AUTH_LOGIN_FAILED: "TM-AUTH-101",
  AUTH_REGISTER_FAILED: "TM-AUTH-102",
  AUTH_LOGOUT_FAILED: "TM-AUTH-103",
  AUTH_SESSION_EXPIRED: "TM-AUTH-104",
  AUTH_INVALID_CREDENTIALS: "TM-AUTH-105",
  AUTH_USERNAME_EXISTS: "TM-AUTH-106",

  // Storage errors (200-299)
  STORAGE_NOT_AVAILABLE: "TM-STOR-201",
  STORAGE_WRITE_FAILED: "TM-STOR-202",
  STORAGE_READ_FAILED: "TM-STOR-203",
  STORAGE_DELETE_FAILED: "TM-STOR-204",
  STORAGE_QUOTA_EXCEEDED: "TM-STOR-205",
  STORAGE_VERIFICATION_FAILED: "TM-STOR-206",

  // Database errors (300-399)
  DB_CONNECTION_FAILED: "TM-DB-301",
  DB_QUERY_FAILED: "TM-DB-302",
  DB_INSERT_FAILED: "TM-DB-303",
  DB_UPDATE_FAILED: "TM-DB-304",
  DB_DELETE_FAILED: "TM-DB-305",
  DB_TRANSACTION_FAILED: "TM-DB-306",
  DB_SUPABASE_NOT_CONFIGURED: "TM-DB-307",

  // Task management errors (400-499)
  TASK_CREATE_FAILED: "TM-TASK-401",
  TASK_UPDATE_FAILED: "TM-TASK-402",
  TASK_DELETE_FAILED: "TM-TASK-403",
  TASK_LOAD_FAILED: "TM-TASK-404",
  TASK_TIMER_FAILED: "TM-TASK-405",
  TASK_COMPLETION_FAILED: "TM-TASK-406",

  // UI errors (500-599)
  UI_RENDER_FAILED: "TM-UI-501",
  UI_EVENT_FAILED: "TM-UI-502",
  UI_ANIMATION_FAILED: "TM-UI-503",
  UI_FORM_VALIDATION_FAILED: "TM-UI-504",
  UI_SETTINGS_SAVE_FAILED: "TM-UI-505",
};

/**
 * Log an error with its code and details
 */
export function logError(code: string, error: any, details?: any) {
  const timestamp = new Date().toISOString();
  const errorObj = {
    code,
    timestamp,
    message: error?.message || "Unknown error",
    stack: error?.stack,
    details,
  };

  console.error(`[${code}] Error:`, errorObj);

  // Store in localStorage for later retrieval if needed
  try {
    const errorLogs = JSON.parse(
      localStorage.getItem("taskManagerErrorLogs") || "[]",
    );
    errorLogs.push(errorObj);
    // Keep only the last 50 errors to avoid storage issues
    if (errorLogs.length > 50) {
      errorLogs.shift();
    }
    localStorage.setItem("taskManagerErrorLogs", JSON.stringify(errorLogs));
  } catch (e) {
    // If we can't store the error log, just log to console
    console.error("Failed to store error log", e);
  }

  return code; // Return the code for function chaining
}

/**
 * Get all error logs
 */
export function getErrorLogs() {
  try {
    return JSON.parse(localStorage.getItem("taskManagerErrorLogs") || "[]");
  } catch (e) {
    console.error("Failed to retrieve error logs", e);
    return [];
  }
}

/**
 * Clear all error logs
 */
export function clearErrorLogs() {
  try {
    localStorage.removeItem("taskManagerErrorLogs");
    return true;
  } catch (e) {
    console.error("Failed to clear error logs", e);
    return false;
  }
}
