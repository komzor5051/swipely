"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

/* ─── FadeIn ─── */
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  y = 20,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ─── SlideIn ─── */
interface SlideInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  duration?: number;
}

export function SlideIn({
  children,
  direction = "left",
  delay = 0,
  duration = 0.4,
  ...props
}: SlideInProps) {
  const x = direction === "left" ? -24 : 24;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ─── StaggerList + StaggerItem ─── */
interface StaggerListProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  stagger?: number;
  delay?: number;
}

const listVariants = {
  hidden: {},
  visible: (custom: { stagger: number; delay: number }) => ({
    transition: {
      staggerChildren: custom.stagger,
      delayChildren: custom.delay,
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function StaggerList({
  children,
  stagger = 0.06,
  delay = 0,
  ...props
}: StaggerListProps) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      custom={{ stagger, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}

/* ─── PageTransition (for AnimatePresence step changes) ─── */
interface PageTransitionProps {
  children: ReactNode;
  id: string;
  className?: string;
}

export function PageTransition({ children, id, className }: PageTransitionProps) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Re-exports ─── */
export { AnimatePresence, motion };
