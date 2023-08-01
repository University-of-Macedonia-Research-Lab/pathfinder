"use client";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
} from "@mui/material";
import { ListItemProps } from "@mui/material/ListItem";

import LogoutIcon from "@mui/icons-material/Logout";
import { ReactNode } from "react";
import Image from "next/image";
import colors from "../helpers/colors";
import { useAuth } from "../helpers/hooks";
import Loader from "./Loader";
import { logoutUser } from "../helpers/api";
import Link from "next/link";

import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ImageAspectRatioIcon from "@mui/icons-material/ImageAspectRatio";

interface StyledListItemProps extends ListItemProps {
  active?: boolean;
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
    props.active ? "rgba(255, 255, 255, 0.05)" : "transparent"};
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

const Layout = ({
  children,
  active,
}: {
  children: ReactNode;
  active: "organisations" | "areas" | "buildings" | "floors" | "rooms";
}) => {
  const { isLoading } = useAuth();

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
          <StyledListItem active={active === "organisations"}>
            <StyledLink href="/dashboard/organisations">
              <ListItemIcon>
                <CorporateFareIcon />
              </ListItemIcon>
              <ListItemText primary="Organisations" />
            </StyledLink>
          </StyledListItem>

          <StyledListItem active={active === "buildings"}>
            <StyledLink href="/dashboard/buildings">
              <ListItemIcon>
                <HomeWorkIcon />
              </ListItemIcon>
              <ListItemText primary="Buildings" />
            </StyledLink>
          </StyledListItem>
          <StyledListItem active={active === "floors"}>
            <StyledLink href="/dashboard/floors">
              <ListItemIcon>
                <SpaceDashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Floors" />
            </StyledLink>
          </StyledListItem>
          <StyledListItem active={active === "rooms"}>
            <StyledLink href="/dashboard/rooms">
              <ListItemIcon>
                <ImageAspectRatioIcon />
              </ListItemIcon>
              <ListItemText primary="Rooms" />
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
  );
};

export default Layout;
