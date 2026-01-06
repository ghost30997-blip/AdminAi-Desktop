
import { GoogleGenAI, Type } from "@google/genai";
import { DataRow } from "../types";

// Always use named parameter and process.env.API_KEY directly as per guidelines.
// The key's availability is assumed as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJson = (text: string | undefined) => {
    if (!text) return "{}";
    // Directly use property .text, then clean potential markdown wrappers.
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Analisa os cabeçalhos do dataset para sugerir campos automáticos para mala direta.
 * Usa gemini-3-pro-preview para tarefas de raciocínio avançado sobre dados.
 */
export const analyzeDataset = async (headers: string[], sampleData: DataRow[]) => {
  try {
    const prompt = `Analise estes cabeçalhos de um dataset de mala direta e sugira mapeamentos úteis: ${headers.join(", ")}.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: "Resumo da análise do dataset." 
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de sugestões de cabeçalhos importantes."
            }
          },
          required: ["summary", "suggestions"]
        }
      }
    });
    // Property .text is extracted directly.
    return JSON.parse(cleanJson(response.text));
  } catch (error) {
    console.error("Gemini analyzeDataset error:", error);
    return { summary: "Análise indisponível no momento.", suggestions: headers.slice(0, 3) };
  }
};

/**
 * Chat livre com o assistente inteligente para auxílio operacional.
 */
export const chatWithAssistant = async (message: string, contextData: any, history: any[]) => {
    try {
        const chat = ai.chats.create({ 
            model: 'gemini-3-flash-preview', 
            history: history // history should follow {role, parts: [{text}]} format
        });
        const response = await chat.sendMessage({ message });
        // Property .text is extracted directly.
        return response.text;
    } catch (e) {
        console.error("Gemini chatWithAssistant error:", e);
        return "Desculpe, não consegui processar sua solicitação de IA no momento.";
    }
};
