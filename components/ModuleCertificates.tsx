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
import { Upload, FileText, LayoutTemplate, Clock, Globe, Loader2, HardDrive } from 'lucide-react';

export const ModuleCertificates: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD_DATA);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [savedTemplates, setSavedTemplates] = useState<PresentationTemplate[]>([]);
  const [isUploadingToGoogle, setIsUploadingToGoogle] = useState(false);

  useEffect(() => {
    if (currentStep === AppStep.UPLOAD_TEMPLATE) {
        setSavedTemplates(getTemplates());
    }
  }, [currentStep]);

  const handleDataLoaded = (loadedData: DataRow[], loadedHeaders: string[]) => {
    setData(loadedData);
    setHeaders(loadedHeaders);
    setCurrentStep(AppStep.CONFIRM_DATA);
  };

  const processPptxFile = async (file: File | Blob) => {
      try {
        const pptData = await loadPresentation(file);
        setPresentation(pptData);
        setCurrentStep(AppStep.EDITOR);
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar PowerPoint.");
      }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processPptxFile(file);
    }
  };

  const handleOpenGooglePreview = async (file: File) => {
      setIsUploadingToGoogle(true);
      try {
          if (!isGoogleConnected()) await requestGoogleLogin();
          const driveFile = await uploadFileToDrive(file, 'root');
          if (driveFile.webViewLink) {
              window.open(driveFile.webViewLink, '_blank');
          }
      } catch (err) {
          alert("Erro ao conectar com Google Drive.");
      } finally {
          setIsUploadingToGoogle(false);
      }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden">
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
                    <div className="flex-1 flex flex-col p-4 md:p-8 animate-fade-in h-full overflow-y-auto">
                        <div className="max-w-6xl w-full mx-auto">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-center">Modelo de Mala Direta</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg text-center">
                                Use um arquivo .pptx local ou abra no Google Slides para edição.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                        <HardDrive size={20} className="text-brand-blue"/> Arquivo Local
                                    </h3>
                                    <label className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-700/50 hover:border-brand-blue transition-all">
                                        <div className="flex flex-col items-center justify-center p-6 text-center">
                                            <div className="p-4 bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-600 text-brand-blue rounded-full mb-4">
                                                <FileText size={32} />
                                            </div>
                                            <p className="font-bold text-slate-700 dark:text-white">Fazer Upload de .pptx</p>
                                            <p className="text-xs text-slate-400 mt-1">Seu arquivo será processado para a mala direta</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".pptx" onChange={handleTemplateUpload} />
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                        <Globe size={20} className="text-brand-orange"/> Google Workspace
                                    </h3>
                                    <div className="h-64 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/30 text-center">
                                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                                            <Globe className="text-brand-orange" size={32}/>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-white mb-4">Abrir no Google Slides</p>
                                        <button 
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = '.pptx';
                                                input.onchange = (e: any) => handleOpenGooglePreview(e.target.files[0]);
                                                input.click();
                                            }}
                                            disabled={isUploadingToGoogle}
                                            className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-orange-600 transition-all flex items-center gap-2"
                                        >
                                            {isUploadingToGoogle ? <Loader2 className="animate-spin" size={18}/> : <Globe size={18}/>}
                                            Upload e Visualizar na Nuvem
                                        </button>
                                        <p className="text-[10px] text-slate-400 mt-3">Requer conta Google conectada</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === AppStep.EDITOR && (
                    <StepEditor 
                        headers={headers} 
                        data={data}
                        presentation={presentation}
                        mapping={fieldMapping}
                        onMappingChange={setFieldMapping}
                        onNext={() => setCurrentStep(AppStep.GENERATE)} 
                        onBack={() => setCurrentStep(AppStep.UPLOAD_TEMPLATE)}
                    />
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