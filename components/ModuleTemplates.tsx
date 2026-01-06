
import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Upload, Trash2, FileText, Clock, Plus } from 'lucide-react';
import { getTemplates, saveTemplate, deleteTemplate } from '../utils/storage';
import { PresentationTemplate } from '../types';
import { fileToBase64 } from '../utils/fileProcessor';

export const ModuleTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<PresentationTemplate[]>([]);
  const [newTemplateCategory, setNewTemplateCategory] = useState('Certificado');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      if (!file.name.match(/\.(pptx|docx)$/i)) {
        alert('Por favor envie apenas arquivos .pptx ou .docx');
        setIsUploading(false);
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        const type = file.name.endsWith('.docx') ? 'docx' : 'pptx';
        const t: PresentationTemplate = {
          id: `tpl_${Date.now()}`,
          name: file.name.replace(/\.(pptx|docx)/i, ''),
          category: newTemplateCategory,
          createdAt: new Date().toLocaleDateString('pt-BR'),
          contentBase64: base64,
          type: type
        };
        const updated = saveTemplate(t);
        setTemplates(updated);
      } catch (error) {
        console.error(error);
        alert('Erro ao salvar template.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Remover este template permanentemente?')) {
      const updated = deleteTemplate(id);
      setTemplates(updated);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in p-4 md:p-8 transition-colors overflow-y-auto">
      <div className="mb-8 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <LayoutTemplate className="text-brand-orange" size={32} /> Biblioteca de Modelos
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Gerencie seus arquivos base para certificados e contratos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Upload */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-brand-blue"/> Adicionar Novo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tipo de Modelo</label>
                <select 
                  className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-blue"
                  value={newTemplateCategory}
                  onChange={e => setNewTemplateCategory(e.target.value)}
                >
                  <option value="Certificado">Certificado</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <label className={`
                flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${isUploading ? 'bg-gray-100 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-brand-blue hover:bg-blue-50/50'}
              `}>
                <Upload size={24} className="text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-500 text-center px-4">
                  {isUploading ? 'Enviando...' : 'Carregar PPTX ou DOCX'}
                </span>
                <input type="file" className="hidden" accept=".pptx,.docx" onChange={handleUploadTemplate} disabled={isUploading} />
              </label>
              
              <p className="text-[10px] text-slate-400 leading-tight">
                * Os arquivos devem conter variáveis no formato <code>{`{{Campo}}`}</code> para substituição automática.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Modelos */}
        <div className="lg:col-span-3">
          {templates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-20 text-center flex flex-col items-center">
              <FileText size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Nenhum modelo cadastrado na biblioteca.</p>
              <p className="text-sm text-slate-300 mt-1">Use o painel ao lado para enviar seu primeiro arquivo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map(tpl => (
                <div key={tpl.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg ${tpl.type === 'docx' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-orange-50 dark:bg-orange-900/20 text-brand-orange'}`}>
                      <FileText size={24} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">
                      {tpl.category}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 dark:text-white truncate mb-1 pr-8" title={tpl.name}>
                    {tpl.name}
                  </h4>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-black uppercase border dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-400">
                      {tpl.type || 'pptx'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {tpl.createdAt}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="absolute top-5 right-5 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
