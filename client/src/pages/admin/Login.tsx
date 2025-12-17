import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GoogleAuthButton, { loadGoogleAuth } from "@/components/GoogleAuthButton";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Google Auth when component mounts
    loadGoogleAuth();
  }, []);

  const handleGoogleLogin = (token: string, user: any) => {
    // no-op: GoogleAuthButton handles redirect after successful verification
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store authentication token/session
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminAuthenticated", "true");
        
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard",
        });
        
        // Redirect to admin dashboard
        window.location.href = "/admin";
      } else {
        const errorData = await response.json();
        
        if (errorData.locked) {
          toast({
            title: "Account Locked",
            description: `Too many failed attempts. Please try again in ${errorData.remainingTime} minutes.`,
          });
        } else {
          toast({
            title: "Login Failed",
            description: errorData.message || "Invalid credentials",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/LOGO.png" 
              alt="Logo" 
              className="w-20 h-20 mx-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <GoogleAuthButton 
            onGoogleLogin={handleGoogleLogin}
            isLoading={isLoading}
          />
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Default credentials: admin / admin123</p>
            <p className="mt-1">Or use ADMIN_KEY environment variable</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
