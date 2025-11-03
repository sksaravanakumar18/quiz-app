import React from 'react';
import './CompletionBadge.css'; // <-- Import the CSS file

// Define the properties the component accepts
interface CompletionBadgeProps {
  percentage: number;      // The calculated score percentage
  threshold?: number;      // Optional pass threshold (defaults to 80)
  className?: string;      // Optional additional CSS classes
}

const CompletionBadge: React.FC<CompletionBadgeProps> = ({
    percentage,
    threshold = 80, // Default pass threshold if not provided
    className = ''  // Default to empty string for className
}) => {

  // Determine if the user passed based on the threshold
  const passed = percentage >= threshold;

  // Determine badge styles based on pass/fail status
  // Using Tailwind-like classes as an example - replace with your actual CSS classes or inline styles
  const baseClasses = "ml-2 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap";
  const statusClasses = passed
    ? "bg-green-100 text-green-700" // Styles for 'Passed'
    : "bg-red-100 text-red-700";    // Styles for 'Failed'

  // Combine base, status, and any custom classes passed via props
  const combinedClasses = `${baseClasses} ${statusClasses} ${className}`.trim();

  // Make sure percentage is a valid number before formatting
  const displayPercentage = typeof percentage === 'number' && !isNaN(percentage)
    ? `${percentage.toFixed(0)}%`
    : 'N/A';

  return (
    <span className={combinedClasses}>
      {/* Display 'Passed' or 'Failed' based on the comparison */}
      {passed ? 'Passed' : 'Failed'} ({displayPercentage})
    </span>
  );
};

export default CompletionBadge;