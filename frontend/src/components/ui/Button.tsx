import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary: "bg-[var(--color-brand)] text-white",
  secondary: "bg-white text-gray-700 ring-1 ring-gray-200",
  danger: "bg-red-600 text-white",
  ghost: "bg-transparent text-gray-700 shadow-none",
};

export default function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium shadow-sm hover:opacity-90 disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}
