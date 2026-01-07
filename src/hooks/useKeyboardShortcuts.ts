import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

export const useKeyboardShortcuts = (config: ShortcutConfig = {}) => {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMetaOrCtrl = event.metaKey || event.ctrlKey;
    const target = event.target as HTMLElement;
    const isInputFocused = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    // Don't trigger shortcuts when typing in inputs (except for specific ones)
    if (isInputFocused && !isMetaOrCtrl) return;

    // Ctrl/Cmd + N: New chat
    if (isMetaOrCtrl && event.key === 'n') {
      event.preventDefault();
      if (config.onNewChat) {
        config.onNewChat();
      } else {
        navigate('/chat');
      }
      return;
    }

    // Ctrl/Cmd + K: Search
    if (isMetaOrCtrl && event.key === 'k') {
      event.preventDefault();
      if (config.onSearch) {
        config.onSearch();
      } else {
        navigate('/search');
      }
      return;
    }

    // Ctrl/Cmd + B: Toggle sidebar (handled by SidebarProvider)
    if (isMetaOrCtrl && event.key === 'b') {
      event.preventDefault();
      config.onToggleSidebar?.();
      return;
    }

    // Ctrl/Cmd + ,: Settings
    if (isMetaOrCtrl && event.key === ',') {
      event.preventDefault();
      if (config.onSettings) {
        config.onSettings();
      } else {
        navigate('/settings');
      }
      return;
    }

    // Escape: Close modals / clear focus
    if (event.key === 'Escape' && isInputFocused) {
      (target as HTMLElement).blur();
      return;
    }

    // ?: Show help (when not in input)
    if (event.key === '?' && !isInputFocused && event.shiftKey) {
      event.preventDefault();
      config.onHelp?.();
      return;
    }

    // Shortcuts without modifier keys (only when not typing)
    if (!isInputFocused && !isMetaOrCtrl) {
      switch (event.key) {
        case 'd':
          navigate('/dashboard');
          break;
        case 'l':
          navigate('/leaderboard');
          break;
        case 'p':
          navigate('/profile');
          break;
        case 'q':
          navigate('/quiz');
          break;
        case 'm':
          navigate('/memory');
          break;
      }
    }
  }, [navigate, config]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'N'], description: 'New chat', mac: ['⌘', 'N'] },
  { keys: ['Ctrl', 'K'], description: 'Search', mac: ['⌘', 'K'] },
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', mac: ['⌘', 'B'] },
  { keys: ['Ctrl', ','], description: 'Settings', mac: ['⌘', ','] },
  { keys: ['Shift', '?'], description: 'Show help', mac: ['Shift', '?'] },
  { keys: ['Esc'], description: 'Clear focus', mac: ['Esc'] },
  { keys: ['D'], description: 'Dashboard', mac: ['D'] },
  { keys: ['L'], description: 'Leaderboard', mac: ['L'] },
  { keys: ['P'], description: 'Profile', mac: ['P'] },
];
