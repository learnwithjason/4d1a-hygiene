import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { Dashboard } from './components/dashboard';

import './styles/main.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<Dashboard />
			</ConvexProviderWithClerk>
		</ClerkProvider>
	</React.StrictMode>,
);
