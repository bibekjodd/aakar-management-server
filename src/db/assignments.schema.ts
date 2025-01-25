import { MILLIS, prefs } from '@/lib/constants';
import { createId } from '@paralleldrive/cuid2';
import { getTableColumns } from 'drizzle-orm';
import { foreignKey, index, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { responseUserSchema, users } from './users.schema';

export const assignments = sqliteTable(
  'assignments',
  (t) => ({
    id: t.text('id').notNull().$defaultFn(createId),
    title: t.text('title'),
    teacherId: t.text('teacher_id').notNull(),
    batch: t.text('batch').notNull(),
    createdAt: t
      .text('created_at')
      .notNull()
      .$default(() => new Date().toISOString()),
    submissionDate: t
      .text('submission_date')
      .$defaultFn(() =>
        new Date(Date.now() + MILLIS.DAY * prefs.assignment.maxSubmissionDays).toISOString()
      ),
    solution: t.text()
  }),
  (assignments) => [
    primaryKey({ name: 'assignments_pkey', columns: [assignments.id] }),
    foreignKey({
      name: 'fk_teacher_id_assignments',
      columns: [assignments.teacherId],
      foreignColumns: [users.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_teacher_id_assignments').on(assignments.teacherId),
    index('idx_created_at_assignments').on(assignments.createdAt),
    index('idx_submission_date_assignments').on(assignments.submissionDate)
  ]
);

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export const selectAssignmentSnapshot = getTableColumns(assignments);

export const selectAssignmentSchema = createSelectSchema(assignments);
export const responseAssignmentSchema = selectAssignmentSchema.extend({
  teacher: responseUserSchema
});
export type ResponseAssignment = z.infer<typeof responseAssignmentSchema>;
