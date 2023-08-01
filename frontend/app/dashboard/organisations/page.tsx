"use client";
import { styled } from "@mui/material";
import Layout from "../../../components/Layout";
import colors from "../../../helpers/colors";
import { PrimaryActionButton } from "../../../components/Buttons";
import { CREATE_ORGANIZATION_PATH } from "../../../helpers/enums";
import Breadcrumbs from "../../../components/Breadcrumb";

const StyledContainer = styled("div")`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  color: ${colors.black.tone1};
  padding:20px
}
`;
const StyledHeader = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 20px;
`;

const StyledBody = styled("div")`
  display: flex;
  padding: 20px;
  flex-direction: column;
`;

export default function Index() {
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
          <p>Welcome to the organisations page!</p>
        </StyledBody>
      </StyledContainer>
    </Layout>
  );
}
