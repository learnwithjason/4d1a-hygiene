import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { internal } from './_generated/api';

export const save = mutation({
	handler: async (ctx) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user?.tokenIdentifier) {
			throw new Error('unauthorized');
		}

		await ctx.scheduler.runAfter(0, internal.reminders.update, {
			user: user.tokenIdentifier,
			text: undefined,
		});

		await ctx.db.insert('flossRecord', { user: user.tokenIdentifier });
	},
});

export const clear = mutation({
	handler: async (ctx) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user?.tokenIdentifier) {
			throw new Error('unauthorized');
		}

		const record = await ctx.db
			.query('flossRecord')
			.filter((q) => q.eq(q.field('user'), user.tokenIdentifier))
			.first();

		if (!record?._id) {
			return;
		}

		await ctx.db.delete(record._id);

		return;
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

		const now = new Date();
		now.setHours(0);
		now.setMinutes(0);
		now.setSeconds(0);

		return ctx.db
			.query('flossRecord')
			.filter((q) =>
				q.and(
					q.eq(q.field('user'), userId),
					q.gte(q.field('_creationTime'), now.getTime()),
				),
			)
			.order('desc')
			.first();
	},
});
