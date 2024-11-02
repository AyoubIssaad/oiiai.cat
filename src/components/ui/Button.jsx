import React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(
  (
    { className, variant = "default", size = "default", children, ...props },
    ref,
  ) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === "default" && "bg-blue-500 text-white hover:bg-blue-600",
          variant === "outline" &&
            "border border-gray-300 bg-white hover:bg-gray-100",
          size === "default" && "h-10 px-4 py-2",
          size === "lg" && "h-12 px-8 py-3",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
