"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectBasedOnRole = async () => {
      if (!isPending && session?.user) {
        try {
          // Get user role from our custom users table
          const response = await fetch("/api/users/me", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            
            // Redirect based on role
            switch (userData.role) {
              case "admin":
                router.push("/admin");
                break;
              case "employee":
                router.push("/employee");
                break;
              case "manager":
              case "cfo":
              case "director":
              case "finance":
                router.push("/manager");
                break;
              default:
                router.push("/sign-in");
            }
          } else {
            router.push("/sign-in");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          router.push("/sign-in");
        } finally {
          setLoading(false);
        }
      } else if (!isPending && !session?.user) {
        router.push("/sign-in");
      }
    };

    redirectBasedOnRole();
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}