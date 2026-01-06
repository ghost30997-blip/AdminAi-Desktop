import { GoogleGenAI, Type } from "@google/genai";

const getAIInstance = () => {
  // Tenta obter a chave de múltiplas fontes possíveis injetadas pelo Vite
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;
  
  // Se a chave for inválida, retornamos null IMEDIATAMENTE antes de chamar o construtor do SDK
  if (!apiKey || apiKey === "" || apiKey === "undefined" || apiKey === "null") {
    console.warn("Slidex: Google Gemini API Key não encontrada. Funcionalidades de IA desativadas.");
    return null;
  }

  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Erro ao instanciar GoogleGenAI:", e);
    return null;
  }
};

/**
 * Analisa as colunas da planilha e sugere o melhor mapeamento para o PowerPoint.
 */
export const analyzeMailingFields = async (headers: string[], pptPlaceholders: string[]) => {
  try {
    const ai = getAIInstance();
    if (!ai) return { mapping: {} };

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
            }
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
        if (!ai) return "Serviço de IA indisponível. Por favor, configure a VITE_API_KEY no painel da Vercel.";

        const chat = ai.chats.create({ 
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: "Você é o assistente do Slidex. Ajude o usuário a criar malas diretas."
            }
        });
        
        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "Sem resposta.";
    } catch (e) {
        console.error("Chat Error:", e);
        return "Erro ao processar mensagem da IA.";
    }
};