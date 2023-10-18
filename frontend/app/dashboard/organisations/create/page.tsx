// "use client";
// import { styled } from "@mui/material";
// import colors from "../../../../helpers/colors";
// import Layout from "../../../../components/Layout";
// import Breadcrumbs from "../../../../components/Breadcrumb";
// import { FC } from "react";
// import {
//   createOrganisation,
//   useGetOrganisations,
// } from "../../../../helpers/api";
// import { useFormik } from "formik";
// import LinkIcon from "@mui/icons-material/Link";
// import { MemberList } from "../../../../components/MemberList";
// import Dropzone from "../../../../components/Dropzone";
// import { PrimaryButton } from "../../../../components/Buttons";
// import { TextField } from "@mui/material";
// import { names } from "tinycolor2";
// import { redirect } from "next/dist/server/api-utils";
// import { useRouter } from "next/navigation";
// export interface Organisation {
//   id: string;
//   name: string;
//   friendlyName: string;
// }

// const StyledContainer = styled("div")`
//    flex-grow: 1;
//    display: flex;
//    flex-direction: column;
//    overflow: auto;
//    color: ${colors.black.tone1};
//    padding:20px
//    margin: 20px;

//  }
//  `;
// const StyledHeader = styled("div")`
//   display: flex;
//   flex-direction: row;
//   justify-content: space-between;
//   padding: 20px;
// `;

// const StyledBody = styled("div")`
//   display: flex;
//   padding: 30px;
//   flex-direction: column;
//   background: #f5f5f5;
//   width: 574px;
//   height: 322px;
//   border-radius: 20px;
//   padding: 40px;
//   margin: 20px;
// `;

// const ValidateMessage = styled("div")`
//   color: red;
// `;

// const StyledTextField = styled(TextField)`
//   margin-bottom: 20px;
// `;

// const SignUpContainer = styled("div")`
//   form {
//     display: flex;
//     flex-wrap: wrap;
//     width: 70%;
//     margin: 0px;
//     margin-left: 0px;

//     label {
//       display: inline-block;
//       color: #000;
//       font-size: 16px;
//       font-style: normal;
//       font-weight: 400;
//       line-height: normal;
//       width: 100px;
//     }
//   }
// `;

// const OrganisationForm: FC = () => {
//   const { data: organisations, error } = useGetOrganisations();
//   const router = useRouter();

//   const formik = useFormik({
//     validateOnChange: false,
//     validateOnBlur: false,
//     initialValues: {
//       name: "",
//       friendlyName: "",
//     },
//     validate: (values) => {
//       let errors: Partial<typeof values> = {};

//       if (!values.name) {
//         errors.name = "Please enter your name!";
//       }

//       if (!values.friendlyName) {
//         errors.friendlyName = "Please enter a valid URL!";
//       }
//       return errors;
//     },
//     onSubmit: async (values) => {
//       try {
//         await createOrganisation(values, organisations);
//         router.push("/dashboard");
//       } catch (err) {
//         console.error(err);
//       }
//     },
//   });

//   if (error) return <div>Failed to load</div>;
//   if (!organisations) return <div>Loading...</div>;

//   return (
//     <Layout active="organisations">
//       <StyledContainer>
//         <StyledHeader>
//           <Breadcrumbs
//             items={[
//               { label: "Organisations", path: "/dashboard/organisations" },
//               { label: "Create" },
//             ]}
//           />
//         </StyledHeader>
//         <StyledBody>
//           <SignUpContainer>
//             <form onSubmit={formik.handleSubmit}>
//               <StyledTextField
//                 label="Name"
//                 name="name"
//                 variant="outlined"
//                 fullWidth
//                 placeholder="Please enter the name"
//                 value={formik.values.name}
//                 onChange={formik.handleChange}
//               />
//               {formik.errors.name ? (
//                 <ValidateMessage>{formik.errors.name}</ValidateMessage>
//               ) : null}

//               <StyledTextField
//                 label="URL Alias"
//                 name="friendlyName"
//                 variant="outlined"
//                 fullWidth
//                 placeholder="https:pathfinder/"
//                 value={formik.values.friendlyName}
//                 onChange={formik.handleChange}
//               />
//               {formik.errors.friendlyName ? (
//                 <ValidateMessage>{formik.errors.friendlyName}</ValidateMessage>
//               ) : null}
//             </form>
//           </SignUpContainer>
//         </StyledBody>
//         <StyledBody>
//           <MemberList />
//         </StyledBody>
//         <PrimaryButton type="submit" variant="contained">
//           Submit
//         </PrimaryButton>
//       </StyledContainer>
//     </Layout>
//   );
// };
// export default OrganisationForm;
"use client";
import OrganisationForm from "../../../../components/BasicSettings";
import Layout from "../../../../components/Layout";
import { MemberList } from "../../../../components/MemberList";
import React from "react";
import Breadcrumbs from "../../../../components/Breadcrumb";
import { PrimaryButton } from "../../../../components/Buttons";
import { styled } from "@mui/material";
import {
  StyledContainer,
  StyledHeader,
  StyledBody,
  SignUpContainer,
} from "../../../../components/BasicSettings";

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
