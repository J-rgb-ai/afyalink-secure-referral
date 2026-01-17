import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, dataApi } from "@/lib/api";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, Plus, FileText, Check, X, AlertCircle, Heart, TrendingUp, ClipboardList, MessageSquare, LogOut, Menu, Bell, Search, Shield, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nurses, setNurses] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [newReferral, setNewReferral] = useState({
    patientEmail: "",
    patientName: "", // Added
    facilityFrom: "",
    facilityTo: "",
    reason: "",
    diagnosis: "",
    notes: "",
    urgency: "medium",
    assignedNurseId: "_none",
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUser();
    fetchReferrals();
    fetchNotifications();
    fetchNurses();
    fetchFacilities();
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

  const fetchNurses = async () => {
    try {
      const { data } = await dataApi.getHealthcareProviders();
      // Filter for nurses only
      const nurseList = data.filter((u: any) => u.role === 'nurse');
      setNurses(nurseList);
    } catch (error) {
      console.error("Error fetching nurses:", error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const { data } = await dataApi.getFacilities();
      setFacilities(data || []);
    } catch (error) {
       console.error("Error fetching facilities:", error);
    }
  };

  const groupedFacilities = useMemo(() => {
     const grouped: Record<string, any[]> = {};
     facilities.forEach(f => {
         const level = f.facility_levels?.name || "Other";
         if (!grouped[level]) grouped[level] = [];
         grouped[level].push(f);
     });
     // Sort levels if needed, or just return object entries
     return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [facilities]);

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

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataApi.createReferral({
        patientEmail: newReferral.patientEmail,
        patientName: newReferral.patientName,
        facility_from: newReferral.facilityFrom,
        facility_to: newReferral.facilityTo,
        reason: newReferral.reason,
        diagnosis: newReferral.diagnosis,
        notes: newReferral.notes,
        urgency: newReferral.urgency,
        assigned_nurse_id: newReferral.assignedNurseId === "_none" ? null : newReferral.assignedNurseId,
      });

      toast({ title: "Referral created successfully" });
      setShowForm(false);
      setNewReferral({
        patientEmail: "",
        patientName: "",
        facilityFrom: "",
        facilityTo: "",
        reason: "",
        diagnosis: "",
        notes: "",
        urgency: "medium",
        assignedNurseId: "_none",
      });
      fetchReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string, rejectionReason?: string) => {
      try {
          await dataApi.updateReferral(id, { status, rejection_reason: rejectionReason });
          toast({ title: `Referral ${status === 'accepted' ? 'accepted' : 'rejected'}` });
          fetchReferrals();
      } catch (error) {
          console.error("Failed to update status", error);
          toast({ title: "Failed to update status", variant: "destructive" });
      }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
      <div className="p-6 border-b border-primary-foreground/20">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Heart />
          <span>AFYALINK</span>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">Doctor Portal</p>
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
             <h2 className="text-xl md:text-2xl font-bold text-foreground">Doctor Dashboard</h2>
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
                    <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold">{referrals.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-3xl font-bold text-warning">
                      {referrals.filter(r => r.status === "pending").length}
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
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Manage Referrals</h3>
                  <p className="text-muted-foreground">Monitor and create patient referrals</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {showForm ? "Cancel" : "New Referral"}
                </Button>
              </div>

              {showForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Create New Referral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateReferral} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="patientEmail">Patient Email</Label>
                          <Input
                            id="patientEmail"
                            type="email"
                            placeholder="patient@example.com"
                            value={newReferral.patientEmail}
                            onChange={(e) => setNewReferral({ ...newReferral, patientEmail: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="urgency">Urgency</Label>
                          <Select
                            value={newReferral.urgency}
                            onValueChange={(value) => setNewReferral({ ...newReferral, urgency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facilityFrom">From Facility</Label>
                          <Input
                            id="facilityFrom"
                            value={newReferral.facilityFrom}
                            onChange={(e) => setNewReferral({ ...newReferral, facilityFrom: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facilityTo">To Facility</Label>
                          <Select
                            value={newReferral.facilityTo}
                            onValueChange={(value) => setNewReferral({ ...newReferral, facilityTo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select facility" />
                            </SelectTrigger>
                            <SelectContent>
                              {groupedFacilities.map(([level, facilities]) => (
                                <div key={level}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/20">
                                    {level}
                                  </div>
                                  {facilities.map((facility: any) => (
                                    <SelectItem key={facility.id} value={facility.name}>
                                      {facility.name} (L{facility.facility_levels?.level})
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Referral</Label>
                        <Textarea
                          id="reason"
                          value={newReferral.reason}
                          onChange={(e) => setNewReferral({ ...newReferral, reason: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Textarea
                          id="diagnosis"
                          value={newReferral.diagnosis}
                          onChange={(e) => setNewReferral({ ...newReferral, diagnosis: e.target.value })}
                          placeholder="Primary diagnosis..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Clinical Notes</Label>
                        <Textarea
                          id="notes"
                          value={newReferral.notes}
                          onChange={(e) => setNewReferral({ ...newReferral, notes: e.target.value })}
                          placeholder="Additional clinical notes..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignedNurse">Assign Nurse (Optional)</Label>
                        <Select
                          value={newReferral.assignedNurseId}
                          onValueChange={(value) => setNewReferral({ ...newReferral, assignedNurseId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a nurse" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            {nurses.map((nurse) => (
                              <SelectItem key={nurse.id} value={nurse.id}>
                                {nurse.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit">Create Referral</Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <Tabs defaultValue="outgoing" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="incoming">
                      <ArrowDownLeft className="mr-2 h-4 w-4" />
                      Incoming Referrals
                    </TabsTrigger>
                    <TabsTrigger value="outgoing">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Outgoing Referrals
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="outgoing" className="space-y-4 mt-4">
                    <h3 className="text-xl font-semibold">Outgoing Referrals</h3>
                    {referrals.filter(r => r.referring_doctor_id === user?.id).length === 0 ? (
                      <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>You haven't sent any referrals yet.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      referrals.filter(r => r.referring_doctor_id === user?.id).map((referral) => (
                        <ReferralCard key={referral.id} referral={referral} type="outgoing" />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="incoming" className="space-y-4 mt-4">
                    <h3 className="text-xl font-semibold">Incoming Referrals</h3>
                    {referrals.filter(r => r.referring_doctor_id !== user?.id).length === 0 ? (
                      <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No incoming referrals assigned to you.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      referrals.filter(r => r.referring_doctor_id !== user?.id).map((referral) => (
                        <ReferralCard key={referral.id} referral={referral} type="incoming" onUpdateStatus={handleUpdateStatus} />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {activeTab === "reports" && (
              <ReportGenerator referrals={referrals} user={user} />
          )}
        </div>
      </main>
    </div>
  );
};

const ReferralCard = ({ referral, type, onUpdateStatus }: { referral: any, type: 'incoming' | 'outgoing', onUpdateStatus?: (id: string, status: string, reason?: string) => void }) => {
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case "critical": return "bg-destructive text-destructive-foreground";
            case "high": return "bg-warning text-warning-foreground";
            case "medium": return "bg-secondary text-secondary-foreground";
            case "low": return "bg-success text-success-foreground";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const handleRejectSubmit = () => {
        if (!rejectionReason.trim()) return;
        if (onUpdateStatus) {
            onUpdateStatus(referral.id, 'rejected', rejectionReason);
            setIsRejectOpen(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        {referral.patient?.full_name || "Unknown Patient"}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="capitalize">{type}</Badge>
                        <Badge className={getUrgencyColor(referral.urgency)}>
                            {referral.urgency}
                        </Badge>
                        <Badge variant={referral.status === 'rejected' ? "destructive" : "secondary"}>
                            {referral.status.replace("_", " ")}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 text-sm">
                    <div className="grid grid-cols-2 gap-2 p-2 bg-muted/20 rounded">
                        <div>
                            <span className="font-semibold text-muted-foreground">From:</span>
                            <div className="font-medium">{referral.facility_from}</div>
                             {type === 'incoming' && (
                                <div className="text-xs text-muted-foreground">Dr. {referral.referring_doctor?.full_name}</div>
                             )}
                        </div>
                        <div>
                            <span className="font-semibold text-muted-foreground">To:</span>
                            <div className="font-medium">{referral.facility_to}</div>
                        </div>
                    </div>
                    
                    <div>
                        <span className="font-semibold block mb-1">Reason for Referral:</span>
                        <div className="p-2 bg-muted/10 rounded border border-dashed border-muted-foreground/20">
                           {referral.reason}
                        </div>
                    </div>

                    {(referral.diagnosis || referral.notes) && (
                        <div className="grid gap-2">
                             {referral.diagnosis && (
                                <div>
                                    <span className="font-semibold">Diagnosis:</span>
                                    <p className="text-muted-foreground">{referral.diagnosis}</p>
                                </div>
                             )}
                             {referral.notes && (
                                <div>
                                    <span className="font-semibold">Clinical Notes:</span>
                                    <p className="text-muted-foreground italic">"{referral.notes}"</p>
                                </div>
                             )}
                        </div>
                    )}

                    {referral.status === 'rejected' && referral.rejection_reason && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                             <div className="flex items-center gap-2 font-semibold mb-1">
                                <AlertCircle size={16} />
                                Rejection Reason:
                             </div>
                             <p>{referral.rejection_reason}</p>
                        </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground pt-2 border-t mt-2 flex justify-between items-center">
                         <span>Created: {new Date(referral.created_at).toLocaleDateString()}</span>
                         
                         {type === 'incoming' && referral.status === 'pending' && onUpdateStatus && (
                             <div className="flex gap-2">
                                 <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                                     <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="h-8">
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                     </DialogTrigger>
                                     <DialogContent>
                                         <DialogHeader>
                                             <DialogTitle>Reject Referral</DialogTitle>
                                             <DialogDescription>
                                                 Please provide a reason for rejecting this referral. This will be sent to the referring doctor.
                                             </DialogDescription>
                                         </DialogHeader>
                                         <div className="py-4">
                                             <Label htmlFor="reject-reason" className="mb-2 block">Reason</Label>
                                             <Textarea 
                                                id="reject-reason" 
                                                placeholder="E.g., Specialist unavailable, Wrong facility..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                             />
                                         </div>
                                         <DialogFooter>
                                             <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                                             <Button variant="destructive" onClick={handleRejectSubmit}>Confirm Rejection</Button>
                                         </DialogFooter>
                                     </DialogContent>
                                 </Dialog>

                                 <Button 
                                    variant="default" 
                                    size="sm" 
                                    className="h-8 bg-success hover:bg-success/90"
                                    onClick={() => onUpdateStatus(referral.id, 'accepted')}
                                 >
                                     <Check className="w-4 h-4 mr-1" /> Accept
                                 </Button>
                             </div>
                         )}
                    </div>
                </div>
            </CardContent>
        </Card>
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
        centerText("Referral Activity Report", 28, 14);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${today}`, 20, 35);
        doc.text(`Generated by: Dr. ${user?.full_name || 'Unknown'}`, 20, 40);
        doc.text(`Filters: ${startDate || 'All Time'} - ${endDate || 'Present'} | Status: ${statusFilter}`, 20, 45);

        doc.setLineWidth(0.5);
        doc.line(20, 50, pageWidth - 20, 50);

        // --- Table Setup ---
        let yPos = 60;
        const headers = ["Date", "Patient", "To Facility", "Status"];
        const colWidths = [40, 50, 60, 40];
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
             const facilityTo = r.facility_to || "N/A";
             const statusStr = r.status.replace("_", " ");
             
             const rowData = [dateStr, patientName, facilityTo, statusStr];
             
             rowData.forEach((text, i) => {
                 // Simple truncation
                 let finalText = text;
                 // Approx char width logic is flawed without proper measurement, just safe truncation
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

        doc.save("referral_report.pdf");
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
                            <Label>Start Date <span className="text-destructive">*</span></Label>
                            <Input required type="date" value={startDate} max={new Date().toISOString().split('T')[0]} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2 flex-1">
                            <Label>End Date <span className="text-destructive">*</span></Label>
                            <Input required type="date" value={endDate} max={new Date().toISOString().split('T')[0]} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
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

export default DoctorDashboard;