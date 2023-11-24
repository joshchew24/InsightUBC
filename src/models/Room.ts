import {Building} from "./Building";
import JSZip from "jszip";
import {Element} from "parse5/dist/tree-adapters/default";
import {
	getChildElements,
	getChildNodes,
	getFirstChildTextNodeValue, getHrefLinkFromAnchor, getTextChildFromAnchor,
	validateAndGetTableFields
} from "../controller/HTMLUtil";
import * as parse5 from "parse5";
import {defaultTreeAdapter} from "parse5";

const ValidClass = [
	"views-field views-field-field-room-number",
	"views-field views-field-field-room-capacity",
	"views-field views-field-field-room-furniture",
	"views-field views-field-field-room-type",
	"views-field views-field-nothing"
];

enum ValidClassMap {
	NUMBER = "views-field views-field-field-room-number",
	CAPACITY = "views-field views-field-field-room-capacity",
	FURNITURE = "views-field views-field-field-room-furniture",
	TYPE = "views-field views-field-field-room-type",
	HREF = "views-field views-field-nothing"
}


export interface RoomFields {
	number?: string,
	seats?: number,
	type?: string,
	furniture?: string,
	href?: string
}

interface IRoomFactory {
	createRoom(roomRow: Element, parent: Building): Room | null;
	getFieldFromCell(roomCell: Element, fieldType: string, roomFieldObject: RoomFields): void;
}

export const RoomFactory: IRoomFactory = {
	createRoom(roomRow: Element, parent: Building): Room | null {
		let roomCells = getChildElements(roomRow, false, parse5.html.TAG_NAMES.TD);
		if (roomCells == null) {
			return null;
		}
		let fieldsObject: RoomFields = {
			number: undefined,
			seats: undefined,
			type: undefined,
			furniture: undefined,
			href: undefined
		};
		let roomFields = validateAndGetTableFields(
			roomCells as Element[],
			fieldsObject,
			ValidClass,
			this.getFieldFromCell
		);
		console.log(roomFields);
		if (roomFields == null) {
			return null;
		}
		return null;
	},
	getFieldFromCell(roomCell: Element, fieldType: string, roomFieldObject: RoomFields): void {
		// console.log(roomCell);
		switch (fieldType) {
			case ValidClassMap.NUMBER: {
				roomFieldObject.number = getTextChildFromAnchor(roomCell);
				break;
			}
			case ValidClassMap.CAPACITY: {
				roomFieldObject.seats = getFirstChildTextNodeValue(roomCell, true) as number | undefined;
				break;
			}
			case ValidClassMap.FURNITURE: {
				roomFieldObject.furniture = getFirstChildTextNodeValue(roomCell) as string | undefined;
				break;
			}
			case ValidClassMap.TYPE: {
				roomFieldObject.type = getFirstChildTextNodeValue(roomCell) as string | undefined;
				break;
			}
			case ValidClassMap.HREF: {
				roomFieldObject.href = getHrefLinkFromAnchor(roomCell);
				break;
			}

		}
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
