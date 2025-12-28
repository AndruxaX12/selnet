interface LogoProps {
  size?: 'sm' | 'md' | 'ml' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    ml: 'h-10 w-auto',
    lg: 'h-12 w-auto'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    ml: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/images/SelNet - Logo.png" 
        alt="СелНет лого" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span className={`font-semibold ${textSizeClasses[size]}`}>
          СелНет
        </span>
      )}
    </div>
  );
}
