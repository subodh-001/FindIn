"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success("Login successful! Welcome to CommunityGuard");
        router.push("/");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <Card className="w-full max-w-lg shadow-3xl border-0 bg-white/90 backdrop-blur-xl relative z-10 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-12 p-12">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-6 rounded-3xl shadow-2xl">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-600 text-xl font-medium leading-relaxed">
            Sign in to your CommunityGuard account to continue helping make your community safer
          </CardDescription>
        </CardHeader>
        <CardContent className="px-12 pb-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-lg font-black text-slate-700">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-lg font-black text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl pr-16 transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-slate-100 rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white h-16 text-xl font-black rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-12 text-center space-y-6">
            <p className="text-slate-600 text-lg font-medium">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-black hover:underline transition-all duration-300">
                Sign up here
              </Link>
            </p>
            
            <Link href="/forgot-password" className="text-lg text-slate-500 hover:text-blue-600 hover:underline block font-medium transition-all duration-300">
              Forgot your password?
            </Link>
          </div>

          {/* Test Accounts Info */}
          <div className="mt-12 p-8 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-slate-200 shadow-lg">
            <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-blue-600" />
              Test Accounts:
            </h4>
            <div className="text-sm text-slate-600 space-y-4">
              <div className="bg-white p-4 rounded-xl border-2 shadow-lg">
                <strong className="text-blue-600 text-lg font-black">Admin:</strong> admin@communityguard.in / admin123
              </div>
              <div className="bg-white p-4 rounded-xl border-2 shadow-lg">
                <strong className="text-emerald-600 text-lg font-black">Citizen:</strong> citizen@communityguard.in / citizen123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}