import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

export const IconTrendingUp: React.FC<IconProps> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="m3 17l6-6l4 4l8-8" />
        <path d="M17 7h4v4" />
      </g>
    </svg>
  );
};
