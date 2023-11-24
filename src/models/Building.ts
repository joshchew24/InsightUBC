import {Room, RoomFactory, RoomFields} from "./Room";
import JSZip from "jszip";
import {ChildNode, Element, TextNode} from "parse5/dist/tree-adapters/default";
import {
	findTableInHTML,
	getChildElements,
	getChildNodes,
	getTableRows,
	validateAndGetTableFields
} from "../controller/HTMLUtil";
import * as parse5 from "parse5";
import {defaultTreeAdapter} from "parse5";
import {InsightError} from "../controller/IInsightFacade";
import {getFileFromZip} from "../controller/DatasetUtil";

const ValidClass = [
	// "views-field views-field-field-building-image",
	"views-field views-field-field-building-code",
	"views-field views-field-title",
	"views-field views-field-field-building-address",
	"views-field views-field-nothing"
];
enum ValidClassMap {
	SHORTNAME = "views-field views-field-field-building-code",
	FULLNAME = "views-field views-field-title",
	ADDRESS = "views-field views-field-field-building-address",
	PATH = "views-field views-field-nothing"
}

export interface BuildingFields {
	shortname?: string,
	fullname?: string,
	address?: string,
	buildingPath?: string
}

interface IBuildingFactory {
	createBuilding(buildingRow: Element, zip: JSZip): Building | null;
	getFieldFromCell(buildingCell: Element, fieldType: string, buildingFieldsObject: BuildingFields): void;
}

export const BuildingFactory: IBuildingFactory = {

	createBuilding(buildingRow: Element, zip: JSZip): Building | null {
		let buildingCells = getChildElements(buildingRow, false, parse5.html.TAG_NAMES.TD);
		if (buildingCells == null) {
			return null;
		}
		let fieldsObject: BuildingFields = {
			shortname: undefined,
			fullname: undefined,
			address: undefined,
			buildingPath: undefined
		};
		// let buildingFields = this.validateAndGetBuildingFields(buildingCells as Element[]);
		let buildingFields = validateAndGetTableFields(
			buildingCells as Element[],
			fieldsObject,
			ValidClass,
			this.getFieldFromCell
		);
		if (buildingFields == null) {
			return null;
		}
		let buildingFieldObject = buildingFields as BuildingFields;
		return new Building(
			buildingFieldObject.shortname as string,
			buildingFieldObject.fullname as string,
			buildingFieldObject.address as string,
			buildingFieldObject.buildingPath as string,
			zip
		);
	},

	// modifies buildingFieldsObject
	getFieldFromCell(buildingCell: Element, fieldType: string, buildingFieldsObject: BuildingFields) {
		switch (fieldType) {
			case ValidClassMap.SHORTNAME: {
				// TODO: find all childNodes of this cell - if numChildren !== 1, incorrect?
				let result = getChildNodes(buildingCell, false, "text");
				let fieldNodes: ChildNode[];
				if (result == null || (fieldNodes = result as ChildNode[]).length !== 1) {
					break;
				}
				buildingFieldsObject.shortname = (fieldNodes[0] as TextNode).value.trim();
				break;
			}
			case ValidClassMap.FULLNAME:{
				// TODO: find first child of this cell with correct tag
				let result = getChildNodes(buildingCell, true, "element", parse5.html.TAG_NAMES.A);
				if (result == null) {
					break;
				}
				let title = getChildNodes(result as Element, true, "text");
				if (title == null) {
					break;
				}
				buildingFieldsObject.fullname = (title as TextNode).value.trim();
				break;
			}
			case ValidClassMap.ADDRESS: {
				// TODO: find first child of this cell with correct tag
				let result = getChildNodes(buildingCell, true, "text");
				if (result == null) {
					break;
				}
				buildingFieldsObject.address = (result as TextNode).value.trim();
				break;
			}
			case ValidClassMap.PATH: {
				// TODO: find all childNodes of this cell - if numChildren !== 1, incorrect?
				let result = getChildNodes(buildingCell, false, "element", parse5.html.TAG_NAMES.A);
				let anchorNodes: ChildNode[];
				if (result == null || (anchorNodes = result as ChildNode[]).length !== 1) {
					break;
				}
				let attrList = defaultTreeAdapter.getAttrList(anchorNodes[0] as Element);
				for (let attr of attrList) {
					if (attr.name === "href") {
						buildingFieldsObject.buildingPath = attr.value.trim();
					}
				}
				break;
			}
		}
	}
};

export class Building {
	public shortname: string; 			// Short building name (code).
	public fullname: string;  			// Full building name.
	public address: string;				// The building address.
	public buildingFilePath: string;	// Path to building.htm file
	public readonly zip: JSZip;
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

	// returns the list of rooms in this building
	// if this.rooms is null, attempts to addRooms via this.buildingFilePath
	// returns Room[] on success
	public async getRooms(): Promise<Room[] | undefined> {
		if (this.rooms == null) {
			try {
				await this.addRooms();
			} catch (err) {
				return undefined;
			}
		}
		return this.rooms;
	}

	// propagates errors to caller
	// attempts to add rooms from this.buildingFilePath to Rooms[]
	public async addRooms() {
		let path = this.buildingFilePath.trim().replace(/^\.\/+/, "");
		let buildingFile = await getFileFromZip(this.zip, path);
		let roomTable = await findTableInHTML(buildingFile, "building document");
		// return Promise.resolve(roomTable);
		let roomTableRows = getTableRows(roomTable as Element);
		if (roomTableRows == null || (roomTableRows as Element[]).length === 0) {
			throw new InsightError("Room Table was empty");
		}
		let rooms = [];
		for (let row of roomTableRows) {
			let room = RoomFactory.createRoom(row, this);
			if (room) {
				rooms.push(room);
			}
		}
		if (rooms.length === 0) {
			throw new InsightError("Rooms Table was empty");
		}
		this.rooms = rooms;
	// get rows from building
	// for each row, createRoom
	}
}
