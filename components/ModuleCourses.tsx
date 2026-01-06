
import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Plus, Calendar, DollarSign, User, AlertTriangle, CheckCircle2, MoreVertical, X, Save, Clock, CreditCard, Receipt, FileSignature, Paperclip, FileText, LayoutList, PieChart, MapPin } from 'lucide-react';
import { Client, Training } from '../types';
import { getClients, saveClient, getTrainings, uploadFileMock, createFolder } from '../utils/storage';
import { formatCPF, formatRG, formatCEP, formatPhone } from '../utils/fileProcessor';

export const ModuleCourses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'enrollment' | 'finance'>('enrollment');
  const [students, setStudents] = useState<Client[]>([]);
  const [courses, setCourses] = useState<Training[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Client>>({});
  const [selectedCourse, setSelectedCourse] = useState<Training | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allClients = getClients();
    setStudents(allClients.filter(c => c.type === 'student'));
    setCourses(getTrainings());
  };

  const handleCourseSelect = (courseName: string) => {
      const course = courses.find(c => c.name === courseName);
      setSelectedCourse(course || null);
      if (course) {
          setNewStudent(prev => ({
              ...prev,
              trainingName: course.name,
              value: course.price, 
              startDate: new Date().toISOString().split('T')[0]
          }));
      }
  };

  const handleAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files) {
          setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const handleSaveStudent = () => {
      if(!newStudent.name || !newStudent.trainingName || !newStudent.rg) {
          alert("Nome, RG e Curso são obrigatórios");
          return;
      }

      let nextPayDate = newStudent.paymentDate;
      if (!nextPayDate && newStudent.startDate) {
          const d = new Date(newStudent.startDate);
          d.setDate(d.getDate() + 30);
          nextPayDate = d.toISOString().split('T')[0];
      }

      const student: Client = {
          id: newStudent.id || `st_${Date.now()}`,
          name: newStudent.name,
          company: newStudent.name,
          rg: newStudent.rg,
          cnpj: newStudent.cnpj || '', 
          birthDate: newStudent.birthDate || '', // Added
          email: newStudent.email || '',
          phone: newStudent.phone || '',
          
          // Address Fields
          address: newStudent.address || '',
          city: newStudent.city || '',
          state: newStudent.state || '',
          zipCode: newStudent.zipCode || '',

          type: 'student',
          status: 'active',
          value: newStudent.value || 0,
          trainingName: newStudent.trainingName,
          startDate: newStudent.startDate,
          paymentDate: nextPayDate,
          paymentStatus: newStudent.paymentStatus || 'pending',
          hasPaidRegistration: newStudent.hasPaidRegistration || false,
          planType: newStudent.planType || 'monthly',
          avatarColor: 'bg-indigo-500',
          lastContact: new Date().toISOString(),
          tags: ['Aluno', newStudent.trainingName, newStudent.planType === 'monthly' ? 'Mensalista' : 'À Vista']
      };

      if(attachments.length > 0) {
          let folderId = student.folderId;
          if(!folderId) {
              const folder = createFolder(`Docs - ${student.name}`, 'root');
              folderId = folder.id;
              student.folderId = folderId;
          }
          attachments.forEach(file => {
              uploadFileMock(file, folderId!);
          });
      }

      saveClient(student);
      refreshData();
      setShowModal(false);
      setNewStudent({});
      setSelectedCourse(null);
      setAttachments([]);
  };

  const togglePaymentStatus = (student: Client) => {
      const newStatus = student.paymentStatus === 'paid' ? 'pending' : 'paid';
      const updated = { ...student, paymentStatus: newStatus as any };
      saveClient(updated);
      refreshData();
  };

  const getPaymentStatusBadge = (status?: string, date?: string) => {
      if (status === 'paid') return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-green-200"><CheckCircle2 size={12}/> Pago</span>;
      
      const isOverdue = date && new Date(date) < new Date() && status !== 'paid';
      if (isOverdue) return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-red-200"><AlertTriangle size={12}/> Atrasado</span>;
      
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-yellow-200"><Clock size={12}/> Pendente</span>;
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Financial Stats
  const totalReceivable = filteredStudents.reduce((acc, s) => acc + (s.value || 0), 0);
  const totalPaid = filteredStudents.filter(s => s.paymentStatus === 'paid').reduce((acc, s) => acc + (s.value || 0), 0);
  const totalPending = totalReceivable - totalPaid;

  const formatAddress = (s: Client) => {
      if (!s.address) return '-';
      return `${s.address}, ${s.city || ''} - ${s.state || ''}, CEP: ${s.zipCode || ''}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in p-4 md:p-8 pb-20 overflow-y-auto transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Cursos</h2>
          <p className="text-slate-500 dark:text-slate-400">Administre alunos, matrículas e controle financeiro.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto custom-scrollbar flex-nowrap pb-2 md:pb-0">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex shadow-sm flex-shrink-0">
                <button 
                    onClick={() => setActiveTab('enrollment')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold whitespace-nowrap ${activeTab === 'enrollment' ? 'bg-brand-blue text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                >
                    <LayoutList size={16} /> Matrículas
                </button>
                <button 
                    onClick={() => setActiveTab('finance')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold whitespace-nowrap ${activeTab === 'finance' ? 'bg-brand-blue text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                >
                    <PieChart size={16} /> Financeiro
                </button>
            </div>
            {activeTab === 'enrollment' && (
                <button 
                    onClick={() => { setNewStudent({ paymentStatus: 'pending', planType: 'monthly' }); setShowModal(true); }}
                    className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0 whitespace-nowrap"
                >
                    <Plus size={20} /> Matricular Aluno
                </button>
            )}
        </div>
      </div>

      {/* List View */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex flex-col md:flex-row gap-4 justify-between items-center">
               <div className="relative flex-1 max-w-md w-full">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="Buscar aluno por nome..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                   />
               </div>
               {activeTab === 'finance' && (
                   <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                       <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded border border-green-100 dark:border-green-800 whitespace-nowrap">
                           Recebido: {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(totalPaid)}
                       </div>
                       <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-100 dark:border-red-800 whitespace-nowrap">
                           Pendente: {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(totalPending)}
                       </div>
                   </div>
               )}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <tr>
                          <th className="p-4">Aluno</th>
                          <th className="p-4">Curso / Plano</th>
                          {activeTab === 'finance' ? (
                              <>
                                <th className="p-4 text-right">Valor</th>
                                <th className="p-4 text-center">Vencimento</th>
                                <th className="p-4 text-center">Controle</th>
                              </>
                          ) : (
                              <>
                                <th className="p-4">Endereço Completo</th>
                                <th className="p-4">Próx. Vencimento</th>
                                <th className="p-4 text-right">Mensalidade</th>
                                <th className="p-4 text-right">Ações</th>
                              </>
                          )}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                      {filteredStudents.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum aluno encontrado.</td></tr>
                      ) : (
                          filteredStudents.map(student => (
                              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                                              {student.name.charAt(0)}
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{student.name}</p>
                                              <p className="text-[10px] text-slate-400 flex gap-2">
                                                  <span>CPF: {student.cnpj || '-'}</span>
                                              </p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex flex-col gap-1">
                                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-gray-200 dark:border-slate-600 w-fit">
                                              {student.trainingName}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-medium">
                                              {student.planType === 'monthly' ? 'Plano Mensal' : 'Pagamento Único'}
                                          </span>
                                      </div>
                                  </td>
                                  
                                  {activeTab === 'finance' ? (
                                      <>
                                        <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-200 text-sm font-bold">
                                            {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(student.value)}
                                        </td>
                                        <td className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">
                                            {student.paymentDate ? new Date(student.paymentDate).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => togglePaymentStatus(student)}
                                                    className={`
                                                        px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2
                                                        ${student.paymentStatus === 'paid' 
                                                            ? 'bg-green-500 text-white hover:bg-green-600' 
                                                            : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-green-500 hover:text-green-500'}
                                                    `}
                                                >
                                                    {student.paymentStatus === 'paid' ? <CheckCircle2 size={14}/> : <DollarSign size={14}/>}
                                                    {student.paymentStatus === 'paid' ? 'Pago' : 'Marcar Pago'}
                                                </button>
                                            </div>
                                        </td>
                                      </>
                                  ) : (
                                      <>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={formatAddress(student)}>
                                            {formatAddress(student)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{student.paymentDate ? new Date(student.paymentDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                                {student.hasPaidRegistration && <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle2 size={10}/> Matrícula Paga</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-200 text-sm">
                                            <div className="flex flex-col items-end gap-1">
                                                <span>{new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(student.value)}</span>
                                                <div className="opacity-80">
                                                    {getPaymentStatusBadge(student.paymentStatus, student.paymentDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    className="text-slate-400 hover:text-brand-blue p-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                                    title="Editar"
                                                    onClick={() => { setNewStudent(student); setShowModal(true); }}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                      </>
                                  )}
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><GraduationCap size={20} /> Nova Matrícula</h3>
                      <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                      
                      {/* Personal Info */}
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-gray-100 dark:border-slate-700 pb-2 mb-3">Dados do Aluno</h4>
                          <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nome Completo</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.name || ''}
                                            onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Nascimento</label>
                                        <input 
                                            type="date"
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.birthDate || ''}
                                            onChange={e => setNewStudent({...newStudent, birthDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">CPF</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.cnpj || ''}
                                            placeholder="000.000.000-00"
                                            onChange={e => setNewStudent({...newStudent, cnpj: formatCPF(e.target.value)})}
                                            maxLength={14}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-brand-orange uppercase">RG (Obrigatório)</label>
                                        <input 
                                            className="w-full border-2 border-orange-100 dark:border-orange-900/50 rounded-lg p-2.5 outline-none focus:border-brand-orange bg-orange-50/20 dark:bg-orange-900/20 dark:text-white"
                                            value={newStudent.rg || ''}
                                            placeholder="00.000.000-0"
                                            onChange={e => setNewStudent({...newStudent, rg: formatRG(e.target.value)})}
                                            maxLength={12}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.email || ''}
                                            onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Telefone</label>
                                        <input 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.phone || ''}
                                            onChange={e => setNewStudent({...newStudent, phone: formatPhone(e.target.value)})}
                                            maxLength={15}
                                        />
                                    </div>
                                </div>
                          </div>
                      </div>

                      {/* Address Info (New Section) */}
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-gray-100 dark:border-slate-700 pb-2 mb-3 flex items-center gap-1">
                              <MapPin size={14}/> Endereço
                          </h4>
                          <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">CEP</label>
                                      <input 
                                          className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                          value={newStudent.zipCode || ''}
                                          onChange={e => setNewStudent({...newStudent, zipCode: formatCEP(e.target.value)})}
                                          placeholder="00000-000"
                                          maxLength={9}
                                      />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Rua / Logradouro</label>
                                      <input 
                                          className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                          value={newStudent.address || ''}
                                          onChange={e => setNewStudent({...newStudent, address: e.target.value})}
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cidade</label>
                                      <input 
                                          className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                          value={newStudent.city || ''}
                                          onChange={e => setNewStudent({...newStudent, city: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Estado</label>
                                      <input 
                                          className="w-full border dark:border-slate-600 rounded-lg p-2.5 text-sm outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                          value={newStudent.state || ''}
                                          onChange={e => setNewStudent({...newStudent, state: e.target.value})}
                                          placeholder="UF"
                                          maxLength={2}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Attachment Section */}
                      <div className="bg-gray-50 dark:bg-slate-700/50 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4">
                          <label className="flex flex-col items-center justify-center cursor-pointer">
                              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 font-medium mb-1">
                                  <Paperclip size={18} /> Anexar Documentos
                              </div>
                              <span className="text-xs text-slate-400">RG, CPF, Comprovante de Residência (PDF/Img)</span>
                              <input type="file" multiple className="hidden" onChange={handleAttachments} />
                          </label>
                          {attachments.length > 0 && (
                              <div className="mt-3 space-y-1">
                                  {attachments.map((f, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-1.5 rounded border border-gray-200 dark:border-slate-600">
                                          <FileText size={12}/> {f.name}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Course Selection */}
                      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                           <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">Escolha do Curso</h4>
                           <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Curso</label>
                                    <select 
                                        className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                        value={newStudent.trainingName || ''}
                                        onChange={e => handleCourseSelect(e.target.value)}
                                    >
                                        <option value="">Selecione o Curso...</option>
                                        {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>

                                {selectedCourse && (
                                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded border border-gray-100 dark:border-slate-600">
                                        <div><span className="font-bold">Duração:</span> {selectedCourse.duration}</div>
                                        <div><span className="font-bold">Dias:</span> {selectedCourse.days}</div>
                                        <div><span className="font-bold">Turnos:</span> {selectedCourse.shifts?.join(', ') || 'N/A'}</div>
                                        <div><span className="font-bold text-brand-blue">Valor Base: R$ {selectedCourse.price}</span></div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data de Início</label>
                                        <input 
                                            type="date"
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.startDate || ''}
                                            onChange={e => setNewStudent({...newStudent, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Plano</label>
                                        <select 
                                            className="w-full border dark:border-slate-600 rounded-lg p-2.5 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                            value={newStudent.planType}
                                            onChange={e => setNewStudent({...newStudent, planType: e.target.value as any})}
                                        >
                                            <option value="monthly">Mensalidade Recorrente</option>
                                            <option value="single">Pagamento Único (À Vista)</option>
                                        </select>
                                    </div>
                                </div>
                           </div>
                      </div>

                      {/* Financials */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                          <h4 className="text-xs font-bold text-brand-blue uppercase mb-3 flex items-center gap-1"><Receipt size={14}/> Financeiro Inicial</h4>
                          
                          {selectedCourse?.hasRegistrationFee && (
                              <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded border border-blue-100 dark:border-slate-600">
                                  <div>
                                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Taxa de Matrícula</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Valor: R$ {selectedCourse.registrationFeeValue}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <input 
                                          type="checkbox" 
                                          id="regPaid" 
                                          className="w-4 h-4 text-brand-blue rounded"
                                          checked={newStudent.hasPaidRegistration}
                                          onChange={e => setNewStudent({...newStudent, hasPaidRegistration: e.target.checked})}
                                      />
                                      <label htmlFor="regPaid" className="text-sm font-medium dark:text-slate-300">Pago no ato</label>
                                  </div>
                              </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Valor a Cobrar (R$)</label>
                                  <input 
                                    type="number"
                                    className="w-full border dark:border-slate-600 rounded p-2 text-sm font-bold text-slate-700 dark:text-white dark:bg-slate-700"
                                    value={newStudent.value || 0}
                                    onChange={e => setNewStudent({...newStudent, value: Number(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Primeiro Vencimento</label>
                                  <input 
                                    type="date"
                                    className="w-full border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-700 dark:text-white"
                                    value={newStudent.paymentDate || ''}
                                    onChange={e => setNewStudent({...newStudent, paymentDate: e.target.value})}
                                  />
                                  <p className="text-[9px] text-slate-400 mt-1">* O sistema alertará no Dashboard ao vencer.</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-700">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg">Cancelar</button>
                      <button onClick={handleSaveStudent} className="px-6 py-2 bg-brand-blue text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                          <Save size={16}/> Confirmar Matrícula
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
