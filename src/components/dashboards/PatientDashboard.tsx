import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataApi, authApi } from "@/lib/api";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, Shield, Lock, Unlock, Heart, Home, MessageSquare, LogOut, Bell, TrendingUp, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reportType, setReportType] = useState("referral_history");
  const [statusFilter, setStatusFilter] = useState("all");

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // User & Consent State
  const [user, setUser] = useState<any>(null);
  const [consents, setConsents] = useState<any[]>([]);

  useEffect(() => {
    fetchUser();
    fetchReferrals();
    fetchConsents();
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

  const fetchConsents = async () => {
    try {
      const { data } = await dataApi.getConsents();
      setConsents(data || []);
    } catch (error) {
      console.error("Error fetching consents:", error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "in_progress":
        return "bg-primary text-primary-foreground";
      case "accepted":
        return "bg-secondary text-secondary-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  /* 
   * Updated Report Generation to match Doctor/Admin style 
   */
  const downloadReport = () => {
    let filteredData = [...referrals];

    // Filter by date range
    if (startDate) {
        filteredData = filteredData.filter(r => new Date(r.created_at) >= new Date(startDate));
    }
    if (endDate) {
        filteredData = filteredData.filter(r => new Date(r.created_at) <= new Date(endDate));
    }

    if (statusFilter !== "all") {
      const statusMap: Record<string, string[]> = {
        "pending": ["pending"],
        "under_review": ["in_progress", "accepted"],
        "reviewed": ["reviewed"],
        "completed": ["completed"]
      };
      const allowedStatuses = statusMap[statusFilter] || [];
      filteredData = filteredData.filter(r => allowedStatuses.includes(r.status));
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString();

    const centerText = (text: string, y: number, size = 12) => {
        doc.setFontSize(size);
        const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    // --- Header ---
    doc.setTextColor(0, 0, 0);
    centerText("AfyaLink Secure Referral", 20, 18);
    centerText("My Referral History", 28, 14);

    doc.setFontSize(10);
    doc.text(`Generated on: ${today}`, 20, 35);
    doc.text(`Patient: ${user?.full_name || 'Unknown'}`, 20, 40);
    doc.text(`Status Filter: ${statusFilter}`, 20, 45);

    doc.setLineWidth(0.5);
    doc.line(20, 50, pageWidth - 20, 50);

    // --- Table Setup ---
    let yPos = 60;
    const headers = ["Date", "Facility To", "Status", "Doctor"];
    const colWidths = [40, 50, 40, 50];
    const startX = 14;

    const drawHeader = (y: number) => {
         doc.setFillColor(0, 51, 102);
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
        const facilityTo = r.facility_to || "N/A";
        const statusStr = r.status.replace("_", " ");
        const doctorName = r.assigned_doctor?.full_name || r.referring_doctor?.full_name || "N/A";

        const rowData = [dateStr, facilityTo, statusStr, doctorName];
        
        rowData.forEach((text, i) => {
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
        doc.text("Confidential Patient Record", 20, 290);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 290);
    }

    doc.save(`patient_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Derive potential consent targets
  const consentTargets = referrals.reduce((acc: any[], r) => {
    if (r.referring_doctor?.full_name) {
      if (!acc.find(t => t.id === r.referring_doctor_id)) {
        acc.push({ id: r.referring_doctor_id, name: r.referring_doctor.full_name, type: 'doctor' });
      }
    }
    if (r.assigned_doctor?.full_name) {
      if (!acc.find(t => t.id === r.assigned_doctor_id)) {
        acc.push({ id: r.assigned_doctor_id, name: r.assigned_doctor.full_name, type: 'doctor' });
      }
    }
    return acc;
  }, []);

  const handleConsentToggle = async (target: any) => {
    const currentConsent = consents.find(c => c.entity_id === target.id && c.entity_type === target.type);
    const newStatus = currentConsent?.status === 'granted' ? 'revoked' : 'granted';

    try {
      await dataApi.updateConsent({
        entity_type: target.type,
        entity_id: target.id,
        entity_name: target.name,
        status: newStatus
      });
      fetchConsents(); 
    } catch (error) {
      console.error("Failed to update consent");
    }
  };

  const dashboardTitle = user ? `${user.full_name}'s Dashboard` : "Patient Dashboard";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
      <div className="p-6 border-b border-primary-foreground/20">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Heart />
          <span>AFYALINK</span>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">Patient Portal</p>
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
          variant={activeTab === "reports" ? "secondary" : "ghost"}
          className="w-full justify-start gap-3 mb-2"
          onClick={() => setActiveTab("reports")}
        >
          <FileText size={20} /> Reports
        </Button>
         <Button
          variant={activeTab === "consent" ? "secondary" : "ghost"}
          className="w-full justify-start gap-3 mb-2"
          onClick={() => setActiveTab("consent")}
        >
          <Shield size={20} /> Consent Management
        </Button>
        <Button
          variant={activeTab === "faq" ? "secondary" : "ghost"}
          className="w-full justify-start gap-3 mb-2"
          onClick={() => navigate("/faq")}
        >
          <FileText size={20} /> FAQ
        </Button>
        <Button
          variant={activeTab === "feedback" ? "secondary" : "ghost"}
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-card shadow-sm px-4 md:px-8 py-4 flex items-center justify-between border-b sticky top-0 z-40">
           {/* Mobile Menu Trigger */}
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
             <h2 className="text-xl md:text-2xl font-bold text-foreground">{dashboardTitle}</h2>
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
                      <p className="text-3xl font-bold">{referrals.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                      <p className="text-3xl font-bold text-primary">
                        {referrals.filter(r => r.status === "in_progress" || r.status === "accepted").length}
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

              <div>
                <p className="text-muted-foreground">View your medical referrals</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Your Referrals</h3>
                {referrals.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No referrals found. Your doctor will create referrals when needed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  referrals.map((referral) => (
                    <Card key={referral.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Referral to {referral.facility_to}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getUrgencyColor(referral.urgency)}>
                              {referral.urgency}
                            </Badge>
                            <Badge className={getStatusColor(referral.status)}>
                              {referral.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-semibold">Referring Doctor:</span>
                              <p>{referral.referring_doctor?.full_name || "Unknown"}</p>
                            </div>
                            {referral.assigned_doctor && (
                              <div>
                                <span className="font-semibold">Assigned Doctor:</span>
                                <p>{referral.assigned_doctor.full_name}</p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-semibold">From Facility:</span>
                              <p>{referral.facility_from}</p>
                            </div>
                            <div>
                              <span className="font-semibold">To Facility:</span>
                              <p>{referral.facility_to}</p>
                            </div>
                          </div>

                          <div>
                            <span className="font-semibold">Reason:</span>
                            <p>{referral.reason}</p>
                          </div>

                          {referral.diagnosis && (
                            <div>
                              <span className="font-semibold">Diagnosis:</span>
                              <p>{referral.diagnosis}</p>
                            </div>
                          )}

                          {referral.notes && (
                            <div>
                              <span className="font-semibold">Notes:</span>
                              <p>{referral.notes}</p>
                            </div>
                          )}

                          {referral.assigned_nurse && (
                            <div>
                              <span className="font-semibold">Assigned Nurse:</span>
                              <p>{referral.assigned_nurse.full_name}</p>
                            </div>
                          )}

                          <div className="text-muted-foreground text-xs pt-2 border-t">
                            <div>Created: {new Date(referral.created_at).toLocaleString()}</div>
                            <div>Last Updated: {new Date(referral.updated_at).toLocaleString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "reports" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Generate Report</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); downloadReport(); }} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="grid gap-2 flex-1">
                        <Label htmlFor="start-date">Start Date <span className="text-destructive">*</span></Label>
                        <Input
                          required
                          id="start-date"
                          type="date"
                          value={startDate}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2 flex-1">
                        <Label htmlFor="end-date">End Date <span className="text-destructive">*</span></Label>
                        <Input
                          required
                          id="end-date"
                          type="date"
                          value={endDate}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status-filter">Status Filter</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status-filter">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending Review</SelectItem>
                          <SelectItem value="under_review">Under Clinical Review</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full md:w-auto"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Generate & Download Report
                    </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "consent" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Consent Management</CardTitle>
                </div>
                <CardDescription>
                  Manage which healthcare providers have access to your medical records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consentTargets.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent healthcare provider interactions found.</p>
                  ) : (
                    consentTargets.map((target, idx) => {
                      const consent = consents.find(c => c.entity_id === target.id && c.entity_type === target.type);
                      const isGranted = consent?.status === 'granted';

                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isGranted ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {isGranted ? <Unlock size={18} /> : <Lock size={18} />}
                            </div>
                            <div>
                              <p className="font-semibold">{target.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{target.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${isGranted ? 'text-success' : 'text-muted-foreground'}`}>
                              {isGranted ? 'Access Granted' : 'Access Revoked'}
                            </span>
                            <Button
                              variant={isGranted ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleConsentToggle(target)}
                              className={isGranted ? "border-destructive text-destructive hover:bg-destructive/10" : ""}
                            >
                              {isGranted ? "Revoke Access" : "Grant Access"}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;