import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        clerkUserId: v.string(),
        lastLoginAt: v.number(), // Store timestamp as a number (milliseconds since epoch)
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        posts: v.optional(v.array(v.id('posts')))
      }).index('byClerkUserId', ['clerkUserId'])
      .index("by_last_login", ["lastLoginAt"]),
    posts: defineTable({
        title: v.string(),
        slug: v.string(),
        excerpt: v.string(),
        content: v.string(),
        coverImageId: v.optional(v.id('_storage')),
        authorId: v.id('users'),
        likes: v.number()
      }).index('bySlug', ['slug'])
})