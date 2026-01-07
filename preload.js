import { contextBridge } from 'electron';

// Exponha APIs seguras para o processo de renderização, se necessário.
// Por enquanto, mantemos o contexto isolado para segurança.

contextBridge.exposeInMainWorld('electronAPI', {
  // Exemplo: getVersion: () => ipcRenderer.invoke('get-version')
});