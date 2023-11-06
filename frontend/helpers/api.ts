import useSWR, { mutate } from "swr";
import { Organisation } from "../components/OrganisationForm";
const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshWhenOffline: false,
  refreshWhenHidden: false,
  refreshInterval: 0,
};
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("An error occurred while fetching the data.");
  }
  return res.json();
};

export const useGetUser = () => {
  return useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user`,
    fetcher,
    swrOptions
  );
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

interface NewOrganisationData {
  name: string;
  friendlyName: string;
}

export const createOrganisation = async (
  newOrganisationData: NewOrganisationData,
  organisations: Organisation[]
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/organisations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(newOrganisationData),
    }
  );

  // Ensure the request was successful
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  // Get the data from the response
  const data = await response.json();

  // Perform the local update
  mutate("/api/organisations", [...organisations, data], false);

  return data;
};

export const useGetOrganisations = () => {
  return useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/organisations`,
    fetcher,
    swrOptions
  );
};

export const useGetOrganisationById = (id: string) => {
  return useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/organisations/${id}`,
    fetcher,
    swrOptions
  );
};
