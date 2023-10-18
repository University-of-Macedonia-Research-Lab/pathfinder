import React, { useEffect, useState } from "react";
import { List, ListItem, ListItemIcon } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { styled } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import TextField from "@mui/material/TextField";
import { StyledBody } from "./BasicSettings";
const StyledLists = styled("div")`
  margin-bottom: 10px;
  padding: 3px;
`;

export const MemberList = () => {
  const [members, setMembers] = useState<string[]>(["", ""]);

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

    // if the two last elements ar empty then remove the last element
    if (
      newMembers.length >= 2 &&
      newMembers[newMembers.length - 1] === "" &&
      newMembers[newMembers.length - 2] === ""
    ) {
      newMembers.pop();
    }

    setMembers(newMembers);
  }, [members]);

  return (
    <StyledBody>
      <List>
        <StyledLists>
          <div>
            {members.map((member, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <TextField
                  label="email"
                  value={member}
                  onChange={handleMemberChange(index)}
                  placeholder="Enter email..."
                />
                <DeleteIcon onClick={handleDelete(index)}></DeleteIcon>
              </ListItem>
            ))}
          </div>
        </StyledLists>
      </List>
    </StyledBody>
  );
};
