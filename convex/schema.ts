import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const settingsSchema = {
	bedtime: v.object({
		hour: v.number(),
		minute: v.number(),
	}),
	timezone: v.string(),
	user: v.string(),
	phone: v.string(),
	updated: v.number(),
	reviewMode: v.optional(v.boolean()),
};

export default defineSchema({
	settings: defineTable(settingsSchema).index('by_user', ['user']),
	flossRecord: defineTable({
		user: v.string(),
	}),
	reminders: defineTable({
		user: v.string(),
		text: v.optional(v.string()),
	}),
});
