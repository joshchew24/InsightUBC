import {Building} from "./Building";
import JSZip from "jszip";
import {Element} from "parse5/dist/tree-adapters/default";
import {getChildElements} from "../controller/HTMLUtil";
import * as parse5 from "parse5";
import {defaultTreeAdapter} from "parse5";

export interface RoomFields {
	number?: string,
	seats?: number,
	type?: string,
	furniture?: string,
	href?: string
}

interface IRoomFactory {
	createRoom(roomRow: Element, parent: Building): Room | null;
	validateAndGetRoomFields(roomCellsArr: Element[]): RoomFields | null;
}

export const RoomFactory: IRoomFactory = {
	createRoom(roomRow: Element, parent: Building): Room | null {
		let roomCells = getChildElements(roomRow, false, parse5.html.TAG_NAMES.TD);
		if (roomCells == null) {
			return null;
		}

		let roomFields = this.validateAndGetRoomFields(roomCells as Element[]);
		if (roomFields == null) {
			return null;
		}
		return null;
	},

	validateAndGetRoomFields(roomCellsArr: Element[]): RoomFields | null {
		// let roomFields: RoomFields = {};
		//
		// for (let cell of roomCellsArr) {
		// 	let attrList = defaultTreeAdapter.getAttrList(cell);
		// 	for (let attr of attrList) {
		// 		if (attr.name === "class" && ValidClass.includes(attr.value)) {
		// 			this.getFieldFromCell(cell, attr.value, roomFields);
		// 		}
		// 	}
		// }
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
