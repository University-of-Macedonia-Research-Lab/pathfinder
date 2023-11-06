import { useContext } from "react";
import { styled } from "@mui/material/styles";
import { PrimaryButton } from "./Buttons";
import { SubmitContext } from "../app/contexts/SubmitContext";

const SubmitContainer = styled("div")`
  display: flex;
  justify-content: flex-end;
  gap: 20px;
`;

const CancelButton = styled(PrimaryButton)`
  background-color: white;
  color: #2f8658;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  border-width: 1px;
  border-color: #2f8658;
  &:hover {
    background-color: whitesmoke;
    border-color: #2f8658;
  }
`;

const SubmitButtonContainer = () => {
  // const { handleSubmit, handleCancel } = useContext(SubmitContext);

  return (
    <SubmitContainer>
      <CancelButton
        type="button"
        variant="outlined"
        onClick={() => console.log("")}
      >
        Cancel
      </CancelButton>
      <PrimaryButton
        type="submit"
        variant="contained"
        onClick={() => console.log("")}
      >
        Submit
      </PrimaryButton>
    </SubmitContainer>
  );
};

export default SubmitButtonContainer;
