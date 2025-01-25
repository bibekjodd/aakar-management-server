import { prefs } from '@/lib/constants';
import { decodeCursor } from '@/lib/utils';
import { z } from 'zod';

const assignmentTaskSchema = z.object({
  title: z
    .string()
    .max(
      prefs.assignment.maxTasksTitleLength,
      `Tasks title can't exceed ${prefs.assignment.maxTasksTitleLength} characters`
    ),
  links: z
    .array(z.string().max(200, "Links can't exceed 200 characters").url())
    .max(
      prefs.assignment.maxLinksOnAssignment,
      `Task can't have more than ${prefs.assignment.maxLinksOnAssignment} links`
    )
    .optional(),
  remarks: z
    .string()
    .max(
      prefs.assignment.maxSolutionLength,
      `Task remarks can't exceed ${prefs.assignment.maxTasksRemarksLength} characters`
    )
});
export type AssignmentTask = z.infer<typeof assignmentTaskSchema>;

export const postAssignmentSchema = z.object({
  batch: z.string(),
  title: z.string().max(200, "Assignment title can't exceed 200 characters").optional(),
  tasks: z
    .array(assignmentTaskSchema)
    .min(1, 'Assignment must have at least one task')
    .max(
      prefs.assignment.maxTasks,
      `Assignment can't have more than ${prefs.assignment.maxTasks} tasks`
    ),
  submissionDate: z
    .string()
    .date()
    .refine((val) => {
      return val > new Date().toISOString();
    }, 'Invalid submission date')
    .optional()
});

export const updateAssignmentSchema = z.object({
  batch: z.string(),
  title: z.string().max(200, "Assignment title can't exceed 200 characters").optional(),
  submissionDate: z
    .string()
    .date()
    .refine((val) => {
      return val > new Date().toISOString();
    }, 'Invalid submission date')
    .optional()
});

export const queryAssignmentsSchema = z.object({
  cursor: z.preprocess(
    (val) => (val ? decodeCursor(val as string) : undefined),
    z
      .object(
        {
          id: z.string(),
          value: z.preprocess((val) => String(val || ''), z.string())
        },
        { message: 'Invalid cursor' }
      )
      .optional()
  ),
  teacher: z.string().optional(),
  batch: z.string().optional(),
  limit: z.preprocess((val) => Number(val) || undefined, z.number().min(1).max(100)).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['pending', 'completed']).optional(),
  from: z
    .union([
      z
        .string()
        .date()
        .transform((val) => new Date(val).toISOString()),
      z.string().datetime()
    ])
    .optional(),
  to: z
    .union([
      z
        .string()
        .date()
        .transform((val) => {
          const to = new Date(val);
          to.setDate(to.getDate() + 1);
          return to.toISOString();
        }),
      z.string().datetime()
    ])
    .optional(),
  resource: z.enum(['student', 'teacher']).optional()
});
