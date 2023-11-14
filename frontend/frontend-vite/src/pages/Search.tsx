import {NavigationBar} from "../component/NavigationBar";
import {
	Autocomplete, Button,
	FormControl,
	FormControlLabel,
	FormLabel, Grid,
	Paper,
	Radio,
	RadioGroup,
	TextField
} from "@mui/material";
import {useEffect, useState} from "react";


const exampleProfessors = [
	{
		label: "Dr. John Doe",
		name: "Dr. John Doe",
	},
	{
		label: "Dr. Bill Doe",
		value: "Dr. Bill Doe"
	},
	{
		label: "Dr. Alex Smith",
		value: "Dr. Alex Smith"
	}
]

const exampleDepartment = [
	{
		label: "CPSC",
		value: "Computer Science",
	},
	{
		label: "FRST",
		value: "Forestry",
	},
	{
		label: "WOOD",
		value: "Wood Products Processing",
	}
]

export function Search() {

	const [searchType, setSearchType] = useState("");

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchType((event.target as HTMLInputElement).value);
	};

	useEffect(() => {
		document.body.style.background = `url(fire.jpg)`
	}, []);

	return (
		<div>
			<NavigationBar />
			<h2>Search</h2>

			<Paper
				sx={{
					display: 'flex',
					alignItems: 'center',
					padding: 1
				}}
			>
				<Grid>
					<Grid item>
				<FormControl>
					<FormLabel id="search-type">Search Type</FormLabel>
					<RadioGroup
						row
						aria-labelledby="search-type"
						name="controlled-radio-buttons-group"
						value={searchType}
						onChange={handleChange}
					>
						<FormControlLabel value="professor" control={<Radio />} label="Professor" />
						<FormControlLabel value="department" control={<Radio />} label="Department" />
					</RadioGroup>
				</FormControl>
					</Grid>

					<Grid item container>
			<Autocomplete
				disablePortal
				id="combo-box-demo"
				options={
					searchType === "professor" ? exampleProfessors :
					searchType === "department" ? exampleDepartment : []
				}
				sx={{ width: 300 }}
				renderInput={(params) =>
					<TextField {...params} label={searchType == "" ? "Choose Search Type" : searchType } />}
				disabled={searchType === ""}
			/>

				<Button
					variant="contained"
					disabled={searchType === ""}
					sx={{
					padding: "15px"
				}} > Search </Button>
					</Grid>
				</Grid>
			</Paper>
		</div>
	)
}
