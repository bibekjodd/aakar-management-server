import {
  deleteAssignment,
  getAssignmentDetail,
  getAssignmentsTaskList,
  postAssignment,
  queryAssignments,
  updateAssignment
} from '@/controllers/assignments.controller';
import { Router } from 'express';

const router = Router();
export const assignmentsRoute = router;

router.route('/').post(postAssignment).get(queryAssignments);
router.route('/:id').get(getAssignmentDetail).put(updateAssignment).delete(deleteAssignment);
router.route('/{id}/tasks').get(getAssignmentsTaskList);
