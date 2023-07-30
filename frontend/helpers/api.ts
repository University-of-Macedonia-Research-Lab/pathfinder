import useSWR, { mutate } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("An error occurred while fetching the data.");
  }
  return res.json();
};

export const useGetUser = () => {
  return useSWR(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user`, fetcher);
};

export const logoutUser = async () => {
  return await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logout`, {
    method: "POST",
    credentials: "include",
  }).then(() => mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user`, null));
};

export const loginUser = async () => {
  return await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`, {
    method: "GET",
    credentials: "include",
  });
};
