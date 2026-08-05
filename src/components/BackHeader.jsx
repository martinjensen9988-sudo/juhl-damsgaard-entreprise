import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Unified back-button header for deep nested routes.
 * Mobile-only (hidden on md+ where the sidebar provides navigation).
 * Prefers history back; falls back to `to` or "/" when no history.
 */
export default function BackHeader({ title, to }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else if (to) navigate(to);
    else navigate('/');
  };
  return (
    <div className="flex items-center gap-2 bg-background border-b border-border px-3 py-2 md:hidden">
      <button
        type="button"
        onClick={goBack}
        className="tap-target -ml-1 p-1 rounded-md hover:bg-accent text-foreground"
        aria-label="Tilbage"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-base font-semibold truncate">{title}</h1>
    </div>
  );
}