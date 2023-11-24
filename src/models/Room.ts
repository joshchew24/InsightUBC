import {Building} from "./Building";
import JSZip from "jszip";

interface IRoomFactory {
	createRoom(path: string, parent: Building): Room | null;
}

export const RoomFactory: IRoomFactory = {
	createRoom(path: string, parent: Building): Room | null {
		let zip: JSZip = parent.zip;
		let trimmedPath = path.trim().replace(/^\.\/+/, "");
		let result = zip.file(trimmedPath);
		console.log(result);
		return null;
	}
};

export class Room {
	public number: string; 			// The room number. Not always a number so represented as a string.
	public name: string; 			// The room id. Should be rooms_shortname + "_" + rooms_number.
	public seats: number; 			// The number of seats in the room.
	public type: string; 			// The room type.
	public furniture: string; 		// The room furniture.
	public href: string; 			// The link to the full details online.
	public building: Building; 		// The building this room is in

	constructor(number: string,
		name: string,
		seats: number,
		type: string,
		furniture: string,
		href: string,
		building: Building) {
		this.number = number;
		this.name = name;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
		this.building = building;
	}
}
