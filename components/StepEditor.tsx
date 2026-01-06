
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ArrowRight, ArrowLeft, ZoomIn, ZoomOut, X, RefreshCw, ChevronLeft, ChevronRight, LayoutList, Sparkles } from 'lucide-react';
import { DataRow, PresentationData, SlideElement, FieldMapping } from '../types';
import { getSlideElements, ensureFontIsLoaded, findBestMatch } from '../utils/fileProcessor';

interface StepEditorProps {
  headers: string[];
  data: DataRow[];
  presentation: PresentationData | null;
  mapping: FieldMapping;
  onMappingChange: (mapping: FieldMapping) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepEditor: React.FC<StepEditorProps> = ({ headers, presentation, mapping, onMappingChange, onNext, onBack }) => {
  const [elements, setElements] = useState<SlideElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto');
  const [manualZoom, setManualZoom] = useState(1);
  const [scale, setScale] = useState(1);
  const [slideIndex, setSlideIndex] = useState(1);
  const [showMappingPanel, setShowMappingPanel] = useState(true);
  const [detectedFields, setDetectedFields] = useState<Set<string>>(new Set());
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  const emuToPx = (emu: number) => (emu / 914400) * 96;
  const BASE_WIDTH_PX = presentation ? emuToPx(presentation.width) : 1123;
  const BASE_HEIGHT_PX = presentation ? emuToPx(presentation.height) : 793;

  useEffect(() => {
    if (presentation) {
        setLoading(true);
        getSlideElements(presentation, slideIndex)
            .then(elems => {
                setElements(elems);
                setLoading(false);
                scanFields(elems);
                elems.forEach(el => el.type === 'text' && el.fontFamily && ensureFontIsLoaded(el.fontFamily));
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }
  }, [presentation, slideIndex]);

  useLayoutEffect(() => {
    if (!presentation || !containerWrapperRef.current) return;
    
    const handleResize = () => {
      const wrapper = containerWrapperRef.current;
      if (!wrapper) return;

      const { width: pW, height: pH } = wrapper.getBoundingClientRect();
      const padding = 60; 

      if (zoomMode === 'manual') {
        setScale(manualZoom);
      } else {
        const sX = (pW - padding) / BASE_WIDTH_PX;
        const sY = (pH - padding) / BASE_HEIGHT_PX;
        setScale(Math.min(sX, sY, 1.5)); 
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerWrapperRef.current);
    return () => observer.disconnect();
  }, [presentation, zoomMode, manualZoom, BASE_WIDTH_PX, BASE_HEIGHT_PX]);

  const scanFields = (elems: SlideElement[]) => {
    const found = new Set<string>();
    const newMapping: FieldMapping = { ...mapping };
    let hasUpdates = false;

    elems.forEach(el => {
        if (el.type === 'text' && el.text) {
            const matches = el.text.match(/\{\{(.*?)\}\}/g);
            if (matches) {
                matches.forEach((m: string) => {
                    const clean = m.replace(/[{}]/g, '');
                    found.add(clean);
                    
                    if (!newMapping[clean]) {
                        const bestMatch = findBestMatch(clean, headers);
                        if (bestMatch) {
                            newMapping[clean] = bestMatch;
                            hasUpdates = true;
                        }
                    }
                });
            }
        }
    });

    setDetectedFields(found);
    if (hasUpdates) onMappingChange(newMapping);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
      {/* Google-Style Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-6">
            <button onClick={onBack} className="text-slate-500 hover:text-brand-blue dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-2 text-sm font-bold transition-colors">
                <ArrowLeft size={18} /> Voltar
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
                <button onClick={() => { setZoomMode('manual'); setManualZoom(z => Math.max(z - 0.1, 0.1)); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"><ZoomOut size={16}/></button>
                <span className="text-[11px] font-black w-12 text-center select-none text-slate-500 dark:text-slate-400">{Math.round(scale * 100)}%</span>
                <button onClick={() => { setZoomMode('manual'); setManualZoom(z => Math.min(z + 0.1, 3.0)); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"><ZoomIn size={16}/></button>
                <button onClick={() => setZoomMode('auto')} className={`p-1.5 rounded-lg ml-1 text-[10px] px-3 font-black uppercase tracking-widest ${zoomMode === 'auto' ? 'bg-brand-blue text-white shadow-md' : 'hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>Auto</button>
            </div>
            {presentation && presentation.slidesCount > 1 && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 px-4 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700">
                    <button onClick={() => setSlideIndex(s => Math.max(1, s-1))} disabled={slideIndex === 1} className="hover:text-brand-blue disabled:opacity-30 transition-colors"><ChevronLeft size={18}/></button>
                    <span className="min-w-[50px] text-center text-slate-600 dark:text-slate-300">Página {slideIndex} / {presentation.slidesCount}</span>
                    <button onClick={() => setSlideIndex(s => Math.min(presentation.slidesCount, s+1))} disabled={slideIndex === presentation.slidesCount} className="hover:text-brand-blue disabled:opacity-30 transition-colors"><ChevronRight size={18}/></button>
                </div>
            )}
        </div>
        <button onClick={onNext} className="bg-brand-orange text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-orange-200 dark:shadow-none hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-3">
            CONCLUIR MAPEAMENTO <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Workspace Centralizada */}
        <div ref={containerWrapperRef} className="flex-1 flex items-center justify-center p-12 bg-slate-200/50 dark:bg-slate-900/50 overflow-hidden relative">
            <div 
                ref={slideRef}
                className="bg-white shadow-[0_25px_60px_rgba(0,0,0,0.18)] relative border border-gray-300 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-500"
                style={{
                    width: `${BASE_WIDTH_PX}px`,
                    height: `${BASE_HEIGHT_PX}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    containerType: 'size',
                    flexShrink: 0
                }}
            >
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-20 rounded-lg">
                         <div className="flex flex-col items-center">
                            <RefreshCw className="animate-spin text-brand-blue mb-4" size={40}/>
                            <span className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Renderizando...</span>
                         </div>
                    </div>
                ) : (
                    elements.map((el) => {
                        if (el.type === 'image' && el.src) {
                            return (
                                <img 
                                    key={el.id} 
                                    src={el.src} 
                                    className="absolute pointer-events-none select-none" 
                                    style={{ 
                                        left: `${el.x}%`, 
                                        top: `${el.y}%`, 
                                        width: `${el.w}%`, 
                                        height: `${el.h}%`, 
                                        zIndex: 1, 
                                        objectFit: 'fill' 
                                    }} 
                                />
                            );
                        }
                        if (el.type === 'text') {
                            const slideHPts = (presentation?.height || 7560000) / 12700;
                            const fsPct = ((el.fontSize || 12) / slideHPts) * 100;
                            
                            return (
                                <div
                                    key={el.id}
                                    className="absolute hover:ring-2 hover:ring-brand-blue/40 transition-all flex flex-col overflow-hidden whitespace-pre-wrap break-words select-none pointer-events-none p-0.5"
                                    style={{
                                        left: `${el.x}%`, 
                                        top: `${el.y}%`, 
                                        width: `${el.w}%`, 
                                        height: `${el.h}%`,
                                        justifyContent: 'flex-start',
                                        fontSize: `${fsPct}cqh`, 
                                        fontWeight: el.bold ? 'bold' : 'normal',
                                        fontStyle: el.italic ? 'italic' : 'normal',
                                        color: el.color || '#1a202c',
                                        textAlign: el.align || 'left',
                                        fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : 'Arial, sans-serif',
                                        lineHeight: 1.15,
                                        zIndex: 10,
                                    }}
                                >
                                    {el.text}
                                </div>
                            );
                        }
                        return null;
                    })
                )}
            </div>
        </div>

        {/* Painel Lateral à la Google Docs */}
        {showMappingPanel && (
            <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-300">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Sparkles size={14} className="text-brand-orange"/> Mapeamento Inteligente
                    </h3>
                    <button onClick={() => setShowMappingPanel(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                    {Array.from(detectedFields).length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">Nenhum marcador {'{{...}}'} detectado nesta página. Insira variáveis no arquivo original para habilitar o mapeamento.</p>
                        </div>
                    ) : (
                        Array.from(detectedFields).map((field: string) => (
                            <div key={field} className="space-y-2 animate-fade-in group">
                                <div className="flex items-center justify-between">
                                    <code className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 transition-all group-hover:border-brand-blue">
                                        {`{{${field}}}`}
                                    </code>
                                    {mapping[field] && (
                                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[8px] text-white">✓</div>
                                    )}
                                </div>
                                <div className="relative">
                                    <select 
                                        className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl p-3 outline-none dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all shadow-sm appearance-none cursor-pointer"
                                        value={mapping[field] || ""}
                                        onChange={(e) => onMappingChange({...mapping, [field]: e.target.value})}
                                    >
                                        <option value="">-- Não vinculado --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                                        <LayoutList size={14} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">As alterações nos valores só serão aplicadas durante a exportação final. O preview mostra apenas o template original.</p>
                </div>
            </div>
        )}
      </div>
      
      {!showMappingPanel && (
          <button 
            onClick={() => setShowMappingPanel(true)}
            className="absolute top-1/2 -right-4 translate-y-[-50%] bg-white dark:bg-slate-800 text-brand-blue p-4 pr-6 rounded-l-full shadow-2xl hover:pr-8 transition-all z-50 border border-r-0 border-gray-200 dark:border-slate-700"
            title="Abrir Painel"
          >
              <LayoutList size={24} />
          </button>
      )}
    </div>
  );
};
