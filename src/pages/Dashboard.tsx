import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed,
  LogOut,
  Loader2,
  MapPin,
  Home,
  Check,
  CalendarDays,
  Sun,
  Moon,
  Coffee,
  ArrowRight,
  ClipboardList,
  CircleAlert,
} from "lucide-react";

const mealTypes = [
  { value: 1, label: "Breakfast", icon: Coffee },
  { value: 2, label: "Lunch", icon: Sun },
  { value: 3, label: "Dinner", icon: Moon },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { student, isLoading: authLoading, logout } = useAuth();
  const [selectedDepot, setSelectedDepot] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<number>(3);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: depots, isLoading: depotsLoading } = trpc.depot.list.useQuery(
    undefined,
    { enabled: !!student, retry: false }
  );

  const reserveMutation = trpc.reservation.create.useMutation({
    onSuccess: (data) => {
      setToast({
        type: data.success ? "success" : "error",
        message: data.message,
      });
      setTimeout(() => setToast(null), 5000);
      if (data.success) {
        setSelectedDepot(null);
      }
    },
    onError: (error) => {
      setToast({ type: "error", message: error.message });
      setTimeout(() => setToast(null), 5000);
    },
  });

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

  const selectedDepotName = depots?.find((d) => d.id === selectedDepot)
    ? (depots.find((d) => d.id === selectedDepot)?.nameEN || depots.find((d) => d.id === selectedDepot)?.nameFR || "Depot")
    : "";

  const handleReserve = () => {
    if (!selectedDepot || !selectedDate) return;
    reserveMutation.mutate({
      date: selectedDate,
      mealType: selectedMealType,
      depotId: selectedDepot,
      depotName: selectedDepotName,
    });
  };

  // Calculate min/max dates
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4 fade-in duration-300">
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm",
              toast.type === "success" ? "bg-[#16a34a]" : "bg-[#dc2626]"
            )}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <CircleAlert className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      )}

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
              onClick={() => navigate("/history")}
              className="text-[#64748b] hover:text-[#0f172a]"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              History
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

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Welcome Card */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Welcome back!</h1>
          <p className="text-sm text-[#64748b]">
            Student ID: <span className="font-medium text-[#0f172a]">{student.studentId}</span>
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-[#64748b]">
            {student.wilaya && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Wilaya {student.wilaya}
              </span>
            )}
            {student.residence && (
              <span className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Residence {student.residence}
              </span>
            )}
          </div>
        </div>

        <Separator className="bg-[#e2e8f0]" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Depot Selection */}
          <Card className="border border-[#e2e8f0] shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#2563eb]" />
                Select Restaurant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {depotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
                </div>
              ) : !depots || depots.length === 0 ? (
                <div className="text-center py-8 text-[#64748b] text-sm">
                  No depots available for your residence.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                  {depots.map((depot, i) => (
                    <button
                      key={depot.id}
                      onClick={() => setSelectedDepot(depot.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 animate-in fade-in slide-in-from-left-2",
                        selectedDepot === depot.id
                          ? "border-[#2563eb] bg-[#eff6ff] ring-1 ring-[#2563eb]"
                          : "border-[#e2e8f0] bg-white hover:border-[#94a3b8] hover:shadow-sm"
                      )}
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                    >
                      <span className="text-sm font-medium text-[#0f172a]">
                        {depot.nameEN || depot.nameFR || depot.nameAR || `Depot ${depot.id}`}
                      </span>
                      {selectedDepot === depot.id && (
                        <Check className="h-4 w-4 text-[#2563eb]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reservation Form */}
          <Card className="border border-[#e2e8f0] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#2563eb]" />
                Make Reservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-11 border-[#e2e8f0] focus-visible:ring-[#2563eb]"
                />
                <p className="text-xs text-[#94a3b8]">
                  You can reserve up to 4 days in advance
                </p>
              </div>

              {/* Meal Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Meal Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {mealTypes.map((meal) => {
                    const Icon = meal.icon;
                    return (
                      <button
                        key={meal.value}
                        onClick={() => setSelectedMealType(meal.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all duration-200",
                          selectedMealType === meal.value
                            ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] ring-1 ring-[#2563eb]"
                            : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#94a3b8]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {meal.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Depot */}
              {selectedDepot && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-sm font-medium">Selected Restaurant</Label>
                  <div className="mt-1 p-2.5 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] text-sm text-[#0f172a]">
                    {selectedDepotName}
                  </div>
                </div>
              )}

              {/* Reserve Button */}
              <Button
                onClick={handleReserve}
                disabled={!selectedDepot || !selectedDate || reserveMutation.isPending}
                className="w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium disabled:opacity-50"
              >
                {reserveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reserving...
                  </>
                ) : (
                  <>
                    Reserve Meal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
