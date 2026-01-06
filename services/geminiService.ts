
import { GoogleGenAI, Type } from "@google/genai";

// Função para obter a instância da IA de forma segura
const getAIInstance = () => {
  // process.env.API_KEY é injetado via vite.config.ts define
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

/**
 * Analisa as colunas da planilha e sugere o melhor mapeamento para o PowerPoint.
 */
export const analyzeMailingFields = async (headers: string[], pptPlaceholders: string[]) => {
  try {
    const ai = getAIInstance();
    const prompt = `
      Atue como um especialista em Mala Direta.
      Planilha possui estas colunas: ${headers.join(", ")}.
      O PowerPoint possui estes placeholders: ${pptPlaceholders.join(", ")}.
      Crie um mapeamento JSON onde a chave é o placeholder e o valor é a coluna correspondente mais provável.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          description: "Mapeamento de campos de mala direta",
          properties: {
            mapping: { 
                type: Type.OBJECT,
                description: "Objeto de mapeamento placeholder -> coluna"
            },
            confidence: { type: Type.NUMBER }
          },
          required: ["mapping"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : { mapping: {} };
  } catch (error) {
    console.error("Erro na análise inteligente do Gemini:", error);
    return { mapping: {} };
  }
};

/**
 * Chat de suporte operacional inteligente.
 */
export const assistantChat = async (history: any[], userMessage: string) => {
    try {
        const ai = getAIInstance();
        const chat = ai.chats.create({ 
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: "Você é o assistente do Slidex. Ajude o usuário a criar malas diretas, formatar planilhas e configurar templates de PowerPoint."
            }
        });
        
        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "Sem resposta.";
    } catch (e) {
        console.error("Chat Error:", e);
        return "Desculpe, tive um problema ao processar sua mensagem.";
    }
};
