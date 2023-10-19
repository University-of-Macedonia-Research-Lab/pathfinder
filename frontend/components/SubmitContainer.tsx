import { PrimaryButton } from "./Buttons";
import { styled } from "@mui/material/styles";

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
  const handleSubmit = () => {
    console.log("Submitted");
  };

  const handleCancel = () => {
    console.log("Canceled");
  };

  return (
    <SubmitContainer>
      <CancelButton type="button" variant="outlined" onClick={handleCancel}>
        Cancel
      </CancelButton>
      <PrimaryButton type="submit" variant="contained" onClick={handleSubmit}>
        Submit
      </PrimaryButton>
    </SubmitContainer>
  );
};

export default SubmitButtonContainer;
