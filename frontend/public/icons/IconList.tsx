import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

export const IconList: React.FC<IconProps> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h1M4 12h1m-1 5.5h1"
      />
    </svg>
  );
};
