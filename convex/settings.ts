import { v } from 'convex/values';
import { internal } from './_generated/api';
import { mutation, query } from './_generated/server';

export const save = mutation({
	args: {
		_id: v.optional(v.id('settings')),
		bedtime: v.object({
			hour: v.number(),
			minute: v.number(),
		}),
		timezone: v.string(),
		reviewMode: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user?.tokenIdentifier) {
			throw new Error('unauthorized');
		}

		const updated = Date.now();

		const data = {
			user: user.tokenIdentifier,
			bedtime: args.bedtime,
			timezone: args.timezone,
			phone: user.phoneNumber!,
			reviewMode: args.reviewMode,
			updated,
		};

		if (!args._id) {
			await ctx.db.insert('settings', data);
			return;
		} else {
			await ctx.db.replace(args._id, data);
		}

		await ctx.scheduler.runAfter(0, internal.reminders.update, {
			user: user.tokenIdentifier,
			text: undefined,
		});

		await ctx.scheduler.runAfter(0, internal.scheduling.sendReminder, {
			user: user.tokenIdentifier,
			updated,
		});
	},
});

export const load = query({
	args: {
		user: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		let userId: string;

		if (args.user) {
			userId = args.user;
		} else {
			const user = await ctx.auth.getUserIdentity();

			if (!user?.tokenIdentifier) {
				throw new Error('unauthorized');
			}

			userId = user?.tokenIdentifier;
		}

		return ctx.db
			.query('settings')
			.withIndex('by_user', (q) => q.eq('user', userId))
			.first();
	},
});
