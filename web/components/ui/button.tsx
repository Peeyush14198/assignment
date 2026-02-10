import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

export const buttonVariants = ({
    variant = 'primary',
    size = 'md',
    className
}: {
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    className?: string;
}) => {
    return cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 ring-offset-2',
        {
            'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'secondary',
            'border border-slate-200 bg-transparent hover:bg-slate-100': variant === 'outline',
            'hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-6': size === 'lg',
        },
        className
    );
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={buttonVariants({ variant, size, className })}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
