"use client";
import { styled } from "@mui/material";
import Layout from "../../../../components/Layout";
import colors from "../../../../helpers/colors";
import Breadcrumb from "../../../../components/Breadcrumb";
import { useGetOrganisationById } from "../../../../helpers/api";

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

export default function Index({
  params,
}: {
  params: { organisationId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Access route parameter
  const { data: organisation, error } = useGetOrganisationById(
    params.organisationId
  );

  return (
    <Layout active="organisations">
      <StyledContainer>
        <StyledHeader>
          <Breadcrumb
            items={[
              { label: "Organisations", path: "/dashboard/organisations/" },
              {
                label: organisation?.name,
                path: "/dashboard/organisations/",
              },
            ]}
          />
        </StyledHeader>
        <StyledBody>
          <p>View organization</p>
          <p>{organisation?.name}</p>
          <p>{organisation?.friendlyName}</p>
        </StyledBody>
      </StyledContainer>
    </Layout>
  );
}
