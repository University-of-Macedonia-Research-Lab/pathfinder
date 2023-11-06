"use client";
import { FormikProps } from "formik";
import { styled, TextField, Typography } from "@mui/material";

import colors from "../helpers/colors";
import { createOrganisation, useGetOrganisations } from "../helpers/api";

export interface Organisation {
  id?: string;
  name: string;
  friendlyName: string;
  members?: string[] | never[] | undefined;
}

export const StyledContainer = styled("div")`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  color: ${colors.black.tone1};
  padding:20px
  margin: 20px;

}
`;
export const StyledHeader = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 20px;
`;

export const StyledBody = styled("div")`
  display: flex;
  flex-direction: column;
  background: ${colors.gray.tone4};
  flex: 1;
  min-width: 390px;
  border-radius: 20px;
  padding: 20px;
  gap: 20px;
`;

export const ValidateMessage = styled("div")`
  color: ${colors.red.tone1};
`;

const OrganisationForm = ({
  formikProps,
}: {
  formikProps: FormikProps<Organisation>;
}) => {
  return (
    <StyledBody>
      <Typography variant="h5" gutterBottom>
        Basic Settings
      </Typography>
      <TextField
        label="Name"
        name="name"
        variant="outlined"
        fullWidth
        placeholder="Please enter the name"
        value={formikProps.values.name}
        onChange={formikProps.handleChange}
      />
      {formikProps.errors.name && (
        <ValidateMessage>{formikProps.errors.name}</ValidateMessage>
      )}

      <TextField
        label="URL Alias"
        name="friendlyName"
        variant="outlined"
        fullWidth
        placeholder="https://pathfinder/"
        value={formikProps.values.friendlyName}
        onChange={formikProps.handleChange}
      />
      {formikProps.errors.friendlyName && (
        <ValidateMessage>{formikProps.errors.friendlyName}</ValidateMessage>
      )}
    </StyledBody>
  );
};

export default OrganisationForm;
