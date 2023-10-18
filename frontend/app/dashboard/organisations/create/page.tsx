"use client";
import OrganisationForm from "../../../../components/BasicSettings";
import Layout from "../../../../components/Layout";
import { MemberList } from "../../../../components/MemberList";
import React from "react";
import Breadcrumbs from "../../../../components/Breadcrumb";
import { PrimaryButton } from "../../../../components/Buttons";

function CreateFormPage() {
  return (
    <Layout active="organisations">
      <Breadcrumbs
        items={[
          { label: "Organisations", path: "/dashboard/organisations" },
          { label: "Create" },
        ]}
      />
      <OrganisationForm />
      <MemberList />
      <PrimaryButton type="submit" variant="contained">
        Submit
      </PrimaryButton>
    </Layout>
  );
}

export default CreateFormPage;
