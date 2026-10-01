import React, { useState, useEffect } from 'react';
import { Languages, Check, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { getLanguage, setLanguage, onLanguageChange, AppLanguage } from '@/utils/languageManager';

interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeName: string;
  badge: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', badge: 'EN' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ', badge: 'ಕ' },
];

export const LanguageSwitcher: React.FC = () => {
  const { theme } = useTheme();
  const [currentLang, setCurrentLang] = useState<AppLanguage>(getLanguage());

  useEffect(() => {
    // Listen for language changes across tabs or components
    const unsubscribe = onLanguageChange((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectLanguage = (code: AppLanguage) => {
    if (code === currentLang) return;
    setCurrentLang(code);
    setLanguage(code);
  };

  const activeOption = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="language-switcher-btn"
          variant="ghost"
          size="sm"
          className="h-7 px-2 sm:px-2.5 rounded-full flex items-center gap-1.5 transition-colors duration-200 text-white/90 hover:text-white hover:bg-white/15 border border-white/20"
          aria-label="Change Language"
        >
          <Languages className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs font-bold tracking-wide uppercase text-white">
            {activeOption.badge}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={`w-44 p-1 rounded-xl shadow-lg border animate-in fade-in-50 zoom-in-95 duration-150 ${
          theme === 'dark'
            ? 'bg-card border-border text-foreground'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 mb-1">
          Select Language / ಭಾಷೆ
        </div>

        {LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors duration-150 ${
                isSelected
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'hover:bg-muted font-medium'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{lang.badge}</span>
                <div className="flex flex-col">
                  <span>{lang.nativeName}</span>
                  {lang.code !== 'en' && (
                    <span className="text-[10px] text-muted-foreground">({lang.label})</span>
                  )}
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
