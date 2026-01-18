
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
        toast({
            title: "Invalid Link",
            description: "No reset token found. Please request a new link.",
            variant: "destructive"
        });
        navigate("/auth");
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 6) {
        toast({
            title: "Error",
            description: "Password must be at least 6 characters",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: passwords.new });
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Hero/Image */}
      <div className="hidden lg:flex flex-col bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/90 z-10" />
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}
        />
        <div className="relative z-20 flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <span>AFYALINK</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">Set New Password</h1>
            <p className="text-lg opacity-90 max-w-md">
              Secure your account with a strong new password.
            </p>
          </div>
          <div className="text-sm opacity-70">
            © 2024 AfyaLink Secure Referral System
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {!isSuccess ? (
            <>
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
                    <p className="text-muted-foreground mt-2">
                    Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            className="pl-10"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            required
                        />
                        </div>
                    </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>
            </>
          ) : (
            <div className="bg-muted/50 p-8 rounded-lg text-center space-y-6 animate-in fade-in zoom-in border border-success/20">
              <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-success">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold">Password Reset!</h3>
              <p className="text-muted-foreground">
                Your password has been successfully updated. You can now login with your new credentials.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Continue to Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
