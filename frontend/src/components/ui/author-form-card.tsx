import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const AuthorFormCard = ({
  initialData,
  onSubmit,
  className,
}: any) => {
  const [name, setName] = React.useState(initialData?.name || "");
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [imageUrl, setImageUrl] = React.useState(initialData?.imageUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=fallback");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, title, imageUrl });
  };

  const swapAvatar = () => {
    const randomSeed = Math.floor(Math.random() * 10000);
    setImageUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  const FADE_IN_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.15,
          },
        },
      }}
      className={cn(
        "relative w-full max-w-lg rounded-xl bg-background p-6 shadow-xl border border-border/60",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <motion.h3 variants={FADE_IN_VARIANTS} className="text-xl font-semibold text-foreground">
          Complete Profile
        </motion.h3>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
        <motion.div variants={FADE_IN_VARIANTS} className="flex flex-col items-center gap-3 md:col-span-1">
          <div className="relative cursor-pointer group" onClick={swapAvatar}>
            <Avatar className="h-24 w-24 border-2 border-dashed border-border group-hover:border-primary transition-colors">
              <AvatarImage src={imageUrl} alt={name || "Avatar"} />
              <AvatarFallback className="bg-muted">
                <span className="text-xs text-muted-foreground">Icon</span>
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); swapAvatar(); }}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted"
              aria-label="Shuffle Image"
            >
              <Plus className="h-4 w-4 text-muted-foreground group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Pick Avatar</p>
            <p className="text-xs text-muted-foreground">Click to shuffle</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={swapAvatar}>
            Randomize
          </Button>
        </motion.div>

        <div className="flex flex-col gap-4 md:col-span-2">
          <motion.div variants={FADE_IN_VARIANTS} className="grid w-full items-center gap-1.5">
            <Label htmlFor="author-name">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              id="author-name"
              placeholder="e.g. MasterDebater"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </motion.div>
          <motion.div variants={FADE_IN_VARIANTS} className="grid w-full items-center gap-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="title">Bio</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>A short bio or your favorite debate tactic.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="text"
              id="title"
              placeholder="Logic > Emotion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </motion.div>
        </div>

        <motion.div variants={FADE_IN_VARIANTS} className="flex justify-end gap-3 md:col-span-3">
          <Button type="submit" className="w-full sm:w-auto shadow-sm">Save Profile</Button>
        </motion.div>
      </form>
    </motion.div>
  );
};
