"use client";
import {
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import FmdGoodIcon from "@mui/icons-material/FmdGood";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "../../helpers/hooks";
import { logoutUser } from "../../helpers/api";
import colors from "../../helpers/colors";
import Loader from "../../components/Loader";
import { PrimaryActionButton } from "../../components/Buttons";

const FlexCenter = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoContainer = styled("div")``;

const StyledWrapper = styled("div")`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
`;

const StyledMenu = styled("div")`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  max-width: 300px;
  background-color: ${colors.green.tone0};
  & * {
    color: ${colors.white.tone3};
  }
`;

const StyledListItem = styled(ListItem)`
  cursor: pointer;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;
const StyledContainer = styled("div")`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background-color: ${colors.white.tone3};
`;

const Dashboard = () => {
  const { isLoading } = useAuth();

  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <StyledWrapper>
      <StyledMenu>
        <LogoContainer>
          <Image
            src="/PathFinder.svg"
            alt="Next.js Logo"
            width={180}
            height={80}
            priority
            style={{ paddingLeft: "20px" }}
          />
        </LogoContainer>
        <List>
          <StyledListItem>
            <ListItemIcon>
              <FmdGoodIcon />
            </ListItemIcon>
            <ListItemText primary="Areas" />
          </StyledListItem>
          <StyledListItem onClick={logoutUser}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </StyledListItem>
        </List>
      </StyledMenu>
      <StyledContainer>
        <h1>Dashboard</h1>
        <PrimaryActionButton>Create Area</PrimaryActionButton>
      </StyledContainer>
    </StyledWrapper>
  );
};

export default Dashboard;
