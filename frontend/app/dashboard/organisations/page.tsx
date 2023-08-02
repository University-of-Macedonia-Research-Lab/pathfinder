"use client";
import Layout from "../../../components/Layout";
import colors from "../../../helpers/colors";
import { PrimaryActionButton } from "../../../components/Buttons";
import { CREATE_ORGANIZATION_PATH } from "../../../helpers/enums";
import Breadcrumbs from "../../../components/Breadcrumb";
import { useGetOrganisations } from "../../../helpers/api";
import { Organisation } from "./create/page";

import Link from "next/link";
import { styled, Card, CardContent, Typography, darken } from "@mui/material";
import chroma from "chroma-js";

const StyledLink = styled(Link)`
  flex: 1;
  flex-wrap: wrap;
  flex-basis: 33%;
`;

const StyledCard = styled(Card)`
  border: 20px;
  height: 100%;
  transition: 0.3s;
  box-shadow: 0 8px 40px -12px rgba(0, 0, 0, 0.3);
  &:hover {
    box-shadow: 0 16px 70px -12.125px rgba(0, 0, 0, 0.3);
    transform: scale(1.03);
  }
  flex: 1;
`;

const StyledContainer = styled("div")`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  color: ${colors.black.tone1};
  gap:20px
}
`;
const StyledHeader = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 20px;
`;

const StyledBody = styled("div")`
  display: grid;
  padding: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-gap: 20px;
  align-items: stretch;
`;
const StyledBanner = styled("div")`
  position: relative;
  top: -20px;
  left: -20px;
  height: 20px;
  width: calc(100% + 40px);
  margin-bottom: 20px;
`;

// Define base colors
const baseColors = [
  colors.green.tone0,
  colors.green.tone1,
  colors.green.tone2,
  colors.green.tone3,
  colors.pink.tone1,
  colors.pink.tone2,
  colors.pink.tone3,
];

// Define number of colors to generate
const colorCount = 100;

// Create color scale
const colorScale = chroma.scale(baseColors).mode("lch").colors(colorCount);

const stringToColorHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

function getColorFromPalette(str: string) {
  const hash = stringToColorHash(str);
  const colorIndex = hash % colorScale.length;
  return colorScale[colorIndex];
}

export default function Index() {
  const { data: organisations, error } = useGetOrganisations();

  return (
    <Layout active="organisations">
      <StyledContainer>
        <StyledHeader>
          <Breadcrumbs items={[{ label: "Organisations" }]} />
          <PrimaryActionButton href={CREATE_ORGANIZATION_PATH}>
            Create Organization
          </PrimaryActionButton>
        </StyledHeader>
        <StyledBody>
          {organisations?.map((organisation: Organisation) => (
            <StyledLink
              href={`/dashboard/organisations/${organisation.id}`}
              passHref
              key={organisation.id}
            >
              <StyledCard>
                <CardContent>
                  <StyledBanner
                    style={{
                      opacity: 0.9,
                      backgroundImage: `linear-gradient(45deg, ${getColorFromPalette(
                        organisation.friendlyName
                      )}, ${darken(
                        getColorFromPalette(organisation.friendlyName),
                        0.5
                      )})`,
                    }}
                  ></StyledBanner>
                  <Typography variant="h5" component="div">
                    {organisation.name}
                  </Typography>
                  <Typography variant="body2">
                    friendly-name: {organisation.friendlyName}
                  </Typography>
                </CardContent>
              </StyledCard>
            </StyledLink>
          ))}
        </StyledBody>
      </StyledContainer>
    </Layout>
  );
}
