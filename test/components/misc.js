// import { createElement, Component } from '../../dist'
// import { StackPanel } from './stack-panel'

// export const SplashPage: Component = () => <div>Splash page</div>

// export const Layout: Component<{ user?: User | undefined }> = function (props) {
// 	const { user, children } = props
// 	return <StackPanel id="root" orientation="vertical" style={{ padding: 0, margin: 0 }}>
// 		<StackPanel id="header"
// 			itemsAlignH="uniform"
// 			itemsAlignV="center"
// 			style={{ backgroundColor: "purple", width: "100vw", height: "10vh" }}>
// 			<StackPanel id="user-info" style={{ padding: "0.25em", color: "whitesmoke" }}>
// 				{user
// 					? <StackPanel style={{ gap: "10%" } as any}>
// 						<span>Welcome, {user.displayName}</span>
// 						<a href="/logout">LOGOUT</a>
// 					</StackPanel>

// 					: <a href="/auth/google">LOGIN</a>
// 				}
// 			</StackPanel>
// 		</StackPanel>

// 		<StackPanel id="content" style={{ backgroundColor: "whitesmoke", height: "75vh" }}>
// 			{children}
// 		</StackPanel>

// 		<StackPanel id="footer" style={{ height: "10vh" }}></StackPanel>
// 	</StackPanel>
// }
// interface User {
// 	id: string
// 	displayName: string
// 	emailAddress?: string
// 	imageUrl?: string
// 	provider: "google" | "microsoft" | "dropbox" | "amazon" | "facebook" | "twitter",
// 	refreshToken: string
// 	accessToken: string
// }
