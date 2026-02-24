import { cn } from "@/lib/utils";

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
  id = "arc-width-slider",
  className,
}: ArcWidthSliderProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-600 bg-gray-800/90 px-4 py-3 shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-200"
      >
        Arc width: {value.toFixed(1)}px
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-40 cursor-pointer appearance-none rounded-lg bg-gray-600 accent-blue-500"
      />
    </div>
  );
}
