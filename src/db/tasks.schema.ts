import { createId } from '@paralleldrive/cuid2';
import { getTableColumns } from 'drizzle-orm';
import { foreignKey, index, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { assignments } from './assignments.schema';

export const tasks = sqliteTable(
  'tasks',
  (t) => ({
    id: t.text().notNull().$defaultFn(createId),
    assignmentId: t.text('assignment_id').notNull(),
    title: t.text({ length: 1000 }).notNull(),
    remarks: t.text({ length: 1000 }),
    links: t.text('links', { mode: 'json' }).$type<string[]>()
  }),
  (tasks) => [
    primaryKey({ name: 'tasks_pkey', columns: [tasks.id] }),
    foreignKey({
      name: 'fk_assignment_id',
      columns: [tasks.assignmentId],
      foreignColumns: [assignments.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_assignment_id_tasks').on(tasks.assignmentId)
  ]
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export const selectTaskSnapshot = getTableColumns(tasks);
export const selectTasksSchema = createSelectSchema(tasks)
  .omit({ links: true })
  .extend({ links: z.array(z.string().url().max(200)).max(5) });
export const responseTaskSchema = selectTasksSchema;
export type ResponseTask = Task;
