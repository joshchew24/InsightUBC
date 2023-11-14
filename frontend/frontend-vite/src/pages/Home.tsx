import {NavigationBar} from "../component/NavigationBar";
import {useEffect} from "react";

export function Home() {

	useEffect(() => {
		document.body.style.background = `url(puppies.jpg)`
	}, []);

	return (
		<div>
			<NavigationBar />
			<h2>Home</h2>
			<p>
				Hello World!
			</p>
		</div>
	)
}
