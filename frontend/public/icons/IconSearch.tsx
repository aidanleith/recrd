import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

export const IconSearch: React.FC<IconProps> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        {/* Path for the magnifying glass circle */}
        <path d="M16 9.5a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0" />
        {/* Path for the handle */}
        <path d="M15 15l6 6" />
      </g>
    </svg>
  );
};