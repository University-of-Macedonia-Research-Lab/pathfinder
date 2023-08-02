import { useRouter } from "next/navigation";
import { useGetUser } from "./api";
import { useEffect } from "react";

export const useAuth = (authenticatedRoute: boolean = true) => {
  const router = useRouter();
  const { data: user, error, isLoading } = useGetUser();

  useEffect(() => {
    console.log("useAuth", user, error, isLoading);
    // If fetching is not yet finished, do nothing
    if (isLoading) return;
    // If not authenticated and there's a route to redirect to
    if (!user && authenticatedRoute) {
      router.push("/dashboard/login");
    }

    // If authenticated and there's a route to redirect to
    if (user && !authenticatedRoute) {
      router.push("/dashboard");
    }
  }, [user, error, authenticatedRoute, router, isLoading]);

  return { user, error, isLoading };
};
