import {Room} from "./IRoom";
import JSZip from "jszip";
import {Element, TextNode} from "parse5/dist/tree-adapters/default";
import {getChildElements, getChildNodes} from "../controller/HTMLUtil";
import * as parse5 from "parse5";
import {defaultTreeAdapter} from "parse5";
import {InsightError} from "../controller/IInsightFacade";

const validClasses = [
	"views-field views-field-field-building-image",
	"views-field views-field-field-building-code",
	"views-field views-field-title",
	"views-field views-field-field-building-address",
	"views-field views-field-nothing"
];

interface IBuildingFactory {
	createBuilding(buildingRow: Element): Building | null;
	validateBuilding(buildingCellsArr: Element[]): void;
}

export const BuildingFactory: IBuildingFactory = {

	createBuilding(buildingRow: Element): Building | null {
		let buildingCells = getChildElements(buildingRow, false, parse5.html.TAG_NAMES.TD);
		if (buildingCells == null) {
			return null;
		}
		let buildingCellsArr = buildingCells as Element[];


		try {
			this.validateBuilding(buildingCellsArr);
		} catch (err) {
			console.log(err);
			return null;
		}

		return null;
	},

	// validateBuilding(buildingCellsArr: Element[]) {
	// 	if (buildingCellsArr.length !== 5) {
	// 		throw new InsightError("building should have 5 columns");
	// 	}
	// 	for (let i = 0; i < 5; i++) {
	// 		let attrList = defaultTreeAdapter.getAttrList(buildingCellsArr[i]);
	// 		for (let attr of attrList) {
	// 			if (attr.name !== "class" || attr.value !== validClasses[i]) {
	// 				throw new InsightError("building is missing the correct class");
	// 			}
	// 		}
	// 	}
	// },

	validateBuilding(buildingCellsArr: Element[]) {
		if (buildingCellsArr.length !== 5) {
			// TODO: is it possible for a building to have not 5 columns?
			throw new InsightError("building should have 5 columns");
		}
		let shortname: string;
		let fullname: string;
		let address: string;
		let buildingPath: string;
		let buildingFields = []; // shortname, fullname, address, buildingPath];

		for (let i = 0; i < 5; i++) {
			let currCell = buildingCellsArr[i];
			// console.log(currCell);
			let attrList = defaultTreeAdapter.getAttrList(currCell);
			for (let attr of attrList) {
				if (attr.name !== "class" || attr.value !== validClasses[i]) {
					throw new InsightError("building is missing the correct class");
				}
			}
			// TODO: left off here
			// if valid attribute, get the appropriate field from the children
			let children = defaultTreeAdapter.getChildNodes(currCell);
			for (let child of children) {
				// getChildNodes(child, true, "text");
				console.log(child);
			}
			// switch(i) {

			// 	case 0:
			// 		break;
			// 	case 1:
			// 		getChildElements();
			// }
		}
		// console.log(buildingFields);
	}
};

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
