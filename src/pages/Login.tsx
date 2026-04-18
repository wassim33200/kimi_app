import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UtensilsCrossed, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.student.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("onou_session_token", data.token);
      window.location.href = "/dashboard";
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !password.trim()) return;
    loginMutation.mutate({ studentId: studentId.trim(), password });
  };

  const isLoading = loginMutation.isPending;
  const error = loginMutation.error?.message;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2563eb] mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">ONOU Meal Reservation</h1>
          <p className="text-[#64748b] mt-2 text-sm">Reserve your university meals with ease</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Student Login</CardTitle>
            <CardDescription className="text-sm">
              Enter your WebEtu credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium">
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-[#e2e8f0] focus-visible:ring-[#2563eb]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-[#e2e8f0] focus-visible:ring-[#2563eb]"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#94a3b8] mt-6">
          Authenticates via the Algerian Ministry of Higher Education (WebEtu)
        </p>
      </div>
    </div>
  );
}
