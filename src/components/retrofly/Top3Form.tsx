import { useState, useEffect } from "react";
import { useTop3, useSubmitTop3, type Top3Category } from "@/hooks/useTop3";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Top3FormProps {
  retroId: string;
  isClosed: boolean;
}

const RANKS = [1, 2, 3] as const;

const Top3Form = ({ retroId, isClosed }: Top3FormProps) => {
  const { myEntries, loading } = useTop3(retroId);
  const submitTop3 = useSubmitTop3();
  const { toast } = useToast();

  const [doAgain, setDoAgain] = useState(["", "", ""]);
  const [doDiff, setDoDiff] = useState(["", "", ""]);

  // Pre-fill from existing entries
  useEffect(() => {
    if (myEntries.length > 0) {
      const ag = ["", "", ""];
      const df = ["", "", ""];
      for (const e of myEntries) {
        const idx = e.rank - 1;
        if (idx >= 0 && idx < 3) {
          if (e.type === "do_again") ag[idx] = e.text;
          else df[idx] = e.text;
        }
      }
      setDoAgain(ag);
      setDoDiff(df);
    }
  }, [myEntries]);

  if (isClosed) return null;

  const handleSave = async () => {
    const items: { type: Top3Category; rank: number; text: string }[] = [];
    doAgain.forEach((t, i) => {
      if (t.trim()) items.push({ type: "do_again", rank: i + 1, text: t });
    });
    doDiff.forEach((t, i) => {
      if (t.trim()) items.push({ type: "do_differently", rank: i + 1, text: t });
    });

    if (items.length === 0) {
      toast({ title: "Fill in at least one field", variant: "destructive" });
      return;
    }

    try {
      await submitTop3.mutateAsync({ retroId, items });
      toast({ title: "Top 3 saved! 🎉" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  if (loading) return null;

  return (
    <section className="space-y-4 pt-4">
      <h3 className="text-lg font-semibold text-foreground">Top 3 ✨</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Top 3 to do again 🔁
          </h4>
          {RANKS.map((rank) => (
            <div key={rank} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-5">
                {rank}.
              </span>
              <Input
                value={doAgain[rank - 1]}
                onChange={(e) => {
                  const next = [...doAgain];
                  next[rank - 1] = e.target.value;
                  setDoAgain(next);
                }}
                placeholder={`Item ${rank}`}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Top 3 to do differently 🔄
          </h4>
          {RANKS.map((rank) => (
            <div key={rank} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-5">
                {rank}.
              </span>
              <Input
                value={doDiff[rank - 1]}
                onChange={(e) => {
                  const next = [...doDiff];
                  next[rank - 1] = e.target.value;
                  setDoDiff(next);
                }}
                placeholder={`Item ${rank}`}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
      <Button
        onClick={handleSave}
        disabled={submitTop3.isPending}
        className="rounded-full"
      >
        {submitTop3.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Top 3
      </Button>
    </section>
  );
};

export default Top3Form;
