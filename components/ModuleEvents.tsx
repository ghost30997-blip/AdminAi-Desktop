
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Client } from '../types';
import { getClients } from '../utils/storage';

export const ModuleEvents: React.FC = () => {
  const [events, setEvents] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'agenda' | 'month'>('agenda');

  useEffect(() => {
    // Filter clients that have startDate
    const allClients = getClients();
    const withDates = allClients.filter(c => c.startDate);
    // Sort by date/time
    withDates.sort((a, b) => {
        const da = new Date(`${a.startDate}T${a.startTime || '00:00'}`);
        const db = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
        return da.getTime() - db.getTime();
    });
    setEvents(withDates);
  }, []);

  const formatDate = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00'); // Prevent timezone issues for display
      return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' });
  };

  const isToday = (dateStr: string) => {
      const today = new Date().toISOString().split('T')[0];
      return dateStr === today;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in p-4 md:p-8 pb-20 overflow-y-auto transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Agenda & Eventos</h2>
          <p className="text-slate-500 dark:text-slate-400">Cronograma de treinamentos e visitas técnicas.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto flex-nowrap pb-2 md:pb-0">
            <button 
                onClick={() => setView('agenda')} 
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${view === 'agenda' ? 'bg-brand-blue text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'}`}
            >
                Lista Agenda
            </button>
            <button 
                onClick={() => setView('month')} 
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${view === 'month' ? 'bg-brand-blue text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'}`}
            >
                Mês
            </button>
        </div>
      </div>

      {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-400">
              <CalendarIcon size={48} className="mb-4 opacity-20" />
              <p>Nenhum agendamento encontrado.</p>
              <p className="text-xs mt-2">Cadastre um cliente com Data de Início no CRM.</p>
          </div>
      ) : (
          <div className="space-y-6">
              {events.map((evt, idx) => {
                  const isFuture = new Date(evt.startDate!) >= new Date(new Date().setHours(0,0,0,0));
                  if (!isFuture && view === 'agenda') return null; // Hide past events in agenda view

                  return (
                      <div key={evt.id} className="flex gap-4 group">
                          {/* Date Column */}
                          <div className="w-24 flex-shrink-0 flex flex-col items-center pt-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${isToday(evt.startDate!) ? 'text-brand-orange' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {new Date(evt.startDate! + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                              </span>
                              <span className={`text-3xl font-bold ${isToday(evt.startDate!) ? 'text-brand-orange' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {new Date(evt.startDate! + 'T12:00:00').getDate()}
                              </span>
                              {isToday(evt.startDate!) && <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-brand-orange px-2 py-0.5 rounded-full mt-1">HOJE</span>}
                          </div>

                          {/* Event Card */}
                          <div className={`flex-1 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-all relative overflow-hidden ${isToday(evt.startDate!) ? 'border-l-4 border-l-brand-orange' : ''}`}>
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                  <div>
                                      <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{evt.trainingName || 'Visita Técnica / Reunião'}</h3>
                                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                          <Users size={16} />
                                          <span className="font-medium">{evt.company}</span>
                                          {evt.type === 'individual' && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">Individual</span>}
                                      </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                      <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
                                          <Clock size={16} className="text-brand-blue dark:text-blue-400" />
                                          {evt.startTime || '08:00'}
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-4 md:gap-6 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                                   <div className="flex items-center gap-2 whitespace-nowrap">
                                       <MapPin size={16} className="text-slate-400" />
                                       <span>{evt.status === 'closed' ? 'Confirmado' : 'Aguardando Confirmação'}</span>
                                   </div>
                                   {evt.employees && evt.employees.length > 0 && (
                                       <div className="flex items-center gap-2 whitespace-nowrap">
                                           <Users size={16} className="text-slate-400" />
                                           <span>{evt.employees.length} Participantes</span>
                                       </div>
                                   )}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};
