import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';

/**
 * Wraps the routed page in a native-style slide transition.
 * Drop in place of <Outlet /> inside layout routes.
 */
export default function AnimatedOutlet({ context }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-0"
      >
        <Outlet context={context} />
      </motion.div>
    </AnimatePresence>
  );
}