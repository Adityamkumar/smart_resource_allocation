import { Assignment, type IAssignment } from "../models/assignment.model.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { getAIScore } from "../services/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateDistance } from "../utils/calculateDistance.js";

export const autoAssignVolunteers = asyncHandler(async (req, res) => {
  const { taskId } = req.body;

  const task = await Task.findById(taskId);

  if (!task) throw new ApiError(404, "Task not found");

  // find nearby volunteers
  const volunteers = await User.find({
    role: "volunteer",
    availability: true,
    skills: { $in: task.requiredSkills },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: task.location.coordinates,
        },
        $maxDistance: 5000, // 5km radius
      },
    },
  }).limit(5);

  const selected = volunteers.slice(0, task.volunteersNeeded);

  const assignments: IAssignment[] = [];

  for (const volunteer of selected) {
    const distance = calculateDistance(
      task.location.coordinates,
      volunteer.location.coordinates,
    );

    const aiResult = await getAIScore(task, volunteer, distance);

    const existing = await Assignment.findOne({
      task: task._id,
      volunteer: volunteer._id,
    });

    if (existing) continue;

    const assignment = await Assignment.create({
      task: task._id,
      volunteer: volunteer._id,
      aiScore: aiResult.score,
      aiReason: aiResult.reason,
    });
    assignments.push(assignment);
  }

  task.assignedCount += selected.length;

  if (task.assignedCount >= task.volunteersNeeded) {
    task.status = "in-progress";
  }

  await task.save();

  return res.json(new ApiResponse(200, assignments, "AI assigned volunteers"));
});
