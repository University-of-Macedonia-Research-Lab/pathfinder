import { useRouter } from "next/navigation";
import { useGetUser } from "./api";
import { useEffect } from "react";

export const useAuth = (redirectTo: string = "") => {
  const router = useRouter();
  const { data: user, error, isLoading } = useGetUser();

  useEffect(() => {
    // If fetching is not yet finished, do nothing
    if (isLoading) return;
    // If not authenticated and there's a route to redirect to
    if (!user) {
      router.push("/dashboard/login");
    }

    // If authenticated and there's a route to redirect to
    if (user) {
      router.push("/dashboard");
    }
  }, [user, error, redirectTo, router, isLoading]);

  return { user, error, isLoading };
};
