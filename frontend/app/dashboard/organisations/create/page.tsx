"use client";
import { styled } from "@mui/material/styles";
import OrganisationForm, {
  Organisation,
} from "../../../../components/OrganisationForm";
import Layout from "../../../../components/Layout";
import MemberList from "../../../../components/MemberList";
import Breadcrumb from "../../../../components/Breadcrumb";
import SubmitContainer from "../../../../components/SubmitContainer";
import { use, useMemo, useState } from "react";
import { FormikValues, useFormik } from "formik";
import { Formik } from "formik";
import { useRouter } from "next/navigation";
import {
  createOrganisation,
  useGetOrganisations,
} from "../../../../helpers/api";

const FormWrapper = styled("div")`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
`;

const initialValues: Organisation = {
  name: "",
  friendlyName: "",
  members: [],
};

function CreateOrganisationPage() {
  const router = useRouter();
  const { data: organisations } = useGetOrganisations();
  const handleCancel = () => router.push("/dashboard/organisations");

  const onSubmit = async (values: Organisation) => {
    console.log("submitted");
    try {
      await createOrganisation(values, organisations);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const validate = (values: FormikValues) => {
    let errors: Partial<typeof values> = {};
    if (!values.name) errors.name = "Please enter a name!";
    if (!values.friendlyName) errors.friendlyName = "Please enter a valid URL!";
    return errors;
  };

  return (
    <Layout active="organisations">
      <Breadcrumb
        items={[
          { label: "Organisations", path: "/dashboard/organisations" },
          { label: "Create" },
        ]}
      />
      <Formik
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={onSubmit}
        initialValues={initialValues}
        validate={validate}
      >
        {(props) => (
          <form onSubmit={props.handleSubmit}>
            <SubmitContainer handleCancel={handleCancel} />
            <FormWrapper>
              <OrganisationForm formikProps={props} />
              <MemberList formikProps={props} />
            </FormWrapper>
          </form>
        )}
      </Formik>
    </Layout>
  );
}

export default CreateOrganisationPage;
