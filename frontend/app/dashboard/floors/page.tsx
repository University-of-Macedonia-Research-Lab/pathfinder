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
    <Layout active="floors">
      <StyledContainer>
        <h1>Floors</h1>
        <p>Welcome to the floors page!</p>
      </StyledContainer>
    </Layout>
  );
}
