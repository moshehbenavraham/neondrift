import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/profileUtils";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(50, "Display name must be 50 characters or less");

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { profile } = useProfile();
  const { mutateAsync, isLoading } = useUpdateProfile();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && profile?.display_name) {
      setName(profile.display_name);
      setError(null);
    }
  }, [open, profile?.display_name]);

  const handleSave = async () => {
    const result = displayNameSchema.safeParse(name);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setError(null);
    try {
      await mutateAsync(result.data);
      onOpenChange(false);
    } catch {
      // error toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-16 w-16">
            {profile?.avatar_url && (
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.display_name ?? "User"}
              />
            )}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-lg font-medium">
              {getInitials(profile?.display_name)}
            </AvatarFallback>
          </Avatar>

          <div className="w-full space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={50}
              placeholder="Your name"
              className="rounded-xl"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
