import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

// ============================================================================
// CrossNavPanel - Slide-in panel for cross-navigation between entities
// ============================================================================

interface CrossNavPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  width?: number;
  children: ReactNode;
}

export function CrossNavPanel({
  open,
  onClose,
  title,
  icon: Icon,
  width = 420,
  children,
}: CrossNavPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Trigger slide-in on next frame for CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: visible ? 1 : 0,
        }}
        onClick={handleBackdropClick}
      />

      {/* Panel */}
      <div
        className="absolute top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: `${width}px`,
          maxWidth: '100vw',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
          style={{ backgroundColor: '#1B3A5C' }}
        >
          {Icon && <Icon size={20} className="text-white flex-shrink-0" />}
          <h2 className="text-white font-semibold text-base truncate flex-1">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// QuickNavButton - Small icon button that opens the cross-nav panel
// ============================================================================

interface QuickNavButtonProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  onClick: () => void;
  color?: string;
}

export function QuickNavButton({
  icon: Icon,
  label,
  count,
  onClick,
  color = '#059669',
}: QuickNavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 hover:scale-105 group"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <Icon size={16} />

      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none px-1"
          style={{ backgroundColor: color }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}

      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ backgroundColor: '#1B3A5C' }}
      >
        {label}
        {count !== undefined && count > 0 && (
          <span className="ml-1 opacity-70">({count})</span>
        )}
      </span>
    </button>
  );
}

// ============================================================================
// EntityBadge - Inline clickable chip for entity references
// ============================================================================

interface EntityBadgeProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function EntityBadge({ icon: Icon, label, onClick }: EntityBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-sm"
      style={{
        backgroundColor: '#2DB5B015',
        color: '#1B3A5C',
        border: '1px solid #2DB5B030',
      }}
    >
      <Icon size={12} style={{ color: '#059669' }} />
      <span className="truncate max-w-[160px]">{label}</span>
    </button>
  );
}
