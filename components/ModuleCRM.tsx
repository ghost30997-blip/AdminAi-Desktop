
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, LayoutGrid, Kanban, Filter, MoreHorizontal, 
  Phone, Mail, Calendar, DollarSign, FolderOpen, X, Save, 
  Users, Building2, Upload, FileSpreadsheet, CheckCircle2, Trash2,
  UserPlus, FileText, Paperclip, Edit2, ChevronDown, Download, Clock, Settings
} from 'lucide-react';
// Fix: Removed CrmStatus as it's not exported from types
import { Client, Employee, Training, CrmColumn } from '../types';
import { getClients, saveClient, deleteClient, getTrainings, getSettings, saveSettings } from '../utils/storage';
import { parseDataFile, exportToCSV, formatCPF, formatCNPJ, formatRG } from '../utils/fileProcessor';

interface ModuleCRMProps {
  onNavigateToCloud: (folderId?: string) => void;
}

export const ModuleCRM: React.FC<ModuleCRMProps> = ({ onNavigateToCloud }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [availableTrainings, setAvailableTrainings] = useState<Training[]>([]);
  const [statusColumns, setStatusColumns] = useState<CrmColumn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form State
  // Fix: Added 'student' to mode state to accommodate all client types
  const [mode, setMode] = useState<'individual' | 'enterprise' | 'student'>('individual');
  const [newClient, setNewClient] = useState<Partial<Client>>({
      name: '', company: '', email: '', phone: '', value: 0, status: 'lead', trainingName: '', cnpj: '', startDate: '', startTime: '', endDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Employee Management State
  const [importedEmployees, setImportedEmployees] = useState<Employee[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  
  // Manual Employee Entry State
  const [manualEmp, setManualEmp] = useState({ name: '', role: '', cpf: '', rg: '' });

  // Load data on mount
  useEffect(() => {
    setClients(getClients());
    setAvailableTrainings(getTrainings());
    const settings = getSettings();
    setStatusColumns(settings.crmColumns || []);
  }, []);

  const handleEditClient = (client: Client, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setNewClient(client);
      setImportedEmployees(client.employees || []);
      setMode(client.type || (client.employees && client.employees.length > 0 ? 'enterprise' : 'individual'));
      setIsEditing(true);
      setShowModal(true);
  };

  const handleDownloadCsv = (client: Client, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      
      const training = availableTrainings.find(t => t.name === client.trainingName);
      const duration = training ? training.duration : 'N/A';
      
      const exportData = (client.employees || []).map(emp => ({
          'Nome Participante': emp.name,
          'CPF': emp.cpf || '',
          'RG': emp.rg || '',
          'Cargo': emp.role,
          'Empresa': client.company,
          'CNPJ': client.cnpj || '',
          'Curso': client.trainingName || 'Geral',
          'Carga Horária': duration,
          'Data Início': client.startDate ? new Date(client.startDate).toLocaleDateString('pt-BR') : '',
          'Hora': client.startTime || '',
          'Data Fim': client.endDate ? new Date(client.endDate).toLocaleDateString('pt-BR') : '',
          'Data Emissão': new Date().toLocaleDateString('pt-BR')
      }));

      if(exportData.length === 0) {
          alert("Esta empresa não possui funcionários cadastrados para gerar a lista.");
          return;
      }

      exportToCSV(exportData, `Lista_${client.company.replace(/ /g, '_')}`);
  };

  const resetForm = () => {
      // Default to first status
      const initialStatus = statusColumns.length > 0 ? statusColumns[0].id : 'lead';
      setNewClient({ name: '', company: '', email: '', phone: '', value: 0, status: initialStatus, trainingName: '', cnpj: '', startDate: '', startTime: '', endDate: '' });
      setImportedEmployees([]);
      setManualEmp({ name: '', role: '', cpf: '', rg: '' });
      setMode('individual');
      setIsEditing(false);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setImportLoading(true);
          try {
              const file = e.target.files[0];
              const { data, headers } = await parseDataFile(file);
              
              const employees: Employee[] = data.map((row, idx) => {
                  const keys = Object.keys(row);
                  const nameKey = keys.find(k => k.toLowerCase().includes('nome')) || keys[0];
                  const roleKey = keys.find(k => k.toLowerCase().includes('cargo') || k.toLowerCase().includes('função')) || keys[1];
                  const cpfKey = keys.find(k => k.toLowerCase().includes('cpf') || k.toLowerCase().includes('doc'));
                  const rgKey = keys.find(k => k.toLowerCase().includes('rg') || k.toLowerCase().includes('identidade') || k.toLowerCase().includes('registro'));

                  return {
                      id: `emp_${Date.now()}_${idx}`,
                      name: String(row[nameKey] || 'Sem Nome'),
                      role: String(row[roleKey] || 'Colaborador'),
                      cpf: cpfKey ? String(row[cpfKey]) : undefined,
                      rg: rgKey ? String(row[rgKey]) : undefined
                  };
              });

              setImportedEmployees(prev => [...prev, ...employees]);
              if(!isEditing) {
                  setNewClient(prev => ({...prev, value: (prev.value || 0) + (employees.length * 200) }));
              }
          } catch (error) {
              alert('Erro ao ler planilha. Certifique-se que é um CSV ou Excel válido.');
          } finally {
              setImportLoading(false);
          }
      }
  };

  const handleAddManualEmployee = () => {
      if (!manualEmp.name) return;
      const newEmp: Employee = {
          id: `emp_manual_${Date.now()}`,
          name: manualEmp.name,
          role: manualEmp.role || 'Participante',
          cpf: manualEmp.cpf,
          rg: manualEmp.rg
      };
      setImportedEmployees(prev => [...prev, newEmp]);
      setManualEmp({ name: '', role: '', cpf: '', rg: '' });
  };

  const handleAttachDocs = (index: number, files: FileList | null) => {
      if (!files) return;
      const fileArray = Array.from(files);
      
      setImportedEmployees(prev => prev.map((emp, i) => {
          if (i === index) {
              const currentFiles = emp.pendingFiles || [];
              return { ...emp, pendingFiles: [...currentFiles, ...fileArray] };
          }
          return emp;
      }));
  };

  const removeEmployee = (index: number) => {
      setImportedEmployees(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveClient = () => {
      if(!newClient.company) {
          alert("Nome (Empresa ou Pessoa) é obrigatório");
          return;
      }
      
      const clientToSave: Client = {
          ...newClient as Client,
          id: newClient.id || Date.now().toString(),
          name: newClient.name || newClient.company, 
          company: newClient.company,
          status: newClient.status || (statusColumns.length > 0 ? statusColumns[0].id : 'lead'),
          value: Number(newClient.value) || 0,
          avatarColor: newClient.avatarColor || `bg-${['blue','purple','green','orange'][Math.floor(Math.random()*4)]}-500`,
          lastContact: newClient.lastContact || 'Hoje',
          type: mode,
          tags: mode === 'enterprise' ? ['Corporativo', 'Treinamento', newClient.trainingName || 'Geral'] : ['Pessoa Física', 'Individual'],
          employees: mode === 'enterprise' ? importedEmployees : []
      };

      const updatedList = saveClient(clientToSave);
      setClients(updatedList);
      setShowModal(false);
      resetForm();
  };

  const handleDeleteClient = (id: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      if(window.confirm('Tem certeza que deseja excluir este registro? Esta ação é irreversível.')) {
          const updated = deleteClient(id);
          setClients(updated);
      }
  };

  const handleSaveColumns = () => {
      const settings = getSettings();
      settings.crmColumns = statusColumns;
      saveSettings(settings);
      setShowSettingsModal(false);
  };

  const updateColumnColor = (id: string, color: string) => {
      setStatusColumns(prev => prev.map(c => c.id === id ? {...c, color} : c));
  };

  const updateColumnLabel = (id: string, label: string) => {
      setStatusColumns(prev => prev.map(c => c.id === id ? {...c, label} : c));
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr?: string) => {
      if(!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  // --- KANBAN VIEW ---
  const KanbanBoard = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full custom-scrollbar snap-x snap-mandatory">
      {statusColumns.map(col => {
        const colClients = filteredClients.filter(c => c.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className="min-w-[280px] w-[85vw] sm:w-[320px] snap-center bg-slate-100/50 dark:bg-slate-800/50 rounded-xl flex flex-col h-full border border-gray-200/60 dark:border-slate-700 transition-colors"
          >
            <div className={`p-4 border-t-4 ${col.color} bg-white dark:bg-slate-800 rounded-t-xl shadow-sm mb-2 flex-shrink-0`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-700 dark:text-white">{col.label}</h3>
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold">
                  {colClients.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Total: {formatCurrency(colClients.reduce((acc, curr) => acc + curr.value, 0))}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
              {colClients.map(client => (
                <div 
                    key={client.id} 
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md border border-gray-200 dark:border-slate-700 cursor-grab active:cursor-grabbing transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${client.avatarColor} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                            {client.company.substring(0,1).toUpperCase()}
                        </div>
                        <div className="overflow-hidden min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{client.company}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.name}</p>
                        </div>
                    </div>
                    <button onClick={(e) => handleEditClient(client, e)} className="text-slate-300 dark:text-slate-500 hover:text-brand-blue"><Edit2 size={14}/></button>
                  </div>
                  
                  {/* Additional Info Snippets */}
                  <div className="mb-3 space-y-1">
                       {/* Show employee count for enterprise */}
                      {client.type === 'enterprise' && client.employees && client.employees.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium">
                              <Users size={14} />
                              {client.employees.length} Funcionários
                          </div>
                      )}
                      {/* Show schedule info */}
                      {(client.startDate || client.startTime) && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-1 rounded">
                              <Clock size={12} className="text-brand-orange"/>
                              {formatDate(client.startDate)} {client.startTime ? ` às ${client.startTime}` : ''}
                          </div>
                      )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <DollarSign size={12} className="text-green-600" />
                        <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(client.value)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex gap-1 overflow-hidden w-1/2">
                        {client.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600 truncate">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={(e) => handleDownloadCsv(client, e)}
                            className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors tooltip flex items-center gap-1 px-2 z-10" 
                            title="Baixar Lista Mala Direta (CSV)"
                        >
                            <FileSpreadsheet size={14} />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClient(client.id, e)}
                            className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 rounded-md transition-colors tooltip z-10 cursor-pointer"
                            title="Excluir"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onNavigateToCloud(client.folderId); }}
                            className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors tooltip flex items-center gap-1 px-2 z-10" 
                            title="Ver Pastas no Drive"
                        >
                            <FolderOpen size={14} />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- LIST VIEW ---
  const ListView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
       <div className="overflow-x-auto custom-scrollbar flex-1">
         <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Empresa / Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Agendamento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Contatos</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider text-right">Valor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${client.avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
                                    {client.company.substring(0,1).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{client.company}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{client.name}</p>
                                </div>
                            </div>
                        </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColumns.find(c => c.id === client.status)?.color.replace('border-', 'text-').replace('400', '600').replace('text-blue-600', 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300') || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
                                {statusColumns.find(c => c.id === client.status)?.label || client.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
                             {client.startDate ? (
                                 <span className="flex flex-col gap-0.5">
                                     <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> {formatDate(client.startDate)}</span>
                                     {client.startTime && <span className="flex items-center gap-1 text-slate-400"><Clock size={12} /> {client.startTime}</span>}
                                 </span>
                             ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                             <div className="flex flex-col gap-1 text-xs">
                                <span className="flex items-center gap-2 hover:text-brand-blue cursor-pointer"><Mail size={12}/> {client.email}</span>
                             </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-white">
                             {formatCurrency(client.value)}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => handleEditClient(client, e)}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-slate-700 border border-transparent hover:border-blue-100 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={(e) => handleDownloadCsv(client, e)}
                                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 border border-transparent hover:border-green-100 rounded-lg transition-colors"
                                    title="Baixar Lista CSV"
                                >
                                    <FileSpreadsheet size={16} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onNavigateToCloud(client.folderId); }}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-transparent hover:border-blue-100 rounded-lg transition-colors"
                                    title="Arquivos"
                                >
                                    <FolderOpen size={16} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteClient(client.id, e)}
                                    className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 border border-transparent hover:border-red-100 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in p-4 md:p-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0 pl-10 md:pl-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">CRM de Vendas & Treinamentos</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie empresas e listas de participantes para treinamentos.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
             <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex shadow-sm">
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-brand-blue text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                    <Kanban size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-brand-blue text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                    <LayoutGrid size={20} />
                </button>
             </div>
             
             <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-colors shadow-sm"
                title="Configurar Colunas"
             >
                <Settings size={20} />
             </button>

             <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-sm"
             >
                <Plus size={20} /> <span className="hidden sm:inline">Novo Cadastro</span>
             </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Buscar empresa ou treinamento..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 transition-all shadow-sm dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue flex items-center justify-center gap-2 transition-colors font-medium">
            <Filter size={18} /> Filtros
        </button>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {viewMode === 'kanban' ? <KanbanBoard /> : <ListView />}
      </div>

      {/* --- COLUMNS SETTINGS MODAL --- */}
      {showSettingsModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                 <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">Configurar Colunas (Tags)</h3>
                      <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                 </div>
                 <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Renomeie as etapas do funil de vendas e escolha as cores para os cards.</p>
                    {statusColumns.map((col, idx) => (
                        <div key={col.id} className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Etapa</label>
                                <input 
                                    className="w-full border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-700 dark:text-white"
                                    value={col.label}
                                    onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Cor</label>
                                <select 
                                    className="w-full border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-700 dark:text-white"
                                    value={col.color}
                                    onChange={(e) => updateColumnColor(col.id, e.target.value)}
                                >
                                    <option value="border-blue-400">Azul</option>
                                    <option value="border-orange-400">Laranja</option>
                                    <option value="border-purple-400">Roxo</option>
                                    <option value="border-yellow-400">Amarelo</option>
                                    <option value="border-green-400">Verde</option>
                                    <option value="border-red-400">Vermelho</option>
                                    <option value="border-gray-400">Cinza</option>
                                </select>
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700">
                      <button onClick={handleSaveColumns} className="px-6 py-2 bg-brand-blue text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
                          <Save size={16} /> Salvar Configuração
                      </button>
                 </div>
             </div>
         </div>
      )}

      {/* --- ADD/EDIT CLIENT MODAL --- */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">{isEditing ? 'Editar Cadastro' : 'Novo Cadastro'}</h3>
                      <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                  </div>

                  {/* Mode Tabs - Responsive Scroll */}
                  <div className="flex p-2 bg-slate-50 dark:bg-slate-700/30 border-b border-gray-200 dark:border-slate-700 gap-2 px-6 overflow-x-auto custom-scrollbar flex-nowrap">
                      <button 
                        onClick={() => setMode('individual')}
                        className={`flex-shrink-0 flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 px-4 whitespace-nowrap ${mode === 'individual' ? 'bg-white dark:bg-slate-600 text-brand-blue dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                          <Users size={16} /> <span className="hidden sm:inline">Pessoa Física</span>
                          <span className="sm:hidden">Individual</span>
                      </button>
                      <button 
                        onClick={() => setMode('enterprise')}
                        className={`flex-shrink-0 flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 px-4 whitespace-nowrap ${mode === 'enterprise' ? 'bg-white dark:bg-slate-600 text-brand-orange dark:text-orange-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                          <Building2 size={16} /> <span className="hidden sm:inline">Corporativo / Empresa</span>
                          <span className="sm:hidden">Corporativo</span>
                      </button>
                  </div>

                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                      {/* Common Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{mode === 'enterprise' ? 'Razão Social / Empresa' : 'Nome Completo'} *</label>
                              <input 
                                className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-blue/20 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                placeholder={mode === 'enterprise' ? "Nome da Empresa" : "Nome do Cliente"}
                                value={newClient.company}
                                onChange={e => setNewClient({...newClient, company: e.target.value})}
                              />
                          </div>
                          <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{mode === 'enterprise' ? 'CNPJ' : 'CPF'}</label>
                                <input 
                                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-blue/20 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                    placeholder={mode === 'enterprise' ? '00.000.000/0000-00' : '000.000.000-00'}
                                    value={newClient.cnpj}
                                    onChange={e => setNewClient({...newClient, cnpj: mode === 'enterprise' ? formatCNPJ(e.target.value) : formatCPF(e.target.value)})}
                                    maxLength={mode === 'enterprise' ? 18 : 14}
                                />
                           </div>
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Responsável / Contato</label>
                          <input 
                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-blue/20 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                            placeholder="Nome de quem responde pelo cadastro"
                            value={newClient.name}
                            onChange={e => setNewClient({...newClient, name: e.target.value})}
                          />
                      </div>

                      {/* --- SCHEDULING SECTION (FOR BOTH MODES NOW) --- */}
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl space-y-4">
                          <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-2">
                              <Clock size={18} /> Agendamento & Treinamento
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Início</label>
                                  <input 
                                    type="date"
                                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                    value={newClient.startDate || ''}
                                    onChange={e => setNewClient({...newClient, startDate: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Hora</label>
                                  <input 
                                    type="time"
                                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                    value={newClient.startTime || ''}
                                    onChange={e => setNewClient({...newClient, startTime: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Fim</label>
                                  <input 
                                    type="date"
                                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                    value={newClient.endDate || ''}
                                    onChange={e => setNewClient({...newClient, endDate: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Selecione o Treinamento / Serviço</label>
                              <div className="relative">
                                <select 
                                    className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 outline-none border-gray-300 appearance-none bg-white dark:bg-slate-700 dark:text-white" 
                                    value={newClient.trainingName || ''}
                                    onChange={e => setNewClient({...newClient, trainingName: e.target.value})}
                                >
                                    <option value="">-- Selecione --</option>
                                    {availableTrainings.map(t => (
                                        <option key={t.id} value={t.name}>{t.name} ({t.duration})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                              </div>
                          </div>

                          {/* EMPLOYEES LIST (Visible for Enterprise OR Individual to add themselves) */}
                          <div className="space-y-3 pt-2">
                              <div className="flex justify-between items-end border-b border-orange-200 dark:border-orange-800 pb-2">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                                      {mode === 'enterprise' ? 'Lista de Funcionários' : 'Dados do Participante'}
                                  </label>
                                  
                                  {/* Import Button (Enterprise Only) */}
                                  {mode === 'enterprise' && (
                                      <label className="cursor-pointer flex items-center gap-2 text-xs font-bold text-brand-orange hover:text-orange-700 bg-white dark:bg-slate-700 border border-orange-200 dark:border-orange-800/50 px-2 py-1 rounded-lg shadow-sm hover:shadow transition-all">
                                          {importLoading ? <div className="animate-spin w-3 h-3 border-2 border-orange-500 rounded-full border-t-transparent"></div> : <FileSpreadsheet size={14} />}
                                          Importar Excel/CSV
                                          <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileImport} />
                                      </label>
                                  )}
                              </div>

                              {/* Manual Add Form */}
                              <div className="bg-white dark:bg-slate-700/50 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30 shadow-sm grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-3 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded p-1.5 text-xs outline-none focus:border-orange-400 bg-white dark:bg-slate-800 dark:text-white" 
                                            placeholder="Nome Completo"
                                            value={manualEmp.name}
                                            onChange={e => setManualEmp({...manualEmp, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-6 sm:col-span-3 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Cargo</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded p-1.5 text-xs outline-none focus:border-orange-400 bg-white dark:bg-slate-800 dark:text-white" 
                                            placeholder="Função"
                                            value={manualEmp.role}
                                            onChange={e => setManualEmp({...manualEmp, role: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-6 sm:col-span-2 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">CPF</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded p-1.5 text-xs outline-none focus:border-orange-400 bg-white dark:bg-slate-800 dark:text-white" 
                                            placeholder="CPF"
                                            value={manualEmp.cpf}
                                            onChange={e => setManualEmp({...manualEmp, cpf: formatCPF(e.target.value)})}
                                            maxLength={14}
                                        />
                                    </div>
                                    <div className="col-span-6 sm:col-span-3 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">RG</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded p-1.5 text-xs outline-none focus:border-orange-400 bg-white dark:bg-slate-800 dark:text-white" 
                                            placeholder="RG"
                                            value={manualEmp.rg}
                                            onChange={e => setManualEmp({...manualEmp, rg: formatRG(e.target.value)})}
                                            maxLength={12}
                                        />
                                    </div>
                                    <div className="col-span-6 sm:col-span-1">
                                        <button 
                                            onClick={handleAddManualEmployee}
                                            className="w-full p-1.5 bg-brand-orange text-white rounded hover:bg-orange-600 transition-colors flex items-center justify-center"
                                            title="Adicionar"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                              </div>
                              
                              {/* Employee List */}
                              {importedEmployees.length > 0 && (
                                  <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 max-h-48 overflow-y-auto custom-scrollbar">
                                      <table className="w-full text-left text-xs">
                                          <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-600 sticky top-0">
                                              <tr>
                                                  <th className="p-2 text-slate-500 dark:text-slate-400 font-bold w-10">#</th>
                                                  <th className="p-2 text-slate-500 dark:text-slate-400 font-bold">Nome / Cargo</th>
                                                  <th className="p-2 text-slate-500 dark:text-slate-400 font-bold">Docs (CPF/RG)</th>
                                                  <th className="p-2 text-right text-slate-500 dark:text-slate-400 w-10"></th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50 dark:divide-slate-600">
                                              {importedEmployees.map((emp, i) => (
                                                  <tr key={i} className="hover:bg-orange-50/30 dark:hover:bg-slate-600/30">
                                                      <td className="p-2 text-slate-400 text-center">{i+1}</td>
                                                      <td className="p-2">
                                                          <div className="font-bold text-slate-700 dark:text-slate-200">{emp.name}</div>
                                                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{emp.role}</div>
                                                      </td>
                                                      <td className="p-2">
                                                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-col mb-1">
                                                              {emp.cpf && <span>CPF: {emp.cpf}</span>}
                                                              {emp.rg && <span>RG: {emp.rg}</span>}
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                              <label className="cursor-pointer flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-brand-blue hover:border-brand-blue px-2 py-1 rounded shadow-sm transition-all text-[10px] font-bold">
                                                                  <Paperclip size={12} /> Anexar
                                                                  <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    multiple 
                                                                    onChange={(e) => handleAttachDocs(i, e.target.files)} 
                                                                  />
                                                              </label>
                                                              {emp.pendingFiles && emp.pendingFiles.length > 0 && (
                                                                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                                      <FileText size={10} /> {emp.pendingFiles.length}
                                                                  </span>
                                                              )}
                                                          </div>
                                                      </td>
                                                      <td className="p-2 text-right">
                                                          <button onClick={() => removeEmployee(i)} className="text-slate-300 hover:text-red-500">
                                                              <Trash2 size={14} />
                                                          </button>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email</label>
                              <input 
                                className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-blue/20 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                placeholder="contato@email.com"
                                value={newClient.email}
                                onChange={e => setNewClient({...newClient, email: e.target.value})}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Valor Contrato (R$)</label>
                              <input 
                                type="number"
                                className="w-full border dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-blue/20 outline-none border-gray-300 bg-white dark:bg-slate-700 dark:text-white" 
                                placeholder="0.00"
                                value={newClient.value}
                                onChange={e => setNewClient({...newClient, value: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      {/* Drive Info */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-brand-blue flex items-start gap-2 border border-blue-100 dark:border-blue-900/50">
                          <FolderOpen size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold block mb-1">Estrutura de Arquivos Automática</span>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Pasta: <strong>{newClient.company || 'Nova Entrada'}</strong></li>
                                <li>Participantes: <strong>{importedEmployees.length} subpastas serão criadas.</strong></li>
                            </ul>
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700">
                      <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium">Cancelar</button>
                      <button onClick={handleSaveClient} className="px-6 py-2 bg-brand-blue text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
                          <Save size={16} /> Salvar Cadastro
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};