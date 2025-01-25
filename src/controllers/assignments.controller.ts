import { db } from '@/db';
import { assignments, ResponseAssignment, selectAssignmentSnapshot } from '@/db/assignments.schema';
import { InsertTask, ResponseTask, selectTaskSnapshot, tasks } from '@/db/tasks.schema';
import { selectUserSnapshot, users } from '@/db/users.schema';
import {
  postAssignmentSchema,
  queryAssignmentsSchema,
  updateAssignmentSchema
} from '@/dtos/assignments.dto';
import {
  ForbiddenException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException
} from '@/lib/exceptions';
import { encodeCursor } from '@/lib/utils';
import { findAssignmentDetails } from '@/services/assignments.services';
import { and, asc, desc, eq, gt, gte, lt, lte, or, SQL } from 'drizzle-orm';
import { RequestHandler } from 'express';

export const postAssignment: RequestHandler<
  unknown,
  { assignment: ResponseAssignment; tasks: ResponseTask[] }
> = async (req, res) => {
  if (req.user?.role != 'teacher')
    throw new ForbiddenException('Only teachers can post assignments');

  const data = postAssignmentSchema.parse(req.body);
  const [assignment] = await db
    .insert(assignments)
    .values({
      batch: data.batch,
      title: data.title,
      teacherId: req.user.id,
      submissionDate: data.submissionDate
    })
    .returning();
  if (!assignment) throw new InternalServerException();

  const insertTasksData: InsertTask[] = data.tasks.map((item) => ({
    assignmentId: assignment.id,
    title: item.title,
    links: item.links,
    remarks: item.remarks
  }));

  const insertedTasks = await db.insert(tasks).values(insertTasksData).returning();

  const responseAssignment: ResponseAssignment = { ...assignment, teacher: req.user };
  res.status(201).json({ assignment: responseAssignment, tasks: insertedTasks });
};

export const updateAssignment: RequestHandler<
  { id: string },
  { assignment: ResponseAssignment }
> = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    throw new ForbiddenException('Only teachers or admins can update assignments');
  const assignmentId = req.params.id;

  const data = updateAssignmentSchema.parse(req.body);

  const assignment = await findAssignmentDetails(assignmentId);
  if (!assignment) throw new NotFoundException('Assignment does not exist');

  if (req.user.role !== 'admin' && assignment.teacherId !== req.user.id)
    throw new ForbiddenException('Teacher does not belong to the assignment');

  const [updatedAssignment] = await db
    .update(assignments)
    .set(data)
    .where(eq(assignments.id, assignmentId))
    .returning();

  if (!updatedAssignment) throw new NotFoundException('Assignment not found');

  const responseAssignment: ResponseAssignment = {
    ...updatedAssignment,
    teacher: assignment.teacher
  };

  res.json({
    assignment: responseAssignment
  });
};

export const deleteAssignment: RequestHandler<{ id: string }> = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  if (!(req.user.role === 'admin' || req.user.role === 'teacher'))
    throw new ForbiddenException('Only admins or teachers can delete assignment');

  const assignmentId = req.params.id;

  const assignment = await findAssignmentDetails(assignmentId);
  if (!assignment) throw new NotFoundException('Assignment does not exist');

  if (req.user.role !== 'admin' && assignment.teacherId !== req.user.id)
    throw new ForbiddenException('Teacher does not belong to the assignment');

  res.json({ message: 'Assignment deleted successfully' });
};

export const getAssignmentDetail: RequestHandler<
  { id: string },
  { assignment: ResponseAssignment }
> = async (req, res) => {
  const assignmentId = req.params.id;
  const assignment = await findAssignmentDetails(assignmentId);
  if (!assignment) throw new NotFoundException('Assignment does not exist');
  res.json({ assignment });
};

export const queryAssignments: RequestHandler<
  unknown,
  { cursor: string | undefined; assignments: ResponseAssignment[] }
> = async (req, res) => {
  const query = queryAssignmentsSchema.parse(req.query);
  if (!query.resource && !req.user) throw new UnauthorizedException();

  if (
    query.resource === 'student' &&
    !req.user?.batch &&
    !(req.user?.role === 'student' || req.user?.role === 'admin')
  )
    throw new ForbiddenException('You are not allowed to access this resource');

  if (query.resource === 'teacher' && !(req.user?.role === 'teacher' || req.user?.role === 'admin'))
    throw new ForbiddenException('You are not allowed to access this resource');

  let cursorCondition: SQL<unknown> | undefined = undefined;
  if (query.sort === 'asc' && query.cursor) {
    cursorCondition = or(
      gt(assignments.createdAt, query.cursor.value),
      and(eq(assignments.submissionDate, query.cursor.value), gt(assignments.id, query.cursor.id))
    );
  }
  if ((query.sort === 'desc' || !query.sort) && query.cursor) {
    cursorCondition = or(
      lt(assignments.createdAt, query.cursor.value),
      and(eq(assignments.submissionDate, query.cursor.value), lt(assignments.id, query.cursor.id))
    );
  }

  const result = await db
    .select({ ...selectAssignmentSnapshot, teacher: selectUserSnapshot })
    .from(assignments)
    .where(
      and(
        cursorCondition,
        query.batch ? eq(assignments.batch, query.batch) : undefined,
        query.resource === 'student' && req.user?.id && req.user.batch
          ? eq(assignments.batch, req.user.batch)
          : undefined,
        query.from ? gte(assignments.createdAt, query.from) : undefined,
        query.to ? lte(assignments.createdAt, query.to) : undefined,
        query.status === 'completed'
          ? lt(assignments.submissionDate, new Date().toISOString())
          : undefined,
        query.status === 'pending'
          ? gt(assignments.submissionDate, new Date().toISOString())
          : undefined,
        query.teacher ? eq(assignments.teacherId, query.teacher) : undefined
      )
    )
    .innerJoin(
      users,
      and(
        eq(assignments.teacherId, users.id),
        query.resource === 'teacher' && req.user?.id
          ? eq(assignments.teacherId, req.user?.id)
          : undefined
      )
    )
    .limit(query.limit)
    .orderBy((t) => {
      if (query.sort === 'asc') return [asc(t.createdAt), asc(t.id)];
      return [desc(t.createdAt), desc(t.id)];
    });

  const lastResult = result[result.length - 1];
  let cursor: string | undefined = undefined;
  if (lastResult) {
    cursor = encodeCursor({ id: lastResult.id, value: lastResult.createdAt });
  }

  res.json({ cursor, assignments: result });
};

export const getAssignmentsTaskList: RequestHandler<
  { id: string },
  { tasks: ResponseTask[] }
> = async (req, res) => {
  const assignmentId = req.params.id;

  const result = await db
    .select({ ...selectTaskSnapshot })
    .from(tasks)
    .where(eq(tasks.assignmentId, assignmentId));

  res.json({ tasks: result });
};
