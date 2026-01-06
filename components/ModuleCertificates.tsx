import React, { useState, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepUpload } from './StepUpload';
import { StepData } from './StepData';
import { StepEditor } from './StepEditor';
import { StepGenerate } from './StepGenerate';
import { AppStep, DataRow, PresentationData, FieldMapping, PresentationTemplate } from '../types';
import { loadPresentation, base64ToBlob } from '../utils/fileProcessor';
import { getTemplates } from '../utils/storage';
import { uploadFileToDrive, isGoogleConnected, requestGoogleLogin } from '../services/google';
import { analyzeMailingFields } from '../services/geminiService';
import { Upload, FileText, LayoutTemplate, Globe, Loader2, Sparkles, Monitor } from 'lucide-react';

export const ModuleCertificates: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD_DATA);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isUploadingToGoogle, setIsUploadingToGoogle] = useState(false);

  // Executa análise IA quando o template é carregado
  const autoMapFields = async (pptData: PresentationData) => {
      if (headers.length === 0) return;
      setIsAiAnalyzing(true);
      try {
          // Placeholder fictício: na vida real, extraímos as tags {{...}} do pptData
          const res = await analyzeMailingFields(headers, ["nome", "data", "curso", "cpf"]);
          if (res.mapping) setFieldMapping(res.mapping);
      } catch (e) {
          console.warn("IA Mapping falhou, usando fallback.");
      } finally {
          setIsAiAnalyzing(false);
      }
  };

  const handleDataLoaded = (loadedData: DataRow[], loadedHeaders: string[]) => {
    setData(loadedData);
    setHeaders(loadedHeaders);
    setCurrentStep(AppStep.CONFIRM_DATA);
  };

  const processPptxFile = async (file: File | Blob) => {
      try {
        const pptData = await loadPresentation(file);
        setPresentation(pptData);
        await autoMapFields(pptData);
        setCurrentStep(AppStep.EDITOR);
      } catch (err) {
        alert("Erro ao processar o arquivo PowerPoint.");
      }
  };

  const handleOpenInGoogle = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pptx';
      input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;
          
          setIsUploadingToGoogle(true);
          try {
              if (!isGoogleConnected()) await requestGoogleLogin();
              const driveFile = await uploadFileToDrive(file, 'root');
              if (driveFile.webViewLink) {
                  window.open(driveFile.webViewLink, '_blank');
              }
          } catch (err) {
              alert("Erro ao conectar com Google Drive. Verifique seu Client ID nas configurações.");
          } finally {
              setIsUploadingToGoogle(false);
          }
      };
      input.click();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden">
            <ProgressBar currentStep={currentStep} />
            
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {currentStep === AppStep.UPLOAD_DATA && (
                    <StepUpload onDataLoaded={handleDataLoaded} />
                )}

                {currentStep === AppStep.CONFIRM_DATA && (
                    <StepData 
                        data={data} 
                        headers={headers} 
                        onConfirm={(selected) => {
                            setData(selected);
                            setCurrentStep(AppStep.UPLOAD_TEMPLATE);
                        }}
                        onBack={() => setCurrentStep(AppStep.UPLOAD_DATA)}
                    />
                )}

                {currentStep === AppStep.UPLOAD_TEMPLATE && (
                    <div className="flex-1 flex flex-col p-6 md:p-10 animate-fade-in h-full overflow-y-auto">
                        <div className="max-w-4xl w-full mx-auto text-center">
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Escolha o Template PowerPoint</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-12">Selecione um arquivo local ou use o Google Slides para preparar seu modelo.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <label className="group p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer hover:border-brand-blue hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-all">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        <Upload className="text-brand-blue" size={32}/>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Upload de .pptx</h3>
                                    <p className="text-xs text-slate-400 mt-2">Arraste ou clique para selecionar do computador</p>
                                    <input type="file" className="hidden" accept=".pptx" onChange={(e) => e.target.files && processPptxFile(e.target.files[0])} />
                                </label>

                                <button 
                                    onClick={handleOpenInGoogle}
                                    disabled={isUploadingToGoogle}
                                    className="group p-8 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        {isUploadingToGoogle ? <Loader2 className="animate-spin text-brand-orange" size={32}/> : <Globe className="text-brand-orange" size={32}/>}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Abrir no Google Slides</h3>
                                    <p className="text-xs text-slate-400 mt-2">Edite seu template na nuvem antes de gerar</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === AppStep.EDITOR && (
                    <div className="flex-1 flex flex-col h-full relative">
                        {isAiAnalyzing && (
                            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-2xl mb-4">
                                    <Sparkles className="text-brand-orange animate-pulse" size={48} />
                                </div>
                                <p className="font-black text-slate-700 dark:text-white uppercase tracking-widest text-sm">Mapeamento Inteligente Gemini...</p>
                            </div>
                        )}
                        <StepEditor 
                            headers={headers} 
                            data={data}
                            presentation={presentation}
                            mapping={fieldMapping}
                            onMappingChange={setFieldMapping}
                            onNext={() => setCurrentStep(AppStep.GENERATE)} 
                            onBack={() => setCurrentStep(AppStep.UPLOAD_TEMPLATE)}
                        />
                    </div>
                )}

                {currentStep === AppStep.GENERATE && (
                    <StepGenerate 
                        data={data} 
                        presentation={presentation}
                        mapping={fieldMapping}
                        onReset={() => {
                            setData([]);
                            setHeaders([]);
                            setPresentation(null);
                            setCurrentStep(AppStep.UPLOAD_DATA);
                        }} 
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};