import { Task } from "../models/task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Assignment } from "../models/assignment.model.js";

export const assignVolunteer = asyncHandler(async (req, res) => {
  const { taskId, volunteerId } = req.body;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.assignedCount >= task.volunteersNeeded) {
    throw new ApiError(400, "Task already full");
  }

  const exsiting = await Assignment.findOne({
    task: taskId,
    volunteer: volunteerId,
  });

  if (exsiting) {
    throw new ApiError(400, "Volunteer already assigned");
  }

  const assignment = await Assignment.create({
    task: taskId,
    volunteer: volunteerId,
  });

  task.assignedCount += 1;

  if (task.assignedCount === task.volunteersNeeded) {
    task.status = "in-progress";
  }

  await task.save();

  return res.json(
    new ApiResponse(200, assignment, "Volunteer assigned successfully"),
  );
});

export const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { status } = req.body;

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  //only assigned volunteer can update
  if (assignment.volunteer.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Not allowed");
  }

  assignment.status = status;

  await assignment.save();

  return res.json(
    new ApiResponse(200, assignment, "Assignment updated")
  );
});

export const getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({
    volunteer: req.user?._id,
  })
    .populate("task", "title description location priority status")
    .populate('volunteer', 'name email')
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, assignments, "My assignments fetched")
  );
});