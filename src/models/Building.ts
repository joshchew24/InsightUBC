import {Room} from "./IRoom";
import JSZip from "jszip";

export class Building {
	public shortname: string;
	public fullname: string;
	public address: string;
	public buildingFilePath: string;
	private readonly zip: JSZip;
	public lat?: number;
	public lon?: number;
	public rooms?: Room[];
	constructor(shortname: string, fullname: string, address: string, buildingFilePath: string, zip: JSZip,
		lat?: number, lon?: number, rooms?: Room[]) {
		this.shortname = shortname;
		this.fullname = fullname;
		this.address = address;
		this.buildingFilePath = buildingFilePath;
		this.zip = zip;
		this.lat = lat;
		this.lon = lon;
		this.rooms = rooms;
	}

	public getRooms() {
		if (this.rooms != null) {
			return this.rooms;
		}
		const buildingFile = this.zip.file(this.buildingFilePath);
		console.log(buildingFile);
		// use jszip to read
	}
}
