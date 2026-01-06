
import React, { useState, useCallback } from 'react';
import { Database, FileSpreadsheet } from 'lucide-react';
import { DataRow } from '../types';
import { parseDataFile } from '../utils/fileProcessor';

interface StepUploadProps {
  onDataLoaded: (data: DataRow[], headers: string[]) => void;
}

export const StepUpload: React.FC<StepUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);

    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Por favor envie um arquivo .csv ou .xlsx válido.');
      setLoading(false);
      return;
    }

    try {
      const { data, headers } = await parseDataFile(file);
      onDataLoaded(data, headers);
    } catch (err) {
      console.error(err);
      setError('Falha ao processar arquivo. Verifique o formato.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 animate-fade-in relative z-10 w-full overflow-y-auto">
      <div className="text-center mb-8 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Fonte de Dados</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Faça o upload da planilha (Excel ou CSV) com as variáveis para a mala direta.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
        w-full max-w-xl h-72 min-h-[250px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative shadow-sm flex-shrink-0
        ${isDragging 
            ? 'border-brand-blue bg-blue-50/50 scale-105' 
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-brand-blue hover:bg-slate-50 dark:hover:bg-slate-700'}
        `}
      >
        {loading ? (
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue mb-3"></div>
                <p className="text-brand-blue font-semibold">Processando planilha...</p>
            </div>
        ) : (
            <>
                <div className="p-4 bg-blue-50 dark:bg-slate-700 text-brand-blue rounded-full mb-4">
                    <Database className="w-8 h-8" />
                </div>
                
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Arraste sua Planilha aqui</p>
                <p className="text-sm text-slate-400 mt-1">ou clique para selecionar (.xlsx, .csv)</p>
                
                <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={onFileChange}
                />
            </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg flex items-center shadow-sm max-w-xl flex-shrink-0">
            <span className="mr-3 font-bold">Erro:</span> {error}
        </div>
      )}

      <div className="mt-8 flex gap-6 text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} />
              <span className="text-xs">Formato Excel (.xlsx)</span>
          </div>
          <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} />
              <span className="text-xs">Formato CSV</span>
          </div>
      </div>
    </div>
  );
};
