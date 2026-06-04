import React from "react";
import { cn } from "@/utils/cn";

export function Button({ className, variant = "default", ...props }) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-800/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
  
  const variants = {
    default: "bg-green-800 text-white hover:bg-green-900 shadow-sm",
    outline: "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 shadow-sm",
    ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
  };

  const hasPadding = className && (className.includes("p-") || className.includes("px-") || className.includes("py-"));
  const paddingStyles = hasPadding ? "" : "px-4 py-2 rounded-lg text-sm";

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        paddingStyles,
        className
      )}
      {...props}
    />
  );
}
