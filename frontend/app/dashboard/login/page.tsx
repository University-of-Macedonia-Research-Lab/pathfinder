"use client";
import styled from "@emotion/styled";
import { Button } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import useSWR from "swr";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #48af74;
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
  background: #2f8658;
  color: #ede2e8;
  justify-content: flex-start;
  & > img {
    padding: 40px;
  }
`;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("An error occurred while fetching the data.");
  }
  return res.json();
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { data, error } = useSWR("/api/user", fetcher);
  const user = data?.user;

  const handleLogin = () => {
    debugger; // eslint-disable-line
    window.location.replace(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`
    );
  };

  // If the user is already logged in, redirect to the home page
  useEffect(() => {
    if (user) {
      window.location.replace("/");
    }
    setIsLoading(false);
  }, [user]);

  // if (error) {
  //   console.error(error);
  //   return <div>Failed to load user</div>;
  // }
  if (isLoading) return <div>Loading...</div>;

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
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login with Google
          </Button>
        </LoginPanel>
      </Panel>
    </Container>
  );
};

export default Login;
