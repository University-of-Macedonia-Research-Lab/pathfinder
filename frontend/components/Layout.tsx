"use client";
import { ReactNode } from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
} from "@mui/material";
import { ListItemProps } from "@mui/material/ListItem";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import Image from "next/image";
import Loader from "./Loader";
import { logoutUser } from "../helpers/api";
import Link from "next/link";
import colors from "../helpers/colors";
import { useAuth } from "../helpers/hooks";

interface StyledListItemProps extends ListItemProps {
  active?: string;
}

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
  min-width: 200px;
  background-color: ${colors.green.tone0};
  & * {
    color: ${colors.white.tone3};
  }
`;

const StyledLink = styled(Link)`
  padding: 8px 16px;
  display: flex;
  flex:1;
}
`;
const StyledListItem = styled(ListItem)<StyledListItemProps>`
  padding: 0;
  cursor: pointer;
  background-color: ${(props) =>
    props.active === "true" ? "rgba(255, 255, 255, 0.05)" : "transparent"};
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
  padding: 20px;
  gap: 20px;
`;
const StyledImage = styled(Image)`
  padding: 20px;
  height: auto;
`;
const Layout = ({
  children,
  active,
}: {
  children: ReactNode;
  active: "organisations" | "areas" | "buildings" | "floors";
}) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  return (
    // <SubmitProvider>
    <StyledWrapper>
      <StyledMenu>
        <LogoContainer>
          <StyledImage
            src="/PathFinder.svg"
            alt="Next.js Logo"
            width={180}
            height={80}
            priority
          />
        </LogoContainer>
        <List>
          <StyledListItem active={String(active === "organisations")}>
            <StyledLink href="/dashboard/organisations">
              <ListItemIcon>
                <CorporateFareIcon />
              </ListItemIcon>
              <ListItemText primary="Organisations" />
            </StyledLink>
          </StyledListItem>

          <StyledListItem active={String(active === "buildings")}>
            <StyledLink href="/dashboard/buildings">
              <ListItemIcon>
                <HomeWorkIcon />
              </ListItemIcon>
              <ListItemText primary="Buildings" />
            </StyledLink>
          </StyledListItem>
          <StyledListItem active={String(active === "floors")}>
            <StyledLink href="/dashboard/floors">
              <ListItemIcon>
                <SpaceDashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Floors" />
            </StyledLink>
          </StyledListItem>
          <StyledListItem onClick={logoutUser}>
            <StyledLink href="#">
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </StyledLink>
          </StyledListItem>
        </List>
      </StyledMenu>
      <StyledContainer>{children}</StyledContainer>
    </StyledWrapper>
    // </SubmitProvider>
  );
};

export default Layout;
