import { useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, Plus, FileText, Check, X, AlertCircle } from "lucide-react";
import { authApi, dataApi } from "@/lib/api";
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

const DoctorDashboard = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newReferral, setNewReferral] = useState({
    patientEmail: "",
    facilityFrom: "",
    facilityTo: "",
    reason: "",
    diagnosis: "",
    notes: "",
    urgency: "medium",
  });

  useEffect(() => {
    fetchUser();
    fetchReferrals();
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

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataApi.createReferral({
        patientEmail: newReferral.patientEmail,
        facility_from: newReferral.facilityFrom,
        facility_to: newReferral.facilityTo,
        reason: newReferral.reason,
        diagnosis: newReferral.diagnosis,
        notes: newReferral.notes,
        urgency: newReferral.urgency,
      });

      toast({ title: "Referral created successfully" });
      setShowForm(false);
      setNewReferral({
        patientEmail: "",
        facilityFrom: "",
        facilityTo: "",
        reason: "",
        diagnosis: "",
        notes: "",
        urgency: "medium",
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "medium":
        return "bg-secondary text-secondary-foreground"; // Differentiate medium from high
      case "low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout title="Doctor Dashboard" role="Doctor">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">Manage patient referrals</p>
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
                  <Input
                    id="facilityTo"
                    value={newReferral.facilityTo}
                    onChange={(e) => setNewReferral({ ...newReferral, facilityTo: e.target.value })}
                    required
                  />
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
    </DashboardLayout>
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

export default DoctorDashboard;