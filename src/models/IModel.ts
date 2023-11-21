import {SectionPruned} from "./ISection";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Room} from "./IRoom";

export interface SectionDatasetModel extends DatasetModel {
	section: SectionPruned[];
}

export interface RoomDatasetModel extends DatasetModel {
	room: Room[];
}

export interface DatasetModel {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
}

export type InsightData = SectionData | RoomData;

export interface SectionData {
	uuid: string;		// Section identifier (e.g. 101, overall, 002, etc)
	id: string;			// Course ID (internal)
	title: string;		// Course name (e.g. 'rsrch methdlgy')
	instructor: string;	// Name of instructor who taught the section
	dept: string;		// Department which offered the section (e.g. CPSC, ANTH)
	year: number;		// Year that section was run. 1900 when section == overall
	avg: number;		// Average grade received by students in section
	pass: number;		// Number of students who passed in the section
	fail: number;		// Number of students who failed in the section
	audit: number;		// Number of students who audited the section
}

export interface RoomData {
	fullname: string; 	// Full building name.
	shortname: string; 	// Short building name.
	number: string; 	// The room number. Not always a number so represented as a string.
	name: string; 		// The room id. Should be rooms_shortname + "_" + rooms_number.
	address: string; 	// The building address.
	lat: number; 		// The latitude of the building.
	lon: number; 		// The longitude of the building.
	seats: number; 		// The number of seats in the room.
	type: string; 		// The room type.
	furniture: string; 	// The room furniture.
	href: string; 		// The link to the full details online.
}
