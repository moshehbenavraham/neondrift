import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCloseRetro, type Retro } from "@/hooks/useRetros";
import { useRetroParticipants } from "@/hooks/useRetroParticipants";
import { getInitials } from "@/lib/profileUtils";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import EditProfileDialog from "@/components/retrofly/EditProfileDialog";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Link as LinkIcon,
  AlertTriangle,
  CheckSquare,
  Clock,
  Star,
  Sparkles,
  LogOut,
  UserPen,
  Layers,
  Loader2,
  Plane,
  Heart,
} from "lucide-react";

interface RetroHeaderProps {
  retro: Retro;
  onOpenActions: () => void;
  onOpenTimeline: () => void;
  onOpenTop3: () => void;
  onOpenSummary: () => void;
  onAutoGroup: () => void;
  isTimelineActive?: boolean;
  isGrouping?: boolean;
}

const RetroHeader = ({ retro, onOpenActions, onOpenTimeline, onOpenTop3, onOpenSummary, onAutoGroup, isTimelineActive, isGrouping }: RetroHeaderProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const closeRetro = useCloseRetro();
  const { participants } = useRetroParticipants(retro.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast: toastHook } = useToast();

  const isCreator = user?.id === retro.created_by;
  const isOpen = retro.status === "open";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClose = async () => {
    try {
      await closeRetro.mutateAsync(retro.id);
      setDialogOpen(false);
    } catch {
      // Mutation-level error handling displays the toast.
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! Share it with your team.");
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success("Link copied!");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toastHook({ title: "Sign out failed", variant: "destructive" });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Top breadcrumb bar */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-8 h-11 bg-background border-b border-border"
      >
        <Link to="/dashboard" className="flex items-center gap-1.5 flex-shrink-0">
          <Heart className="h-3.5 w-3.5 text-foreground fill-foreground" />
          <span className="text-base font-semibold tracking-[-0.02em] text-foreground">Retrofly</span>
        </Link>

        <div className="flex items-center gap-3">
          

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile?.display_name ?? "User"} />
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
      </header>

      {/* Notion-style page title */}
      <div className="mb-8 pt-16">
        <h1 className="text-[40px] font-bold text-foreground leading-[1.2] tracking-[-0.06em]">
          {retro.title}
        </h1>
        {retro.description && (
          <p className="mt-1.5 text-base text-muted-foreground">{retro.description}</p>
        )}
      </div>

      {/* Bottom dock */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] w-auto max-w-[90vw]">
        {/* Status */}
        <div className="hidden md:flex items-center pr-2 border-r border-neutral-700">
          {isOpen ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-xs font-medium text-neutral-100">Open</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-500 flex-shrink-0" />
              <span className="text-xs font-medium text-neutral-400">Closed</span>
            </div>
          )}
        </div>




        {/* Tools */}
        <div className="flex items-center gap-0.5 [&_button]:text-neutral-300 [&_button:hover]:text-neutral-100 [&_button:hover]:bg-neutral-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onOpenActions}>
                <CheckSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Action items</TooltipContent>
          </Tooltip>

          {retro.format !== "simple" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={isTimelineActive ? "secondary" : "ghost"} size="icon" className={`h-8 w-8 rounded-md ${isTimelineActive ? "!text-neutral-900" : ""}`} onClick={onOpenTimeline}>
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{isTimelineActive ? "Back to board" : "Timeline"}</TooltipContent>
            </Tooltip>
          )}

          {retro.format !== "simple" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onOpenTop3}>
                  <Star className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Top 3</TooltipContent>
            </Tooltip>
          )}

          {isOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onAutoGroup} disabled={isGrouping}>
                  {isGrouping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Group by theme</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onOpenSummary}>
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">AI summary</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handleShare}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Share link</TooltipContent>
          </Tooltip>

          {isCreator && isOpen && (
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-md gap-1.5 h-8 text-xs px-3 border border-neutral-600 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 bg-neutral-800/50 ml-0.5">
                  <Lock className="h-3 w-3" />
                  <span className="hidden md:inline">Close</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive-foreground flex-shrink-0" />
                    <AlertDialogTitle>Close this retro?</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    This action is permanent. All tabs become read-only.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClose}
                    disabled={closeRetro.isPending}
                    className="rounded-md bg-foreground text-background hover:bg-foreground/90"
                  >
                    {closeRetro.isPending ? "Closing..." : "Yes, close retro"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </TooltipProvider>
  );
};

export default RetroHeader;
