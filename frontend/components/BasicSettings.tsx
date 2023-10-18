"use client";
import { styled } from "@mui/material";
import colors from "../helpers/colors";
import Layout from "./Layout";
import { FC } from "react";
import Breadcrumbs from "./Breadcrumb";
import { createOrganisation, useGetOrganisations } from "../helpers/api";
import { useFormik } from "formik";
import LinkIcon from "@mui/icons-material/Link";
import { MemberList } from "./MemberList";
import Dropzone from "react-dropzone";
import { PrimaryButton } from "./Buttons";
import { TextField } from "@mui/material";
import { names } from "tinycolor2";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";
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
  padding: 30px;
  flex-direction: column;
  background: #f5f5f5;
  width: 574px;
  border-radius: 20px;
  padding: 40px;
  margin: 20px;
`;

export const ValidateMessage = styled("div")`
  color: red;
`;

export const StyledTextField = styled(TextField)`
  margin-bottom: 20px;
`;

export const SignUpContainer = styled("div")`
  form {
    display: flex;
    flex-wrap: wrap;
    width: 70%;
    margin: 0px;
    margin-left: 0px;

    label {
      display: inline-block;
      color: #000;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      width: 100px;
    }
  }
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
        errors.name = "Please enter your name!";
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
      <SignUpContainer>
        <form onSubmit={formik.handleSubmit}>
          <StyledTextField
            label="Name"
            name="name"
            variant="outlined"
            fullWidth
            placeholder="Please enter the name"
            value={formik.values.name}
            onChange={formik.handleChange}
          />
          {formik.errors.name ? (
            <ValidateMessage>{formik.errors.name}</ValidateMessage>
          ) : null}

          <StyledTextField
            label="URL Alias"
            name="friendlyName"
            variant="outlined"
            fullWidth
            placeholder="https://pathfinder/"
            value={formik.values.friendlyName}
            onChange={formik.handleChange}
          />
          {formik.errors.friendlyName ? (
            <ValidateMessage>{formik.errors.friendlyName}</ValidateMessage>
          ) : null}
        </form>
      </SignUpContainer>
    </StyledBody>
  );
};

export default OrganisationForm;
