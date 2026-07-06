'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function ThemeSync() {
  const theme = useUIStore((s) => s.theme);
  const accentColor = useUIStore((s) => s.accentColor);
  const organization = useAuthStore((s) => s.organization);

  // Apply light/dark/system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Apply accent preset
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  // Apply organization branding colors as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (organization?.primaryColor) {
      root.style.setProperty('--brand-primary', organization.primaryColor);
    }
    if (organization?.secondaryColor) {
      root.style.setProperty('--brand-secondary', organization.secondaryColor);
    }
    if (organization?.accentColor) {
      root.style.setProperty('--brand-accent', organization.accentColor);
      root.style.setProperty('--accent', organization.accentColor);
    }
  }, [organization?.primaryColor, organization?.secondaryColor, organization?.accentColor]);

  return null;
}
