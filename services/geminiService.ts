import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client
// NOTE: In a real app, ensure API_KEY is present.
const ai = new GoogleGenAI({ apiKey });

/**
 * Chat with the model (Gemini 3 Pro Preview)
 */
export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are a helpful, creative, and intelligent AI assistant.',
    },
  });
};

/**
 * Analyze an image and write a story opening (Gemini 3 Pro Preview)
 */
export const generateStoryFromImage = async (base64Image: string): Promise<string> => {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Analyze the mood, lighting, and scene details of this image. Then, acting as a master novelist, ghostwrite an opening paragraph to a story set in this world. The tone should match the visual atmosphere. Keep it under 200 words."
          }
        ]
      }
    });

    return response.text || "I couldn't generate a story for this image.";
  } catch (error) {
    console.error("Story generation error:", error);
    throw error;
  }
};

/**
 * Generate Speech from text (Gemini 2.5 Flash TTS)
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir has a nice deep storytelling voice
          },
        },
      },
    });

    // Extract base64 audio string
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS generation error:", error);
    throw error;
  }
};
