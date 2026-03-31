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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg overflow-hidden !rounded-lg",
          success: "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-green-500 group-[.toaster]:!bg-background group-[.toaster]:!text-foreground",
          error: "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-red-500 group-[.toaster]:!bg-background group-[.toaster]:!text-foreground",
          warning: "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-yellow-500 group-[.toaster]:!bg-background group-[.toaster]:!text-foreground",
          info: "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-blue-500 group-[.toaster]:!bg-background group-[.toaster]:!text-foreground",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:!text-foreground",
          description: "group-[.toast]:text-sm group-[.toast]:!text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
