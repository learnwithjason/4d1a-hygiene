'use node';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import { api, internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { v } from 'convex/values';

dayjs.extend(utc);
dayjs.extend(tz);

export const sendReminder = internalAction({
	args: {
		user: v.string(),
		updated: v.number(),
		reminderCount: v.optional(v.number()),
	},
	handler: async (ctx, { user, updated, reminderCount = 0 }) => {
		const settings = await ctx.runQuery(api.settings.load, { user });
		const record = await ctx.runQuery(api.record.load, { user });

		if (settings?.updated !== updated) {
			return;
		}

		const bedtime = dayjs()
			.tz(settings.timezone)
			.set('hour', settings?.bedtime.hour ?? 21)
			.set('minute', settings?.bedtime.minute ?? 30)
			.set('seconds', 0)
			.set('milliseconds', 0);

		let tomorrow = dayjs(bedtime).add(1, 'day');
		let isDoneFlossing = !!record;
		let isBeforeBedtime = bedtime.subtract(1, 'minute').isAfter(dayjs());
		let reminderInterval = dayjs().add(15, 'minutes');

		if (settings.reviewMode) {
			isBeforeBedtime = false;
			reminderInterval = dayjs().add(10, 'seconds');
		}

		console.log({
			now: dayjs().toString(),
			bedtime: bedtime.toString(),
			tomorrow: tomorrow.toString(),
			isBeforeBedtime,
			isDoneFlossing,
			record,
			reminderInterval: reminderInterval.toString(),
			reminderCount,
		});

		if (isDoneFlossing) {
			await ctx.runMutation(internal.reminders.update, {
				user,
				text: undefined,
			});

			await ctx.scheduler.runAt(
				tomorrow.toDate(),
				internal.scheduling.sendReminder,
				{ user, updated },
			);
			return;
		}

		if (isBeforeBedtime) {
			await ctx.runMutation(internal.reminders.update, {
				user,
				text: undefined,
			});

			await ctx.scheduler.runAt(
				bedtime.toDate(),
				internal.scheduling.sendReminder,
				{ user, updated },
			);
			return;
		}

		if (!settings?.phone) {
			throw new Error('phone number is required!');
		}

		if (reminderCount > 4) {
			// give up — they clearly hate their teeth
			await ctx.runMutation(internal.reminders.update, {
				user,
				text: undefined,
			});
			return;
		}

		const reminders = [
			'Time to floss!',
			'What, you too good to take care of your teeth?',
			'I swear to god if you don’t start flossing I’m gonna come over there and do it myself.',
			'Final warning, friendo. Floss them chompers.',
		];

		// they haven't flossed yet. get 'em!
		await ctx.runMutation(internal.reminders.update, {
			user,
			text:
				reminders.at(reminderCount) ??
				'FINE. ENJOY GUMMING YOUR MEALS YA JERK.',
		});

		await ctx.scheduler.runAt(
			reminderInterval.toDate(),
			internal.scheduling.sendReminder,
			{ user, updated, reminderCount: reminderCount + 1 },
		);
	},
});
