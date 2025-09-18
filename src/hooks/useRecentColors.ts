import { useState, useCallback } from 'react';

export function useRecentColors() {
  const [recentTextColors, setRecentTextColors] = useState<string[]>([]);

  const addRecentTextColor = useCallback((color: string) => {
    setRecentTextColors(prev => {
      // 이미 있는 색상이면 맨 앞으로 이동
      const filtered = prev.filter(c => c !== color);
      // 최대 10개까지만 저장
      return [color, ...filtered].slice(0, 10);
    });
  }, []);

  const clearRecentTextColors = useCallback(() => {
    setRecentTextColors([]);
  }, []);

  return {
    recentTextColors,
    addRecentTextColor,
    clearRecentTextColors
  };
}