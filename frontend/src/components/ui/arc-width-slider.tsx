import { cn } from "@/lib/utils";
import { useId } from "react";

type ArcWidthSliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Unique id for label/input association. Defaults to "arc-width-slider". */
  id?: string;
  /** Extra class names for the wrapper (e.g. "z-1000"). */
  className?: string;
};

export function ArcWidthSlider({
  value,
  min,
  max,
  step,
  onChange,
  id,
  className,
}: ArcWidthSliderProps) {
  const fallbackId = useId();
  const sliderId = id ?? fallbackId;

  // Use vmin so scaling follows the smaller viewport side (e.g. 4320px on 30720×4320),
  // keeping the control readable on very large displays without blowing up on width.
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-600 bg-gray-800/90 shadow-lg backdrop-blur-sm",
        "p-[clamp(0.5rem,1.2vmin,5rem)]",
        className
      )}
    >
      <label
        htmlFor={sliderId}
        className="mb-[clamp(0.25rem,0.5vmin,2.5rem)] block font-medium text-gray-200 text-[clamp(0.75rem,2.5vmin,12rem)]"
      >
        Arc width: {value.toFixed(1)}px
      </label>
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[clamp(0.375rem,0.8vmin,2.5rem)] w-[clamp(7rem,15vmin,50rem)] cursor-pointer appearance-none rounded-lg bg-gray-600 accent-blue-500"
      />
    </div>
  );
}
