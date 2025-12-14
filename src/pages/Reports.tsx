import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Heart, ArrowLeft, Download, Calendar, Filter, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    reportType: "referrals",
    status: "all",
  });

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const { data: user } = await import("@/lib/api").then(m => m.authApi.me());
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserRoles(user.roles || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      navigate("/auth");
    }
  };

  const handleGenerateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Fetch data based on report type
      // Fetch data based on report type
      // Currently backend only supports getting referrals (all or filtered depending on role).
      // For now we fetch all referrals and filter in JS as before.
      const { data } = await import("@/lib/api").then(m => m.dataApi.getReferrals());
      let dataToProcess = data || [];

      // Filter by date
      if (filters.startDate) {
        dataToProcess = dataToProcess.filter((r: any) => new Date(r.created_at) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        dataToProcess = dataToProcess.filter((r: any) => new Date(r.created_at) <= new Date(filters.endDate));
      }

      if (filters.status !== "all") {
        dataToProcess = dataToProcess.filter((r: any) => r.status === filters.status);
      }

      generatePDFReport(dataToProcess, filters);

      toast({
        title: "Success",
        description: "Report generated successfully!",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = (data: any[], filters: any) => {
    const doc = new jsPDF();
    const now = new Date();

    // Title
    doc.setFontSize(16);
    doc.text(`AFYALINK: ${filters.reportType.toUpperCase()} REPORT`, 14, 20);

    // Meta details
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 30);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 36);
    doc.text(`Status Filter: ${filters.status}`, 14, 42);

    // Summary
    doc.setFontSize(12);
    doc.text(`Total Records: ${data.length}`, 14, 55);

    // Table Header
    const startY = 65;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Status", 14, startY);
    doc.text("From", 50, startY);
    doc.text("To", 90, startY);
    doc.text("Urgency", 130, startY);
    doc.text("Date", 160, startY);

    // Draw line
    doc.line(14, startY + 2, 195, startY + 2);

    // Records
    let y = startY + 10;
    doc.setTextColor(0);

    data.forEach((record: any) => {
      // Page break check
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(record.status || "-", 14, y);

      // Truncate long strings
      const from = record.facility_from?.substring(0, 15) || "-";
      doc.text(from, 50, y);

      const to = record.facility_to?.substring(0, 15) || "-";
      doc.text(to, 90, y);

      doc.text(record.urgency || "-", 130, y);
      doc.text(new Date(record.created_at).toLocaleDateString(), 160, y);

      y += 8;
    });

    // Save
    doc.save(`AFYALINK_Report_${filters.reportType}_${now.toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Heart className="text-primary" size={32} />
                <span className="text-2xl font-bold text-foreground">AFYALINK</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Reports & Analytics</h1>
          <p className="text-muted-foreground text-lg">
            Generate and export reports for your referral activities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generate Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) =>
                  setFilters({ ...filters, reportType: value })
                }
              >
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referrals">Referrals Report</SelectItem>
                  {userRoles.includes("admin") && (
                    <>
                      <SelectItem value="facilities">Facilities Report</SelectItem>
                      <SelectItem value="staff">Medical Staff Report</SelectItem>
                      <SelectItem value="users">Users Report</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateReport}
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download size={18} />
                  Generate & Download Report
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {userRoles.includes("admin") && (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-1">Total Referrals</p>
                  <p className="text-3xl font-bold text-foreground">-</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-1">Active Facilities</p>
                  <p className="text-3xl font-bold text-foreground">-</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-1">Medical Staff</p>
                  <p className="text-3xl font-bold text-foreground">-</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
