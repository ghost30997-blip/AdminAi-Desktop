
import React, { useState, useEffect } from 'react';
import { StepUpload } from './StepUpload';
import { StepData } from './StepData';
import { DataRow, SystemSettings } from '../types';
import { getSettings } from '../utils/storage';
import { generateAttendancePDF } from '../utils/fileProcessor';
import { ClipboardList, Download, CheckCircle, ArrowRight, UserCheck, FileText, Settings, AlertCircle } from 'lucide-react';

export const ModuleAttendance: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'confirm' | 'generate'>('upload');
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  
  // Mapping
  const [nameColumn, setNameColumn] = useState('');
  const [cpfColumn, setCpfColumn] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleDataLoaded = (loadedData: DataRow[], loadedHeaders: string[]) => {
    setData(loadedData);
    setHeaders(loadedHeaders);
    
    // Auto-detect columns
    const nameMatch = loadedHeaders.find(h => /nome|name|aluno|cliente/i.test(h));
    const cpfMatch = loadedHeaders.find(h => /cpf|documento|id/i.test(h));
    
    if (nameMatch) setNameColumn(nameMatch);
    if (cpfMatch) setCpfColumn(cpfMatch);
    
    setStep('confirm');
  };

  const handleRunGeneration = async () => {
    if (!nameColumn || !settings) {
        alert("Selecione pelo menos a coluna de NOME.");
        return;
    }
    
    setIsGenerating(true);
    try {
        const blob = await generateAttendancePDF(data, settings, { name: nameColumn, cpf: cpfColumn });
        setDownloadUrl(URL.createObjectURL(blob));
        setStep('generate');
    } catch (e) {
        console.error(e);
        alert("Erro ao gerar PDF.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in overflow-hidden">
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
          {step === 'confirm' && (
              <div className="flex-shrink-0 mb-4 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                      <ClipboardList className="text-brand-blue" size={24} />
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Configurar Lista de Presença</h2>
                          <p className="text-xs text-slate-500">Mapeie as colunas para o PDF oficial.</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => { setStep('upload'); setDownloadUrl(null); }}
                      className="text-slate-400 hover:text-brand-blue text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                      Reiniciar
                  </button>
              </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden">
                {step === 'upload' && <StepUpload onDataLoaded={handleDataLoaded} />}
                
                {step === 'confirm' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden p-6">
                        {/* Left: Configuration */}
                        <div className="w-full md:w-80 flex-shrink-0 space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Settings size={18} className="text-brand-blue"/> Mapeamento
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Coluna de Nomes</label>
                                        <select 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm dark:bg-slate-700 dark:text-white outline-none focus:border-brand-blue"
                                            value={nameColumn}
                                            onChange={e => setNameColumn(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Coluna de CPF (Opcional)</label>
                                        <select 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm dark:bg-slate-700 dark:text-white outline-none focus:border-brand-blue"
                                            value={cpfColumn}
                                            onChange={e => setCpfColumn(e.target.value)}
                                        >
                                            <option value="">Nenhum / Não incluir</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
                                    <button 
                                        onClick={handleRunGeneration}
                                        disabled={!nameColumn || isGenerating}
                                        className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 transition-all"
                                    >
                                        {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <><FileText size={18}/> Gerar Lista PDF</>}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>O cabeçalho (Logo e Empresa) será inserido automaticamente com base nas suas Configurações.</p>
                            </div>
                        </div>

                        {/* Right: Data Preview */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                                <h3 className="font-bold text-slate-700 dark:text-white text-sm">Preview da Tabela ({data.length} nomes)</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase sticky top-0">
                                        <tr>
                                            <th className="p-3 w-10 text-center">#</th>
                                            <th className="p-3">Nome</th>
                                            <th className="p-3">Documento</th>
                                            <th className="p-3">Assinatura</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="p-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {String(row[nameColumn] || '---').toUpperCase()}
                                                </td>
                                                <td className="p-3 text-sm text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                    {String(row[cpfColumn] || '-')}
                                                </td>
                                                <td className="p-3">
                                                    <div className="h-6 w-full border-b border-slate-200 dark:border-slate-600 opacity-30"></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'generate' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in h-full">
                        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-100 dark:border-green-800">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Lista Gerada!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Seu PDF está pronto para impressão com as margens configuradas.</p>
                        
                        <div className="flex gap-4">
                            {downloadUrl && (
                                <a 
                                    href={downloadUrl} 
                                    download={`Lista_Presenca_${new Date().getTime()}.pdf`}
                                    className="bg-brand-blue hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                                >
                                    <Download size={20} /> Baixar PDF
                                </a>
                            )}
                            <button 
                                onClick={() => { setStep('upload'); setDownloadUrl(null); }}
                                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Criar Nova
                            </button>
                        </div>
                    </div>
                )}
          </div>
      </div>
    </div>
  );
};
