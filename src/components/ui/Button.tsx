import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-display font-semibold tracking-wide uppercase transition-all duration-150 rounded-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-court-lime text-court-green hover:bg-court-limeLight active:scale-95',
    secondary: 'bg-court-green text-white hover:bg-court-greenLight active:scale-95',
    ghost: 'bg-transparent border border-court-green text-court-green hover:bg-court-green hover:text-white',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="mr-2 animate-spin">⟳</span> : null}
      {children}
    </button>
  );
}
