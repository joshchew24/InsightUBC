import {Room, RoomFactory} from "./Room";
import JSZip from "jszip";
import {ChildNode, Element, TextNode} from "parse5/dist/tree-adapters/default";
import {getChildElements, getChildNodes} from "../controller/HTMLUtil";
import * as parse5 from "parse5";
import {defaultTreeAdapter} from "parse5";
import {InsightError} from "../controller/IInsightFacade";

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

interface BuildingFields {
	shortname?: string,
	fullname?: string,
	address?: string,
	buildingPath?: string
}

interface IBuildingFactory {
	createBuilding(buildingRow: Element, zip: JSZip): Building | null;
	validateAndGetBuildingFields(buildingCellsArr: Element[]): BuildingFields | null;
	getFieldFromCell(buildingCell: Element, fieldType: string, buildingFieldsObject: BuildingFields): void;
}

export const BuildingFactory: IBuildingFactory = {

	createBuilding(buildingRow: Element, zip: JSZip): Building | null {
		let buildingCells = getChildElements(buildingRow, false, parse5.html.TAG_NAMES.TD);
		if (buildingCells == null) {
			return null;
		}
		let buildingCellsArr = buildingCells as Element[];

		let buildingFields = this.validateAndGetBuildingFields(buildingCellsArr);
		if (buildingFields == null) {
			return null;
		}
		return new Building(
			buildingFields.shortname as string,
			buildingFields.fullname as string,
			buildingFields.address as string,
			buildingFields.buildingPath as string,
			zip
		);
	},

	validateAndGetBuildingFields(buildingCellsArr: Element[]) {
		if (buildingCellsArr.length !== 5) {
			// TODO: is it possible for a building to have not 5 columns?
			throw new InsightError("building should have 5 columns");
		}
		let buildingFields: BuildingFields = {};

		for (let cell of buildingCellsArr) {
			let attrList = defaultTreeAdapter.getAttrList(cell);
			for (let attr of attrList) {
				if (attr.name === "class" && ValidClass.includes(attr.value)) {
					this.getFieldFromCell(cell, attr.value, buildingFields);
				}
			}
		}
		// if we were not able to get all fields for this building, it's not valid so return null
		if (Object.values(buildingFields).some((value) => value === undefined)) {
			return null;
		}
		return buildingFields;
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

	public getRooms() {
		if (this.rooms != null) {
			return this.rooms;
		}
		console.log(this.buildingFilePath);
		let roomResult = RoomFactory.createRoom(this.buildingFilePath, this);
		// if (roomResult == null) {
			// throw new InsightError("This building has no valid rooms");
		// }
		// this.rooms = roomResult as Room[];
		// use jszip to read
	}
}
