
import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, Calendar, Search, Bell, Bot, ArrowRight, Activity, FileText, Clock, AlertTriangle, CheckSquare, X, Mail, Phone, Filter, PieChart, Wallet } from 'lucide-react';
import { getClients, getSettings, getTasks, saveClient, getTrainings } from '../utils/storage';
import { Client, SystemSettings, Task, Training } from '../types';

export const DashboardHome: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [notifications, setNotifications] = useState<Client[]>([]);
  
  // Filters
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1); // 1-12
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<Client | null>(null);
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
      setClients(getClients());
      setTasks(getTasks());
      setSettings(getSettings());
      setTrainings(getTrainings());
  };

  // Notification Check Logic
  useEffect(() => {
      const checkSchedule = () => {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();

          const activeEvents = clients.filter(c => {
              if (c.startDate === todayStr && c.startTime) {
                  const [h, m] = c.startTime.split(':').map(Number);
                  const eventTime = h * 60 + m;
                  const currentTime = currentHour * 60 + currentMin;
                  return (currentTime >= eventTime - 15 && currentTime <= eventTime + 60);
              }
              return false;
          });

          const overduePayments = clients.filter(c => 
             c.type === 'student' && 
             c.paymentStatus !== 'paid' && 
             c.paymentDate && 
             new Date(c.paymentDate) < now
          );

          setNotifications([...activeEvents, ...overduePayments]);
      };

      checkSchedule();
      const interval = setInterval(checkSchedule, 60000); 
      return () => clearInterval(interval);
  }, [clients]);

  const handleMarkPaid = (client: Client, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = { ...client, paymentStatus: 'paid' as const };
      saveClient(updated);
      refreshData();
      if(selectedItem && selectedItem.id === client.id) setSelectedItem(updated);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Financial Calculations
  const filteredStudents = clients.filter(c => {
      if (c.type !== 'student') return false;
      if (!c.paymentDate) return false;
      const d = new Date(c.paymentDate);
      return d.getMonth() + 1 === Number(monthFilter) && d.getFullYear() === Number(yearFilter);
  });

  const totalPending = filteredStudents
    .filter(s => s.paymentStatus !== 'paid')
    .reduce((acc, s) => acc + (s.value || 0), 0);

  const totalMonthlyFees = filteredStudents
    .filter(s => s.planType === 'monthly')
    .reduce((acc, s) => acc + (s.value || 0), 0);

  // Calculate Registration Fees (Requires mapping training price)
  const newEnrollments = clients.filter(c => {
      if (c.type !== 'student' || !c.startDate) return false;
      const d = new Date(c.startDate);
      return d.getMonth() + 1 === Number(monthFilter) && d.getFullYear() === Number(yearFilter);
  });

  const totalRegistrationFees = newEnrollments.reduce((acc, s) => {
      const training = trainings.find(t => t.name === s.trainingName);
      if (training && training.hasRegistrationFee) {
          return acc + (training.registrationFeeValue || 0);
      }
      return acc;
  }, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in pb-20 overflow-y-auto h-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="pl-10 md:pl-0"> {/* Padding for hamburger menu */}
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Dashboard Financeiro</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Visão geral de receitas e pendências.</p>
        </div>
        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className="flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm flex-1 md:flex-none">
              <select 
                className="p-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none bg-transparent flex-1 md:flex-none"
                value={monthFilter}
                onChange={(e) => setMonthFilter(Number(e.target.value))}
              >
                  {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>
                  ))}
              </select>
              <div className="w-px bg-gray-200 dark:bg-slate-700"></div>
              <select 
                className="p-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none bg-transparent"
                value={yearFilter}
                onChange={(e) => setYearFilter(Number(e.target.value))}
              >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
              </select>
          </div>
          <button className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-orange relative">
            <Bell size={20} />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
        </div>
      </div>

      {/* Notifications Area */}
      {notifications.length > 0 && (
          <div className="space-y-2">
              {notifications.map((note, i) => (
                  <div key={i} className={`border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm animate-in slide-in-from-top-2 gap-3 ${note.paymentStatus && note.paymentStatus !== 'paid' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'}`}>
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${note.paymentStatus ? 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200' : 'bg-orange-100 text-brand-orange dark:bg-orange-800 dark:text-orange-200'}`}>
                              {note.paymentStatus ? <DollarSign size={20} /> : <Clock size={20} />}
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                                  {note.paymentStatus ? 'Pagamento Atrasado' : 'Evento Agora'}
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  {note.paymentStatus 
                                    ? `Aluno: ${note.name} - Venceu em ${new Date(note.paymentDate!).toLocaleDateString('pt-BR')}`
                                    : `${note.company} • Início às ${note.startTime}`
                                  }
                              </p>
                          </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                          {note.paymentStatus && note.paymentStatus !== 'paid' && (
                              <button 
                                onClick={(e) => handleMarkPaid(note, e)}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold transition-colors w-full sm:w-auto"
                              >
                                  Marcar Pago
                              </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1: Pending Values */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <AlertTriangle size={64} className="text-red-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2 uppercase text-xs tracking-wider">
                      <Clock size={16}/> Pendentes (Vencidos)
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalPending)}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Valores a receber neste mês.</p>
              </div>
          </div>

          {/* Card 2: Registration Fees */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet size={64} className="text-blue-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-2 uppercase text-xs tracking-wider">
                      <FileText size={16}/> Taxas de Matrícula
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalRegistrationFees)}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{newEnrollments.length} novas matrículas.</p>
              </div>
          </div>

          {/* Card 3: Monthly Fees */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-green-100 dark:border-green-900/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <PieChart size={64} className="text-green-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-2 uppercase text-xs tracking-wider">
                      <DollarSign size={16}/> Mensalidades
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalMonthlyFees)}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total de planos mensais ativos.</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Activity size={20} className="text-brand-blue"/> Atividades Recentes
             </h3>
          </div>
          
          <div className="space-y-4">
             {tasks.slice(0, 3).map(task => (
                 <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                     <div className={`w-3 h-3 rounded-full flex-shrink-0 ${task.completed ? 'bg-green-400' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                     <span className={`text-sm flex-1 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>{task.title}</span>
                     <span className="text-[10px] uppercase bg-white dark:bg-slate-800 dark:text-slate-300 border dark:border-slate-600 px-1.5 rounded">{task.priority}</span>
                 </div>
             ))}

             {clients.slice(0, 3).map(client => (
                 <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-slate-600 transition-colors cursor-pointer group">
                    <div className={`w-10 h-10 rounded-full ${client.avatarColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                        {client.company.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">
                            {client.company}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {client.type === 'student' ? 'Novo Aluno Matriculado' : 'Cliente Corporativo Atualizado'}
                        </p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">Hoje</span>
                 </div>
             ))}
          </div>
        </div>

        {/* AI Assistant Card */}
        <div className="bg-gradient-to-br from-brand-dark to-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange opacity-10 rounded-full transform translate-x-10 -translate-y-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue opacity-10 rounded-full transform -translate-x-5 translate-y-5 blur-xl"></div>
          
          <div className="relative z-10">
             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                 <Bot size={28} className="text-brand-orange" />
             </div>
             <h3 className="font-bold text-xl mb-2">Assistente Inteligente</h3>
             <p className="text-slate-300 text-sm mb-6 leading-relaxed">
               Posso identificar quais alunos estão com mensalidade atrasada ou agendar lembretes para suas tarefas.
             </p>
          </div>

          <div className="relative z-10 space-y-3">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors border border-white/5 flex items-center justify-between px-4 group">
              <span>Listar Inadimplentes</span>
              <ArrowRight size={16} className="text-brand-orange group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full py-3 bg-brand-blue hover:bg-blue-600 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/50">
              Iniciar Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
