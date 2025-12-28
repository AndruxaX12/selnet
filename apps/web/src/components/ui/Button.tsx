"use client";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "default" | "destructive" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "default" | "icon";
  as?: "button" | "a";
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", as = "button", className = "", children, href, ...props }, ref) => {
    const baseClass = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClass = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md",
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md",
      secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-sm hover:shadow-md",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md",
      outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-sm",
      ghost: "bg-transparent text-gray-700 border border-transparent hover:bg-gray-100 focus:ring-blue-500",
      link: "bg-transparent text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline"
    }[variant];
    
    const sizeClass = {
      default: "px-6 py-3 text-sm font-medium",
      sm: "px-4 py-2 text-sm font-medium",
      md: "px-6 py-3 text-sm font-medium",
      lg: "px-8 py-4 text-base font-medium",
      icon: "h-10 w-10"
    }[size];
    
    const classes = `${baseClass} ${variantClass} ${sizeClass} ${className}`;
    
    if (as === "a") {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }
    
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export default Button;
