"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="container max-w-5xl mx-auto py-12 px-6 flex-grow">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-2">Личный кабинет</h1>
            <p className="text-muted-foreground">Управляйте своим профилем и отслеживайте прогресс</p>
          </div>
          <Button asChild size="lg" className="ai-button rounded-full">
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
            <div className="ai-card">
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4 ring-4 ring-blue-500/20 ai-glow">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {session?.user?.name ? getInitials(session.user.name) : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-center mb-1">{session?.user?.name}</h2>
                  <p className="text-muted-foreground text-center text-sm">{session?.user?.email}</p>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 glass-effect rounded-md">
                    <span className="text-muted-foreground text-sm">Пройдено уроков:</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {userData?.progress?.length || 0}
                    </span>
                  </div>
                  {userData?.progress && userData.progress.length > 0 && (
                    <div className="py-2 px-3 glass-effect rounded-md">
                      <div className="text-muted-foreground text-sm mb-1">Последний урок:</div>
                      <div className="text-sm font-medium truncate">
                        {userData.progress[0].lesson.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(userData.progress[0].updatedAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 px-3 glass-effect rounded-md">
                    <span className="text-muted-foreground text-sm">Account Type:</span>
                    <span className="text-sm">
                      {userData?.accounts?.length > 0 ? userData.accounts.map((a: any) => a.provider).join(", ") : "Email"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 glass-effect rounded-md">
                    <span className="text-muted-foreground text-sm">User ID:</span>
                    <span className="font-mono text-xs truncate max-w-[160px] bg-muted px-2 py-1 rounded" title={session?.user?.id}>
                      {session?.user?.id}
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" size="sm" className="w-full ai-button" asChild>
                    <Link href="/api/auth/signout">Выйти из аккаунта</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="col-span-1 md:col-span-2">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6 glass-effect">
                <TabsTrigger value="profile" className="data-[state=active]:ai-glow">Профиль</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:ai-glow">Активность</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <div className="ai-card">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 ai-gradient-text">Информация о профиле</h3>
                    <p className="text-muted-foreground mb-6">Ваша персональная информация, которую мы храним на сервере</p>
                    <div className="space-y-4">
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
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity">
                <div className="ai-card">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 ai-gradient-text">Активность</h3>
                    <p className="text-muted-foreground mb-6">Пройденные уроки и даты их завершения</p>
                    {userData?.progress && userData.progress.length > 0 ? (
                      <div className="space-y-4">
                        {userData.progress.map((progress: any) => (
                          <div key={progress.id} className="glass-effect rounded-xl p-4 border-l-4 border-green-500">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-green-600 dark:text-green-400 mb-1">
                                  {progress.lesson.title}
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  Модуль {Number(progress.lesson.module.id) - 1}: {progress.lesson.module.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Завершен: {new Date(progress.updatedAt).toLocaleDateString('ru-RU', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <p className="text-muted-foreground">Вы еще не завершили ни одного урока</p>
                        <p className="text-sm text-muted-foreground mt-2">Начните проходить уроки, чтобы увидеть свой прогресс</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}