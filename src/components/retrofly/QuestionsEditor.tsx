import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DEFAULT_QUESTIONS = [
  "What went well and why",
  "What went wrong and why",
  "Wish list",
  "Surprises",
  "Anything else here?",
];

interface QuestionsEditorProps {
  questions: string[];
  onChange: (questions: string[]) => void;
}

const QuestionsEditor = ({ questions, onChange }: QuestionsEditorProps) => {
  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    onChange([...questions, ""]);
  };

  return (
    <div className="space-y-3">
      <Label>Question Categories</Label>
      {questions.map((q, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">
            {idx + 1}.
          </span>
          <Input
            value={q}
            onChange={(e) => updateQuestion(idx, e.target.value)}
            placeholder="Enter a question…"
            className="rounded-xl h-11 flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeQuestion(idx)}
            disabled={questions.length <= 1}
            className="h-11 w-11 flex-shrink-0 text-muted-foreground hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addQuestion}
        className="rounded-full gap-1 h-11"
      >
        <Plus className="h-3 w-3" />
        Add question
      </Button>
    </div>
  );
};

export { DEFAULT_QUESTIONS };
export default QuestionsEditor;
