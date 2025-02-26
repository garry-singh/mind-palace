import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        userId: v.string(),
        lastLoginAt: v.number(), // Store timestamp as a number (milliseconds since epoch)
      })
      .index("by_user_id", ["userId"])
      .index("by_email", ["email"])
      .index("by_last_login", ["lastLoginAt"]),
})