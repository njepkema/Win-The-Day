import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for task suggestions
const taskSchema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "A specific, actionable task description.",
      },
      description: "List of 5 critical tasks.",
    },
    motivationalQuote: {
      type: Type.STRING,
      description: "A short, punchy motivational quote related to the goal.",
    },
  },
  required: ["tasks", "motivationalQuote"],
};

export const generateSmartTasks = async (goal: string): Promise<{ tasks: string[], quote: string }> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided");
    return {
      tasks: ["Define your goal", "Break it down", "Execute step 1", "Review progress", "Plan tomorrow"],
      quote: "Action is the foundational key to all success."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The user wants to 'Win the Day' based on this goal: "${goal}". 
      Generate 5 specific, high-impact, actionable tasks that they can complete today to move the needle. 
      Also provide a short motivational quote.
      Keep tasks concise (under 10 words).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    
    // Ensure we strictly return 5 tasks, even if model varies slightly
    const tasks = data.tasks ? data.tasks.slice(0, 5) : [];
    while (tasks.length < 5) {
      tasks.push("Review goals");
    }

    return {
      tasks: tasks,
      quote: data.motivationalQuote || "Dominate the day."
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      tasks: ["Drink 1 gallon water", "Read 10 pages", "45 min workout", "Clear inbox", "Plan tomorrow"],
      quote: "Discipline equals freedom."
    };
  }
};

export const getDailyMotivation = async (streak: number, status: 'WIN' | 'LOSS' | 'IN_PROGRESS'): Promise<string> => {
  if (!process.env.API_KEY) return "Keep pushing forward.";

  try {
    const prompt = `
      The user is using a 'Win the Day' tracker.
      Current Streak: ${streak} days.
      Current Status for today: ${status}.
      Give me a very short, aggressive, high-performance coaching sentence (Andy Frisella style) to keep them moving.
      Max 20 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Go win.";
  } catch (error) {
    return "Focus on the execution.";
  }
};