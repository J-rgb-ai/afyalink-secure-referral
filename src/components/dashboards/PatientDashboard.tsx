import { useEffect, useState } from "react";
import { dataApi, authApi } from "@/lib/api";
import { jsPDF } from "jspdf";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, Shield, Lock, Unlock } from "lucide-react";
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

const PatientDashboard = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reportType, setReportType] = useState("referral_history");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const { data } = await dataApi.getReferrals();
      setReferrals(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
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

  const generateReport = () => {
    let filteredData = [...referrals];

    // Filter by date range
    if (startDate && startTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      filteredData = filteredData.filter(r => new Date(r.created_at) >= startDateTime);
    }
    if (endDate && endTime) {
      const endDateTime = new Date(`${endDate}T${endTime}`);
      filteredData = filteredData.filter(r => new Date(r.created_at) <= endDateTime);
    }

    // Filter by status
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

    return filteredData;
  };

  const downloadReport = () => {
    const reportData = generateReport();

    const reportTypeNames: Record<string, string> = {
      referral_history: "My Referral History",
      visit_history: "My Visit History",
      health_reports: "My Submitted Health Reports",
    };

    // Initialize jsPDF
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(reportTypeNames[reportType] || "Report", 14, 20);

    // Generated date
    doc.setFontSize(10);
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 14, 30);

    // Filters
    const filters = [
      `Start Date: ${startDate && startTime ? `${startDate} ${startTime}` : "Not set"}`,
      `End Date: ${endDate && endTime ? `${endDate} ${endTime}` : "Not set"}`,
      `Status: ${statusFilter}`,
    ];
    filters.forEach((f, i) => {
      doc.text(f, 14, 40 + i * 6);
    });

    // Table header
    const startY = 60;
    doc.setFontSize(12);
    doc.text("Patient", 14, startY);
    doc.text("Facility To", 70, startY);
    doc.text("Status", 130, startY);
    doc.text("Created", 180, startY);

    // Table rows
    let y = startY + 6;
    reportData.forEach((r: any) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(r.patient?.full_name ?? "", 14, y);
      doc.text(r.facility_to ?? "", 70, y);
      doc.text(r.status ?? "", 130, y);
      doc.text(new Date(r.created_at).toLocaleDateString(), 180, y);
      y += 6;
    });

    // Save PDF
    doc.save(`${reportType}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const [user, setUser] = useState<any>(null);
  const [consents, setConsents] = useState<any[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchReferrals();
    fetchConsents();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
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

  // Derive potential consent targets from referrals (Doctors the patient has interacted with)
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

    // Optimistic update
    const previousConsents = [...consents];
    if (currentConsent) {
      setConsents(prev => prev.map(c => c.id === currentConsent.id ? { ...c, status: newStatus } : c));
    } else {
       setConsents(prev => [...prev, { entity_id: target.id, entity_type: target.type, status: newStatus }]);
    }

    try {
      await dataApi.updateConsent({
        entity_type: target.type,
        entity_id: target.id,
        entity_name: target.name,
        status: newStatus
      });
      // Refresh to get real IDs etc
      fetchConsents(); 
    } catch (error) {
      console.error("Failed to update consent");
      setConsents(previousConsents); // Revert
    }
  };

  const dashboardTitle = user ? `${user.full_name}'s Dashboard` : "Patient Dashboard";

  return (
    <DashboardLayout title={dashboardTitle} role="Patient">
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

      <div className="mb-6">
        <p className="text-muted-foreground">View your medical referrals</p>
      </div>

      <div className="space-y-4 mb-6">
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
                    <span className="font-semibold">Reason for Referral:</span>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date & Time</Label>
              <div className="flex gap-2">
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date & Time</Label>
              <div className="flex gap-2">
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral_history">My Referral History</SelectItem>
                  <SelectItem value="visit_history">My Visit History</SelectItem>
                  <SelectItem value="health_reports">My Submitted Health Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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
          </div>

          <Button
            onClick={downloadReport}
            className="w-full md:w-auto"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Generate & Download Report
          </Button>
        </CardContent>
      </Card>
      <Card className="mb-6">
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
                 const isGranted = consent?.status === 'granted'; // Default to denied if not found, usually default is 'read' in some systems but let's be strict

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
    </DashboardLayout>
  );
};

export default PatientDashboard;