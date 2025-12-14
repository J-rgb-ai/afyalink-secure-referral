import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminDashboard from "@/components/dashboards/AdminDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import NurseDashboard from "@/components/dashboards/NurseDashboard";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data } = await import("@/lib/api").then(m => m.authApi.me());
      
      const user = data.user;
      setUserEmail(user.email || "");
      setUserStatus(user.status || "pending");

      // Only fetch roles if user is active
      if (user.status === "active") {
        setUserRoles(user.roles || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await import("@/lib/api").then(m => m.authApi.logout());
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleCheckStatus = async () => {
    setLoading(true);
    await fetchUserData();
  };

  // Show pending approval message if user is not active
  if (userStatus !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your account is currently awaiting approval from an administrator. 
              You will be able to access the system once your account has been activated.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <Mail className="h-4 w-4" />
              <span>{userEmail}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Please check back later or contact the administrator if you need immediate access.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleCheckStatus} className="w-full">
                Check Status
              </Button>
              <Button variant="outline" onClick={handleLogout} className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render dashboard based on highest priority role
  if (userRoles.includes("admin")) {
    return <AdminDashboard />;
  } else if (userRoles.includes("doctor")) {
    return <DoctorDashboard />;
  } else if (userRoles.includes("nurse")) {
    return <NurseDashboard />;
  } else if (userRoles.includes("patient")) {
    return <PatientDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">No Role Assigned</h2>
        <p className="text-muted-foreground">
          Please contact an administrator to assign you a role.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;