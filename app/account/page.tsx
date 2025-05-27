"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/ui/header";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchUserData();
    }
  }, [status, session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user`);
      if (!res.ok) throw new Error("Failed to fetch user data");
      const data = await res.json();
      setUserData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get user's initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container max-w-5xl mx-auto py-12 px-4 flex-grow">
          <div className="flex justify-center items-center min-h-[300px]">
            <p className="text-muted-foreground">Loading your account information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container max-w-5xl mx-auto py-12 px-4 flex-grow">
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
            <p className="text-muted-foreground mb-6">Please sign in to view your account information</p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-5xl mx-auto py-12 px-4 flex-grow">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Личный кабинет</h1>
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-full">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Вернуться к урокам</span>
              <span className="sm:hidden">Уроки</span>
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Summary */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="text-lg">
                      {session?.user?.name ? getInitials(session.user.name) : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-center">{session?.user?.name}</CardTitle>
                  <CardDescription className="text-center">{session?.user?.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs truncate max-w-[160px]" title={session?.user?.id}>
                      {session?.user?.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Type:</span>
                    <span>
                      {userData?.accounts?.length > 0 ? userData.accounts.map((a: any) => a.provider).join(", ") : "Email"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/api/auth/signout">Выйти</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="col-span-1 md:col-span-2">
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Профиль</TabsTrigger>
                <TabsTrigger value="activity">Активность</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Информация о профиле</CardTitle>
                    <CardDescription>Ваша персональная информация, которую мы храним на сервере</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading profile data...</p>
                    ) : error ? (
                      <p className="text-red-500">{error}</p>
                    ) : !userData ? (
                      <p className="text-muted-foreground">No detailed user data available</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <div className="font-medium">Name</div>
                          <div className="text-muted-foreground">{userData.name || "Not provided"}</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="font-medium">Email</div>
                          <div className="text-muted-foreground">{userData.email || "Not provided"}</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="font-medium">Email Verified</div>
                          <div className="text-muted-foreground">
                            {userData.emailVerified 
                              ? new Date(userData.emailVerified).toLocaleDateString() 
                              : "Not verified"}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Активность</CardTitle>
                    <CardDescription>Ваши последние сеансы и действия</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userData?.sessions && userData.sessions.length > 0 ? (
                      <div className="space-y-4">
                        {userData.sessions.map((session: any) => (
                          <div key={session.id} className="border rounded-md p-4">
                            <div className="grid gap-1">
                              <div className="font-medium">Session</div>
                              <div className="text-sm text-muted-foreground">
                                Expires: {new Date(session.expires).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No recent activity to display</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}