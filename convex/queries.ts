import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUser } from "./users";
import { hasUserLikedPost, hasUserSavedPost } from "./posts";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get all posts for the main feed
 */
export const getPosts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    
    // Query posts, sorted by creation time
    const postsPagination = await ctx.db
      .query("posts")
      .withIndex("by_creation_time")
      .order("desc")
      .paginate(paginationOpts);
    
    // Get current user for personalization, if signed in
    const currentUser = await getCurrentUser(ctx);
    
    // Enrich posts with user data and interaction status
    const enrichedPosts = await Promise.all(
      postsPagination.page.map(async (post) => {
        // Get the author information
        const author = await ctx.db.get(post.userId);
        
        // Check user interactions if logged in
        let liked = false;
        let saved = false;
        
        if (currentUser) {
          liked = await hasUserLikedPost(ctx, currentUser._id, post._id);
          saved = await hasUserSavedPost(ctx, currentUser._id, post._id);
        }
        
        return {
          ...post,
          author: author ? {
            id: author._id,
            clerkUserId: author.clerkUserId,
            name: author.name,
            username: author.username || `user_${author._id.toString().substring(0, 8)}`,
            imageUrl: author.imageUrl,
          } : null,
          liked,
          saved,
        };
      })
    );
    
    return {
      ...postsPagination,
      page: enrichedPosts,
    };
  },
});

/**
 * Get posts from followed users
 */
export const getFollowingPosts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    
    // Get current user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Authentication required");
    }
    
    // Get users the current user follows
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();
    
    // If not following anyone, return empty result
    if (follows.length === 0) {
      return {
        page: [],
        continueCursor: null,
        isDone: true,
      };
    }
    
    // Get IDs of followed users
    const followedUserIds = follows.map(follow => follow.followedId);
    
    // Get posts from each followed user
    const postsPromises = followedUserIds.map(userId => 
      ctx.db
        .query("posts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );
    
    const allUserPosts = await Promise.all(postsPromises);
    const flattenedPosts = allUserPosts.flat();
    
    // Sort posts by creation time
    const sortedPosts = flattenedPosts.sort((a, b) => 
      b._creationTime - a._creationTime
    );
    
    // Manual pagination
    const pageSize = paginationOpts?.numItems ?? 10;
    const startIdx = 0; // Would be based on cursor in a real implementation
    const endIdx = Math.min(startIdx + pageSize, sortedPosts.length);
    
    const page = sortedPosts.slice(startIdx, endIdx);
    
    // Enrich posts with user data and interaction status
    const enrichedPosts = await Promise.all(
      page.map(async (post) => {
        // Get the author information
        const author = await ctx.db.get(post.userId);
        
        // Check user interactions
        const liked = await hasUserLikedPost(ctx, currentUser._id, post._id);
        const saved = await hasUserSavedPost(ctx, currentUser._id, post._id);
        
        return {
          ...post,
          author: author ? {
            id: author._id,
            clerkUserId: author.clerkUserId,
            name: author.name,
            username: author.username || `user_${author._id.toString().substring(0, 8)}`,
            imageUrl: author.imageUrl,
          } : null,
          liked,
          saved,
        };
      })
    );
    
    return {
      page: enrichedPosts,
      continueCursor: endIdx < sortedPosts.length ? String(endIdx) : null,
      isDone: endIdx >= sortedPosts.length,
    };
  },
});

/**
 * Get a single post by ID
 */
export const getPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      return null;
    }
    
    // Get current user for personalization, if signed in
    const currentUser = await getCurrentUser(ctx);
    
    // Get the author information
    const author = await ctx.db.get(post.userId);
    
    // Check user interactions if logged in
    let liked = false;
    let saved = false;
    
    if (currentUser) {
      liked = await hasUserLikedPost(ctx, currentUser._id, post._id);
      saved = await hasUserSavedPost(ctx, currentUser._id, post._id);
    }
    
    return {
      ...post,
      author: author ? {
        id: author._id,
        clerkUserId: author.clerkUserId,
        name: author.name,
        username: author.username || `user_${author._id.toString().substring(0, 8)}`,
        imageUrl: author.imageUrl,
      } : null,
      liked,
      saved,
    };
  },
});

/**
 * Get replies to a post
 */
export const getReplies = query({
  args: {
    postId: v.id("posts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { postId, paginationOpts } = args;
    
    // Query replies for this post
    const repliesPagination = await ctx.db
      .query("posts")
      .withIndex("by_parent", (q) => q.eq("parentId", postId))
      .order("desc")
      .paginate(paginationOpts);
    
    // Get current user for personalization, if signed in
    const currentUser = await getCurrentUser(ctx);
    
    // Enrich replies with user data and interaction status
    const enrichedReplies = await Promise.all(
      repliesPagination.page.map(async (reply) => {
        // Get the author information
        const author = await ctx.db.get(reply.userId);
        
        // Check user interactions if logged in
        let liked = false;
        let saved = false;
        
        if (currentUser) {
          liked = await hasUserLikedPost(ctx, currentUser._id, reply._id);
          saved = await hasUserSavedPost(ctx, currentUser._id, reply._id);
        }
        
        return {
          ...reply,
          author: author ? {
            id: author._id,
            clerkUserId: author.clerkUserId,
            name: author.name,
            username: author.username || `user_${author._id.toString().substring(0, 8)}`,
            imageUrl: author.imageUrl,
          } : null,
          liked,
          saved,
        };
      })
    );
    
    return {
      ...repliesPagination,
      page: enrichedReplies,
    };
  },
});

/**
 * Get posts by a specific user
 */
export const getUserPosts = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { userId, paginationOpts } = args;
    
    // Query posts by this user
    const postsPagination = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts);
    
    // Get current user for personalization, if signed in
    const currentUser = await getCurrentUser(ctx);
    
    // Get the author information once since all posts are from the same user
    const author = await ctx.db.get(userId);
    
    // Enrich posts with user interactions
    const enrichedPosts = await Promise.all(
      postsPagination.page.map(async (post) => {
        // Check user interactions if logged in
        let liked = false;
        let saved = false;
        
        if (currentUser) {
          liked = await hasUserLikedPost(ctx, currentUser._id, post._id);
          saved = await hasUserSavedPost(ctx, currentUser._id, post._id);
        }
        
        return {
          ...post,
          author: author ? {
            id: author._id,
            clerkUserId: author.clerkUserId,
            name: author.name,
            username: author.username || `user_${author._id.toString().substring(0, 8)}`,
            imageUrl: author.imageUrl,
          } : null,
          liked,
          saved,
        };
      })
    );
    
    return {
      ...postsPagination,
      page: enrichedPosts,
    };
  },
});

/**
 * Get saved posts for the current user
 */
export const getSavedPosts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    
    // Get current user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Authentication required");
    }
    
    // Get saved posts IDs with pagination
    const savedPagination = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .paginate(paginationOpts);
    
    // If no saved posts, return empty result
    if (savedPagination.page.length === 0) {
      return {
        page: [],
        continueCursor: savedPagination.continueCursor,
        isDone: savedPagination.isDone,
      };
    }
    
    // Get the actual posts
    const postsPromises = savedPagination.page.map(async (save) => {
      const post = await ctx.db.get(save.postId);
      return post;
    });
    
    const posts = (await Promise.all(postsPromises)).filter(Boolean) as Doc<"posts">[];
    
    // Enrich posts with user data and interaction status
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        // Get the author information
        const author = await ctx.db.get(post.userId);
        
        // Check if liked - saved is always true here
        const liked = await hasUserLikedPost(ctx, currentUser._id, post._id);
        
        return {
          ...post,
          author: author ? {
            id: author._id,
            clerkUserId: author.clerkUserId,
            name: author.name,
            username: author.username || `user_${author._id.toString().substring(0, 8)}`,
            imageUrl: author.imageUrl,
          } : null,
          liked,
          saved: true,
        };
      })
    );
    
    return {
      page: enrichedPosts,
      continueCursor: savedPagination.continueCursor,
      isDone: savedPagination.isDone,
    };
  },
});

/**
 * Check if the current user is following another user
 */
export const isFollowing = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return false;
    }
    
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) => 
        q.eq("followerId", currentUser._id).eq("followedId", args.userId)
      )
      .unique();
    
    return follow !== null;
  },
});

/**
 * Get followers for a user
 */
export const getFollowers = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { userId, paginationOpts } = args;
    
    // Query followers for this user
    const followersPagination = await ctx.db
      .query("follows")
      .withIndex("by_followed", (q) => q.eq("followedId", userId))
      .paginate(paginationOpts);
    
    // Get current user for personalization
    const currentUser = await getCurrentUser(ctx);
    
    // Enrich followers with user data
    const enrichedFollowers = await Promise.all(
      followersPagination.page.map(async (follow) => {
        const follower = await ctx.db.get(follow.followerId);
        
        // Check if the current user follows this follower
        let isFollowedByMe = false;
        if (currentUser) {
          isFollowedByMe = !!(await ctx.db
            .query("follows")
            .withIndex("by_both", (q) => 
              q.eq("followerId", currentUser._id).eq("followedId", follow.followerId)
            )
            .unique());
        }
        
        return {
          ...follow,
          follower: follower ? {
            id: follower._id,
            clerkUserId: follower.clerkUserId,
            name: follower.name,
            username: follower.username || `user_${follower._id.toString().substring(0, 8)}`,
            imageUrl: follower.imageUrl,
          } : null,
          isFollowedByMe,
        };
      })
    );
    
    return {
      ...followersPagination,
      page: enrichedFollowers,
    };
  },
});

/**
 * Get users followed by a user
 */
export const getFollowing = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { userId, paginationOpts } = args;
    
    // Query users followed by this user
    const followingPagination = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .paginate(paginationOpts);
    
    // Get current user for personalization
    const currentUser = await getCurrentUser(ctx);
    
    // Enrich following with user data
    const enrichedFollowing = await Promise.all(
      followingPagination.page.map(async (follow) => {
        const followed = await ctx.db.get(follow.followedId);
        
        // Check if the current user follows this user
        let isFollowedByMe = currentUser && 
          currentUser._id.toString() === userId.toString() ? 
          true : false;
        
        if (currentUser && currentUser._id.toString() !== userId.toString()) {
          isFollowedByMe = !!(await ctx.db
            .query("follows")
            .withIndex("by_both", (q) => 
              q.eq("followerId", currentUser._id).eq("followedId", follow.followedId)
            )
            .unique());
        }
        
        return {
          ...follow,
          followed: followed ? {
            id: followed._id,
            clerkUserId: followed.clerkUserId,
            name: followed.name,
            username: followed.username || `user_${followed._id.toString().substring(0, 8)}`,
            imageUrl: followed.imageUrl,
          } : null,
          isFollowedByMe,
        };
      })
    );
    
    return {
      ...followingPagination,
      page: enrichedFollowing,
    };
  },
});

/**
 * Search for posts by content
 */
export const searchPosts = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { query, paginationOpts } = args;
    
    // This is a simplified search - in a real app, you'd use a proper search index
    // Here we're just doing a full scan with a filter, which wouldn't scale well
    const allPosts = await ctx.db.query("posts").collect();
    
    // Filter posts by content (case-insensitive)
    const matchingPosts = allPosts.filter(post => 
      post.content.toLowerCase().includes(query.toLowerCase())
    );
    
    // Sort by creation time
    const sortedPosts = matchingPosts.sort((a, b) => 
      b._creationTime - a._creationTime
    );
    
    // Manual pagination
    const pageSize = paginationOpts?.numItems ?? 10;
    const startIdx = 0; // Would be based on cursor in a real implementation
    const endIdx = Math.min(startIdx + pageSize, sortedPosts.length);
    
    const page = sortedPosts.slice(startIdx, endIdx);
    
    // Get current user for personalization
    const currentUser = await getCurrentUser(ctx);
    
    // Enrich posts with user data and interaction status
    const enrichedPosts = await Promise.all(
      page.map(async (post) => {
        // Get the author information
        const author = await ctx.db.get(post.userId);
        
        // Check user interactions if logged in
        let liked = false;
        let saved = false;
        
        if (currentUser) {
          liked = await hasUserLikedPost(ctx, currentUser._id, post._id);
          saved = await hasUserSavedPost(ctx, currentUser._id, post._id);
        }
        
        return {
          ...post,
          author: author ? {
            id: author._id,
            clerkUserId: author.clerkUserId,
            name: author.name,
            username: author.username || `user_${author._id.toString().substring(0, 8)}`,
            imageUrl: author.imageUrl,
          } : null,
          liked,
          saved,
        };
      })
    );
    
    return {
      page: enrichedPosts,
      continueCursor: endIdx < sortedPosts.length ? String(endIdx) : null,
      isDone: endIdx >= sortedPosts.length,
    };
  },
});