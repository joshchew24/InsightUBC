import {NavigationBar} from "../component/NavigationBar";
import {
	Autocomplete, Button, Divider,
	FormControl,
	FormControlLabel,
	FormLabel, Grid,
	Paper,
	Radio,
	RadioGroup,
	TextField
} from "@mui/material";
import {useEffect, useState} from "react";
import professorData from "../mockJson/professor.json";
import departmentData from "../mockJson/department.json";

interface Section {
	sections_uuid: string;
	sections_id: string;
	sections_title: string;
	sections_instructor: string;
	sections_dept: string;
	sections_year: number;
	sections_avg: number;
	sections_pass: number;
	sections_fail: number;
	sections_audit: number;
}

interface AutoComplete {
	label: string;
	value: Section[]
}

const groupByInstructor = (data: Section[]): AutoComplete[] => {
	const result: Record<string, Section[]> = {};

	data.forEach((section) => {
		// Split the instructor names by comma
		const instructors = section.sections_instructor.split(';');

		instructors.forEach((instructor) => {
			if (!result[instructor]) {
				result[instructor] = [];
			}
			result[instructor].push(section);
		});
	});

	return Object.keys(result).sort().map((instructor) => ({
		label: instructor,
		value: result[instructor]
	}));
};

const groupByDepartment = (data: Section[]): AutoComplete[] => {
	const result: Record<string, Section[]> = {};

	data.forEach((section) => {
		const department = section.sections_dept;

		if (!result[department]) {
			result[department] = [];
		}
		result[department].push(section);
	});

	return Object.keys(result).sort().map((dept) => ({
		label: dept,
		value: result[dept]
	}));
};


const groupedProfessorData = groupByInstructor(professorData);
const groupedDepartmentData = groupByDepartment(departmentData);


export function Search() {

	const [searchType, setSearchType] = useState("");
	const [deptYear, setDeptYear] = useState<string | null>(null);
	const [userInput, setUserInput] = useState<string | null>(null);
	const [searchedData, setSearchedData] = useState<Section[] | null>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchType((event.target as HTMLInputElement).value);
	};

	const handleSearch = () => {
		if (searchType === "professor") {
			groupedProfessorData.forEach((professor) => {
				if (professor.label === userInput) {
					setSearchedData(professor.value);
				}
			});
		} else if (searchType === "department") {
			groupedDepartmentData.forEach((department) => {
				if (department.label === userInput) {
					setSearchedData(department.value);
				}
			});
		}
	}

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
				onInputChange={(_event, value: string | null) => {
						setUserInput(value);
						setSearchedData(null)
				}}
				options={
					searchType === "professor" ? groupedProfessorData :
					searchType === "department" ? groupedDepartmentData : []
				}
				sx={{ width: 300 }}
				renderInput={(params) =>
					<TextField {...params} label={searchType == "" ? "Choose Search Type" : searchType } />}
				disabled={searchType === ""}
			/>
						{searchType === "department" && <TextField
							id="department-year"
							label="Year"
							value={deptYear}
							type="number"
							onChange={(event) => {
								if(event.target.value === "") {
									setDeptYear(null);
									return;
								}
								setDeptYear(event.target.value);
							}}

						/>

								}

				<Button
					variant="contained"
					disabled={searchType === "" || userInput === null}
					onClick={handleSearch}
					sx={{
					padding: "15px"
				}} > Search </Button>
					</Grid>
				</Grid>
			</Paper>

			{searchedData && <Paper sx={{
				padding: 1,
				marginTop: 1,
				maxHeight: 500,
				overflow: 'auto'
			}}
			>
				{searchedData.map((section) => (
					<>
					<Grid item key={section.sections_uuid} sx={{
						padding:2,
					}}
					>
						<Grid item>
							<u>Title</u>: {section.sections_title}
						</Grid>
						<Grid item>
							<u>Audit</u>: {section.sections_audit}
						</Grid>
						<Grid item>
						<u>Average</u>: {section.sections_avg}
						</Grid>
						<Grid item>
							<u>Department</u>: {section.sections_dept}
						</Grid>
						<Grid item>
							<u>Fail</u>: {section.sections_fail}
						</Grid>
						<Grid item>
							<u>ID</u>: {section.sections_id}
						</Grid>
						<Grid item>
							<u>Instructor(s)</u>: {section.sections_instructor.split(';').map((instructor) => (
							<>
								{instructor}
								<br/>
							</>
						))}
						</Grid>
						<Grid item>
						Pass: {section.sections_pass}
						</Grid>
						<Grid item>
							<u>Year</u>: {section.sections_year}
						</Grid>
					</Grid>
					<Divider />
					</>
				))}
			</Paper>}
		</div>
	)
}
