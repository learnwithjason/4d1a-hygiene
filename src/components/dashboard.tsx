import { FormEvent, MouseEvent } from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from 'convex/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Header } from './header';
import { api } from '../../convex/_generated/api';
import styles from './dashboard.module.css';

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

const DashboardDisplay = () => {
	const { user } = useUser();
	const updateSettings = useMutation(api.settings.save);
	const updateRecord = useMutation(api.record.save);
	const clearRecord = useMutation(api.record.clear);
	const settings = useQuery(api.settings.load, {});
	const record = useQuery(api.record.load, {});
	const reminder = useQuery(api.reminders.load);

	const done = !!record?._creationTime;

	const hour = settings?.bedtime.hour ?? 21;
	const minute = settings?.bedtime.minute ?? 30;
	const ampm = settings?.bedtime.hour ?? 9 > 12 ? 'pm' : 'am';

	const name = user?.firstName ?? 'mfer';

	const now = dayjs();
	const bedtime = dayjs()
		.set('hour', hour)
		.set('minute', minute)
		.tz(Intl.DateTimeFormat().resolvedOptions().timeZone);

	let headline = `${bedtime.fromNow(true)} until Toofums time, ${name}`;
	if (bedtime.isBefore(now) && bedtime.diff(now, 'minutes') < 30) {
		headline = `It’s time to floss, ${name}`;
	}

	if (done) {
		headline = `Your chompers are safe and healthy in your skull for another day, ${name}.`;
	}

	function openDialog(e: MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();

		const dialog = document.querySelector('dialog');
		dialog?.showModal();
	}

	function closeDialog() {
		const dialog = document.querySelector('dialog');
		dialog?.close();
	}

	async function saveSettings(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const data = new FormData(event.currentTarget);
		const hour = Number(data.get('hour')) ?? 9;
		const minute = Number(data.get('minute')) ?? 30;
		const ampm = data.get('ampm') ?? 'pm';
		const newBedtime = {
			hour: ampm === 'pm' ? hour + 12 : hour,
			minute,
		};

		const reviewMode = !!data.get('reviewMode');

		await updateSettings({
			bedtime: newBedtime,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			_id: settings?._id,
			reviewMode,
		});

		closeDialog();
	}

	return (
		<>
			<div className={styles.bedtime}>
				<p className={styles.label}>Your Bedtime:</p>
				<p className={styles.time}>{bedtime.format('h:mm a')}</p>
				<p className={styles.timezone}>{bedtime.format('zzz')}</p>
				<p className={styles.editLink}>
					(
					<a href="#edit" onClick={openDialog}>
						edit
					</a>
					)
				</p>
			</div>

			{reminder?.text ? (
				<div className={styles.reminderText}>{reminder.text}</div>
			) : null}

			<dialog className={styles.dialog}>
				<button autoFocus onClick={closeDialog}>
					close
				</button>

				<form onSubmit={saveSettings}>
					<h2>What time do you go to bed?</h2>
					<div className={styles.inputs}>
						<label htmlFor="hour" className={styles.visuallyHidden}>
							hour
						</label>
						<select id="hour" name="hour" defaultValue={hour % 12}>
							<option value="1">1</option>
							<option value="2">2</option>
							<option value="3">3</option>
							<option value="4">4</option>
							<option value="5">5</option>
							<option value="6">6</option>
							<option value="7">7</option>
							<option value="8">8</option>
							<option value="9">9</option>
							<option value="10">10</option>
							<option value="11">11</option>
							<option value="12">12</option>
						</select>

						<label htmlFor="minute" className={styles.visuallyHidden}>
							minute
						</label>
						<select id="minute" name="minute" defaultValue={minute}>
							<option value="0">0</option>
							<option value="15">15</option>
							<option value="30">30</option>
							<option value="45">45</option>
						</select>

						<label htmlFor="ampm" className={styles.visuallyHidden}>
							am or pm
						</label>
						<select id="ampm" name="ampm" defaultValue={ampm}>
							<option value="am">am</option>
							<option value="pm">pm</option>
						</select>
					</div>

					<p>Using the {bedtime.format('zzz')} timezone.</p>

					<label>
						<input type="checkbox" name="reviewMode" />
						Enable review mode
					</label>

					<button type="submit">
						<span>Save</span>
					</button>
				</form>
			</dialog>

			<div className={styles.reminder}>
				<h2 className={styles.headline}>{headline}</h2>
				<button
					className={[styles.button, done ? styles.disabled : ''].join(' ')}
					onClick={() => updateRecord()}
					disabled={done}
				>
					<svg viewBox="0 0 450 90">
						<text x="50%" y="75%">
							{done ? 'sparkly!' : 'I flossed!'}
						</text>
					</svg>
				</button>

				{done ? (
					<>
						<p>All done today. Check back tomorrow and floss again!</p>
						{settings?.reviewMode ? (
							<>
								<p>
									In review mode, you can delete your floss record to make it
									easier to try things out.
								</p>
								<button onClick={() => clearRecord()}>
									remove floss record
								</button>
							</>
						) : null}
					</>
				) : null}
			</div>
		</>
	);
};

export const Dashboard = () => {
	return (
		<>
			<Header />
			<main>
				<Unauthenticated>
					<SignIn />
				</Unauthenticated>
				<Authenticated>
					<DashboardDisplay />
				</Authenticated>
			</main>
		</>
	);
};
