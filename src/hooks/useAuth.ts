import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: student, isLoading } = trpc.student.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.student.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("onou_session_token");
      utils.student.me.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    student: student ?? null,
    isLoading,
    isAuthenticated: !!student,
    logout,
  };
}
