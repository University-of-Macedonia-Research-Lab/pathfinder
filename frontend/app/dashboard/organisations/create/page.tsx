"use client";
import OrganisationForm from "../../../../components/BasicSettings";
import Layout from "../../../../components/Layout";
import { MemberList } from "../../../../components/MemberList";
import React from "react";
import Breadcrumbs from "../../../../components/Breadcrumb";
import { styled } from "@mui/material/styles";
import SubmitButtonContainer from "../../../../components/SubmitContainer";
const FormWrapper = styled("div")`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
`;

function CreateFormPage() {
  return (
    <Layout active="organisations">
      <Breadcrumbs
        items={[
          { label: "Organisations", path: "/dashboard/organisations" },
          { label: "Create" },
        ]}
      />
      <SubmitButtonContainer />
      <FormWrapper>
        <OrganisationForm />
        <MemberList />
      </FormWrapper>
    </Layout>
  );
}

export default CreateFormPage;
