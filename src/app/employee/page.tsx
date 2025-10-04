"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, LogOut, Loader2 } from "lucide-react";
import EmployeeExpenseForm from "@/components/employee/EmployeeExpenseForm";
import EmployeeExpenseHistory from "@/components/employee/EmployeeExpenseHistory";
import ChangePassword from "@/components/common/ChangePassword";
import { authClient } from "@/lib/auth-client";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isPending && session?.user) {
        try {
          const response = await fetch("/api/users/me", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            
            if (userData.role !== "employee") {
              router.push("/dashboard");
              return;
            }

            setCurrentUser(userData);
          } else {
            router.push("/sign-in");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          router.push("/sign-in");
        } finally {
          setLoading(false);
        }
      } else if (!isPending && !session?.user) {
        router.push("/sign-in");
      }
    };

    fetchUserData();
  }, [session, isPending, router]);

  const handleExpenseSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");

    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (!error) {
      localStorage.removeItem("bearer_token");
      router.push("/sign-in");
    }
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {currentUser?.name}</p>
          </div>
          <div className="flex gap-2">
            <ChangePassword />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="submit">
              <FileText className="mr-2 h-4 w-4" />
              Submit Expense
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Expense History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="space-y-6">
            <EmployeeExpenseForm onSuccess={handleExpenseSubmitted} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <EmployeeExpenseHistory refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}