import type { Variants } from 'framer-motion';

export const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Parent/child pair for lists that fade up one item after another. */
export const staggerParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
export const staggerChild: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };
