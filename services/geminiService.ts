import { GoogleGenAI, Type } from "@google/genai";

/**
 * Obtém a instância do Google GenAI de forma segura.
 * O SDK do Google lança um erro fatal se a chave for undefined ou vazia no browser.
 */
const getAIInstance = () => {
  try {
    // Tenta obter de process.env (Vite define) ou import.meta.env
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;
    
    // Verificação rigorosa para evitar instanciar sem chave válida
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "" || apiKey === "undefined" || apiKey === "null") {
      return null;
    }

    // Instancia apenas se tivermos uma string não vazia
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Slidex: Falha crítica ao inicializar Gemini SDK:", e);
    return null;
  }
};

/**
 * Analisa as colunas da planilha e sugere o melhor mapeamento para o PowerPoint.
 */
export const analyzeMailingFields = async (headers: string[], pptPlaceholders: string[]) => {
  try {
    const ai = getAIInstance();
    if (!ai) {
      console.warn("Slidex: IA inativa (Chave Ausente).");
      return { mapping: {} };
    }

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
        if (!ai) return "O assistente de IA está desativado. Verifique a variável VITE_API_KEY na Vercel.";

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