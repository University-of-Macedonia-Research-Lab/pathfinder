import { useEffect, useState } from "react";
import { ListItemIcon } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { styled } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

import { StyledBody } from "./OrganisationForm";
const StyledLists = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MemberList = () => {
  const [members, setMembers] = useState<string[]>([""]);

  const handleMemberChange =
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newMembers = [...members];
      newMembers[index] = event.target.value;
      setMembers(newMembers);
    };

  const handleDelete = (index: number) => () => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  useEffect(() => {
    const newMembers = [...members];
    // if last element of members is not empty then add an empty record at the end
    if (newMembers.length === 0 || newMembers[newMembers.length - 1] !== "") {
      newMembers.push("");
    }

    // if the two last elements are empty then remove the last element
    if (
      newMembers.length >= 2 &&
      newMembers[newMembers.length - 1] === "" &&
      newMembers[newMembers.length - 2] === ""
    ) {
      newMembers.pop();
    }
    // update the members state only when length is different
    if (newMembers.length !== members.length) setMembers(newMembers);
  }, [members]);

  return (
    <StyledBody>
      <Typography variant="h5" gutterBottom>
        Members
      </Typography>
      {members.map((member, index) => (
        <StyledLists key={index}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="large" />
          </ListItemIcon>
          <TextField
            fullWidth
            label="email"
            value={member}
            onChange={handleMemberChange(index)}
            placeholder="Enter email..."
          />

          {index < members.length - 1 && (
            <IconButton>
              <DeleteIcon onClick={handleDelete(index)} />
            </IconButton>
          )}
        </StyledLists>
      ))}
    </StyledBody>
  );
};

export default MemberList;
