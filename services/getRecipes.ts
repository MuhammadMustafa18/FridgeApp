type Recipe = {
  name: string;
  ingredients: string[];
};

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // fast + cheap

/**
 * Suggest recipes based on available ingredients
 */
export async function suggestRecipesFromGroq(
  ingredients: string[], count?: number
): Promise<Recipe[]> {
  if (!GROQ_API_KEY) {
    console.warn("Groq API key missing");
    return [];
  }

  const prompt = `
You are a helpful cooking assistant.

Given these available ingredients:
${ingredients.join(", ")}

Suggest ${count ? count : 3} simple recipes.

Rules:
- Return ONLY valid JSON
- No explanations
- No backticks
- Format:
[
  { "name": "Recipe name", "ingredients": ["ingredient1", "ingredient2"], "how_to_cook": "Step 1..." }
]
`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    console.log("data");
    console.log(data)
    const content = data.choices?.[0]?.message?.content;
    console.log("content");
    console.log(content)
    if (!content) return [];

    return JSON.parse(content) as Recipe[];
  } catch (err) {
    console.error("Groq recipe error:", err);
    return [];
  }
}

export async function generateRecipeMetadata(
  name: string,
  ingredients: string[]
): Promise<{ time: string; difficulty: string; servings: string } | null> {
  if (!GROQ_API_KEY) return null;

  const prompt = `
You are a cooking expert.
Recipe: ${name}
Ingredients: ${ingredients.join(", ")}

Estimate the preparation time, difficulty, and servings.
Return ONLY valid JSON. No backticks.
Format:
{
  "time": "e.g. 30 mins",
  "difficulty": "Easy/Medium/Hard",
  "servings": "e.g. 2 people"
}
`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (err) {
    console.error("Groq metadata error:", err);
    return null;
  }
}
