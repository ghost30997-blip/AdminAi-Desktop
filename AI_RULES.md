# Regras de Desenvolvimento e Stack Tecnológico (Slidex Web)

Este documento define o stack tecnológico e as regras de uso de bibliotecas para garantir a consistência, manutenibilidade e performance do aplicativo.

## Stack Tecnológico

*   **Framework:** React (v19) com TypeScript.
*   **Estilização:** Tailwind CSS (exclusivamente para todos os estilos e responsividade).
*   **Componentes UI:** Utilizar a biblioteca Shadcn/ui (ou componentes customizados que sigam o mesmo padrão visual).
*   **Persistência de Dados:** IndexedDB local (via `idb` e `utils/storage.ts`). O aplicativo opera em "Local Mode" por padrão.
*   **Manipulação de Documentos:** `jszip` (para PPTX/DOCX), `xlsx` (para leitura de planilhas) e `jspdf` (para geração de PDFs).
*   **Inteligência Artificial:** Google Gemini API (`@google/genai`) via `services/geminiService.ts` para mapeamento inteligente e assistência.
*   **Integração Externa:** Google Drive API (via `services/google.ts`) para upload de arquivos.
*   **Estrutura:** Componentes em `src/components/` e navegação baseada em estado (`App.tsx`).

## Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Módulo | Regra de Uso |
| :--- | :--- | :--- |
| **Estilização** | Tailwind CSS | **Obrigatório.** Não usar CSS ou módulos CSS. Priorizar classes utilitárias. |
| **UI/Design** | Shadcn/ui | **Preferencial.** Usar componentes Shadcn/ui para elementos comuns (botões, modais, inputs). |
| **Navegação** | `App.tsx` state | **Obrigatório.** Usar o estado `activeModule` em `App.tsx` para gerenciar a visualização de módulos (sem React Router). |
| **Acesso a Dados** | `utils/storage.ts` | **Obrigatório.** Todas as operações CRUD (Clientes, Configurações, Tarefas, etc.) devem passar por este módulo. |
| **Leitura de Planilhas** | `xlsx` | Usar `parseDataFile` em `utils/fileProcessor.ts`. |
| **Manipulação PPTX/DOCX** | `jszip` | Usar as funções em `utils/fileProcessor.ts` (`loadPresentation`, `generateMergedDocument`, etc.). |
| **Geração de PDF** | `jspdf` / `jspdf-autotable` | Usar `generateAttendancePDF` em `utils/fileProcessor.ts` para documentos PDF. |
| **AI/LLM** | `@google/genai` | Usar as funções em `services/geminiService.ts`. |
| **Google Drive** | `services/google.ts` | Usar as funções de autenticação e upload neste módulo. |