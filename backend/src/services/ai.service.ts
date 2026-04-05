import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const getAIScore = async (task: any, volunteer: any) => {
  try {
    const prompt = `
You are an AI system that assigns volunteers to tasks.

Task:
- Title: ${task.title}
- Required Skills: ${task.requiredSkills.join(", ")}

Volunteer:
- Skills: ${volunteer.skills.join(", ")}
- Available: ${volunteer.availability}

Give output in STRICT JSON format:
{
  "score": number (0 to 1),
  "reason": "short explanation within one or two line, while explaning the actual reason."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
    });

    const text = response.text;

    const cleaned = text?.replace(/```json|```/g, "").trim();

    return JSON.parse(cleaned!);
  } catch (error) {
    console.log("AI Error:", error);

    return {
      score: 0.5,
      reason: "Fallback: basic matching",
    };
  }
};