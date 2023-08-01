"use client";
import { styled } from "@mui/material";
import Layout from "../../../components/Layout";
import colors from "../../../helpers/colors";

const StyledContainer = styled("div")`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  color: ${colors.black.tone1};
}
`;
export default function Index() {
  return (
    <Layout active="areas">
      <StyledContainer>
        <h1>Areas</h1>
        <p>Welcome to the areas page!</p>
      </StyledContainer>
    </Layout>
  );
}
