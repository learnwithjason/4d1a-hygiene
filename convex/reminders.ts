import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';

dayjs.extend(utc);
dayjs.extend(tz);

export const load = query(async (ctx) => {
	const user = await ctx.auth.getUserIdentity();

	const reminder = await ctx.db
		.query('reminders')
		.filter((q) => q.eq(q.field('user'), user?.tokenIdentifier))
		.first();

	return reminder;
});

export const update = internalMutation({
	args: {
		user: v.string(),
		text: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const reminder = await ctx.db
			.query('reminders')
			.filter((q) => q.eq(q.field('user'), args.user))
			.first();

		if (reminder?._id) {
			await ctx.db.replace(reminder._id, args);
		} else {
			await ctx.db.insert('reminders', args);
		}
	},
});
