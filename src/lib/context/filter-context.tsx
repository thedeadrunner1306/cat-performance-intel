'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { FilterState } from '@/lib/analytics/types';

const defaultFilters: FilterState = {
  dateRange: { start: null, end: null },
  mockRange: { start: null, end: null },
  section: null,
  topic: null,
  subtopic: null,
  difficulty: null,
};

interface FilterContextType {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((v) => {
      if (v === null) return false;
      if (typeof v === 'object' && v !== null) {
        return Object.values(v).some((sv) => sv !== null);
      }
      return true;
    });
  }, [filters]);

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within a FilterProvider');
  return context;
}
