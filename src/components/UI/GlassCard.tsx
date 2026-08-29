import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'purple' | 'green' | 'none';
  variant?: 'default' | 'elevated' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = 'none',
  variant = 'default',
  ...props
}) => {
  const glowStyles = {
    cyan: 'shadow-[0_0_25px_rgba(0,242,254,0.15)] border-cyan-500/30',
    purple: 'shadow-[0_0_25px_rgba(176,0,255,0.15)] border-purple-500/30',
    green: 'shadow-[0_0_25px_rgba(0,255,136,0.15)] border-emerald-500/30',
    none: 'border-white/10',
  };

  const variantStyles = {
    default: 'bg-[#0e111a]/80 backdrop-blur-xl',
    elevated: 'bg-[#141824]/90 backdrop-blur-2xl shadow-2xl',
    subtle: 'bg-white/[0.04] backdrop-blur-md',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border transition-all duration-300',
          variantStyles[variant],
          glowStyles[glow],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
