-- Add indexes to improve filtering performance
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);
CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks(deadline);
CREATE INDEX IF NOT EXISTS tasks_user_id_completed_idx ON tasks(user_id, completed);

-- Add function to filter tasks by status
CREATE OR REPLACE FUNCTION get_filtered_tasks(user_id_param UUID, status_param TEXT)
RETURNS SETOF tasks AS $$
BEGIN
  IF status_param = 'Completed' THEN
    RETURN QUERY SELECT * FROM tasks WHERE user_id = user_id_param AND completed = TRUE;
  ELSIF status_param = 'Pending' THEN
    RETURN QUERY SELECT * FROM tasks WHERE user_id = user_id_param AND completed = FALSE;
  ELSIF status_param = 'Overdue' THEN
    RETURN QUERY SELECT * FROM tasks 
      WHERE user_id = user_id_param 
      AND completed = FALSE 
      AND deadline < NOW();
  ELSE
    -- 'All' or any other value returns all tasks
    RETURN QUERY SELECT * FROM tasks WHERE user_id = user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;
