import { useEffect, useRef } from 'react';

/**
 * Syncs a boolean dialog open-state with the browser history so the Android
 * hardware/system back button closes the dialog instead of leaving the page.
 *
 * When the dialog opens we push a history entry; pressing back pops it and
 * closes the dialog. When the dialog is closed via its own button we pop the
 * entry we added so the back stack stays consistent.
 *
 * @param {boolean} open      - current open state
 * @param {function} setOpen  - state setter for open
 */
export function useDialogHistory(open, setOpen) {
  const closedByBack = useRef(false);

  useEffect(() => {
    if (open) {
      window.history.pushState({ modal: true }, '');
      closedByBack.current = false;
      const onPop = () => {
        closedByBack.current = true;
        setOpen(false);
      };
      window.addEventListener('popstate', onPop);
      return () => {
        window.removeEventListener('popstate', onPop);
        // Closed via the dialog's own button (not the back button) — remove our entry.
        if (!closedByBack.current) {
          window.history.back();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}