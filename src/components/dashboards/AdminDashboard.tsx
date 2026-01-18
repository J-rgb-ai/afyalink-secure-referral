import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, dataApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Users, ClipboardList, TrendingUp, Bell, Search, Settings, LogOut,
  CheckCircle, Clock, X, AlertTriangle, Shield, FileText, Building2,
  UserCircle, Ban, UserCheck, UserX, MoreVertical, Code, Activity, ChevronDown
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSettings from "./settings/AdminSettings";
import AdminReports from "./reports/AdminReports";

interface UserRowProps {
  id: string;
  name: string;
  email: string;
  role: string;
  facility: string;
  status: string;
  lastActive: string;
  onAssignFacility: (userId: string) => void;
}

function UserRow({ id, name, email, role, facility, status, lastActive, onAssignFacility }: UserRowProps) {
  const [showActions, setShowActions] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20">
            <CheckCircle size={14} className="mr-1" />
            Active
          </Badge>
        );
      case "Suspended":
        return (
          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
            <AlertTriangle size={14} className="mr-1" />
            Suspended
          </Badge>
        );
      case "Deactivated":
        return (
          <Badge variant="destructive">
            <X size={14} className="mr-1" />
            Deactivated
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleAction = (action: string) => {
    setCurrentStatus(action);
    setShowActions(false);
  };

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-semibold text-foreground">{name}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-muted-foreground">{email}</td>
      <td className="py-4 px-4">
        <Badge variant="secondary">{role}</Badge>
      </td>
      <td className="py-4 px-4 text-muted-foreground">{facility}</td>
      <td className="py-4 px-4">{getStatusBadge(currentStatus)}</td>
      <td className="py-4 px-4 text-muted-foreground text-sm">{lastActive}</td>
      <td className="py-4 px-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical size={20} />
          </Button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border z-10">
              {onAssignFacility && (!facility || facility === "Unassigned" || facility === "N/A") && (
              <button
                onClick={() => {
                  onAssignFacility(id);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted text-left"
              >
                <Building2 size={18} className="text-primary" />
                <span>Assign Facility</span>
              </button>
              )}
              <button
                onClick={() => handleAction("Active")}
                disabled={currentStatus === "Active"}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck size={18} className="text-success" />
                <span>Activate</span>
              </button>
              <button
                onClick={() => handleAction("Suspended")}
                disabled={currentStatus === "Suspended"}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban size={18} className="text-warning" />
                <span>Suspend</span>
              </button>
              <button
                onClick={() => handleAction("Deactivated")}
                disabled={currentStatus === "Deactivated"}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted text-left border-t disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserX size={18} className="text-destructive" />
                <span>Deactivate</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: string[];
}

interface HealthcareProvider {
  id: string;
  full_name: string;
  email: string;
  status: string;
  role: string;
  facility_name?: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // New Facility State
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: "",
    type: "",
    level: "",
    address: "",
    contact: ""
  });

  const handleAddFacility = () => {
    if (!newFacility.name || !newFacility.type) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const facilityToAdd = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFacility.name,
      type: newFacility.type,
      facility_levels: {
        level: parseInt(newFacility.level) || 1,
        name: `Level ${newFacility.level}`
      },
      address: newFacility.address,
      rating: 0,
      status: "active"
    };

    setDbFacilities([facilityToAdd, ...dbFacilities]);
    setIsAddFacilityOpen(false);
    setNewFacility({ name: "", type: "", level: "", address: "", contact: "" });
    toast({
      title: "Success",
      description: "Facility added successfully",
    });
  };
  const [notifications, setNotifications] = useState(3);
  const [usersOpen, setUsersOpen] = useState(false);
  const [facilitiesOpen, setFacilitiesOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReferrals: 0,
    totalCodes: 0,
    pendingReferrals: 0,
    pendingUsers: 0,
  });
  const [newCode, setNewCode] = useState({ code: "", role: "patient" });
  const [dbFacilities, setDbFacilities] = useState<any[]>([]);
  const [facilityLevels, setFacilityLevels] = useState<any[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [activatingUsers, setActivatingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [activatedUsers, setActivatedUsers] = useState<Set<string>>(new Set());
  const [healthcareProviders, setHealthcareProviders] = useState<HealthcareProvider[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: "", message: "", recipient: "all" });
  const [sendingNotification, setSendingNotification] = useState(false);


  // Facility Assignment State
  const [isAssignFacilityOpen, setIsAssignFacilityOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState<HealthcareProvider | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  const openAssignFacility = (userId: string) => {
    let user = healthcareProviders.find(u => u.id === userId);
    if (!user) {
      const patient = patients.find(p => p.id === userId);
      if (patient) {
        user = { ...patient, role: 'patient' };
      }
    }

    if (user) {
      setAssigningUser(user);
      setIsAssignFacilityOpen(true);
    }
  };

  const handleAssignFacilitySubmit = async () => {
    if (!assigningUser || !selectedFacilityId) return;

    try {
      await dataApi.assignFacility(assigningUser.id, {
        facilityId: selectedFacilityId,
        role: assigningUser.role
      });

      toast({
        title: "Facility Assigned",
        description: `Assigned ${assigningUser.full_name} to facility.`
      });

      setIsAssignFacilityOpen(false);
      setAssigningUser(null);
      setSelectedFacilityId("");
      fetchHealthcareProviders(); // Refresh list
      fetchPatients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.details || error.response?.data?.error || "Failed to assign facility",
        variant: "destructive"
      });
    }
  };






  useEffect(() => {
    fetchStats();
    fetchFacilityLevels();
    fetchFacilitiesByLevel();
    fetchPendingUsers();
    fetchReferrals();
    fetchHealthcareProviders();
    fetchPatients();
    fetchAllNotifications();
    fetchSentNotifications();
  }, []);

  useEffect(() => {
    if (activeTab.startsWith("facilities")) {
      fetchFacilitiesByLevel();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    setLoadingPendingUsers(true);
    try {
      const { data } = await dataApi.getPendingUsers();
      setPendingUsers(data || []);
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  const fetchReferrals = async () => {
    setLoadingReferrals(true);
    try {
      // NOTE: Admin might want ALL referrals without filtering by user?
      // My getReferrals filters by user roles. 
      // If user is Admin, my backend logic should probably return ALL referrals.
      // I should update backend getReferrals to check if Admin -> return all.
      // But for now let's call it.
      const { data } = await dataApi.getReferrals();
      setReferrals(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchHealthcareProviders = async () => {
    setLoadingProviders(true);
    try {
      const { data } = await dataApi.getHealthcareProviders();
      setHealthcareProviders(data || []);
    } catch (error) {
      console.error("Error fetching healthcare providers:", error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await dataApi.getPatients();
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAllNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data } = await dataApi.getNotifications();
      setAllNotifications(data || []);
      // Update unread count for the bell icon
      setNotifications(data ? data.filter((n: any) => !n.is_read).length : 0);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchSentNotifications = async () => {
    try {
      const { data } = await dataApi.getSentNotifications();
      setSentNotifications(data || []);
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await dataApi.markNotificationRead(id);
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setNotifications((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification read");
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = allNotifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await dataApi.markAllNotificationsRead();
      setAllNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setNotifications(0);
    } catch (error) {
      console.error("Failed to mark all notifications read");
    }
  };

  const sendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Error",
        description: "Please fill in title and message",
        variant: "destructive",
      });
      return;
    }

    setSendingNotification(true);
    try {
      await dataApi.sendNotification({
        title: newNotification.title,
        message: newNotification.message,
        recipient: newNotification.recipient
      });

      toast({
        title: "Success",
        description: `Notification sent`,
      });
      setNewNotification({ title: "", message: "", recipient: "all" });
      // Re-fetch to show the new notification if it was sent to self/admin, though in reality it goes to others
      // But we might want to see it in a "Sent" list? 
      // For now, assume this is for sending OUT. The bell shows RECEIVED.
      fetchSentNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    const selectedRole = selectedRoles[userId];

    // Check if user already has a role or admin selected one
    const user = pendingUsers.find(u => u.id === userId);
    const hasExistingRole = user?.roles && user.roles.length > 0;

    if (!hasExistingRole && !selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role for this user before activating.",
        variant: "destructive",
      });
      return;
    }

    setActivatingUsers(prev => new Set(prev).add(userId));
    try {
      await dataApi.activateUser(userId, selectedRole);

      // Show activated status
      setActivatingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setActivatedUsers(prev => new Set(prev).add(userId));

      toast({
        title: "User Activated",
        description: "The user can now log in to the system."
      });

      // Remove from pending list immediately - don't refetch
      setTimeout(() => {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setActivatedUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        // Clear the selected role for this user
        setSelectedRoles(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        fetchStats();
        fetchHealthcareProviders(); // Refresh providers list after activation
      }, 2000);
    } catch (error: any) {
      setActivatingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await dataApi.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const [securityStats, setSecurityStats] = useState({
    activeSessions: 0,
    failedLogins: 0,
    securityScore: 100,
    logs: [] as any[]
  });

  const fetchData = async () => {
    try {
      const usersRes = await dataApi.getHealthcareProviders(); // Using providers for now as users list
      // Ideally get all users or specific endpoint
      setHealthcareProviders(usersRes.data || []);

      const patientsRes = await dataApi.getPatients();
      setPatients(patientsRes.data || []);

      const facilitiesRes = await dataApi.getFacilities();
      setDbFacilities(facilitiesRes.data || []);

      const referralsRes = await dataApi.getReferrals();
      setReferrals(referralsRes.data || []);

      const statsRes = await dataApi.getAdminStats();
      if (statsRes.data) {
        const { active_referrals, pending_referrals, completed_referrals } = statsRes.data;
        // This part seems to be updating analyticsStats directly, which might conflict with the useMemo.
        // Assuming this is a temporary or intended override for some dashboard view.
        // If analyticsStats is meant to be derived solely from 'referrals' state, this block should be removed.
        // For now, I'll keep it as provided in the instruction.
        // setAnalyticsStats(prev => ({
        //     ...prev,
        //     currentCount: active_referrals + pending_referrals + completed_referrals, // simplistic total
        //     statusData: [
        //         { name: "Pending", count: pending_referrals, percent: 30 }, // percents are mock in backend for now or calc here
        //         { name: "Active", count: active_referrals, percent: 50 },
        //         { name: "Completed", count: completed_referrals, percent: 20 }
        //     ]
        // }));
      }

      // Fetch Security Stats
      try {
        const secRes = await dataApi.getSecurityStats();
        if (secRes.data) {
          setSecurityStats(secRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch security stats", err);
      }

    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const fetchFacilityLevels = async () => {
    try {
      const { data } = await dataApi.getFacilityLevels();
      setFacilityLevels(data || []);
    } catch (error) {
      console.error("Error fetching facility levels:", error);
    }
  };

  const fetchFacilitiesByLevel = async () => {
    setLoadingFacilities(true);
    try {
      const { data } = await dataApi.getFacilities();
      let facilities = data || [];

      // Filter by level if a specific level is selected (Client side filtering since API returns all)
      if (activeTab.includes("level-")) {
        // Logic to map tab name to level ID? 
        // Current API returns facilities with `level_id` and `facility_levels` object.
        // The tabs are hardcoded "level-6", etc.
        // Note: The facility_levels.level is a number.
        const levelNum = parseInt(activeTab.split("level-")[1]);
        facilities = facilities.filter((f: any) => f.facility_levels?.level === levelNum);
      }

      setDbFacilities(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    } finally {
      setLoadingFacilities(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataApi.createRegistrationCode({
        code: newCode.code,
        role: newCode.role
      });

      toast({ title: "Registration code created successfully" });
      setNewCode({ code: "", role: "patient" });
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast({ title: "Logged out successfully" });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Compute real counts from healthcare providers
  const providerCounts = {
    doctors: healthcareProviders.filter(p => p.role === 'doctor'),
    nurses: healthcareProviders.filter(p => p.role === 'nurse'),
    pharmacists: healthcareProviders.filter(p => p.role === 'pharmacist'),
    labTechnicians: healthcareProviders.filter(p => p.role === 'lab_technician'),
  };

  const roleCountStats = {
    doctors: { total: providerCounts.doctors.length, active: providerCounts.doctors.filter(p => p.status === 'active').length },
    nurses: { total: providerCounts.nurses.length, active: providerCounts.nurses.filter(p => p.status === 'active').length },
    patients: { total: patients.length, active: patients.filter(p => p.status === 'active').length },
    pharmacists: { total: providerCounts.pharmacists.length, active: providerCounts.pharmacists.filter(p => p.status === 'active').length },
    labTechnicians: { total: providerCounts.labTechnicians.length, active: providerCounts.labTechnicians.filter(p => p.status === 'active').length },
  };

  const dashboardStats = [
    { label: "Total Referrals", value: stats.totalReferrals.toString(), icon: ClipboardList, color: "bg-primary", change: "" },
    { label: "Active Facilities", value: dbFacilities.filter(f => f.status === "active").length.toString(), icon: Building2, color: "bg-success", change: "" },
    { label: "Total Users", value: stats.totalUsers.toString(), icon: UserCircle, color: "bg-accent", change: "" },
    { label: "Pending Referrals", value: stats.pendingReferrals.toString(), icon: Clock, color: "bg-warning", change: "" }
  ];

  const analyticsStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(currentMonth - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const currentMonthRefs = referrals.filter(r => {
      const d = new Date(r.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthRefs = referrals.filter(r => {
      const d = new Date(r.created_at);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const currentCount = currentMonthRefs.length;
    const lastCount = lastMonthRefs.length;
    const growth = lastCount > 0 ? ((currentCount - lastCount) / lastCount) * 100 : (currentCount > 0 ? 100 : 0);

    // Status Breakdown
    const statusCounts: Record<string, number> = {};
    referrals.forEach(r => {
      const s = r.status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts)
      .map(([name, count]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        count,
        percent: referrals.length > 0 ? Math.round((count / referrals.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Success Rate (Completed / Total)
    const completedCount = referrals.filter(r => r.status === 'completed').length;
    const successRate = referrals.length > 0 ? (completedCount / referrals.length) * 100 : 0;

    // Avg Processing Time (Completed only)
    const completedRefs = referrals.filter(r => r.status === 'completed' && r.updated_at);
    let avgTimeDays = 0;
    if (completedRefs.length > 0) {
      const totalTimeMs = completedRefs.reduce((acc, r) => {
        return acc + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime());
      }, 0);
      avgTimeDays = totalTimeMs / (completedRefs.length * 1000 * 60 * 60 * 24);
    }

    return {
      currentCount,
      lastCount,
      growth,
      statusData,
      successRate,
      avgTimeDays
    };
  }, [referrals]);


  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground flex flex-col">
        <div className="p-6 border-b border-primary-foreground/20">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Heart />
            <span>AFYALINK</span>
          </div>
          <p className="text-primary-foreground/70 text-sm mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 p-4">
          <Button
            variant={activeTab === "overview" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("overview")}
          >
            <TrendingUp size={20} /> Overview
          </Button>
          <Button
            variant={activeTab === "referrals" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("referrals")}
          >
            <ClipboardList size={20} /> Referrals
          </Button>
          <Collapsible open={facilitiesOpen} onOpenChange={setFacilitiesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={activeTab.startsWith("facilities") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-2"
              >
                <Building2 size={20} />
                <span className="flex-1 text-left">Facilities</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${facilitiesOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-8 space-y-1">
              <Button
                variant={activeTab === "facilities-all" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-all")}
              >
                All Facilities
              </Button>
              <Button
                variant={activeTab === "facilities-level-6" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-level-6")}
              >
                Level 6 - National
              </Button>
              <Button
                variant={activeTab === "facilities-level-5" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-level-5")}
              >
                Level 5 - County
              </Button>
              <Button
                variant={activeTab === "facilities-level-4" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-level-4")}
              >
                Level 4 - Sub-County
              </Button>
              <Button
                variant={activeTab === "facilities-level-3" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-level-3")}
              >
                Level 3 - Health Centre
              </Button>
              <Button
                variant={activeTab === "facilities-level-2" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-level-2")}
              >
                Level 2 - Dispensary
              </Button>
              <Button
                variant={activeTab === "facilities-level-1" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("facilities-level-1")}
              >
                Level 1 - Community
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={activeTab.startsWith("users") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-2"
              >
                <Users size={20} />
                <span className="flex-1 text-left">Healthcare Providers</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${usersOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-8 space-y-1">
              <Button
                variant={activeTab === "users-doctors" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("users-doctors")}
              >
                Doctors
              </Button>
              <Button
                variant={activeTab === "users-nurses" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("users-nurses")}
              >
                Nurses
              </Button>
              <Button
                variant={activeTab === "users-patients" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("users-patients")}
              >
                Patients
              </Button>
              <Button
                variant={activeTab === "users-pharmacists" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("users-pharmacists")}
              >
                Pharmacists
              </Button>
              <Button
                variant={activeTab === "users-lab-technicians" ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 mb-1 text-sm"
                onClick={() => setActiveTab("users-lab-technicians")}
              >
                Lab Technicians
              </Button>
            </CollapsibleContent>
          </Collapsible>
          <Button
            variant={activeTab === "pending-users" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("pending-users")}
          >
            <Clock size={20} />
            <span className="flex-1 text-left">Pending Users</span>
            {stats.pendingUsers > 0 && (
              <Badge className="bg-warning text-warning-foreground">{stats.pendingUsers}</Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "analytics" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("analytics")}
          >
            <FileText size={20} /> Analytics & Reports
          </Button>
          <Button
            variant={activeTab === "security" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("security")}
          >
            <Shield size={20} /> Security & Audit
          </Button>
          <Button
            variant={activeTab === "notifications" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={20} /> Notifications
          </Button>

          <div className="my-4 border-t border-primary-foreground/20" />

          <Button
            variant={activeTab === "reports" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("reports")}
          >
            <FileText size={20} /> Reports
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 mb-2"
            onClick={() => navigate("/faq")}
          >
            <FileText size={20} /> FAQ
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 mb-2"
            onClick={() => navigate("/feedback")}
          >
            <Bell size={20} /> Feedback
          </Button>
        </nav>

        <div className="p-4 border-t border-primary-foreground/20">
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-2"
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} /> Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-card shadow-sm px-8 py-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search referrals, facilities, users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative focus:outline-none">
                  <Bell className="text-muted-foreground" size={24} />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground w-5 h-5 flex items-center justify-center p-0 rounded-full text-xs">
                      {notifications}
                    </Badge>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-card" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  {notifications > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-auto py-1 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {allNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    allNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${!notification.is_read ? "bg-primary/5" : ""
                          }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                AD
              </div>
              <div>
                <p className="font-semibold text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@afyalink.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "overview" && (
            <>
              <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {dashboardStats.map((stat, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.color} p-3 rounded-lg text-primary-foreground`}>
                        <stat.icon size={24} />
                      </div>
                      <span className="text-success font-semibold text-sm">{stat.change}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-xl shadow-sm p-6 border">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <p className="text-muted-foreground">Recent referrals and activity will be displayed here...</p>
              </div>
            </>
          )}

          {activeTab === "referrals" && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Referral Management</h1>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Referrals</CardTitle>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingReferrals ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : referrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No referrals found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {referrals
                        .filter(referral =>
                          searchQuery === "" ||
                          referral.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          referral.facility_from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          referral.facility_to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          referral.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((referral) => (
                          <div key={referral.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <ClipboardList className="text-primary" size={24} />
                              </div>
                              <div>
                                <p className="font-semibold">{referral.reason}</p>
                                <p className="text-sm text-muted-foreground">
                                  {referral.facility_from} → {referral.facility_to}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Diagnosis: {referral.diagnosis || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge
                                variant={referral.urgency === 'high' ? 'destructive' : referral.urgency === 'medium' ? 'default' : 'secondary'}
                              >
                                {referral.urgency}
                              </Badge>
                              <Badge
                                variant={referral.status === 'completed' ? 'default' : referral.status === 'pending' ? 'outline' : 'secondary'}
                              >
                                {referral.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {new Date(referral.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab.startsWith("facilities") && (
            <div>
              <h1 className="text-3xl font-bold mb-6">
                {activeTab === "facilities-all" && "All Facilities"}
                {activeTab === "facilities-level-6" && "Level 6 - National Referral Hospitals"}
                {activeTab === "facilities-level-5" && "Level 5 - County Referral Hospitals"}
                {activeTab === "facilities-level-4" && "Level 4 - Sub-County Hospitals"}
                {activeTab === "facilities-level-3" && "Level 3 - Health Centres"}
                {activeTab === "facilities-level-2" && "Level 2 - Dispensaries"}
                {activeTab === "facilities-level-1" && "Level 1 - Community Units"}
              </h1>

              {activeTab === "facilities-all" && (
                <div className="mb-6">
                  <Dialog open={isAddFacilityOpen} onOpenChange={setIsAddFacilityOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus size={16} /> Add New Facility
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Facility</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Facility Name</Label>
                          <Input
                            placeholder="e.g. Nairobi Central Hospital"
                            value={newFacility.name}
                            onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={newFacility.type}
                              onValueChange={(val) => setNewFacility({ ...newFacility, type: val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hospital">Hospital</SelectItem>
                                <SelectItem value="Clinic">Clinic</SelectItem>
                                <SelectItem value="Dispensary">Dispensary</SelectItem>
                                <SelectItem value="Medical Center">Medical Center</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Level</Label>
                            <Select
                              value={newFacility.level}
                              onValueChange={(val) => setNewFacility({ ...newFacility, level: val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6">Level 6</SelectItem>
                                <SelectItem value="5">Level 5</SelectItem>
                                <SelectItem value="4">Level 4</SelectItem>
                                <SelectItem value="3">Level 3</SelectItem>
                                <SelectItem value="2">Level 2</SelectItem>
                                <SelectItem value="1">Level 1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Address/Location</Label>
                          <Input
                            placeholder="e.g. Moi Avenue, Nairobi"
                            value={newFacility.address}
                            onChange={(e) => setNewFacility({ ...newFacility, address: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Info</Label>
                          <Input
                            placeholder="e.g. +254 700 000000"
                            value={newFacility.contact}
                            onChange={(e) => setNewFacility({ ...newFacility, contact: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddFacilityOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFacility}>Add Facility</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Facilities</p>
                        <p className="text-3xl font-bold">{dbFacilities.length}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Facilities</p>
                        <p className="text-3xl font-bold text-success">
                          {dbFacilities.filter(f => f.status === "active").length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                        <p className="text-3xl font-bold">
                          {dbFacilities.length > 0
                            ? (dbFacilities.reduce((acc, f) => acc + (f.rating || 0), 0) / dbFacilities.length).toFixed(1)
                            : "N/A"}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {loadingFacilities ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : dbFacilities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No facilities found for this level</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dbFacilities
                        .filter(facility =>
                          searchQuery === "" ||
                          facility.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          facility.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          facility.address?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((facility) => (
                          <div key={facility.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Building2 className="text-primary" size={24} />
                              </div>
                              <div>
                                <p className="font-semibold">{facility.name}</p>
                                <p className="text-sm text-muted-foreground">{facility.type}</p>
                                <p className="text-xs text-muted-foreground">{facility.address}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <Badge variant="outline">
                                  Level {facility.facility_levels?.level || "N/A"}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {facility.facility_levels?.name || "Unknown"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">{facility.rating || 0}</p>
                                <p className="text-sm text-muted-foreground">Rating</p>
                              </div>
                              <Badge className={facility.status === "active" ? "bg-success" : "bg-muted"}>
                                {facility.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "providers" && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Healthcare Providers</h1>

              {loadingProviders ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Doctors</p>
                            <p className="text-3xl font-bold">{roleCountStats.doctors.total}</p>
                          </div>
                          <UserCircle className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Nurses</p>
                            <p className="text-3xl font-bold">{roleCountStats.nurses.total}</p>
                          </div>
                          <UserCircle className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Pharmacists</p>
                            <p className="text-3xl font-bold">{roleCountStats.pharmacists.total}</p>
                          </div>
                          <UserCircle className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Lab Technicians</p>
                            <p className="text-3xl font-bold">{roleCountStats.labTechnicians.total}</p>
                          </div>
                          <UserCircle className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Tabs defaultValue="doctors" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="doctors">Doctors</TabsTrigger>
                      <TabsTrigger value="nurses">Nurses</TabsTrigger>
                      <TabsTrigger value="pharmacists">Pharmacists</TabsTrigger>
                      <TabsTrigger value="lab-technicians">Lab Technicians</TabsTrigger>
                    </TabsList>

                    <TabsContent value="doctors">
                      <Card>
                        <CardHeader>
                          <CardTitle>Registered Doctors ({roleCountStats.doctors.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {providerCounts.doctors.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No doctors registered yet</p>
                            ) : (
                              providerCounts.doctors
                                .filter(d =>
                                  searchQuery === "" ||
                                  d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  d.email.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((doctor) => (
                                  <div key={doctor.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <UserCircle className="text-primary" size={24} />
                                      </div>
                                      <div>
                                        <p className="font-semibold">{doctor.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{doctor.email}</p>
                                      </div>
                                    </div>
                                    <Badge className={doctor.status === 'active' ? 'bg-success/10 text-success' : ''}>
                                      {doctor.status === 'active' ? 'Active' : doctor.status}
                                    </Badge>
                                  </div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="nurses">
                      <Card>
                        <CardHeader>
                          <CardTitle>Registered Nurses ({roleCountStats.nurses.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {providerCounts.nurses.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No nurses registered yet</p>
                            ) : (
                              providerCounts.nurses
                                .filter(n =>
                                  searchQuery === "" ||
                                  n.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  n.email.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((nurse) => (
                                  <div key={nurse.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <UserCircle className="text-primary" size={24} />
                                      </div>
                                      <div>
                                        <p className="font-semibold">{nurse.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{nurse.email}</p>
                                      </div>
                                    </div>
                                    <Badge className={nurse.status === 'active' ? 'bg-success/10 text-success' : ''}>
                                      {nurse.status === 'active' ? 'Active' : nurse.status}
                                    </Badge>
                                  </div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="pharmacists">
                      <Card>
                        <CardHeader>
                          <CardTitle>Registered Pharmacists ({roleCountStats.pharmacists.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {providerCounts.pharmacists.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No pharmacists registered yet</p>
                            ) : (
                              providerCounts.pharmacists
                                .filter(p =>
                                  searchQuery === "" ||
                                  p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.email.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((pharmacist) => (
                                  <div key={pharmacist.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <UserCircle className="text-primary" size={24} />
                                      </div>
                                      <div>
                                        <p className="font-semibold">{pharmacist.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{pharmacist.email}</p>
                                      </div>
                                    </div>
                                    <Badge className={pharmacist.status === 'active' ? 'bg-success/10 text-success' : ''}>
                                      {pharmacist.status === 'active' ? 'Active' : pharmacist.status}
                                    </Badge>
                                  </div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="lab-technicians">
                      <Card>
                        <CardHeader>
                          <CardTitle>Registered Lab Technicians ({roleCountStats.labTechnicians.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {providerCounts.labTechnicians.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No lab technicians registered yet</p>
                            ) : (
                              providerCounts.labTechnicians
                                .filter(l =>
                                  searchQuery === "" ||
                                  l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  l.email.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((labTech) => (
                                  <div key={labTech.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <UserCircle className="text-primary" size={24} />
                                      </div>
                                      <div>
                                        <p className="font-semibold">{labTech.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{labTech.email}</p>
                                      </div>
                                    </div>
                                    <Badge className={labTech.status === 'active' ? 'bg-success/10 text-success' : ''}>
                                      {labTech.status === 'active' ? 'Active' : labTech.status}
                                    </Badge>
                                  </div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          )}

          {(activeTab === "users-doctors" || activeTab === "users-nurses" || activeTab === "users-patients" || activeTab === "users-pharmacists" || activeTab === "users-lab-technicians") && (
            <>
              <h1 className="text-3xl font-bold mb-6">
                {activeTab === "users-doctors" && "Doctor Management"}
                {activeTab === "users-nurses" && "Nurse Management"}
                {activeTab === "users-patients" && "Patient Management"}
                {activeTab === "users-pharmacists" && "Pharmacist Management"}
                {activeTab === "users-lab-technicians" && "Lab Technician Management"}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total {activeTab === "users-doctors" ? "Doctors" : activeTab === "users-nurses" ? "Nurses" : activeTab === "users-patients" ? "Patients" : activeTab === "users-pharmacists" ? "Pharmacists" : "Lab Technicians"}
                        </p>
                        <p className="text-3xl font-bold">
                          {activeTab === "users-doctors" ? roleCountStats.doctors.total :
                            activeTab === "users-nurses" ? roleCountStats.nurses.total :
                              activeTab === "users-patients" ? roleCountStats.patients.total :
                                activeTab === "users-pharmacists" ? roleCountStats.pharmacists.total :
                                  roleCountStats.labTechnicians.total}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-3xl font-bold text-success">
                          {activeTab === "users-doctors" ? roleCountStats.doctors.active :
                            activeTab === "users-nurses" ? roleCountStats.nurses.active :
                              activeTab === "users-patients" ? roleCountStats.patients.active :
                                activeTab === "users-pharmacists" ? roleCountStats.pharmacists.active :
                                  roleCountStats.labTechnicians.active}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Suspended</p>
                        <p className="text-3xl font-bold text-warning">0</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Deactivated</p>
                        <p className="text-3xl font-bold text-destructive">0</p>
                      </div>
                      <X className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {activeTab === "users-doctors" && "All Doctors"}
                      {activeTab === "users-nurses" && "All Nurses"}
                      {activeTab === "users-patients" && "All Patients"}
                      {activeTab === "users-pharmacists" && "All Pharmacists"}
                      {activeTab === "users-lab-technicians" && "All Lab Technicians"}
                    </CardTitle>
                    <div className="flex gap-3">
                      <Input placeholder="Search users..." className="w-64" />
                      <Select>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">User</th>
                          <th className="text-left py-3 px-4 font-semibold">Email</th>
                          <th className="text-left py-3 px-4 font-semibold">Role</th>
                          <th className="text-left py-3 px-4 font-semibold">Facility</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Last Active</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTab === "users-doctors" && (
                          <>
                            {providerCounts.doctors.length === 0 ? (
                              <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No doctors found</td></tr>
                            ) : (
                              providerCounts.doctors
                                .filter(d =>
                                  searchQuery === "" ||
                                  d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  d.facility_name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(user => (
                                  <UserRow
                                    key={user.id}
                                    id={user.id}
                                    name={user.full_name}
                                    email={user.email}
                                    role="Doctor"
                                    facility={user.facility_name || "Unassigned"}
                                    status={user.status}
                                    lastActive="Recently"
                                    onAssignFacility={openAssignFacility}
                                  />
                                ))
                            )}
                          </>
                        )}
                        {activeTab === "users-nurses" && (
                          <>
                            {providerCounts.nurses.length === 0 ? (
                              <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No nurses found</td></tr>
                            ) : (
                              providerCounts.nurses
                                .filter(n =>
                                  searchQuery === "" ||
                                  n.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  n.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  n.facility_name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(user => (
                                  <UserRow
                                    key={user.id}
                                    id={user.id}
                                    name={user.full_name}
                                    email={user.email}
                                    role="Nurse"
                                    facility={user.facility_name || "Unassigned"}
                                    status={user.status}
                                    lastActive="Recently"
                                    onAssignFacility={openAssignFacility}
                                  />
                                ))
                            )}
                          </>
                        )}
                        {activeTab === "users-patients" && (
                          <>
                            {patients.length === 0 ? (
                              <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No patients found</td></tr>
                            ) : (
                              patients
                                .filter(p =>
                                  searchQuery === "" ||
                                  p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.email?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(patient => (
                                  <UserRow
                                    key={patient.id}
                                    id={patient.id}
                                    name={patient.full_name}
                                    email={patient.email}
                                    role="Patient"
                                    facility={patient.facility_name || "Unassigned"}
                                    status={patient.status}
                                    lastActive="Recently"
                                    onAssignFacility={openAssignFacility}
                                  />
                                ))
                            )}
                          </>
                        )}
                        {activeTab === "users-pharmacists" && (
                          <>
                            {providerCounts.pharmacists.length === 0 ? (
                              <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No pharmacists found</td></tr>
                            ) : (
                              providerCounts.pharmacists
                                .filter(p =>
                                  searchQuery === "" ||
                                  p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.facility_name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(user => (
                                  <UserRow
                                    key={user.id}
                                    id={user.id}
                                    name={user.full_name}
                                    email={user.email}
                                    role="Pharmacist"
                                    facility={user.facility_name || "Unassigned"}
                                    status={user.status}
                                    lastActive="Recently"
                                    onAssignFacility={openAssignFacility}
                                  />
                                ))
                            )}
                          </>
                        )}
                        {activeTab === "users-lab-technicians" && (
                          <>
                            {providerCounts.labTechnicians.length === 0 ? (
                              <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No lab technicians found</td></tr>
                            ) : (
                              providerCounts.labTechnicians
                                .filter(l =>
                                  searchQuery === "" ||
                                  l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  l.facility_name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(user => (
                                  <UserRow
                                    key={user.id}
                                    id={user.id}
                                    name={user.full_name}
                                    email={user.email}
                                    role="Lab Technician"
                                    facility={user.facility_name || "Unassigned"}
                                    status={user.status}
                                    lastActive="Recently"
                                    onAssignFacility={openAssignFacility}
                                  />
                                ))
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "pending-users" && (
            <>
              <h1 className="text-3xl font-bold mb-6">Pending User Approvals</h1>

              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Users Awaiting Approval</p>
                      <p className="text-3xl font-bold text-warning">{pendingUsers.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New User Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPendingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                      <p>No pending user approvals</p>
                      <p className="text-sm">All registered users have been reviewed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingUsers
                        .filter(user =>
                          searchQuery === "" ||
                          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((user) => (
                          <div key={user.id} className={`flex items-center justify-between p-4 rounded-lg border ${activatedUsers.has(user.id)
                            ? 'bg-success/10 border-success/30'
                            : 'bg-muted/30 border-warning/20'
                            }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activatedUsers.has(user.id)
                                ? 'bg-success/20'
                                : 'bg-warning/10'
                                }`}>
                                {activatedUsers.has(user.id) ? (
                                  <CheckCircle className="text-success" size={24} />
                                ) : (
                                  <Clock className="text-warning" size={24} />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {user.roles.length > 0 ? (
                                    user.roles.map((role, i) => (
                                      <Badge key={i} variant="outline" className="capitalize">
                                        {role.replace('_', ' ')}
                                      </Badge>
                                    ))
                                  ) : !activatedUsers.has(user.id) && (
                                    <Select
                                      value={selectedRoles[user.id] || ""}
                                      onValueChange={(value) => setSelectedRoles(prev => ({ ...prev, [user.id]: value }))}
                                    >
                                      <SelectTrigger className="w-40 h-8">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="nurse">Nurse</SelectItem>
                                        <SelectItem value="patient">Patient</SelectItem>
                                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                        <SelectItem value="lab_technician">Lab Technician</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right text-sm text-muted-foreground">
                                <p>Registered</p>
                                <p>{new Date(user.created_at).toLocaleDateString()}</p>
                              </div>
                              {activatedUsers.has(user.id) ? (
                                <Badge className="bg-success text-success-foreground gap-1 py-2 px-4">
                                  <CheckCircle size={16} />
                                  Activated
                                </Badge>
                              ) : (
                                <Button
                                  onClick={() => handleActivateUser(user.id)}
                                  className="gap-2"
                                  disabled={activatingUsers.has(user.id)}
                                >
                                  {activatingUsers.has(user.id) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                      Activating...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={18} />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "codes" && (
            <>
              <h1 className="text-3xl font-bold mb-6">Registration Codes</h1>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary p-3 rounded-lg text-primary-foreground">
                        <Users size={24} />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary p-3 rounded-lg text-primary-foreground">
                        <ClipboardList size={24} />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold">{stats.totalReferrals}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-primary p-3 rounded-lg text-primary-foreground">
                        <Code size={24} />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">Registration Codes</p>
                    <p className="text-3xl font-bold">{stats.totalCodes}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-warning p-3 rounded-lg text-primary-foreground">
                        <Activity size={24} />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">Pending Referrals</p>
                    <p className="text-3xl font-bold">{stats.pendingReferrals}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Registration Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCode} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                          id="code"
                          placeholder="DOCTOR2025"
                          value={newCode.code}
                          onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newCode.role}
                          onValueChange={(value) => setNewCode({ ...newCode, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="nurse">Nurse</SelectItem>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="pharmacist">Pharmacist</SelectItem>
                            <SelectItem value="lab_technician">Lab Technician</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit">Create Code</Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "analytics" && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Analytics & Reports</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Referral Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <span className="font-semibold">{analyticsStats.currentCount} referrals</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, (analyticsStats.currentCount / (Math.max(analyticsStats.lastCount, 1) * 2)) * 100))}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Last Month: {analyticsStats.lastCount}</span>
                        <span className={analyticsStats.growth >= 0 ? "text-success" : "text-destructive"}>
                          {analyticsStats.growth > 0 ? "+" : ""}{analyticsStats.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Referrals by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsStats.statusData.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No data available</p>
                      ) : (
                        analyticsStats.statusData.map((stat, i) => (
                          <div key={i}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{stat.name}</span>
                              <span className="text-sm font-semibold">{stat.count}</span>
                            </div>
                            <div className="w-full bg-muted h-2 rounded-full">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${stat.percent}%` }}></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Processing Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-5xl font-bold text-primary">{analyticsStats.avgTimeDays.toFixed(1)}</p>
                      <p className="text-muted-foreground mt-2">days average</p>
                      <p className="text-sm text-muted-foreground mt-1">processing time</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-5xl font-bold text-success">{analyticsStats.successRate.toFixed(1)}%</p>
                      <p className="text-muted-foreground mt-2">completed referrals</p>
                      <p className="text-sm text-muted-foreground mt-1">all time</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Monthly Summary
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Facility Performance
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Provider Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Security & Audit</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Sessions (24h)</p>
                        <p className="text-3xl font-bold">{securityStats.activeSessions}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
                        <p className="text-3xl font-bold text-warning">{securityStats.failedLogins}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Security Score</p>
                        <p className="text-3xl font-bold text-success">{securityStats.securityScore}%</p>
                      </div>
                      <Shield className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Recent Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {securityStats.logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No audit logs found.</p>
                    ) : (
                      securityStats.logs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${log.type === "success" ? "bg-success" :
                              log.type === "warning" ? "bg-warning" :
                                "bg-primary"
                              }`}></div>
                            <div>
                              <p className="font-semibold text-sm">{log.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.full_name ? `${log.full_name} (${log.email})` : (log.email || 'System/Unknown')}
                                {log.details && ` - ${log.details}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      )))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Badge className="bg-success">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
                      </div>
                      <span className="text-sm font-semibold">30 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Notifications Management</h1>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Send Notification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notif-recipient">Send To</Label>
                      <Select
                        value={newNotification.recipient}
                        onValueChange={(value) =>
                          setNewNotification({ ...newNotification, recipient: value })
                        }
                      >
                        <SelectTrigger id="notif-recipient">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                          <SelectItem value="doctor">Doctors</SelectItem>
                          <SelectItem value="nurse">Nurses</SelectItem>
                          <SelectItem value="patient">Patients</SelectItem>
                          <SelectItem value="pharmacist">Pharmacists</SelectItem>
                          <SelectItem value="lab_technician">Lab Technicians</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="notif-title">Title</Label>
                      <Input
                        id="notif-title"
                        placeholder="Notification title"
                        value={newNotification.title}
                        onChange={(e) =>
                          setNewNotification({ ...newNotification, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="notif-message">Message</Label>
                      <Input
                        id="notif-message"
                        placeholder="Notification message"
                        value={newNotification.message}
                        onChange={(e) =>
                          setNewNotification({ ...newNotification, message: e.target.value })
                        }
                      />
                    </div>
                    <Button onClick={sendNotification} disabled={sendingNotification}>
                      {sendingNotification ? "Sending..." : "Send Notification"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sent Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingNotifications ? (
                    <p className="text-center text-muted-foreground py-4">Loading...</p>
                  ) : sentNotifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No notifications sent yet</p>
                  ) : (
                    <div className="space-y-3">
                      {sentNotifications.map((notif) => (
                        <div key={notif.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{notif.title}</p>
                            <Badge variant="outline">
                              Sent
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Platform Settings</h1>
              <AdminSettings />
            </div>
          )}

          {activeTab === "reports" && (
            <AdminReports
              stats={stats}
              providers={healthcareProviders}
              patients={patients}
              facilities={dbFacilities}
              referrals={referrals}
            />
          )}
        </div>
      </main>
      {/* Assign Facility Dialog */}
      <Dialog open={isAssignFacilityOpen} onOpenChange={setIsAssignFacilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Facility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input value={assigningUser?.full_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Select Facility</Label>
              <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a facility" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {dbFacilities.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFacilityOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignFacilitySubmit}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Assign Facility Dialog */}
      <Dialog open={isAssignFacilityOpen} onOpenChange={setIsAssignFacilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Facility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input value={assigningUser?.full_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Select Facility</Label>
              <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a facility" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {dbFacilities.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFacilityOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignFacilitySubmit}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;