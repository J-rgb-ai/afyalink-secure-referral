import { useEffect, useState } from "react";
import { dataApi } from "@/lib/api";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
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
    doc.text("Referral ID", 14, startY);
    doc.text("Patient", 50, startY);
    doc.text("Facility To", 100, startY);
    doc.text("Status", 150, startY);
    doc.text("Created", 180, startY);

    // Table rows
    let y = startY + 6;
    reportData.forEach((r: any) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(r.id?.toString() ?? "", 14, y);
      doc.text(r.patient?.full_name ?? "", 50, y);
      doc.text(r.facility_to ?? "", 100, y);
      doc.text(r.status ?? "", 150, y);
      doc.text(new Date(r.created_at).toLocaleDateString(), 180, y);
      y += 6;
    });

    // Save PDF
    doc.save(`${reportType}_${new Date().toISOString().split("T")[0]}.pdf`);
  };
    const reportData = generateReport();
    
    const reportTypeNames: Record<string, string> = {
      "referral_history": "My Referral History",
      "visit_history": "My Visit History",
      "health_reports": "My Submitted Health Reports"
    };

    const reportContent = {
      title: reportTypeNames[reportType],
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: startDate && startTime ? `${startDate} ${startTime}` : "Not set",
        endDate: endDate && endTime ? `${endDate} ${endTime}` : "Not set",
        status: statusFilter === "all" ? "All Statuses" : statusFilter.replace("_", " ")
      },
      totalRecords: reportData.length,
      data: reportData.map(r => ({
        id: r.id,
        facilityFrom: r.facility_from,
        facilityTo: r.facility_to,
        referringDoctor: r.referring_doctor?.full_name || "Unknown",
        assignedDoctor: r.assigned_doctor?.full_name || "Not assigned",
        reason: r.reason,
        diagnosis: r.diagnosis || "N/A",
        urgency: r.urgency,
        status: r.status,
        createdAt: new Date(r.created_at).toLocaleString(),
        updatedAt: new Date(r.updated_at).toLocaleString()
      }))
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Patient Dashboard" role="Patient">
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

      <div className="mb-6">
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
    </DashboardLayout>
  );
};

export default PatientDashboard;