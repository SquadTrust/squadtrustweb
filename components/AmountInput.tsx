"use client";

import React, { useState, useEffect, useId } from "react";
import { cn } from "../lib/utils";

interface AmountInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value: number; // Kobo
  onChange: (value: number) => void;
  label?: string;
  error?: string;
}

export function AmountInput({
  value,
  onChange,
  label,
  error,
  className,
  id,
  ...props
}: AmountInputProps) {
  // Local state for Naira display
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    if (value !== undefined && value !== null && !isNaN(value)) {
      // Only update if the parsed display value differs to avoid overriding active typing
      const currentNaira = parseFloat(displayValue || "0");
      const expectedNaira = value / 100;
      if (Math.abs(currentNaira - expectedNaira) > 0.01) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayValue((value / 100).toString());
      }
    } else if (!value) {
      setDisplayValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;

    // Remove all non-numeric characters except one dot
    rawValue = rawValue.replace(/[^0-9.]/g, "");
    const parts = rawValue.split(".");
    if (parts.length > 2) {
      rawValue = parts[0] + "." + parts.slice(1).join("");
    }

    setDisplayValue(rawValue);

    if (!rawValue || rawValue === ".") {
      onChange(0);
      return;
    }

    const nairaValue = parseFloat(rawValue);
    if (!isNaN(nairaValue)) {
      const koboValue = Math.round(nairaValue * 100);
      onChange(koboValue);
    }
  };

  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">₦</span>
        </div>
        <input
          {...props}
          id={inputId}
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-7 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
          )}
          placeholder="0.00"
          value={displayValue}
          onChange={handleChange}
        />
      </div>
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
}
