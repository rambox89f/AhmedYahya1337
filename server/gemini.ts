import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate an image from a text prompt
 */
export async function generateImage(prompt: string): Promise<{
  imageData: Buffer;
  base64: string;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const result = response.response;

    // Extract image data from response
    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if ("inlineData" in part && part.inlineData) {
            const imageData = part.inlineData.data;
            const imageBuffer = Buffer.from(imageData, "base64");
            return {
              imageData: imageBuffer,
              base64: imageData,
            };
          }
        }
      }
    }

    throw new Error("No image data in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

/**
 * Edit an existing image with a text prompt
 */
export async function editImage(
  imageUrl: string,
  prompt: string
): Promise<{
  imageData: Buffer;
  base64: string;
}> {
  try {
    // Fetch the image from URL and convert to base64
    const response = await fetch(imageUrl);
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Determine MIME type
    const contentType = response.headers.get("content-type") || "image/jpeg";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    });

    const editResponse = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const result = editResponse.response;

    // Extract image data from response
    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if ("inlineData" in part && part.inlineData) {
            const imageData = part.inlineData.data;
            const editedImageBuffer = Buffer.from(imageData, "base64");
            return {
              imageData: editedImageBuffer,
              base64: imageData,
            };
          }
        }
      }
    }

    throw new Error("No image data in response");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}

