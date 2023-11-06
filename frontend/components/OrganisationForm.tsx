"use client";
import { FC } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { styled, TextField, Typography } from "@mui/material";

import colors from "../helpers/colors";
import { createOrganisation, useGetOrganisations } from "../helpers/api";

export interface Organisation {
  id: string;
  name: string;
  friendlyName: string;
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

const OrganisationForm: FC = () => {
  const { data: organisations, error } = useGetOrganisations();
  const router = useRouter();

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: {
      name: "",
      friendlyName: "",
    },
    validate: (values) => {
      let errors: Partial<typeof values> = {};

      if (!values.name) {
        errors.name = "Please enter a name!";
      }

      if (!values.friendlyName) {
        errors.friendlyName = "Please enter a valid URL!";
      }
      return errors;
    },
    onSubmit: async (values) => {
      try {
        await createOrganisation(values, organisations);
        router.push("/dashboard");
      } catch (err) {
        console.error(err);
      }
    },
  });

  if (error) return <div>Failed to load</div>;
  if (!organisations) return <div>Loading...</div>;

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
        value={formik.values.name}
        onChange={formik.handleChange}
      />
      {formik.errors.name && (
        <ValidateMessage>{formik.errors.name}</ValidateMessage>
      )}

      <TextField
        label="URL Alias"
        name="friendlyName"
        variant="outlined"
        fullWidth
        placeholder="https://pathfinder/"
        value={formik.values.friendlyName}
        onChange={formik.handleChange}
      />
      {formik.errors.friendlyName && (
        <ValidateMessage>{formik.errors.friendlyName}</ValidateMessage>
      )}
    </StyledBody>
  );
};

export default OrganisationForm;
