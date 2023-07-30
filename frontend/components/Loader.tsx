import React from "react";
import { CircularProgress } from "@mui/material";
import styled from "@emotion/styled";

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: white;
`;

const Loader = () => (
  <LoadingContainer>
    <CircularProgress style={{ color: "#48af74" }} />
  </LoadingContainer>
);

export default Loader;
