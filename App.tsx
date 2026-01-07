import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModuleCertificates } from './components/ModuleCertificates';
import { ModuleAdmin } from './components/ModuleAdmin';
import { ModuleContracts } from './components/ModuleContracts'; 
import { ModuleTemplates } from './components/ModuleTemplates';
import { ModuleAttendance } from './components/ModuleAttendance';
import { DashboardHome } from './components/DashboardHome';
import { AppModule } from './types';
import { Loader2, Menu, MessageSquare } from 'lucide-react';
import { initStorage, getSettings } from './utils/storage';

const PlaceholderModule = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 animate-fade-in p-4 text-center">
    <Icon size={64} className="mb-4 opacity-20" />
    <h2 className="text-2xl font-bold text-slate-400 dark:text-slate-500">{title}</h2>
    <p className="text-sm">Módulo em desenvolvimento</p>
  </div>
);

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AppModule>(AppModule.ADMIN); // Iniciando em Admin para configuração
  const [appReady, setAppReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appLogo, setAppLogo] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
      initStorage().then(() => {
          const settings = getSettings();
          if (settings && settings.logo) {
              setAppLogo(settings.logo);
          }
          setAppReady(true);
      });
  }, []);

  const toggleTheme = () => {
      setIsDarkMode(!isDarkMode);
  };

  const navigateAndCloseMenu = (m: AppModule) => {
      setActiveModule(m);
      setIsMobileMenuOpen(false);
  };

  const renderModule = () => {
    switch (activeModule) {
      case AppModule.CERTIFICATES: return <ModuleCertificates />;
      case AppModule.CONTRACTS: return <ModuleContracts />;
      case AppModule.ATTENDANCE: return <ModuleAttendance />;
      case AppModule.TEMPLATES: return <ModuleTemplates />;
      case AppModule.ADMIN: return <ModuleAdmin onLogoUpdate={setAppLogo} />; // Passando setAppLogo
      case AppModule.WHATSAPP: return <PlaceholderModule title="Automação WhatsApp" icon={MessageSquare} />;
      default: return <ModuleCertificates />;
    }
  };

  if (!appReady) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#172B4D] flex-col gap-4">
              <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-white font-bold tracking-widest text-xs uppercase">Inicializando Slidex Web...</p>
          </div>
      );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
          
          {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
                onClick={() => setIsMobileMenuOpen(false)}
              />
          )}

          <Sidebar 
            activeModule={activeModule} 
            onNavigate={navigateAndCloseMenu} 
            logo={appLogo}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isOpen={isMobileMenuOpen}
          />
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-slate-700 dark:text-slate-200"
          >
              <Menu size={24} />
          </button>
          
          <main className="flex-1 md:ml-64 h-full flex flex-col relative bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden w-full">
            {renderModule()}
          </main>
        </div>
    </div>
  );
};

export default App;