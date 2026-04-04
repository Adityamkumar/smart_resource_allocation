import { Assignment, type IAssignment } from "../models/assignment.model.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const autoAssignVolunteers = asyncHandler(async (req, res) => {
  const { taskId } = req.body;

  const task = await Task.findById(taskId);

  if (!task) throw new ApiError(404, "Task not found");

  // find nearby volunteers
  const volunteers = await User.find({
    role: "volunteer",
    availability: true,
    skills: { $in: task.requiredSkills },
  });

  const selected = volunteers.slice(0, task.volunteersNeeded);

  const assignments: IAssignment[] = [];

  for (const volunteer of selected) {
    const assignment = await Assignment.create({
      task: task._id,
      volunteer: volunteer._id,
      aiScore: Math.random(),
      aiReason: "Matched based on skills and availability",
    });

    task.assignedCount += selected.length;

    if (task.assignedCount >= task.volunteersNeeded) {
      task.status = "in-progress";
    }
    assignments.push(assignment);
  }

  return res.json(new ApiResponse(200, assignments, "AI assigned volunteers"));
});
