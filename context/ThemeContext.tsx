'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeSettings {
  backgroundImage: string;
  textColor: string;
  hyperlinkColor: string;
  tableColor: string;
  tableOpacity: number;
  contextMenuColor: string;
  contextMenuOpacity: number;
  backgroundAnimationDuration: number;
  pageTransitionDuration: number;
  backgroundOverlay: string;
  backgroundOverlayColor: string;
  backgroundOverlayOpacity: number;
}

interface ThemeContextType {
  theme: ThemeSettings;
  setTheme: (settings: ThemeSettings) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeState, setThemeState] = useState<ThemeSettings>(() => {
    const savedSettings = localStorage.getItem('themeSettings');
    const defaultSettings = {
      backgroundImage: 'https://theinnercircle.gg/ic2.jpg',
      textColor: '#000000',
      hyperlinkColor: '#0000FF',
      tableColor: '#f3f4f6',
      tableOpacity: 0.7,
      contextMenuColor: '#f3f4f6',
      contextMenuOpacity: 0.7,
      backgroundAnimationDuration: 10,
      pageTransitionDuration: 0.3,
      backgroundOverlay: 'rgba(255, 255, 255, 0.5)',
      backgroundOverlayColor: '#ffffff',
      backgroundOverlayOpacity: 0.5,
    };
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      const [r, g, b, a] = parsedSettings.backgroundOverlay.match(/\d+(\.\d+)?/g) || [];
      return {
        ...parsedSettings,
        backgroundOverlayColor: `rgb(${r}, ${g}, ${b})`,
        backgroundOverlayOpacity: parseFloat(a) || 0.5,
      };
    }
    return defaultSettings;
  });

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  }, []);

  const setTheme = useCallback((newTheme: ThemeSettings) => {
    setThemeState(newTheme);
    localStorage.setItem('themeSettings', JSON.stringify(newTheme));

    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--background-image', `url(${newTheme.backgroundImage})`);
      document.documentElement.style.setProperty('--text-color', newTheme.textColor);
      document.documentElement.style.setProperty('--hyperlink-color', newTheme.hyperlinkColor);
      document.documentElement.style.setProperty('--table-color', `rgba(${hexToRgb(newTheme.tableColor)}, ${newTheme.tableOpacity})`);
      document.documentElement.style.setProperty('--context-menu-color', `rgba(${hexToRgb(newTheme.contextMenuColor)}, ${newTheme.contextMenuOpacity})`);
      document.documentElement.style.setProperty('--background-animation-duration', `${newTheme.backgroundAnimationDuration}s`);
      document.documentElement.style.setProperty('--page-transition-duration', `${newTheme.pageTransitionDuration}s`);
      document.documentElement.style.setProperty('--background-overlay', `rgba(${hexToRgb(newTheme.backgroundOverlayColor)}, ${newTheme.backgroundOverlayOpacity})`);
    });
  }, [hexToRgb]);

  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeState));

    document.documentElement.style.setProperty('--background-image', `url(${themeState.backgroundImage})`);
    document.documentElement.style.setProperty('--text-color', themeState.textColor);
    document.documentElement.style.setProperty('--hyperlink-color', themeState.hyperlinkColor);
    document.documentElement.style.setProperty('--table-color', `rgba(${hexToRgb(themeState.tableColor)}, ${themeState.tableOpacity})`);
    document.documentElement.style.setProperty('--context-menu-color', `rgba(${hexToRgb(themeState.contextMenuColor)}, ${themeState.contextMenuOpacity})`);
    document.documentElement.style.setProperty('--background-animation-duration', `${themeState.backgroundAnimationDuration}s`);
    document.documentElement.style.setProperty('--page-transition-duration', `${themeState.pageTransitionDuration}s`);
    document.documentElement.style.setProperty('--background-overlay', `rgba(${hexToRgb(themeState.backgroundOverlayColor)}, ${themeState.backgroundOverlayOpacity})`);
  }, [themeState, hexToRgb]);

  return (
    <ThemeContext.Provider value={{ theme: themeState, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

