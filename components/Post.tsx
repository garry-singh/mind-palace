"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface PostProps {
  id: Id<"posts">;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  replies: number;
  reposts: number;
  liked?: boolean;
  saved?: boolean;
}

export default function Post({
  id,
  author,
  content,
  createdAt,
  likes,
  replies,
  reposts,
  liked = false,
  saved = false,
}: PostProps) {
  const { isSignedIn } = useUser();
  const [isLiked, setIsLiked] = useState(liked);
  const [likeCount, setLikeCount] = useState(likes);
  const [isSaved, setIsSaved] = useState(saved);

  // Convex mutations
  const likePost = useMutation(api.posts.like);
  const savePost = useMutation(api.posts.save);

  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleLike = async () => {
    if (!isSignedIn) return;

    try {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

      // Call the Convex mutation
      const result = await likePost({ postId: id });

      // Revert if there was an error (unlikely but possible)
      if (!result) {
        setIsLiked(isLiked);
        setLikeCount(likeCount);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      console.error("Error liking post:", error);
    }
  };

  const handleSave = async () => {
    if (!isSignedIn) return;

    try {
      // Optimistic update
      setIsSaved(!isSaved);

      // Call the Convex mutation
      const result = await savePost({ postId: id });

      // Revert if there was an error
      if (!result) {
        setIsSaved(isSaved);
      }
    } catch (error) {
      // Revert on error
      setIsSaved(isSaved);
      console.error("Error saving post:", error);
    }
  };

  return (
    <Card className="mb-2 overflow-hidden border-b border-t-0 border-x-0 rounded-none shadow-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{author.name}</span>
                <span className="text-muted-foreground ml-1">
                  @{author.username}
                </span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-muted-foreground">{timeAgo}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-base whitespace-pre-wrap break-words">
              {content}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 flex justify-between text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-8 text-muted-foreground hover:text-blue-500"
                onClick={() => {}}
              >
                <MessageCircle className="h-4 w-4" />
                {replies > 0 && <span className="text-xs">{replies}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-8 text-muted-foreground hover:text-green-500"
                onClick={() => {}}
              >
                <Repeat2 className="h-4 w-4" />
                {reposts > 0 && <span className="text-xs">{reposts}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Repost</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 h-8 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isLiked ? "Unlike" : "Like"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 h-8 ${isSaved ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}
                onClick={handleSave}
              >
                <Bookmark
                  className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isSaved ? "Unsave" : "Save"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
