import { useProfileById, getInitials } from "@/lib/profileUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileAvatarProps {
  userId: string;
  showName?: boolean;
  size?: "sm" | "md";
}

const ProfileAvatar = ({ userId, showName = true, size = "md" }: ProfileAvatarProps) => {
  const { profile, loading } = useProfileById(userId);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className={size === "sm" ? "h-6 w-6 rounded-full" : "h-8 w-8 rounded-full"} />
        {showName && <Skeleton className="h-4 w-20 rounded" />}
      </div>
    );
  }

  const sizeClass = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";

  return (
    <div className="flex items-center gap-2">
      <Avatar className={sizeClass}>
        {profile?.avatar_url && (
          <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "User"} />
        )}
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
          {getInitials(profile?.display_name)}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="text-sm text-foreground truncate max-w-[120px]">
          {profile?.display_name ?? "Unknown"}
        </span>
      )}
    </div>
  );
};

export default ProfileAvatar;
