
import React from 'react';
import { 
  FileBadge, Building2, FileSignature, Moon, Sun, LayoutTemplate, ClipboardList
} from 'lucide-react';
import { AppModule } from '../types';

interface SidebarProps {
  activeModule: AppModule;
  onNavigate: (module: AppModule) => void;
  logo?: string;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  isOpen?: boolean;
}

const menuItems = [
  { type: 'divider', label: 'MALA DIRETA' },
  { id: AppModule.CONTRACTS, label: 'Gerador de Contratos', icon: FileSignature },
  { id: AppModule.CERTIFICATES, label: 'Certificados & Docs', icon: FileBadge }, 
  { id: AppModule.ATTENDANCE, label: 'Lista de Presença', icon: ClipboardList },
  { id: AppModule.TEMPLATES, label: 'Biblioteca de Modelos', icon: LayoutTemplate },
  { type: 'divider', label: 'CONFIGURAÇÃO' },
  { id: AppModule.ADMIN, label: 'Configurações', icon: Building2 },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onNavigate, logo, isDarkMode, toggleTheme, isOpen = false }) => {
  return (
    <aside className={`
        w-64 bg-brand-dark dark:bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-700/50 flex items-center gap-3 min-h-[88px]">
        {logo ? (
            <div className="w-full h-10 flex items-center justify-start">
                <img src={logo} alt="Company Logo" className="h-full max-w-full object-contain" />
            </div>
        ) : (
            <>
                <div className="w-8 h-8 bg-gradient-to-br from-brand-orange to-brand-purple rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  A
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg leading-tight">Admin<span className="text-brand-orange">AI</span></h1>
                  <p className="text-xs text-slate-500">Enterprise System</p>
                </div>
            </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') {
              return (
                  <div key={idx} className="px-3 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {item.label}
                  </div>
              );
          }

          const Icon = item.icon as any;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => item.id && onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-brand-blue text-white shadow-lg shadow-blue-900/50' 
                  : 'hover:bg-slate-800 hover:text-white dark:hover:bg-slate-800'}
              `}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 space-y-3">
        {toggleTheme && (
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
                <span className="flex items-center gap-2">
                    {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
                    {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                </span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-brand-blue' : 'bg-slate-600'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{left: isDarkMode ? '18px' : '2px'}}></div>
                </div>
            </button>
        )}

        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white">
            US
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-white font-medium truncate">Usuário Admin</p>
            <p className="text-xs text-slate-500 truncate">admin@empresa.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
