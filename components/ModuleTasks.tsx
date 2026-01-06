
import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, Flag, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Task } from '../types';
import { getTasks, saveTask, deleteTask } from '../utils/storage';

export const ModuleTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', priority: 'medium', dueDate: '' });

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const handleAddTask = () => {
    if (!newTask.title) return;
    const t: Task = {
      id: `task_${Date.now()}`,
      title: newTask.title,
      priority: newTask.priority as any,
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updated = saveTask(t);
    setTasks(updated);
    setNewTask({ title: '', priority: 'medium', dueDate: '' });
  };

  const toggleTask = (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    const updatedList = saveTask(updatedTask);
    setTasks(updatedList);
  };

  const removeTask = (id: string) => {
    const updated = deleteTask(id);
    setTasks(updated);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/50';
      case 'medium': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-900/50';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-900/50';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in p-4 md:p-8 pb-20 overflow-y-auto transition-colors">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Tarefas & Metas</h2>
        <p className="text-slate-500 dark:text-slate-400">Organize suas atividades diárias e acompanhe o progresso.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-fit transition-colors">
          <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
            <Plus size={20} className="text-brand-blue" /> Nova Tarefa
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Título</label>
              <input 
                className="w-full border dark:border-slate-600 rounded-lg p-3 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white transition-colors"
                placeholder="O que precisa ser feito?"
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Prioridade</label>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-nowrap pb-1">
                {['low', 'medium', 'high'].map(p => (
                   <button 
                    key={p}
                    onClick={() => setNewTask({...newTask, priority: p as any})}
                    className={`flex-shrink-0 flex-1 py-2 px-3 text-xs font-bold rounded border capitalize whitespace-nowrap transition-colors ${newTask.priority === p ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                   >
                     {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                   </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Data de Entrega</label>
              <input 
                type="date"
                className="w-full border dark:border-slate-600 rounded-lg p-3 outline-none focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-white transition-colors"
                value={newTask.dueDate}
                onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            <button 
              onClick={handleAddTask}
              className="w-full bg-brand-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
            >
              Adicionar Tarefa
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 border-dashed">
              <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhuma tarefa pendente.</p>
            </div>
          ) : (
            tasks.sort((a,b) => Number(a.completed) - Number(b.completed)).map(task => (
              <div 
                key={task.id} 
                className={`bg-white dark:bg-slate-800 p-4 rounded-xl border flex items-center gap-4 transition-all group ${task.completed ? 'border-gray-100 dark:border-slate-700 opacity-60' : 'border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md'}`}
              >
                <button 
                  onClick={() => toggleTask(task)}
                  className={`flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-slate-300 dark:text-slate-500 hover:text-brand-blue'}`}
                >
                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-slate-800 dark:text-white truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} uppercase`}>
                      {task.priority === 'low' ? 'Baixa' : task.priority === 'medium' ? 'Média' : 'Alta'}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 whitespace-nowrap">
                        <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => removeTask(task.id)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
