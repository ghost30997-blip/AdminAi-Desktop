
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Analisa as colunas da planilha e sugere o melhor mapeamento para o PowerPoint.
 * Usa o modelo gemini-3-flash-preview para tarefas de texto básicas.
 */
export const analyzeMailingFields = async (headers: string[], pptPlaceholders: string[]) => {
  try {
    // Inicialização direta conforme diretrizes
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const prompt = `
      Atue como um especialista em automação de documentos e Mala Direta.
      A planilha de dados possui estas colunas (cabeçalhos): ${headers.join(", ")}.
      O modelo de PowerPoint possui estes marcadores (placeholders): ${pptPlaceholders.join(", ")}.
      
      Sua tarefa é criar um mapeamento lógico entre os marcadores do PowerPoint e as colunas da planilha.
      Retorne um JSON onde a chave é o nome do marcador (sem as chaves {{}}) e o valor é o nome da coluna correspondente na planilha.
      Apenas mapeie se houver uma correspondência clara ou semântica (ex: "Nome do Aluno" mapeia para "nome").
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
 * Assistente de suporte operacional para tirar dúvidas sobre o processo de Mala Direta.
 */
export const assistantChat = async (history: any[], userMessage: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const chat = ai.chats.create({ 
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: "Você é o Slidex AI, um assistente especializado em automação de documentos PowerPoint e Word via Mala Direta. Ajude o usuário com dúvidas técnicas sobre formatação, placeholders {{campo}} e integração com Google Drive."
            }
        });
        
        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "Desculpe, não consegui processar sua mensagem agora.";
    } catch (e) {
        console.error("Chat Error:", e);
        return "Houve um erro ao conectar com a inteligência artificial. Verifique sua chave de API.";
    }
};
