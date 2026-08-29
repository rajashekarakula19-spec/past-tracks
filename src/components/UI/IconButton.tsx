import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  icon,
  label,
  variant = 'glass',
  size = 'md',
  active = false,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'p-2 text-xs gap-1.5 rounded-xl',
    md: 'p-2.5 text-sm gap-2 rounded-xl',
    lg: 'p-3.5 text-base gap-2.5 rounded-2xl font-medium',
  };

  const variantStyles = {
    glass: active
      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
      : 'bg-white/[0.07] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 hover:border-white/20',
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(0,242,254,0.4)] border border-cyan-400/40 hover:brightness-110',
    success:
      'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/40 hover:brightness-110',
    danger:
      'bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400/40 hover:brightness-110',
    secondary:
      'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer select-none outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label && <span>{label}</span>}
      {children}
    </motion.button>
  );
};
