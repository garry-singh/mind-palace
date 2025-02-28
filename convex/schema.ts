import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - matches your existing structure
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.string(),
    name: v.string(),
    lastLoginAt: v.number(),
    username: v.string(),
  })
  .index("byClerkUserId", ["clerkUserId"])
  .index("by_last_login", ["lastLoginAt"]),

  // Posts table stores all the posts created by users
  posts: defineTable({
    content: v.string(),
    userId: v.id("users"),  // Reference to users table
    likeCount: v.number(),
    replyCount: v.number(),
    repostCount: v.number(),
    parentId: v.optional(v.id("posts")),  // For replies
    authorId: v.string(),
    authorName: v.string(),
    authorUsername: v.string(),
    authorImageUrl: v.string(),
  })
  .index("by_user", ["userId"])
  .index("by_parent", ["parentId"]),

  // Likes table to track which users liked which posts
  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
  .index("by_post", ["postId"])
  .index("by_user", ["userId"])
  .index("by_post_and_user", ["postId", "userId"]),

  // Saves table to track which users saved which posts
  saves: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
  .index("by_post", ["postId"])
  .index("by_user", ["userId"])
  .index("by_post_and_user", ["postId", "userId"]),

  // Follows table to track user follow relationships
  follows: defineTable({
    followerId: v.id("users"),  // User who is following
    followedId: v.id("users"),  // User being followed
  })
  .index("by_follower", ["followerId"])
  .index("by_followed", ["followedId"])
  .index("by_both", ["followerId", "followedId"]),
});