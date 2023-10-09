import { UserButton } from '@clerk/clerk-react';
import toofums from '../assets/toofums.svg';
import { Authenticated } from 'convex/react';
import styles from './header.module.css';

export const Header = () => {
	return (
		<header className={styles.header}>
			<img src={toofums} alt="Toofums" />

			<Authenticated>
				<UserButton
					appearance={{
						elements: {
							userButtonAvatarBox: styles.avatar,
							avatarBox: styles.avatarBox,
						},
					}}
				/>
			</Authenticated>
		</header>
	);
};
