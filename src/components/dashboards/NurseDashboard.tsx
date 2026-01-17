import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, dataApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { FileText, Activity, Heart, TrendingUp, ClipboardList, MessageSquare, LogOut, Menu, Bell, Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null); // To store current user info if needed

  useEffect(() => {
    fetchUser();
    fetchReferrals();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch (error) {
       console.error("Error fetching user:", error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data } = await dataApi.getReferrals();
      setReferrals(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await dataApi.getNotifications();
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await dataApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
       console.error("Failed to mark notification read");
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await dataApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
       console.error("Failed to mark all notifications read");
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

  const handleUpdateStatus = async (referralId: string, newStatus: "pending" | "accepted" | "in_progress" | "completed" | "rejected") => {
    try {
      await dataApi.updateReferral(referralId, { status: newStatus });

      toast({ title: "Referral status updated" });
      fetchReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignToMe = async (referralId: string) => {
    try {
      if (!user) {
         // Should have user by now, but just in case
         const { data } = await authApi.me();
         setUser(data.user);
         await dataApi.updateReferral(referralId, { assigned_nurse_id: data.user.id });
      } else {
         await dataApi.updateReferral(referralId, { assigned_nurse_id: user.id });
      }

      toast({ title: "Referral assigned to you" });
      fetchReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "medium":
        return "bg-secondary text-secondary-foreground";
      case "low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
      <div className="p-6 border-b border-primary-foreground/20">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Heart />
          <span>AFYALINK</span>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">Nurse Portal</p>
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
          <MessageSquare size={20} /> Feedback
        </Button>
      </nav>

      <div className="p-4 border-t border-primary-foreground/20">
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive-foreground hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-card shadow-sm px-4 md:px-8 py-4 flex items-center justify-between border-b sticky top-0 z-40">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
             <h2 className="text-xl md:text-2xl font-bold text-foreground">Nurse Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-card" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          !notification.is_read ? "bg-primary/5" : ""
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
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Assigned to Me</p>
                    <p className="text-3xl font-bold">
                        {referrals.filter(r => r.assigned_nurse_id).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                    <p className="text-3xl font-bold text-primary">
                      {referrals.filter(r => r.status === "in_progress").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold text-success">
                      {referrals.filter(r => r.status === "completed").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Referrals
              </h3>
              {referrals.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No referrals to manage at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                referrals.map((referral) => (
                  <Card key={referral.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {referral.patient?.full_name || "Unknown Patient"}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getUrgencyColor(referral.urgency)}>
                            {referral.urgency}
                          </Badge>
                          <Badge variant="outline">{referral.status}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm">
                        <div>
                          <span className="font-semibold">Referring Doctor:</span>{" "}
                          {referral.referring_doctor?.full_name || "Unknown"}
                        </div>
                        <div>
                          <span className="font-semibold">From:</span> {referral.facility_from}
                        </div>
                        <div>
                          <span className="font-semibold">To:</span> {referral.facility_to}
                        </div>
                        <div>
                          <span className="font-semibold">Reason:</span> {referral.reason}
                        </div>
                        {referral.diagnosis && (
                          <div>
                            <span className="font-semibold">Diagnosis:</span> {referral.diagnosis}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Created: {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {!referral.assigned_nurse_id && (
                          <Button size="sm" onClick={() => handleAssignToMe(referral.id)}>
                            Assign to Me
                          </Button>
                        )}
                        {referral.assigned_nurse_id && (
                          <div className="flex gap-2 items-center">
                            <span className="text-sm">Update Status:</span>
                            <Select
                              value={referral.status}
                              onValueChange={(value: "pending" | "accepted" | "in_progress" | "completed" | "rejected") => handleUpdateStatus(referral.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <ReportGenerator referrals={referrals} user={user} />
          )}
        </div>
      </main>
    </div>
  );
};

const ReportGenerator = ({ referrals, user }: { referrals: any[], user: any }) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const generateReport = () => {
        let filteredData = [...referrals];

        if (startDate) {
            filteredData = filteredData.filter(r => new Date(r.created_at) >= new Date(startDate));
        }
        if (endDate) {
            filteredData = filteredData.filter(r => new Date(r.created_at) <= new Date(endDate));
        }

        if (statusFilter !== "all") {
             filteredData = filteredData.filter(r => r.status === statusFilter);
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const today = new Date().toLocaleDateString();

        // Helper for centered text
        const centerText = (text: string, y: number, size = 12) => {
            doc.setFontSize(size);
            const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, y);
        };
        
        // --- Header ---
        doc.setTextColor(0, 0, 0);
        centerText("AfyaLink Secure Referral", 20, 18);
        centerText("Nurse Referral Report", 28, 14);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${today}`, 20, 35);
        doc.text(`Generated by: Nurse ${user?.full_name || 'Unknown'}`, 20, 40);
        doc.text(`Filters: ${startDate || 'All Time'} - ${endDate || 'Present'} | Status: ${statusFilter}`, 20, 45);

        doc.setLineWidth(0.5);
        doc.line(20, 50, pageWidth - 20, 50);

        // --- Table Setup ---
        let yPos = 60;
        const headers = ["Date", "Patient", "Status", "Assignment"];
        const colWidths = [40, 50, 40, 40];
        const startX = 14;

        // Draw Header
        const drawHeader = (y: number) => {
             doc.setFillColor(0, 51, 102); // Dark Blue
             doc.rect(startX, y - 6, pageWidth - 28, 8, 'F');
             doc.setTextColor(255, 255, 255);
             doc.setFontSize(10);
             doc.setFont("helvetica", "bold");
             
             let xPos = startX + 2;
             headers.forEach((header, i) => {
                 doc.text(header, xPos, y);
                 xPos += colWidths[i];
             });
             doc.setTextColor(0, 0, 0);
             doc.setFont("helvetica", "normal");
        };

        drawHeader(yPos);
        yPos += 8;

        // --- Data ---
        filteredData.forEach((r, index) => {
             if (yPos > 280) {
                 doc.addPage();
                 yPos = 20;
                 drawHeader(yPos);
                 yPos += 8;
             }

             if (index % 2 === 1) {
                 doc.setFillColor(245, 245, 245);
                 doc.rect(startX, yPos - 6, pageWidth - 28, 8, 'F');
             }

             let xRow = startX + 2;
             const dateStr = new Date(r.created_at).toLocaleDateString();
             const patientName = r.patient?.full_name || "Unknown";
             const statusStr = r.status.replace("_", " ");
             const assignedStatus = r.assigned_nurse_id ? (r.assigned_nurse_id === user?.id ? "Assigned (You)" : "Assigned (Other)") : "Unassigned";
             
             const rowData = [dateStr, patientName, statusStr, assignedStatus];
             
             rowData.forEach((text, i) => {
                 // Simple truncation
                 let finalText = text;
                 if (text.length > 25) finalText = text.substring(0, 22) + "...";
                 
                 doc.text(finalText, xRow, yPos);
                 xRow += colWidths[i];
             });
             
             yPos += 8;
        });

        // --- Footer ---
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("Confidential Medical Record - For Internal Use Only", 20, 290);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 290);
        }

        doc.save("nurse_referral_report.pdf");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Report</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); generateReport(); }} className="space-y-4">
                    <div className="flex gap-4">
                         <div className="grid gap-2 flex-1">
                            <Label htmlFor="start-date">Start Date <span className="text-destructive">*</span></Label>
                            <Input required id="start-date" type="date" value={startDate} max={new Date().toISOString().split('T')[0]} onChange={e => setStartDate(e.target.value)} />
                         </div>
                         <div className="grid gap-2 flex-1">
                            <Label htmlFor="end-date">End Date <span className="text-destructive">*</span></Label>
                            <Input required id="end-date" type="date" value={endDate} max={new Date().toISOString().split('T')[0]} onChange={e => setEndDate(e.target.value)} />
                         </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status-filter">Status</Label>
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit"><Download className="mr-2 h-4 w-4"/> Download PDF</Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default NurseDashboard;