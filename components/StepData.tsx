
import React, { useEffect, useState, useMemo } from 'react';
import { DataRow } from '../types';
import { ArrowRight, Search, CheckSquare, Square } from 'lucide-react';

interface StepDataProps {
  data: DataRow[];
  headers: string[];
  onConfirm: (selectedData: DataRow[]) => void;
  onBack: () => void;
}

export const StepData: React.FC<StepDataProps> = ({ data, headers, onConfirm, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State (Indices based on original data)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Initialize selection with all items
  useEffect(() => {
    setSelectedIndices(new Set(data.map((_, i) => i)));
  }, [data]);

  // Filter Logic
  const filteredIndices = useMemo(() => {
    return data.map((row, index) => {
        // Search across all values in the row
        const rowString = Object.values(row).join(' ').toLowerCase();
        if (rowString.includes(searchTerm.toLowerCase())) return index;
        return -1;
    }).filter(i => i !== -1);
  }, [data, searchTerm]);

  // Checkbox Handlers
  const toggleSelect = (index: number) => {
      const newSet = new Set(selectedIndices);
      if (newSet.has(index)) {
          newSet.delete(index);
      } else {
          newSet.add(index);
      }
      setSelectedIndices(newSet);
  };

  const toggleSelectAll = () => {
      const allFilteredSelected = filteredIndices.every(i => selectedIndices.has(i));
      const newSet = new Set(selectedIndices);
      
      if (allFilteredSelected) {
          // Deselect visible
          filteredIndices.forEach(i => newSet.delete(i));
      } else {
          // Select visible
          filteredIndices.forEach(i => newSet.add(i));
      }
      setSelectedIndices(newSet);
  };

  const handleConfirm = () => {
      // Filter original data based on selected indices
      const selectedData = data.filter((_, i) => selectedIndices.has(i));
      if (selectedData.length === 0) {
          alert("Selecione pelo menos um registro para continuar.");
          return;
      }
      onConfirm(selectedData);
  };

  const allVisibleSelected = filteredIndices.length > 0 && filteredIndices.every(i => selectedIndices.has(i));
  const selectedCount = selectedIndices.size;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-3 md:p-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Top Section (Fixed Height Elements) */}
      <div className="flex-shrink-0 flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Revisão e Seleção</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Selecione os registros que deseja processar ({selectedCount} selecionados).</p>
            </div>
            <div className="flex gap-3">
                <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    Voltar
                </button>
                <button 
                    onClick={handleConfirm}
                    className="flex items-center gap-2 bg-brand-blue hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-all text-sm"
                >
                    Confirmar Seleção <ArrowRight size={16} />
                </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input 
                  type="text" 
                  placeholder="Pesquisar aluno, curso ou valor..." 
                  className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg outline-none focus:border-brand-blue focus:ring-1 focus:ring-blue-100 bg-white dark:bg-slate-700 dark:text-white transition-all text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* Data Table - Fills Remaining Space */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative h-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-3 w-10 text-center bg-gray-50 dark:bg-slate-700">
                    <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-500 hover:text-brand-blue">
                        {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                </th>
                <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider w-12 text-center bg-gray-50 dark:bg-slate-700">#</th>
                {headers.map((h) => (
                  <th key={h} className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap min-w-[120px] bg-gray-50 dark:bg-slate-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredIndices.slice(0, 100).map((originalIndex) => (
                <tr 
                    key={originalIndex} 
                    className={`transition-colors group cursor-pointer ${selectedIndices.has(originalIndex) ? 'bg-blue-50/30 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                    onClick={() => toggleSelect(originalIndex)}
                >
                  <td className="p-2.5 text-center">
                       <div className={`flex items-center justify-center ${selectedIndices.has(originalIndex) ? 'text-brand-blue' : 'text-slate-300 dark:text-slate-600'}`}>
                           {selectedIndices.has(originalIndex) ? <CheckSquare size={16} /> : <Square size={16} />}
                       </div>
                  </td>
                  <td className="p-2.5 text-center text-slate-400 text-xs font-mono group-hover:text-brand-blue">{originalIndex + 1}</td>
                  {headers.map((h) => (
                    <td key={`${originalIndex}-${h}`} className="p-2.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                      {data[originalIndex][h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 p-2 border-t border-gray-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 text-center font-medium flex-shrink-0 z-30 relative">
            Exibindo {Math.min(filteredIndices.length, 100)} de {filteredIndices.length} registros filtrados.
        </div>
      </div>
    </div>
  );
};
