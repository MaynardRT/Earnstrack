import React from "react";

interface BrandLogoProps {
  variant?: "full" | "mark";
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  className = "",
}) => {
  const fileName =
    variant === "mark" ? "earnstrack-mark.svg" : "earnstrack-logo.svg";

  return (
    <img
      src={`${import.meta.env.BASE_URL}${fileName}`}
      alt="Earnstrack logo"
      className={className}
      draggable={false}
    />
  );
};
