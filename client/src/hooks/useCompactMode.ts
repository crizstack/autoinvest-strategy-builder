import { useState, useEffect } from 'react';

export function useCompactMode() {
  const [isCompact, setIsCompact] = useState(() => {
    // Recuperar preferência do localStorage
    const saved = localStorage.getItem('compact-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Salvar preferência no localStorage
    localStorage.setItem('compact-mode', JSON.stringify(isCompact));

    // Aplicar classe ao documento
    if (isCompact) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [isCompact]);

  const toggle = () => setIsCompact(!isCompact);

  return { isCompact, toggle, setIsCompact };
}
