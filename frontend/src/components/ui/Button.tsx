import type { ButtonHTMLAttributes } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "font-semibold text-white border border-(--primary) rounded-lg hover:bg-(--primary) hover:text-background transition-colors":
            variant === "primary",
          "font-semibold text-white bg-[#1e1e1e] border border-(--primary) rounded-lg hover:bg-(--primary) hover:text-background transition-colors":
            variant === "secondary",
          "font-semibold text-white bg-(--primary) border border-(--primary) rounded-lg hover:bg-[#FFDD57] hover:border-[#FFDD57] hover:text-background transition-colors":
            variant === "tertiary",
          "border-2 border-primary text-primary hover:bg-primary/10":
            variant === "outline",
          "h-8 px-4 text-sm": size === "sm",
          "h-10 px-6 text-base": size === "md",
          "h-12 px-8 text-lg": size === "lg",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
