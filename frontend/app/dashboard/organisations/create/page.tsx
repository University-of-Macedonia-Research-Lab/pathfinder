"use client";
import { styled } from "@mui/material";
import colors from "../../../../helpers/colors";
import Layout from "../../../../components/Layout";
import { PrimaryActionButton } from "../../../../components/Buttons";
import { CREATE_ORGANIZATION_PATH } from "../../../../helpers/enums";
import Breadcrumbs from "../../../../components/Breadcrumb";

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
          <Breadcrumbs
            items={[
              { label: "Organisations", path: "/dashboard/organisations" },
              { label: "Create" },
            ]}
          />
        </StyledHeader>
        <StyledBody>
          <p>Create an organization</p>
        </StyledBody>
      </StyledContainer>
    </Layout>
  );
}
