import React, { useState, useEffect } from 'react';
import { Building2, Save, Upload, Image as ImageIcon, Database } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/storage';
import { SystemSettings } from '../types';
import { fileToBase64 } from '../utils/fileProcessor';

interface ModuleAdminProps {
    onLogoUpdate: (logo?: string) => void;
}

export const ModuleAdmin: React.FC<ModuleAdminProps> = ({ onLogoUpdate }) => {
  const [settings, setSettings] = useState<SystemSettings>({
      companyName: '', cnpj: '', email: '', themeColor: 'blue', crmColumns: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
  }, []);

  const handleSaveSettings = () => {
      setLoading(true);
      saveSettings(settings);
      onLogoUpdate(settings.logo); // Update logo state in App.tsx
      setTimeout(() => {
          setLoading(false);
          alert("Configurações salvas!");
      }, 500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              const base64 = await fileToBase64(e.target.files[0]);
              setSettings({ ...settings, logo: base64 });
          } catch (err) {
              alert("Erro ao carregar logo.");
          }
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in transition-colors overflow-hidden">
      <div className="p-4 md:p-8 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie a identidade visual e informações da sua empresa.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 md:p-10 space-y-10">
                
                {/* Database Status */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-5">
                    <div className="p-3 bg-white dark:bg-slate-800 text-brand-blue rounded-xl shadow-sm">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Armazenamento Local</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Seus dados estão seguros e armazenados localmente no seu navegador.
                        </p>
                    </div>
                </div>

                {/* Logo Section */}
                <div className="space-y-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <ImageIcon size={20} className="text-brand-purple"/> Logotipo Institucional
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700">
                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden relative group shrink-0 shadow-sm">
                            {settings.logo ? (
                                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs text-gray-400 text-center px-4">Arraste seu logo aqui</span>
                            )}
                            <label className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <Upload className="text-white" size={24} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <div className="space-y-2 text-center sm:text-left">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Esta imagem será aplicada automaticamente em:</p>
                            <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                                <li>Cabeçalho do sistema</li>
                                <li>Documentos gerados pela Mala Direta</li>
                                <li>Relatórios administrativos</li>
                            </ul>
                            <label className="inline-block mt-4 text-sm font-bold text-brand-blue cursor-pointer hover:underline">
                                Alterar Imagem
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-slate-700" />

                {/* Company Info */}
                <div className="space-y-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Building2 size={20} className="text-brand-blue"/> Informações da Empresa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Razão Social</label>
                            <input 
                                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-white dark:bg-slate-700 dark:text-white"
                                placeholder="Nome da sua empresa"
                                value={settings.companyName}
                                onChange={e => setSettings({...settings, companyName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CNPJ / CPF</label>
                            <input 
                                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-white dark:bg-slate-700 dark:text-white"
                                placeholder="00.000.000/0000-00"
                                value={settings.cnpj}
                                onChange={e => setSettings({...settings, cnpj: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email para Correspondência</label>
                            <input 
                                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-white dark:bg-slate-700 dark:text-white"
                                placeholder="contato@suaempresa.com"
                                value={settings.email}
                                onChange={e => setSettings({...settings, email: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="bg-brand-blue hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : <><Save size={22} /> Salvar Configurações</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};