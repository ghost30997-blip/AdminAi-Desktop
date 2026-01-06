
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModuleCertificates } from './components/ModuleCertificates';
import { ModuleAdmin } from './components/ModuleAdmin';
import { ModuleContracts } from './components/ModuleContracts'; 
import { ModuleTemplates } from './components/ModuleTemplates';
import { ModuleAttendance } from './components/ModuleAttendance';
import { AppModule } from './types';
import { Loader2, Menu, MessageSquare, Monitor } from 'lucide-react';
import { initStorage, getSettings } from './utils/storage';

const PlaceholderModule = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 animate-fade-in p-4 text-center">
    <Icon size={64} className="mb-4 opacity-20" />
    <h2 className="text-2xl font-bold text-slate-400 dark:text-slate-500">{title}</h2>
    <p className="text-sm">Módulo em desenvolvimento</p>
  </div>
);

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AppModule>(AppModule.CONTRACTS);
  const [appReady, setAppReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appLogo, setAppLogo] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
      // Verifica se está rodando no Electron
      setIsElectron(navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);

      initStorage().then(() => {
          const settings = getSettings();
          if (settings && settings.logo) {
              setAppLogo(settings.logo);
          }
          setAppReady(true);
      });
  }, []);

  useEffect(() => {
      const settings = getSettings();
      if(settings) setAppLogo(settings.logo);
  }, [activeModule]);

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
      case AppModule.ADMIN: return <ModuleAdmin />;
      case AppModule.WHATSAPP: return <PlaceholderModule title="Automação WhatsApp" icon={MessageSquare} />;
      default: return <ModuleContracts />;
    }
  };

  if (!appReady) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4">
              <Loader2 className="animate-spin text-brand-blue" size={40} />
              <p className="text-slate-500 font-bold">Iniciando Slidex Desktop...</p>
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
            {/* Desktop Badge */}
            {isElectron && (
                <div className="absolute top-4 right-4 z-50 pointer-events-none opacity-50 flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm">
                    <Monitor size={10} /> Windows Client
                </div>
            )}
            {renderModule()}
          </main>
        </div>
    </div>
  );
};

export default App;
