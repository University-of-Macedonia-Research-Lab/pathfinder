import { Button } from "@mui/material";
import { styled } from "@mui/system";
import Link from "next/link";
import { ReactNode } from "react";
import colors from "../helpers/colors";

export const PrimaryButton = styled(Button)({
  backgroundColor: colors.green.tone1,
  color: colors.white.tone2,
  width: "max-content",
  "&:hover": {
    backgroundColor: colors.green.tone2,
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
      <PrimaryButton variant="contained">{children}</PrimaryButton>
    </Link>
  );
};
