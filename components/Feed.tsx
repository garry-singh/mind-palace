"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreatePost from "@/components/CreatePost";
import Post from "@/components/Post";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

// Define a type for the post data including the additional properties from our query
interface PostWithInteractions extends Doc<"posts"> {
  liked: boolean;
  saved: boolean;
}

export default function Feed() {
  const { isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Pagination state
  const [allPostsCursor, setAllPostsCursor] = useState<string | null>(null);
  const [followingPostsCursor, setFollowingPostsCursor] = useState<
    string | null
  >(null);

  // ✅ Always call hooks in order, but only return data if the user is signed in
  const allPostsResult = useQuery(api.queries.getPosts, {
    paginationOpts: { cursor: allPostsCursor, numItems: 10 },
  }) || { page: [], continueCursor: null, isDone: true };

  const followingPostsResult = useQuery(
    api.queries.getFollowingPosts,
    isSignedIn
      ? { paginationOpts: { cursor: followingPostsCursor, numItems: 10 } }
      : "skip" // ✅ This prevents Convex from running the query when logged out
  ) || { page: [], continueCursor: null, isDone: true };

  // ✅ Use `useMemo` to only return data when the user is signed in
  const postsResult = useMemo(() => {
    if (!isSignedIn) return null;
    return activeTab === "following" ? followingPostsResult : allPostsResult;
  }, [isSignedIn, activeTab, followingPostsResult, allPostsResult]);

  const isLoading = postsResult === undefined;
  const posts = postsResult?.page || [];
  const hasMore = postsResult ? !postsResult.isDone : false;

  const renderPosts = (posts: PostWithInteractions[]) => {
    return posts.map((post: PostWithInteractions) => (
      <Post
        key={post._id.toString()}
        id={post._id}
        author={{
          id: post.authorId,
          name: post.authorName,
          username: post.authorUsername,
          avatar: post.authorImageUrl,
        }}
        content={post.content}
        createdAt={new Date(post._creationTime)}
        likes={post.likeCount}
        replies={post.replyCount}
        reposts={post.repostCount}
        liked={post.liked}
        saved={post.saved}
      />
    ));
  };

  // 🚨 If the user is not logged in, show a message instead of loading posts
  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto text-center py-10 text-muted-foreground">
        <p className="text-lg font-semibold">Log in to see posts</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <CreatePost
        onPostCreated={() => {
          setAllPostsCursor(null);
          setFollowingPostsCursor(null);
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent mb-4">
          <TabsTrigger
            value="following"
            className="data-[state=active]:border-b-2 data-[state=active]:border-black dark:data-[state=active]:border-white rounded-none data-[state=active]:font-semibold"
          >
            Following
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:border-b-2 data-[state=active]:border-black dark:data-[state=active]:border-white rounded-none data-[state=active]:font-semibold"
          >
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No posts from people you follow yet
            </div>
          ) : (
            <>
              {renderPosts(posts)}

              {hasMore && (
                <div className="text-center my-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFollowingPostsCursor(
                        followingPostsResult?.continueCursor || null
                      );
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No posts yet
            </div>
          ) : (
            <>
              {renderPosts(posts)}

              {hasMore && (
                <div className="text-center my-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAllPostsCursor(allPostsResult?.continueCursor || null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
