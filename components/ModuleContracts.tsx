
import React, { useState, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';
import { StepUpload } from './StepUpload';
import { StepData } from './StepData';
import { StepEditor } from './StepEditor';
import { StepGenerate } from './StepGenerate';
import { AppStep, DataRow, PresentationData, FieldMapping, PresentationTemplate } from '../types';
import { loadPresentation, base64ToBlob } from '../utils/fileProcessor';
import { getTemplates } from '../utils/storage';
import { Upload, FileSignature, LayoutTemplate, Clock, FileText } from 'lucide-react';

export const ModuleContracts: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD_DATA);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [savedTemplates, setSavedTemplates] = useState<PresentationTemplate[]>([]);

  useEffect(() => {
    if (currentStep === AppStep.UPLOAD_TEMPLATE) {
        const all = getTemplates();
        const contracts = all.filter(t => t.category === 'Contrato' || t.type === 'docx');
        setSavedTemplates(contracts.length > 0 ? contracts : all);
    }
  }, [currentStep]);

  const handleDataLoaded = (loadedData: DataRow[], loadedHeaders: string[]) => {
    setData(loadedData);
    setHeaders(loadedHeaders);
    setCurrentStep(AppStep.CONFIRM_DATA);
  };

  const handleDataConfirmed = (selectedData: DataRow[]) => {
      setData(selectedData);
      setCurrentStep(AppStep.UPLOAD_TEMPLATE);
  };

  const processDocxFile = async (file: File | Blob) => {
      try {
        const docData = await loadPresentation(file);
        setPresentation(docData);
        setCurrentStep(AppStep.EDITOR);
      } catch (err) {
        console.error("Failed to load document", err);
        alert("Erro ao carregar arquivo Word (.docx).");
      }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.docx')) {
          alert("O modelo de contrato deve ser um arquivo Word (.docx)");
          return;
      }
      await processDocxFile(file);
    }
  };

  const handleSelectSavedTemplate = async (template: PresentationTemplate) => {
      try {
          const blob = await base64ToBlob(template.contentBase64);
          await processDocxFile(blob);
      } catch (err) {
          console.error(err);
          alert("Erro ao carregar template salvo.");
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden h-full">
            <ProgressBar currentStep={currentStep} />
            
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {currentStep === AppStep.UPLOAD_DATA && (
                    <StepUpload onDataLoaded={handleDataLoaded} />
                )}

                {currentStep === AppStep.CONFIRM_DATA && (
                    <StepData 
                        data={data} 
                        headers={headers} 
                        onConfirm={handleDataConfirmed}
                        onBack={() => setCurrentStep(AppStep.UPLOAD_DATA)}
                    />
                )}

                {currentStep === AppStep.UPLOAD_TEMPLATE && (
                    <div className="flex-1 flex flex-col p-4 md:p-8 animate-fade-in h-full overflow-y-auto">
                        <div className="max-w-6xl w-full mx-auto pb-10">
                            <button 
                                onClick={() => setCurrentStep(AppStep.CONFIRM_DATA)}
                                className="mb-6 text-slate-500 dark:text-slate-400 hover:text-brand-blue transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                ← Voltar para Dados
                            </button>
                            
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-center">Modelo de Contrato</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg text-center">
                                Selecione um modelo de contrato no formato <strong>Word (.docx)</strong>.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Option 1: Upload */}
                                <div className="lg:col-span-1">
                                    <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                                        <Upload size={20} className="text-brand-blue"/> Upload Manual
                                    </h3>
                                    <label className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-700/50 hover:border-brand-blue dark:hover:border-brand-blue hover:bg-blue-50/50 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            <div className="p-4 bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-600 text-brand-blue rounded-full mb-4 group-hover:scale-110 transition-transform">
                                                <FileText size={32} />
                                            </div>
                                            <p className="mb-2 text-lg font-semibold text-slate-700 dark:text-white">Novo Arquivo .docx</p>
                                            <p className="text-xs text-slate-400">Arraste ou clique para buscar</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".docx" onChange={handleTemplateUpload} />
                                    </label>
                                </div>

                                {/* Option 2: Library */}
                                <div className="lg:col-span-2">
                                    <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                                        <LayoutTemplate size={20} className="text-brand-orange"/> Biblioteca de Documentos
                                    </h3>
                                    
                                    {savedTemplates.length === 0 ? (
                                        <div className="h-64 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-700/50 flex flex-col items-center justify-center text-slate-400">
                                            <FileSignature size={48} className="mb-4 opacity-20" />
                                            <p>Nenhum template salvo.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64 overflow-y-auto custom-scrollbar pr-2">
                                            {savedTemplates.map(tpl => (
                                                <div 
                                                    key={tpl.id}
                                                    onClick={() => handleSelectSavedTemplate(tpl)}
                                                    className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 cursor-pointer hover:border-brand-blue dark:hover:border-brand-blue hover:shadow-md hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-all group bg-white dark:bg-slate-800"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                                            <FileText size={20} />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded">{tpl.category}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-700 dark:text-white truncate">{tpl.name}</h4>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                        <Clock size={10} /> {tpl.createdAt}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                            setFieldMapping({});
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
