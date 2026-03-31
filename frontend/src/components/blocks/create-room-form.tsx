import type { FormEvent } from "react";
import { Bot, Gavel, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateRoomFormProps {
  topic: string;
  topicBrief: string;
  sideSelectionMode: string;
  ownerParticipates: boolean;
  evaluationInstructions: string;
  loading: boolean;
  suggesting: boolean;
  onTopicChange: (value: string) => void;
  onSideSelectionModeChange: (value: string) => void;
  onOwnerParticipatesChange: (value: boolean) => void;
  onEvaluationInstructionsChange: (value: string) => void;
  onSuggest: () => void;
  onSubmit: (e: FormEvent) => void;
}

export default function CreateRoomForm({
  topic,
  topicBrief,
  sideSelectionMode,
  ownerParticipates,
  evaluationInstructions,
  loading,
  suggesting,
  onTopicChange,
  onSideSelectionModeChange,
  onOwnerParticipatesChange,
  onEvaluationInstructionsChange,
  onSuggest,
  onSubmit,
}: CreateRoomFormProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <Gavel className="h-5 w-5 text-primary" />
            Create Debate Room
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure rules, invite challengers, and launch a structured arena.
          </p>
        </div>
        <div className="rounded-full border border-border/70 bg-muted px-3 py-1 text-xs text-muted-foreground">
          Host Controls
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="topic">Debate Topic</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="topic"
              placeholder="e.g. Should AI be regulated like medicine?"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              className="h-10"
            />
            <Button
              type="button"
              variant="secondary"
              className="sm:min-w-36"
              onClick={onSuggest}
              disabled={suggesting}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {suggesting ? "Suggesting..." : "Suggest Topic"}
            </Button>
          </div>
        </div>

        {topicBrief && (
          <div className="rounded-lg border border-border/70 bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Bot className="h-4 w-4 text-primary" />
              AI Brief
            </p>
            <p className="mt-1">{topicBrief}</p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mode">Side Assignment</Label>
            <select
              id="mode"
              value={sideSelectionMode}
              onChange={(e) => onSideSelectionModeChange(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
            >
              <option value="auto">Auto balance sides</option>
              <option value="user">Users choose side</option>
              <option value="owner">Host assigns sides</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-participates">Host Role</Label>
            <label
              htmlFor="owner-participates"
              className="flex h-10 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm shadow-black/5"
            >
              <input
                id="owner-participates"
                type="checkbox"
                checked={ownerParticipates}
                onChange={(e) => onOwnerParticipatesChange(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span>I will participate in this debate</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">Evaluation Rules (Optional)</Label>
          <Textarea
            id="rules"
            value={evaluationInstructions}
            onChange={(e) => onEvaluationInstructionsChange(e.target.value)}
            placeholder="Example: Arguments must include one source and avoid personal attacks."
          />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            These rules guide moderation and final judging.
          </p>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Creating..." : "Create Room"}
        </Button>
      </form>
    </div>
  );
}
