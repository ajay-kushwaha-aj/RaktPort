import React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success: "group-[.toaster]:!bg-green-50 group-[.toaster]:!text-green-700 group-[.toaster]:!border-green-300 dark:group-[.toaster]:!bg-green-900/50 dark:group-[.toaster]:!text-green-400 dark:group-[.toaster]:!border-green-900",
          error: "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-700 group-[.toaster]:!border-red-300 dark:group-[.toaster]:!bg-red-900/50 dark:group-[.toaster]:!text-red-400 dark:group-[.toaster]:!border-red-900",
          warning: "group-[.toaster]:!bg-yellow-50 group-[.toaster]:!text-yellow-700 group-[.toaster]:!border-yellow-300 dark:group-[.toaster]:!bg-yellow-900/50 dark:group-[.toaster]:!text-yellow-400 dark:group-[.toaster]:!border-yellow-900",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-700 group-[.toaster]:!border-blue-300 dark:group-[.toaster]:!bg-blue-900/50 dark:group-[.toaster]:!text-blue-400 dark:group-[.toaster]:!border-blue-900",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
