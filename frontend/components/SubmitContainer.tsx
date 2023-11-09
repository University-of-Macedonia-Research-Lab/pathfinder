import { styled } from "@mui/material/styles";
import { PrimaryButton } from "./Buttons";

const StyledWrapper = styled("div")`
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

const SubmitContainer = ({
  handleSubmit,
  handleCancel,
}: {
  handleSubmit?: () => void;
  handleCancel: () => void;
}) => {
  return (
    <StyledWrapper>
      <CancelButton type="button" variant="outlined" onClick={handleCancel}>
        Cancel
      </CancelButton>
      <PrimaryButton
        type="submit"
        variant="contained"
        onClick={() => handleSubmit?.()}
      >
        Submit
      </PrimaryButton>
    </StyledWrapper>
  );
};

export default SubmitContainer;
