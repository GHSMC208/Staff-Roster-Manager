import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WardInfo, WardCategory } from '../types';
import { Search, ChevronDown, Check, Building2, X, Filter } from 'lucide-react';

interface WardSearchSelectorProps {
  wards: WardInfo[];
  currentWardId?: string;
  onSelectWard: (wardId: string) => void;
  className?: string;
  compact?: boolean;
}

export const WardSearchSelector: React.FC<WardSearchSelectorProps> = ({
  wards,
  currentWardId,
  onSelectWard,
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | WardCategory>('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Active ward
  const activeWard = useMemo(() => {
    return wards.find(w => w.id === currentWardId) || wards[0];
  }, [wards, currentWardId]);

  // Categories available
  const availableCategories = useMemo(() => {
    const cats = new Set<WardCategory>();
    wards.forEach(w => {
      if (w.category) cats.add(w.category);
    });
    return Array.from(cats);
  }, [wards]);

  // Filtered wards
  const filteredWards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return wards.filter(w => {
      const matchCat = selectedCategory === 'ALL' || w.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;

      const codeMatch = w.code?.toLowerCase().includes(q);
      const nameMatch = w.name?.toLowerCase().includes(q);
      const descMatch = w.description?.toLowerCase().includes(q);
      const catMatch = w.category?.toLowerCase().includes(q);
      const supervisorMatch = w.supervisorName?.toLowerCase().includes(q);

      return codeMatch || nameMatch || descMatch || catMatch || supervisorMatch;
    });
  }, [wards, searchQuery, selectedCategory]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setHighlightedIndex(0);
    } else {
      setSearchQuery('');
      setSelectedCategory('ALL');
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredWards.length - 1));
      // Scroll into view
      scrollHighlightedIntoView(Math.min(highlightedIndex + 1, filteredWards.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
      scrollHighlightedIntoView(Math.max(highlightedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredWards[highlightedIndex]) {
        handleSelect(filteredWards[highlightedIndex].id);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-ward-item]');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (wardId: string) => {
    onSelectWard(wardId);
    setIsOpen(false);
  };

  // Helper for cleaner display of ward title
  const formatWardLabel = (w?: WardInfo) => {
    if (!w) return 'Select Ward / Unit';
    const code = w.code?.trim();
    const name = w.name?.trim();
    if (!code || code.toLowerCase() === name.toLowerCase()) {
      return name;
    }
    if (name.startsWith(code)) {
      return name;
    }
    return `${code} — ${name}`;
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100/90 text-blue-900 border border-blue-200/90 hover:border-blue-300 rounded-xl font-black text-xs transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isOpen ? 'ring-2 ring-blue-500/40 border-blue-400 bg-blue-100/70' : ''
        }`}
        title="Search and select hospital ward / unit"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="p-1 bg-blue-600 text-white rounded-md shrink-0 shadow-2xs">
          <Building2 size={12} />
        </div>
        
        <div className="flex items-center gap-1.5 truncate max-w-[260px] sm:max-w-[340px]">
          <span className="font-extrabold text-blue-950 truncate">
            {formatWardLabel(activeWard)}
          </span>
          {activeWard?.category && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-blue-200/70 text-blue-900 text-[9px] font-black rounded-md uppercase tracking-tight">
              {activeWard.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-blue-500 pl-1 border-l border-blue-200">
          <Search size={11} className="text-blue-500" />
          <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-700' : ''}`} />
        </div>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ maxHeight: '460px' }}
        >
          {/* Popover Header & Search Input */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Search size={14} className="text-blue-600" />
                <span>Search Ward / Unit</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                {filteredWards.length} {filteredWards.length === 1 ? 'ward' : 'wards'}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Type ward name, code (ICU, 55...), category..."
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category / Division Filter Pills */}
            {availableCategories.length > 1 ? (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-2 py-1 rounded-lg font-black transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  All Divisions
                </button>
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-lg font-black transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : availableCategories.length === 1 ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                <span className="font-extrabold text-blue-950 uppercase tracking-wider text-[9px]">Division Scope:</span>
                <span>{availableCategories[0]} Division</span>
              </div>
            ) : null}
          </div>

          {/* Wards List */}
          <div 
            ref={listRef}
            className="overflow-y-auto p-1.5 divide-y divide-slate-100 max-h-64 sm:max-h-72"
            role="listbox"
          >
            {filteredWards.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Building2 size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-black text-slate-700">No matching ward or unit</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Try searching with a different ward name, unit number, or division
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Clear search query
                  </button>
                )}
              </div>
            ) : (
              filteredWards.map((w, index) => {
                const isSelected = w.id === (currentWardId || activeWard?.id);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={w.id}
                    data-ward-item
                    onClick={() => handleSelect(w.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-900 border border-blue-200/80 shadow-2xs font-black'
                        : isHighlighted
                        ? 'bg-slate-100/90 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Ward Code Pill */}
                      <span className={`px-2 py-1 text-[10px] font-black rounded-lg shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {w.code || 'UNIT'}
                      </span>

                      {/* Ward Name & Category */}
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate flex items-center gap-1.5">
                          <span className={isSelected ? 'text-blue-950' : 'text-slate-900'}>
                            {w.name}
                          </span>
                        </div>
                        {w.category && (
                          <span className="text-[9.5px] font-bold text-slate-600 block truncate">
                            Division: {w.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="p-1 bg-blue-600 text-white rounded-full shrink-0 shadow-2xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Tip */}
          <div className="p-2 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-[10px] font-medium text-slate-600 px-3">
            <span>Tip: Type unit number or code</span>
            <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-[9px]">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
