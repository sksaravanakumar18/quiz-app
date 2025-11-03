// src/components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  progress: number; // A value between 0 and 100
  label?: string; // Optional label to display
  barColor?: string; // Optional custom color for the progress bar
  backgroundColor?: string; // Optional custom color for the background
  height?: string; // Optional custom height (e.g., 'h-2', 'h-4')
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  barColor = 'bg-emerald-500', // Default to Tailwind's emerald-500
  backgroundColor = 'bg-slate-200', // Default background
  height = 'h-3', // Default height
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress)); // Ensure progress is between 0 and 100

  return (
    <div className="progress-bar-container w-full my-2">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-slate-700">{label}</span>
          <span className="text-xs font-medium text-emerald-700">{normalizedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full ${backgroundColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${barColor} ${height} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
        </div>
      </div>
      {!label && ( // Show percentage below if no label is provided above
        <div className="text-right mt-1">
            <span className="text-xs font-medium text-emerald-700">{normalizedProgress.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;