import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { getInitials } from "@/lib/profileUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Menu, UserPen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditProfileDialog from "@/components/retrofly/EditProfileDialog";
import ThemeToggle from "@/components/retrofly/ThemeToggle";

const TopNav = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const { toast } = useToast();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-11 max-w-[1400px] items-center justify-between px-4 md:px-8 relative">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-foreground fill-foreground" />
          <span className="text-base font-semibold tracking-[-0.02em] text-foreground">
            Retrofly
          </span>
        </Link>


        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow">
                <Avatar className="h-6 w-6 ring-1 ring-border">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "User"} />
                  )}
                  <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                    {getInitials(profile?.display_name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground truncate">{profile?.display_name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email ?? ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditProfileOpen(true)} className="cursor-pointer">
                <UserPen className="mr-2 h-4 w-4" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle variant="ghost" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="pt-12 bg-background border-border">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <Avatar className="h-8 w-8 ring-1 ring-border">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "User"} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">{getInitials(profile?.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{profile?.display_name ?? "User"}</span>
                    <span className="text-xs text-muted-foreground">{profile?.email ?? ""}</span>
                  </div>
                </div>
                <SheetClose asChild>
                  <button onClick={() => setEditProfileOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground min-h-[44px] py-2 hover:text-foreground transition-colors">
                    <UserPen className="h-4 w-4" />
                    Edit profile
                  </button>
                </SheetClose>
                <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground min-h-[44px] py-2 hover:text-foreground transition-colors">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </nav>
  );
};

export default TopNav;
