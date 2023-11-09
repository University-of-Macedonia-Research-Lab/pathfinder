import { styled } from "@mui/material";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const StyledContainer = styled("div")`
  padding: 20px;
  margin: 0 auto;
  margin-top: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 400px;
  background-color: #f5f5f5;
  border-radius: 200px;
  border: 1px dashed black;
  aspect-ration: 1 /1;
`;

const ContentContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Dropzone = () => {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      setFiles((previousFiles) => [
        ...previousFiles,
        ...acceptedFiles.map((file) =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        ),
      ]);
    }

    console.log("Accepted Files:", acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
  });

  return (
    <StyledContainer>
      <ContentContainer>
        <section className="section">
          <h1 className="title text-3xl font-bold">Upload File</h1>
        </section>
        <div {...getRootProps({})}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>
              Drag &apos;n&apos; drop some files here, or click to select files
            </p>
          )}
        </div>
      </ContentContainer>
    </StyledContainer>
  );
};

export default Dropzone;
