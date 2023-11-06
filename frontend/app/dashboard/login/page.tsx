"use client";
import styled from "@emotion/styled";
import { Button } from "@mui/material";
import Image from "next/image";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "../../../helpers/hooks";
import colors from "../../../helpers/colors";
import Loader from "../../../components/Loader";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${colors.green.tone0};
`;

const Panel = styled.div`
  background: white;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
`;

const LoginPanel = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  background-color: ${colors.green.tone0};
  color: ${colors.pink.tone3};
  justify-content: flex-start;
  padding-top: 100px;
  gap: 40px;
  & > img {
    padding: 40px;
  }
`;

const LoginButton = styled(Button)`
  background-color: transparent;
  color: ede2e8;
  padding: 10px 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid white;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Description = styled.p`
  color: white;
  font-size: 1.2rem;
  text-align: center;
  max-width: 300px;
`;

const Login = () => {
  const { isLoading } = useAuth(false);

  const handleLogin = () => {
    if (!window) return;
    window.location.replace(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`
    );
  };

  if (isLoading) return <Loader />;

  return (
    <Container>
      <Panel>
        <Image
          src="/login.png"
          alt="Next.js Logo"
          width={400}
          height={400}
          priority
        />
      </Panel>
      <Panel>
        <LoginPanel>
          <Image
            src="/PathFinder.svg"
            alt="Next.js Logo"
            width={400}
            height={120}
            priority
          />
          <Description>
            Your journey starts here. Discover new paths with us.
          </Description>

          <LoginButton
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleLogin}
          >
            Login with Google
          </LoginButton>
        </LoginPanel>
      </Panel>
    </Container>
  );
};

export default Login;
