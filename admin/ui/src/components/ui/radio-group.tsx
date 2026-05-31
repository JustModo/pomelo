import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("grid gap-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

const RadioGroupContext = React.createContext<{ value: string; onValueChange: (v: string) => void }>({
  value: "",
  onValueChange: () => {},
});

function RadioGroupItem({
  value,
  id,
  className,
}: {
  value: string;
  id?: string;
  className?: string;
}) {
  const ctx = React.useContext(RadioGroupContext);
  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      id={id}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center",
        className
      )}
    >
      {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-current" />}
    </button>
  );
}

export { RadioGroup, RadioGroupItem };
