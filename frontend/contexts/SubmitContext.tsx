import { ReactNode, createContext } from "react";

interface ProviderProps {
  handleSubmit?: () => void;
  handleCancel?: () => void;
}
const SubmitContext = createContext<ProviderProps>({});

interface Props {
  children: ReactNode;
}

const SubmitProvider = ({ children }: Props) => {
  const handleSubmit = () => {
    debugger;
    console.log("Submitted");
  };

  const handleCancel = () => {
    debugger;
    console.log("Canceled");
  };

  return (
    <SubmitContext.Provider value={{ handleSubmit, handleCancel }}>
      {children}
    </SubmitContext.Provider>
  );
};

export { SubmitContext, SubmitProvider };
