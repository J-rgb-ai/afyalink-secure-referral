import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Settings, Users, Shield, Lock, FileText, Globe, Bell,
    Database, Activity, MessageSquare, Briefcase, Sliders, Smartphone, AlertTriangle
} from "lucide-react";

const AdminSettings = () => {
    const [activeCategory, setActiveCategory] = useState("general");

    // Simulated state for settings
    const [settings, setSettings] = useState({
        platformName: "AfyaLink Secure Referral",
        language: "en",
        timezone: "Africa/Nairobi",
        maintenanceMode: false,
        contactEmail: "support@afyalink.com",
        contactPhone: "+254 700 000000",
        signupRole: "patient",
        requireActivation: true,
        allowRegistration: true,
        passwordLength: "8",
        enable2FA: true,
    });

    const categories = [
        { id: "general", label: "General Platform", icon: Settings },
        { id: "users", label: "User & Role Management", icon: Users },
        { id: "security", label: "Security & Authentication", icon: Lock },
        { id: "privacy", label: "Data Privacy & Compliance", icon: Shield },
        { id: "providers", label: "Healthcare Provider", icon: Briefcase },
        { id: "appointments", label: "Appointment & Service", icon: Sliders },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "integration", label: "Integration & API", icon: Database },
        { id: "content", label: "Content Management", icon: FileText },
        { id: "monitoring", label: "System Monitoring", icon: Activity },
        { id: "support", label: "Support & Feedback", icon: MessageSquare },
        { id: "localization", label: "Localization", icon: Globe },
        { id: "mobile", label: "Mobile App", icon: Smartphone },
        { id: "advanced", label: "Advanced", icon: AlertTriangle },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <Card className="w-full md:w-64 h-fit md:min-h-[600px]">
                <ScrollArea className="h-[600px] w-full">
                    <div className="p-2 space-y-1">
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={activeCategory === category.id ? "secondary" : "ghost"}
                                className="w-full justify-start gap-2 text-sm"
                                onClick={() => setActiveCategory(category.id)}
                            >
                                <category.icon className="h-4 w-4" />
                                {category.label}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Settings Content Area */}
            <div className="flex-1 space-y-6">
                {activeCategory === "general" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>General Platform Settings</CardTitle>
                            <CardDescription>Configure the basic details and behavior of the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="platformName">Platform Name</Label>
                                <Input
                                    id="platformName"
                                    value={settings.platformName}
                                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="language">System Language</Label>
                                    <Select value={settings.language} onValueChange={(val) => setSettings({ ...settings, language: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="sw">Swahili</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={settings.timezone} onValueChange={(val) => setSettings({ ...settings, timezone: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    value={settings.contactEmail}
                                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Disable access to the platform for all non-admin users.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save General Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "users" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>User & Role Management</CardTitle>
                            <CardDescription>Control user access and registration policies.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="signupRole">Default Role on Signup</Label>
                                <Select value={settings.signupRole} onValueChange={(val) => setSettings({ ...settings, signupRole: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="patient">Patient</SelectItem>
                                        <SelectItem value="doctor">Doctor (Pending Approval)</SelectItem>
                                        <SelectItem value="nurse">Nurse (Pending Approval)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Require Admin Activation</Label>
                                    <p className="text-sm text-muted-foreground">
                                        New accounts must be manually activated by an admin.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.requireActivation}
                                    onCheckedChange={(checked) => setSettings({ ...settings, requireActivation: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow New Registrations</Label>
                                    <p className="text-sm text-muted-foreground">
                                        If disabled, only admins can create new users manually.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.allowRegistration}
                                    onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save User Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "security" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Security & Authentication</CardTitle>
                            <CardDescription>Manage password policies and login security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="passwordLength">Minimum Password Length</Label>
                                <Select value={settings.passwordLength} onValueChange={(val) => setSettings({ ...settings, passwordLength: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="8">8 characters</SelectItem>
                                        <SelectItem value="10">10 characters</SelectItem>
                                        <SelectItem value="12">12 characters</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enforce 2FA for all admin and provider accounts.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.enable2FA}
                                    onCheckedChange={(checked) => setSettings({ ...settings, enable2FA: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Login Attempt Limit</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Lock account after 5 failed attempts.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Security Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "privacy" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Privacy & Compliance</CardTitle>
                            <CardDescription>Configure data retention and compliance policies.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">HIPAA Compliance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enforce strict data access logging and timeouts.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="grid gap-2">
                                <Label>Data Retention Period</Label>
                                <Select defaultValue="7years">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1year">1 Year</SelectItem>
                                        <SelectItem value="5years">5 Years</SelectItem>
                                        <SelectItem value="7years">7 Years (Standard)</SelectItem>
                                        <SelectItem value="forever">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow Patient Data Export</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Patients can download their own medical records.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Privacy Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "providers" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Healthcare Provider Settings</CardTitle>
                            <CardDescription>Manage requirements for doctors and facilities.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Verify License Automatically</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Integrate with medical board API to verify licenses.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Manual Approval Required</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Admins must approve all provider registrations.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="grid gap-2">
                                <Label>Default Provider Status</Label>
                                <Select defaultValue="pending">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active (Immediate)</SelectItem>
                                        <SelectItem value="pending">Pending Validation</SelectItem>
                                        <SelectItem value="probation">Probation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Provider Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}


                {activeCategory === "appointments" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointment & Service Settings</CardTitle>
                            <CardDescription>Configure how appointments are booked and managed.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Default Appointment Duration</Label>
                                <Select defaultValue="30">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 Minutes</SelectItem>
                                        <SelectItem value="30">30 Minutes</SelectItem>
                                        <SelectItem value="45">45 Minutes</SelectItem>
                                        <SelectItem value="60">1 Hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Telemedicine</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow video consultation bookings.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow Cancellations</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Patients can cancel up to 24h before.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Appointment Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "notifications" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications & Communication</CardTitle>
                            <CardDescription>Manage how the system communicates with users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send transactional emails (welcome, reset password, etc.)
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">SMS Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send SMS alerts for appointments and referrals.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="grid gap-2">
                                <Label>SMS Provider</Label>
                                <Select defaultValue="twilio">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="twilio">Twilio</SelectItem>
                                        <SelectItem value="africastalking">AfricasTalking</SelectItem>
                                        <SelectItem value="aws-sns">AWS SNS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Notification Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "integration" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Integration & API</CardTitle>
                            <CardDescription>Manage third-party connections and API keys.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Google Maps API Key</Label>
                                <Input type="password" value="AIzaSy************************" disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label>Payment Gateway Key (Stripe/M-Pesa)</Label>
                                <Input type="password" value="sk_test_************************" disabled />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Webhooks</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send real-time events to external URLs.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Integration Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "content" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Management</CardTitle>
                            <CardDescription>Manage FAQs, articles, and announcements.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Show Announcement Banner</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display a global alert at the top of the dashboard.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="grid gap-2">
                                <Label>Banner Message</Label>
                                <Input placeholder="e.g., System maintenance scheduled for..." />
                            </div>
                            <div className="grid gap-2">
                                <Label>Homepage Hero Image</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                        Preview
                                    </div>
                                    <Button variant="outline">Upload New Image</Button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Content Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "monitoring" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>System Monitoring</CardTitle>
                            <CardDescription>View system health and logs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-semibold">Server Status</p>
                                    <p className="text-2xl font-bold text-success">Operational</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-semibold">Database Latency</p>
                                    <p className="text-2xl font-bold">24ms</p>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Log Level</Label>
                                <Select defaultValue="info">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="debug">Debug</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                        <SelectItem value="warn">Warning</SelectItem>
                                        <SelectItem value="error">Error</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline">Download System Logs</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "support" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Support & Feedback</CardTitle>
                            <CardDescription>Configure help center and ticketing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="help@afyalink.com" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Live Chat</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show support widget on dashboard.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Support Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "localization" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Localization & Accessibility</CardTitle>
                            <CardDescription>Manage languages and display preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Default Date Format</Label>
                                <Select defaultValue="dd/mm/yyyy">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">High Contrast Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Increase contrast for better visibility.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Localization Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "mobile" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mobile App Settings</CardTitle>
                            <CardDescription>Configure minimal version and update policies.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Minimum iOS Version</Label>
                                <Input defaultValue="1.0.4" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Minimum Android Version</Label>
                                <Input defaultValue="1.2.0" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Force Update</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require users to update to latest version.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Mobile Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeCategory === "advanced" && (
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Advanced / Developer Zone</CardTitle>
                            <CardDescription>Critial system configurations. Proceed with caution.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold text-destructive">Debug Mode</Label>
                                    <p className="text-sm text-destructive/80">
                                        Enable verbose logging and error reporting.
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold text-destructive">Flush Cache</Label>
                                    <p className="text-sm text-destructive/80">
                                        Clear all server-side caches immediately.
                                    </p>
                                </div>
                                <Button variant="destructive" size="sm">Flush Now</Button>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" className="text-destructive hover:bg-destructive/10">Evaluate Feature Flags</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pushing the catch-all down further */}
                {activeCategory !== "general" &&
                    activeCategory !== "users" &&
                    activeCategory !== "security" &&
                    activeCategory !== "privacy" &&
                    activeCategory !== "providers" &&
                    activeCategory !== "appointments" &&
                    activeCategory !== "notifications" &&
                    activeCategory !== "integration" &&
                    activeCategory !== "content" &&
                    activeCategory !== "monitoring" &&
                    activeCategory !== "support" &&
                    activeCategory !== "localization" &&
                    activeCategory !== "mobile" &&
                    activeCategory !== "advanced" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Coming Soon</CardTitle>
                                <CardDescription>This settings category is under development.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Please configure General and User settings for now.</p>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </div>
    );
};

export default AdminSettings;
