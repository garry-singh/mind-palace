"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";

export default function CreatePost({
  onPostCreated,
}: {
  onPostCreated?: () => void;
}) {
  const { user, isSignedIn } = useUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex mutation for creating a post
  const createPost = useMutation(api.posts.create);

  const handleSubmit = async () => {
    if (!content.trim() || !isSignedIn || !user) return;

    setIsSubmitting(true);

    try {
      // Create the post in the database
      await createPost({
        content: content.trim(),
        authorName: user.fullName || user.username || "User",
        authorUsername: user.username || `user${user.id.substring(0, 8)}`,
        authorImageUrl: user.imageUrl,
      });

      // Clear the textarea and reset state
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Notify parent component that a post was created
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  if (!isSignedIn) {
    return (
      <Card className="mb-6 border-none shadow-none">
        <CardContent className="p-4 text-center text-muted-foreground">
          Sign in to create a post
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden border-b border-t-0 border-x-0 rounded-none shadow-none">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.imageUrl} alt={user?.username || "User"} />
            <AvatarFallback>
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="What's happening?"
              className="min-h-[60px] resize-none border-none focus-visible:ring-0 text-base p-0"
              value={content}
              onChange={handleTextareaChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 flex justify-between border-t">
        <div className="flex-1"></div>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="rounded-full px-4"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting
            </>
          ) : (
            "Post"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
