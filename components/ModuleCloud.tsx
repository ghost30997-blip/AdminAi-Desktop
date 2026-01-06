
import React, { useState, useEffect } from 'react';
import { 
  Folder, FileText, Image as ImageIcon, Search, 
  Download, HardDrive, ChevronRight, Plus, Loader2
} from 'lucide-react';
import { DriveFile } from '../types';
import { getFiles, uploadFileMock } from '../utils/storage';

interface ModuleCloudProps {
    initialFolderId?: string;
}

export const ModuleCloud: React.FC<ModuleCloudProps> = ({ initialFolderId }) => {
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Armazenamento'}]);
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setAllFiles(getFiles());
  }, []);

  // Handle Initial Navigation (Deep Link from CRM)
  useEffect(() => {
      if(initialFolderId) {
          const files = getFiles();
          const target = files.find(f => f.id === initialFolderId);
          if(target) {
              setCurrentFolderId(initialFolderId);
              if(target.parentId === 'root') {
                 setBreadcrumbs([
                     {id: 'root', name: 'Armazenamento'},
                     {id: target.id, name: target.name}
                 ]); 
              }
          }
      }
  }, [initialFolderId]);

  const handleNavigate = (folder: DriveFile) => {
      if(folder.type !== 'folder') {
          return;
      }
      setCurrentFolderId(folder.id);
      setBreadcrumbs([...breadcrumbs, {id: folder.id, name: folder.name}]);
  };

  const handleNavigateUp = (index: number) => {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const file = e.target.files[0];
          
          try {
              // 1. Save locally for instant access
              const uploaded = uploadFileMock(file, currentFolderId);
              setAllFiles(prev => [...prev, uploaded]);
              setIsUploading(false);
          } catch (error) {
              console.error(error);
              alert("Erro no upload.");
              setIsUploading(false);
          }
      }
  };

  // Filter local files manually
  const currentFiles = allFiles.filter(f => currentFolderId === 'root' ? (f.parentId === 'root' || f.parentId === null) : f.parentId === currentFolderId);

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 animate-fade-in transition-colors">
      
      {/* Sidebar (Drive Structure) */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col p-4 hidden md:flex">
        
        <div className="space-y-3 mb-6">
            <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-blue text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all font-bold cursor-pointer text-sm">
                <Plus size={18} /> 
                <span>Upload Arquivo</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
        </div>

        <nav className="space-y-1">
            <div 
                onClick={() => setCurrentFolderId('root')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium cursor-pointer bg-blue-50 dark:bg-blue-900/30 text-brand-blue dark:text-blue-300`}
            >
                <HardDrive size={18} /> 
                Arquivos Locais
            </div>
        </nav>

        <div className="mt-auto">
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-2">
                    Storage Local
                </p>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
                    <div className="w-[35%] h-full bg-brand-blue rounded-full"></div>
                </div>
                <p className="text-xs text-slate-400">Armazenado no Navegador</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-16 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium overflow-x-auto custom-scrollbar flex-nowrap mr-2">
                {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                        <span 
                            onClick={() => handleNavigateUp(idx)}
                            className={`whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-white font-bold' : 'hover:text-brand-blue dark:hover:text-blue-400 cursor-pointer'}`}
                        >
                            {crumb.name}
                        </span>
                        {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="flex-shrink-0" />}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex gap-4 flex-shrink-0">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none w-32 md:w-64 transition-all" />
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
            
            {isUploading && (
                <div className="absolute top-4 right-4 bg-brand-dark text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Loader2 className="animate-spin text-brand-orange" size={20} />
                    <div className="text-sm">
                        <p className="font-bold">Processando...</p>
                    </div>
                </div>
            )}

            {currentFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Folder size={64} className="mb-4 opacity-20" />
                    <p>Pasta vazia</p>
                    <div className="flex gap-2 mt-4">
                        <label className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-brand-blue hover:text-brand-blue cursor-pointer transition-colors text-sm font-medium dark:text-slate-300">
                            Fazer Upload
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Tamanho</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {currentFiles.map((file, i) => (
                                    <tr 
                                        key={file.id || i} 
                                        onClick={() => handleNavigate(file)}
                                        className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-3 flex items-center gap-3">
                                            <div className="text-slate-400 group-hover:text-brand-orange transition-colors">
                                                {file.type === 'folder' || (!file.type && !file.metadata) ? (
                                                    <Folder size={20} fill="#FFEDD5" className="text-orange-200 dark:text-orange-300 group-hover:text-orange-300" />
                                                ) : (
                                                    <FileText size={20} className="text-blue-400" />
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{file.name}</span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400 uppercase text-xs">
                                            {file.type || (file.metadata ? file.metadata.mimetype : 'N/A')}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                                            {file.size || (file.metadata ? (file.metadata.size / 1024).toFixed(1) + ' KB' : '-')}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded text-slate-500 dark:text-slate-400" title="Download">
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
