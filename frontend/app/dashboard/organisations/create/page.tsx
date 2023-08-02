"use client";
import { styled } from "@mui/material";
import colors from "../../../../helpers/colors";
import Layout from "../../../../components/Layout";
import Breadcrumbs from "../../../../components/Breadcrumb";

import React, { useState, FormEvent } from "react";
import { TextField, Button } from "@mui/material";
import {
  createOrganisation,
  useGetOrganisations,
} from "../../../../helpers/api";

export interface Organisation {
  id: string;
  name: string;
  friendlyName: string;
}

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

const OrganisationForm: React.FC = () => {
  const [name, setName] = useState("");
  const [friendlyName, setFriendlyName] = useState("");

  const { data: organisations, error } = useGetOrganisations();

  if (error) return <div>Failed to load</div>;
  if (!organisations) return <div>Loading...</div>;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newOrganisation = {
      name,
      friendlyName,
    };

    try {
      await createOrganisation(newOrganisation, organisations);
      setName("");
      setFriendlyName("");
    } catch (err) {
      console.error(err);
    }
  };
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
          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Friendly Name"
              variant="outlined"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
            />
            <Button variant="contained" color="primary" type="submit">
              Submit
            </Button>
          </form>
        </StyledBody>
      </StyledContainer>
    </Layout>
  );
};

export default OrganisationForm;
