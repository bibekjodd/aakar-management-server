import { db } from '@/db';
import { assignments, ResponseAssignment, selectAssignmentSnapshot } from '@/db/assignments.schema';
import { selectUserSnapshot, users } from '@/db/users.schema';
import { eq } from 'drizzle-orm';

export const findAssignmentDetails = async (
  assignmentId: string
): Promise<ResponseAssignment | undefined> => {
  const [assignment] = await db
    .select({ ...selectAssignmentSnapshot, teacher: selectUserSnapshot })
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .innerJoin(users, eq(assignments.teacherId, users.id));

  return assignment;
};
