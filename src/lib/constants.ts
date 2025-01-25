export const MILLIS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
};

export const userRoles = ['student', 'teacher', 'admin'] as const;

export const prefs = {
  assignment: {
    maxSubmissionDays: 30,
    maxLinksOnAssignment: 5,
    maxTasks: 20,
    maxTasksTitleLength: 1000,
    maxTasksRemarksLength: 1000,
    maxSolutionLength: 2000
  }
} as const;
