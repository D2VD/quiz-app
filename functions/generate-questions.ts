import { GoogleGenAI, Type } from "@google/genai";

// Define the structure of the incoming request body
interface GenerateRequestBody {
    topic: string;
    numQuestions: number;
    questionTypes: string[];
}

// This is the main handler for the Cloudflare Function.
// It will be triggered on a POST request to /generate-questions.
export const onRequestPost = async ({ request, env }) => {
    // Set up CORS headers to allow requests from our frontend
    const headers = {
        'Access-Control-Allow-Origin': '*', // Replace with your domain in production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    // Handle preflight CORS requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        // FIX: Remove type argument from .json() and cast the result
        const { topic, numQuestions, questionTypes } = await request.json() as GenerateRequestBody;

        if (!topic || !numQuestions || !questionTypes) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers });
        }

        // Initialize Gemini AI with the API key from Cloudflare's environment variables
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

        const questionTypePrompt = questionTypes.join(' and ');
        const prompt = `Generate ${numQuestions} questions about "${topic}". The questions should be of type: ${questionTypePrompt}. For multiple-choice questions, provide 4 options and indicate the correct one. Ensure the question text and option text are in Vietnamese.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    options: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: { text: { type: Type.STRING } }
                                        }
                                    },
                                    correctOptionIndex: { type: Type.NUMBER }
                                },
                                required: ['text', 'type']
                            }
                        }
                    },
                    required: ['questions']
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        const generatedQuestions = jsonResponse.questions || [];

        const formattedQuestions = generatedQuestions.map((q: any) => {
             if (q.type === 'multiple-choice' && Array.isArray(q.options) && q.correctOptionIndex !== undefined) {
                const options = q.options.map((opt: any) => ({ id: crypto.randomUUID(), text: opt.text }));
                if (options.length > 0 && q.correctOptionIndex < options.length) {
                    return {
                        text: q.text,
                        type: q.type,
                        options: options,
                        correctOptionId: options[q.correctOptionIndex].id,
                    };
                }
            }
            return { text: q.text, type: q.type, options: [] };
        });


        return new Response(JSON.stringify({ questions: formattedQuestions }), { headers });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to generate questions.' }), { status: 500, headers });
    }
};
