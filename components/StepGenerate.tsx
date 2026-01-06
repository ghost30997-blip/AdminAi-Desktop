import React, { useState } from 'react';
import { DataRow, PresentationData, FieldMapping } from '../types';
import { CheckCircle, Download, Layers, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { generateMergedDocument, generateConcatenatedPPTX } from '../utils/fileProcessor';
import { uploadFileToDrive, isGoogleConnected, requestGoogleLogin } from '../services/google';
import JSZip from 'jszip';

interface StepGenerateProps {
  data: DataRow[];
  presentation: PresentationData | null;
  mapping: FieldMapping;
  onReset: () => void;
}

export const StepGenerate: React.FC<StepGenerateProps> = ({ data, presentation, mapping, onReset }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [googleViewUrl, setGoogleViewUrl] = useState<string | null>(null);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);
  
  const [mergeMode, setMergeMode] = useState<'zip' | 'single'>('single');

  const runGeneration = async () => {
      if (!presentation) return;
      
      setStatus('processing');
      setLogs(['Iniciando geração...', `Modo: ${mergeMode === 'single' ? 'Unificado' : 'Separado'}`]);
      
      try {
        if (mergeMode === 'single' && presentation.type === 'pptx') {
             setProgress(30);
             const finalBlob = await generateConcatenatedPPTX(presentation.zip, data, mapping);
             setGeneratedBlob(finalBlob);
             setDownloadUrl(URL.createObjectURL(finalBlob));
             setProgress(100);
             setStatus('complete');
             setLogs(prev => [`Sucesso! PowerPoint único gerado.`, ...prev]);
        } else {
            const outputZip = new JSZip();
            const total = data.length;

            for (let i = 0; i < total; i++) {
                const row = data[i];
                const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nome')) || 'id';
                const safeName = String(row[nameKey]).replace(/[^a-z0-9]/gi, '_');
                
                const fileBlob = await generateMergedDocument(presentation.zip, row, mapping, presentation.type);
                outputZip.file(`Doc_${safeName}.${presentation.type}`, fileBlob);
                setProgress(Math.round(((i + 1) / total) * 100));
            }

            const finalZipBlob = await outputZip.generateAsync({ type: 'blob' });
            setGeneratedBlob(finalZipBlob);
            setDownloadUrl(URL.createObjectURL(finalZipBlob));
            setStatus('complete');
        }
      } catch (error) {
        console.error(error);
        setStatus('idle');
        alert("Erro na fusão dos documentos.");
      }
  };

  const handleOpenGoogle = async () => {
      if (!generatedBlob) return;
      
      setIsOpeningGoogle(true);
      try {
          if (!isGoogleConnected()) {
              await requestGoogleLogin();
          }
          
          const fileName = `MalaDireta_${new Date().getTime()}.pptx`;
          const file = new File([generatedBlob], fileName, { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
          
          // Enviamos para a raiz ou pasta do sistema no Drive
          const driveFile = await uploadFileToDrive(file, 'root');
          if (driveFile.webViewLink) {
              setGoogleViewUrl(driveFile.webViewLink);
              window.open(driveFile.webViewLink, '_blank');
          }
      } catch (err) {
          console.error(err);
          alert("Erro ao enviar para o Google Drive. Verifique seu Client ID.");
      } finally {
          setIsOpeningGoogle(false);
      }
  };

  if (status === 'idle') {
      return (
          <div className="max-w-4xl mx-auto p-12 text-center animate-fade-in dark:text-white">
              <h2 className="text-3xl font-bold mb-6">Pronto para Exportar</h2>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-8 text-left">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Layers size={20} className="text-brand-blue"/> Formato de Saída</h3>
                  <div className="space-y-4">
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${mergeMode === 'single' ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}>
                          <input type="radio" checked={mergeMode === 'single'} onChange={() => setMergeMode('single')} />
                          <div>
                              <p className="font-bold text-sm">Arquivo Único (PowerPoint)</p>
                              <p className="text-xs text-slate-500">Gera um único .pptx com todos os slides sequenciados.</p>
                          </div>
                      </label>
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${mergeMode === 'zip' ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}>
                          <input type="radio" checked={mergeMode === 'zip'} onChange={() => setMergeMode('zip')} />
                          <div>
                              <p className="font-bold text-sm">Arquivos Individuais (ZIP)</p>
                              <p className="text-xs text-slate-500">Gera um arquivo separado para cada linha da planilha.</p>
                          </div>
                      </label>
                  </div>
              </div>
              <button onClick={runGeneration} className="bg-brand-blue text-white px-12 py-4 rounded-xl shadow-xl font-bold text-lg hover:scale-105 transition-all">Iniciar Processamento</button>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto p-12 text-center animate-fade-in">
      {status === 'processing' ? (
        <div className="space-y-8">
            <div className="w-40 h-40 mx-auto relative flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-2xl font-black text-slate-700 dark:text-white">{progress}%</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gerando documentos...</h2>
        </div>
      ) : (
        <div className="space-y-8">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Concluído!</h2>
            
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
                {downloadUrl && (
                  <a href={downloadUrl} download="MalaDireta_Slidex.zip" className="flex items-center justify-center gap-3 bg-brand-blue text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                      <Download size={20} /> Baixar Arquivos
                  </a>
                )}

                {mergeMode === 'single' && (
                    <button 
                        onClick={handleOpenGoogle} 
                        disabled={isOpeningGoogle}
                        className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-brand-orange text-brand-orange px-8 py-4 rounded-xl font-bold hover:bg-orange-50 transition-all disabled:opacity-50"
                    >
                        {isOpeningGoogle ? <Loader2 className="animate-spin" size={20}/> : <Globe size={20} />}
                        Abrir no Google Slides
                    </button>
                )}

                {googleViewUrl && (
                    <a href={googleViewUrl} target="_blank" className="text-xs text-brand-blue underline flex items-center justify-center gap-1">
                        <ExternalLink size={12}/> Link do Google Drive
                    </a>
                )}
                
                <button onClick={onReset} className="text-slate-400 text-sm font-bold hover:text-brand-dark">Gerar Novo Trabalho</button>
            </div>
        </div>
      )}
    </div>
  );
};