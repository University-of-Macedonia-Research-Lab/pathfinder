import { ReactNode, createContext, useState } from "react";
import { Organisation } from "../components/OrganisationForm";

interface ProviderProps {
  organisation?: Organisation;
  setOrganisation?: React.Dispatch<React.SetStateAction<Organisation>>;
}
const SubmitContext = createContext<ProviderProps>({});

interface Props {
  children: ReactNode;
}

const SubmitProvider = ({ children }: Props) => {
  const [organisation, setOrganisation] = useState<Organisation>({
    name: "",
    friendlyName: "",
    members: [],
  });

  return (
    <SubmitContext.Provider value={{ organisation, setOrganisation }}>
      {children}
    </SubmitContext.Provider>
  );
};

export { SubmitContext, SubmitProvider };
