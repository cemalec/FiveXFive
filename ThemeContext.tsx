import React, { createContext, useContext, useState } from 'react';
import { AppTheme, ThemeName, themes } from './theme';

type ThemeContextValue = {
  theme: AppTheme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.midnightCarbon,
  themeName: 'midnightCarbon',
  setThemeName: () => {},
});

export function ThemeProvider({
  initialTheme = 'midnightCarbon',
  children,
}: {
  initialTheme?: ThemeName;
  children: React.ReactNode;
}) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
