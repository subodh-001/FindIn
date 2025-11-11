"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Upload, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    phone: "",
    address: "",
  });
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        userType: formData.userType.toUpperCase(),
      };

      const result = await register(formData.email, formData.password, userData);
      
      if (result.success) {
        // Upload ID document if provided
        if (idDocument) {
          // Note: We'll need to get the user ID after registration
          // For now, we'll skip the upload and handle it in admin approval
          toast.info("Registration successful! Please check your email for verification.");
        } else {
          toast.success("Registration successful! Please check your email for verification.");
        }
        router.push("/login");
      } else {
        toast.error(result.error || "Registration failed");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdDocument(e.target.files[0]);
    }
  };

  const handleUserTypeChange = (value: string) => {
    setFormData({
      ...formData,
      userType: value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-3xl mx-auto relative z-10">
        <Card className="shadow-3xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-12 p-12">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-6 rounded-3xl shadow-2xl">
                <Shield className="h-16 w-16 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-slate-600 text-xl font-medium leading-relaxed">
              Join CommunityGuard to help find missing persons and track criminals. All users must be verified with government ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-12 pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-lg font-black text-slate-700">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-lg font-black text-slate-700">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

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
                <Label htmlFor="phone" className="text-lg font-black text-slate-700">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="address" className="text-lg font-black text-slate-700">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="userType" className="text-lg font-black text-slate-700">User Type</Label>
                <Select onValueChange={handleUserTypeChange} required disabled={loading}>
                  <SelectTrigger className="border-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-16 text-xl rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="Select your user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="police">Police Officer</SelectItem>
                    <SelectItem value="government">Government Agency</SelectItem>
                    <SelectItem value="security">Security Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-lg font-black text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
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
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-lg font-black text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-slate-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="idDocument" className="text-lg font-black text-slate-700">Government ID Document</Label>
                <div className="border-3 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 transition-all duration-500 shadow-lg hover:shadow-xl">
                  <Upload className="h-20 w-20 text-slate-400 mx-auto mb-6" />
                  <input
                    id="idDocument"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                    disabled={loading}
                  />
                  <label htmlFor="idDocument" className="cursor-pointer">
                    <div className="space-y-4">
                      <p className="text-xl font-black text-slate-700">
                        {idDocument ? idDocument.name : "Click to upload your government ID"}
                      </p>
                      <p className="text-lg text-slate-500 font-medium">
                        Supported formats: JPG, PNG, PDF (Max 10MB)
                      </p>
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-6 py-3 rounded-xl text-lg font-black shadow-lg">
                        📄 Aadhaar, PAN, Voter ID, Driving License
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-3 border-yellow-200 rounded-2xl p-8 shadow-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mt-1 mr-4 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-black text-yellow-800 mb-3">Important Notice</h4>
                    <p className="text-lg text-yellow-700 leading-relaxed font-medium">
                      Your account will be reviewed by our admin team. Only verified users can create reports. 
                      This verification process typically takes 24-48 hours. We take security seriously to protect our community.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white h-18 text-xl font-black rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="mr-3 h-6 w-6" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-12 text-center space-y-6">
              <p className="text-slate-600 text-lg font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-black hover:underline transition-all duration-300">
                  Sign in here
                </Link>
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
                <p className="text-lg text-slate-600 font-medium">
                  <strong className="text-blue-600 font-black">Why verification?</strong> We verify all users to ensure authentic reports and protect our community from false information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}