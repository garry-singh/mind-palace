import { v } from "convex/values";
import { mutation, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUserOrThrow } from "./users";

/**
 * Create a new post
 */
export const create = mutation({
  args: {
    content: v.string(),
    parentId: v.optional(v.id("posts")),
    authorName: v.string(),
    authorUsername: v.string(),
    authorImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const user = await getCurrentUserOrThrow(ctx);

    // Insert the post
    const postId = await ctx.db.insert("posts", {
      content: args.content,
      userId: user._id,
      likeCount: 0,
      replyCount: 0,
      repostCount: 0,
      parentId: args.parentId,
      authorName: args.authorName,
      authorId: user.clerkUserId,
      authorUsername: args.authorUsername,
      authorImageUrl: args.authorImageUrl,
    });

    // If this is a reply, increment the reply count on the parent post
    if (args.parentId) {
      const parentPost = await ctx.db.get(args.parentId);
      if (parentPost) {
        await ctx.db.patch(args.parentId, {
          replyCount: parentPost.replyCount + 1,
        });
      }
    }

    return postId;
  },
});

/**
 * Delete a post
 */
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Check if the user is the author of the post
    if (post.userId.toString() !== user._id.toString()) {
      throw new Error("Not authorized to delete this post");
    }
    
    // If this is a reply, decrement the reply count on the parent post
    if (post.parentId) {
      const parentPost = await ctx.db.get(post.parentId);
      if (parentPost) {
        await ctx.db.patch(post.parentId, {
          replyCount: Math.max(0, parentPost.replyCount - 1),
        });
      }
    }
    
    // Delete the post
    await ctx.db.delete(args.postId);
    
    return { success: true };
  },
});

/**
 * Like a post
 */
export const like = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user already liked the post
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) => 
        q.eq("postId", args.postId).eq("userId", user._id)
      )
      .unique();

    if (existingLike) {
      // Unlike: Delete the like record and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });
      return { liked: false };
    } else {
      // Like: Create a new like record and increment count
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: user._id,
      });
      await ctx.db.patch(args.postId, {
        likeCount: post.likeCount + 1,
      });
      return { liked: true };
    }
  },
});

/**
 * Save a post
 */
export const save = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user already saved the post
    const existingSave = await ctx.db
      .query("saves")
      .withIndex("by_post_and_user", (q) => 
        q.eq("postId", args.postId).eq("userId", user._id)
      )
      .unique();

    if (existingSave) {
      // Unsave: Delete the save record
      await ctx.db.delete(existingSave._id);
      return { saved: false };
    } else {
      // Save: Create a new save record
      await ctx.db.insert("saves", {
        postId: args.postId,
        userId: user._id,
      });
      return { saved: true };
    }
  },
});

/**
 * Follow a user
 */
export const followUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    
    // Can't follow yourself
    if (currentUser._id.toString() === args.userId.toString()) {
      throw new Error("You cannot follow yourself");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) => 
        q.eq("followerId", currentUser._id).eq("followedId", args.userId)
      )
      .unique();

    if (existingFollow) {
      // Unfollow: Delete the follow record
      await ctx.db.delete(existingFollow._id);
      return { following: false };
    } else {
      // Follow: Create a new follow record
      await ctx.db.insert("follows", {
        followerId: currentUser._id,
        followedId: args.userId,
      });
      return { following: true };
    }
  },
});

/**
 * Check if a user has liked a post
 */
export async function hasUserLikedPost(
  ctx: QueryCtx,
  userId: Id<"users">,
  postId: Id<"posts">
) {
  const like = await ctx.db
    .query("likes")
    .withIndex("by_post_and_user", (q) => 
      q.eq("postId", postId).eq("userId", userId)
    )
    .unique();
  
  return like !== null;
}

/**
 * Check if a user has saved a post
 */
export async function hasUserSavedPost(
  ctx: QueryCtx,
  userId: Id<"users">,
  postId: Id<"posts">
) {
  const save = await ctx.db
    .query("saves")
    .withIndex("by_post_and_user", (q) => 
      q.eq("postId", postId).eq("userId", userId)
    )
    .unique();
  
  return save !== null;
}

/**
 * Check if a user is following another user
 */
export async function isUserFollowing(
  ctx: QueryCtx,
  followerId: Id<"users">,
  followedId: Id<"users">
) {
  const follow = await ctx.db
    .query("follows")
    .withIndex("by_both", (q) => 
      q.eq("followerId", followerId).eq("followedId", followedId)
    )
    .unique();
  
  return follow !== null;
}