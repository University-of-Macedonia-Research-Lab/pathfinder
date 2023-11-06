"use client";
import { styled } from "@mui/material/styles";
import OrganisationForm from "../../../../components/OrganisationForm";
import Layout from "../../../../components/Layout";
import MemberList from "../../../../components/MemberList";
import Breadcrumb from "../../../../components/Breadcrumb";
import SubmitContainer from "../../../../components/SubmitContainer";

const FormWrapper = styled("div")`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
`;

function CreateFormPage() {
  return (
    <Layout active="organisations">
      <Breadcrumb
        items={[
          { label: "Organisations", path: "/dashboard/organisations" },
          { label: "Create" },
        ]}
      />
      <SubmitContainer />
      <FormWrapper>
        <OrganisationForm />
        <MemberList />
      </FormWrapper>
    </Layout>
  );
}

export default CreateFormPage;
