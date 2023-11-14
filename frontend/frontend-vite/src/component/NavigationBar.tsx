import {Grid} from "@mui/material";

export function NavigationBar() {
	return (
		<Grid container direction={"row"} spacing={2}>
			<Grid item>
			<a href="/">Home</a>
			</Grid>
			<Grid item>
			<a href="/search">Professor</a>
			</Grid>

		</Grid>
	)
}
