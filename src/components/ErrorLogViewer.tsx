import React, { useState, useEffect } from "react";
import { getErrorLogs, clearErrorLogs } from "@/lib/errorCodes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Download, RefreshCw } from "lucide-react";

interface ErrorLogViewerProps {
  onClose?: () => void;
}

const ErrorLogViewer: React.FC<ErrorLogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const errorLogs = getErrorLogs();
    setLogs(errorLogs.reverse()); // Show newest first
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear all error logs?")) {
      clearErrorLogs();
      setLogs([]);
      setSelectedLog(null);
    }
  };

  const handleDownloadLogs = () => {
    const logsJson = JSON.stringify(logs.slice().reverse(), null, 2); // Reverse back to chronological order
    const blob = new Blob([logsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-manager-error-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-3 md:p-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg md:text-2xl font-semibold">
          Error Logs
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[500px]">
          {/* Log list */}
          <div className="border-r border-gray-200 dark:border-gray-700">
            <ScrollArea className="h-[500px]">
              {logs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No error logs found
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedLog === log ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="font-medium text-sm">{log.code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {log.message}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Log details */}
          <div className="col-span-2">
            <ScrollArea className="h-[500px] p-4">
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{selectedLog.code}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(selectedLog.timestamp)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-1">Message</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                      {selectedLog.message}
                    </div>
                  </div>

                  {selectedLog.details && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Details</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.stack && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Stack Trace
                      </h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto whitespace-pre-wrap">
                        {selectedLog.stack}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {logs.length > 0
                    ? "Select an error log to view details"
                    : "No error logs available"}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorLogViewer;
