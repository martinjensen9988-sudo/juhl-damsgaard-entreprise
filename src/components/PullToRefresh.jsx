import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight pull-to-refresh wrapper for scrollable views.
 * Place it inside a scroll container (e.g. the layout <main>); it auto-detects
 * the nearest scrollable ancestor and only triggers when pulled from the top.
 */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const wrapRef = useRef(null);
  const scrollParent = useRef(null);
  const startY = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESHOLD = 70;

  useEffect(() => {
    let el = wrapRef.current;
    while (el && el !== document.body) {
      const st = window.getComputedStyle(el);
      if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight) {
        scrollParent.current = el;
        break;
      }
      el = el.parentElement;
    }
  }, []);

  const onTouchStart = (e) => {
    const sp = scrollParent.current;
    if (!sp || sp.scrollTop > 0 || refreshing) { startY.current = null; return; }
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current == null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 110));
  };
  const onTouchEnd = async () => {
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try { await onRefresh?.(); } finally { setRefreshing(false); }
    }
    setPull(0);
    startY.current = null;
  };

  const indicatorHeight = refreshing ? 48 : pull;

  return (
    <div ref={wrapRef} className={className} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        style={{ height: indicatorHeight, transition: pull || refreshing ? 'none' : 'height 0.2s ease', overflow: 'hidden' }}
        className="flex items-center justify-center"
      >
        <div className={`w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
      </div>
      {children}
    </div>
  );
}