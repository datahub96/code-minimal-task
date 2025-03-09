import React, { useState, useEffect } from "react";
import { StorageManager } from "@/components/storage/StorageManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase-auth";
import { supabase } from "@/lib/supabase";

interface UserProfileProps {
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose = () => {} }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Try to get user from Supabase if available
        if (supabase) {
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            setLoading(false);
            return;
          }
        }

        // Fallback to localStorage
        const userJson = StorageManager.getItem("taskManagerUser");
        if (userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              User not found. Please log in again.
            </AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          View and manage your account information
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              value={user.username}
              className="pl-10"
              readOnly
            />
          </div>
        </div>

        {user.email && (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={user.email}
                className="pl-10"
                readOnly
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <p className="text-sm text-muted-foreground">
            Account created:{" "}
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : "Unknown"}
          </p>
          {user.last_login && (
            <p className="text-sm text-muted-foreground">
              Last login: {new Date(user.last_login).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserProfile;
