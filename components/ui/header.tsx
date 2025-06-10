"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { ClientOnly } from "./client-only";
import { useHydration } from "@/hooks/useHydration";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHydrated = useHydration();

  // Get user's initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="glass-effect border-b border-border/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image
              src="/assets/diamond_logo_green.png"
              alt="EightFaces Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <a 
            href="https://eightfaces.ru" 
            className="ai-gradient-text font-bold text-lg hover:scale-105 transition-transform duration-200"
          >
            EightFaces: Soft Skills Engine
          </a>
        </div>
        <nav className="flex items-center space-x-3">
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
          {isHydrated && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full p-0 w-10 h-10 glass-effect hover:ai-glow transition-all duration-300"
                  aria-label="User menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={session.user?.image || ""}
                      alt={session.user?.name || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {session.user?.name ? (
                        getInitials(session.user.name)
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 ai-card">
                <div className="flex flex-col space-y-1 p-3">
                  <p className="text-sm font-semibold leading-none">
                    {session.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user?.email}
                  </p>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/account" className="flex items-center">
                    Личный кабинет
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-red-500 focus:text-red-600"
                >
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isHydrated ? (
            <Button variant="outline" asChild className="ai-button">
              <Link href="/auth/signin">Вход</Link>
            </Button>
          ) : (
            <div className="w-20 h-10 bg-muted rounded animate-pulse"></div>
          )}
        </nav>
      </div>
    </header>
  );
}
