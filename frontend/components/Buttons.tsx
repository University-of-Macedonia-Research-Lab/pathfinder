import { Button } from "@mui/material";
import { styled } from "@mui/system";

export const PrimaryActionButton = styled(Button)({
  backgroundColor: "#2F8658",
  color: "white",
  width: "200px",
  "&:hover": {
    backgroundColor: "#48AF74",
  },
});

// Usage:
// <PrimaryActionButton>Click me</PrimaryActionButton>
