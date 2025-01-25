import { responseAssignmentSchema } from '@/db/assignments.schema';
import { responseTaskSchema } from '@/db/tasks.schema';
import { postAssignmentSchema, queryAssignmentsSchema } from '@/dtos/assignments.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';
import 'zod-openapi/extend';

const tags = ['Assignment'];

export const assignmentsDoc: ZodOpenApiPathsObject = {
  '/api/assignments': {
    post: {
      tags,
      summary: 'Post new assignment',
      requestBody: { content: { 'application/json': { schema: postAssignmentSchema } } },
      responses: {
        201: {
          description: 'Assignment posted successfully',
          content: {
            'application/json': {
              schema: z.object({
                assignment: responseAssignmentSchema,
                tasks: z.array(responseTaskSchema)
              })
            }
          }
        },
        400: { description: 'Invaid request body' },
        401: { description: 'User is not authroized or is not teacher' }
      }
    },

    get: {
      tags,
      summary: 'Fetch assignments list',
      requestParams: { query: queryAssignmentsSchema },
      responses: {
        200: {
          description: 'Assignments fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                cursor: z.string().optional(),
                assignments: z.array(responseAssignmentSchema)
              })
            }
          }
        },
        400: {
          description: 'Invalid query params'
        },
        401: { description: 'Request resource does not belong to the user' }
      }
    }
  },

  '/api/assignments/{id}': {
    get: {
      tags,
      summary: 'Get assignment details',
      requestParams: { path: z.object({ id: z.string().describe('Assignment id') }) },
      responses: {
        200: {
          description: 'Assignment details fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                assignment: responseAssignmentSchema
              })
            }
          }
        },
        404: { description: 'Assignment does not exist' }
      }
    },

    put: {
      tags,
      summary: 'Update assignment details',
      requestParams: { path: z.object({ id: z.string().describe('Assignment id') }) },
      responses: {
        200: {
          description: 'Assignment details updated successfully',
          content: {
            'application/json': {
              schema: z.object({
                assignment: responseAssignmentSchema
              })
            }
          }
        },
        404: { description: 'Assignment does not exist' }
      }
    },

    delete: {
      tags,
      summary: 'Delete assignment',
      requestParams: { path: z.object({ id: z.string().describe('Assignment id') }) },
      responses: {
        200: {
          description: 'Assignment deleted successfully'
        },
        404: { description: 'Assignment does not exist' }
      }
    }
  },
  '/api/assignments/{id}/tasks': {
    get: {
      tags,
      summary: 'Fetch tasks list of an assignment',
      requestParams: { path: z.object({ id: z.string().describe('Assignment id') }) },
      responses: {
        200: {
          description: 'Tasks list fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                tasks: z.array(responseTaskSchema)
              })
            }
          }
        }
      }
    }
  }
};
