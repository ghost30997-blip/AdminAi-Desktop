
import React, { useState, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepUpload } from './StepUpload';
import { StepData } from './StepData';
import { StepEditor } from './StepEditor';
import { StepGenerate } from './StepGenerate';
import { AppStep, DataRow, PresentationData, FieldMapping } from '../types';
import { loadPresentation } from '../utils/fileProcessor';
import { uploadFileToDrive, isGoogleConnected, requestGoogleLogin } from '../services/google';
import { analyzeMailingFields } from '../services/geminiService';
import { Upload, Globe, Loader2, Sparkles, Monitor, ArrowRight, ExternalLink, Info } from 'lucide-react';

export const ModuleCertificates: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD_DATA);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isUploadingToGoogle, setIsUploadingToGoogle] = useState(false);

  const autoMapFields = async (pptData: PresentationData) => {
      if (headers.length === 0) return;
      setIsAiAnalyzing(true);
      try {
          // Extraímos placeholders comuns do template para ajudar a IA
          const res = await analyzeMailingFields(headers, ["nome", "data", "curso", "cpf", "valor", "empresa"]);
          if (res.mapping) setFieldMapping(res.mapping);
      } catch (e) {
          console.warn("IA Mapping falhou.");
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
        alert("Erro ao processar o arquivo PowerPoint. Certifique-se que é um .pptx válido.");
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
                  // Após abrir, também processamos localmente para o mapeamento
                  await processPptxFile(file);
              }
          } catch (err) {
              console.error(err);
              alert("Erro ao conectar com Google Drive. Verifique as permissões de pop-up.");
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
                            <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-full text-xs font-bold mb-6">
                                <Monitor size={14}/> MÓDULO POWERPOINT
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4">Seu Modelo de PowerPoint</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-12 text-lg">Envie seu arquivo .pptx. Recomendamos abrir no Google Slides para garantir que os placeholders {`{{campo}}`} estejam corretos.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <label className="group p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] cursor-pointer hover:border-brand-blue hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-xl">
                                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                        <Upload className="text-brand-blue" size={36}/>
                                    </div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white">Carregar Localmente</h3>
                                    <p className="text-sm text-slate-400 mt-2">Usar arquivo .pptx do computador</p>
                                    <input type="file" className="hidden" accept=".pptx" onChange={(e) => e.target.files && processPptxFile(e.target.files[0])} />
                                </label>

                                <div 
                                    onClick={handleOpenInGoogle}
                                    className="group p-10 border-2 border-brand-orange/20 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10 rounded-[2.5rem] hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center justify-center border-dashed hover:border-solid hover:border-brand-orange"
                                >
                                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                                        {isUploadingToGoogle ? <Loader2 className="animate-spin text-brand-orange" size={36}/> : <Globe className="text-brand-orange" size={36}/>}
                                    </div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                                        Abrir no Google Slides <ExternalLink size={16} className="opacity-50"/>
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-2">Editar template na nuvem antes de mesclar</p>
                                </div>
                            </div>

                            <div className="mt-16 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-start gap-4 text-left max-w-2xl mx-auto">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                    <Info className="text-brand-blue" size={20}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 dark:text-white text-sm">Dica de Formatação</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        Para que a Mala Direta funcione, certifique-se de que os textos no PowerPoint contêm variáveis entre chaves duplas, como <strong>{`{{NOME}}`}</strong> ou <strong>{`{{VALOR}}`}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === AppStep.EDITOR && (
                    <div className="flex-1 flex flex-col h-full relative">
                        {isAiAnalyzing && (
                            <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center">
                                <div className="relative">
                                    <Sparkles className="text-brand-orange animate-pulse mb-6" size={64} />
                                    <div className="absolute inset-0 animate-ping opacity-20 bg-brand-orange rounded-full"></div>
                                </div>
                                <p className="font-black text-slate-800 dark:text-white tracking-[0.3em] text-sm uppercase">Gemini está analisando sua base...</p>
                                <p className="text-xs text-slate-400 mt-4">Mapeando colunas da planilha para o PowerPoint automaticamente.</p>
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
