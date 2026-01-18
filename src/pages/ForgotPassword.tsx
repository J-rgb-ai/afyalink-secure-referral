
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      // Always show success message for security/ux
      setIsSubmitted(true);
      toast({
        title: "Email Sent",
        description: "If an account exists, you will receive a reset link shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send reset link",
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
            <h1 className="text-4xl font-bold mb-4">Secure Password Recovery</h1>
            <p className="text-lg opacity-90 max-w-md">
              Don't worry, it happens to the best of us. We'll help you recover your access securely.
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
          <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>

          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Forgot password?</h2>
            <p className="text-muted-foreground mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending Link..." : "Send Reset Link"}
              </Button>
              <div className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account?{" "}
                <Link to="/auth?tab=signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </form>
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg text-center space-y-4 animate-in fade-in zoom-in border border-primary/20">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">Check your email</h3>
              <p className="text-muted-foreground text-sm">
                We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-4">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                  Click to try again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
