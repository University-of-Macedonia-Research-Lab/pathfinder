"use client";
import { styled } from "@mui/material";
import Layout from "../../../components/Layout";
import colors from "../../../helpers/colors";
import Dropzone from "../../../components/Dropzone";

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
    <Layout active="buildings">
      <StyledContainer>
        <h1>Buildings</h1>
        <p>Welcome to the buildings page!</p>
        <hr></hr>
        <Dropzone />
      </StyledContainer>
    </Layout>
  );
}
