import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed,
  LogOut,
  Loader2,
  ArrowLeft,
  ClipboardList,
  CalendarDays,
  Coffee,
  Sun,
  Moon,
  Clock,
} from "lucide-react";

const mealLabels: Record<number, { label: string; icon: typeof Coffee; color: string }> = {
  1: { label: "Breakfast", icon: Coffee, color: "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]" },
  2: { label: "Lunch", icon: Sun, color: "bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]" },
  3: { label: "Dinner", icon: Moon, color: "bg-[#ede9fe] text-[#5b21b6] border-[#c4b5fd]" },
};

const statusColors: Record<string, string> = {
  success: "bg-[#dcfce7] text-[#166534] border-[#86efac]",
  failed: "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]",
  pending: "bg-[#fef9c3] text-[#854d0e] border-[#fde047]",
};

export default function History() {
  const navigate = useNavigate();
  const { student, isLoading: authLoading, logout } = useAuth();
  const { data: history, isLoading: historyLoading } = trpc.reservation.history.useQuery(
    undefined,
    { enabled: !!student }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (!student) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#e2e8f0] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-[#0f172a] text-base">ONOU Meals</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-[#64748b] hover:text-[#0f172a]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-[#64748b] hover:text-[#dc2626]"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-1 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[#2563eb]" />
            Reservation History
          </h1>
          <p className="text-sm text-[#64748b]">
            Track your past meal reservations
          </p>
        </div>

        <Separator className="bg-[#e2e8f0] my-5" />

        {historyLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#2563eb]" />
          </div>
        ) : !history || history.length === 0 ? (
          <Card className="border border-[#e2e8f0] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-[#94a3b8]" />
              </div>
              <p className="text-[#64748b] text-sm font-medium">No reservations yet</p>
              <p className="text-[#94a3b8] text-xs mt-1">
                Make your first reservation from the dashboard
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="mt-4 border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff]"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item, i) => {
              const mealInfo = mealLabels[item.mealType] || mealLabels[3];
              const MealIcon = mealInfo.icon;
              const statusColor = statusColors[item.status] || statusColors.pending;

              return (
                <Card
                  key={item.id}
                  className="border border-[#e2e8f0] shadow-sm animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    animationDelay: `${i * 40}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center border shrink-0",
                            mealInfo.color
                          )}
                        >
                          <MealIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#0f172a]">
                              {mealInfo.label}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-medium border", statusColor)}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b]">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {item.reservationDate}
                            </span>
                            {item.depotName && (
                              <span className="flex items-center gap-1">
                                <UtensilsCrossed className="h-3 w-3" />
                                {item.depotName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#94a3b8] shrink-0">
                        <Clock className="h-3 w-3" />
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
