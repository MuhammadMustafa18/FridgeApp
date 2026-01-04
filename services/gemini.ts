import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Sends an image and a prompt to the Gemini API.
 * @param base64Image The base64 encoded image string (can include data URI prefix).
 * @param prompt The text prompt to accompany the image.
 * @returns The generated text response from Gemini.
 */
export async function sendImageToGemini(base64Image: string, prompt: string = "Analyze the food items in the image. Return a JSON array where each object has a 'name' (string) and 'quantity' (string). Example: [{\"name\": \"Apple\", \"quantity\": \"3\"}].") {
    if (!apiKey) {
        throw new Error("Gemini API key not found. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.");
    }

    try {
        // legacy gemini-pro-vision, or newer gemini-1.5-flash / gemini-1.5-pro
        // gemini-1.5-flash is generally faster and multimodal
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Remove the data URL prefix if present because the API expects just the raw base64
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error sending to Gemini:", error);
        throw error;
    }
}
