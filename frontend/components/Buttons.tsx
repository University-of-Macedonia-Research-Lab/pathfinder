import { Button } from "@mui/material";
import { styled } from "@mui/system";
import Link from "next/link";
import { ReactNode } from "react";

export const StyledButton = styled(Button)({
  backgroundColor: "#2F8658",
  color: "white",
  width: "max-content",
  "&:hover": {
    backgroundColor: "#48AF74",
  },
});

export const PrimaryActionButton = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => {
  return (
    <Link href={href}>
      <StyledButton variant="contained">{children}</StyledButton>
    </Link>
  );
};

// Usage:
// <PrimaryActionButton>Click me</PrimaryActionButton>
