import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {defaultTreeAdapter} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Document, Element} from "parse5/dist/tree-adapters/default";
import {Attribute} from "parse5/dist/common/token";
import {makeAsync} from "./AsyncUtil";
import {Building, BuildingFactory} from "../models/Building";
import {findTableInHTML, getChildElements} from "./HTMLUtil";
import {getFileFromZip} from "./DatasetUtil";

export class RoomDataset extends InsightDatasetClass {
	private readonly ROOMS_DIR = "campus/discover/buildings-and-classrooms";
	private readonly INDEX = "index.htm";

	protected async processFileContents(content: string): Promise<any[]> {
		let zip: JSZip = new JSZip();
		return zip.loadAsync(content, {base64: true, createFolders: false})
			.catch(() => {
				throw new InsightError("Error loading zip file from content parameter");
			})
			.then(() => {
				return getFileFromZip(zip, this.INDEX);
			})
			.catch((err) => {
				throw err;
			})
			.then((index: string) => {
				return findTableInHTML(index, "index");
			}).then((buildingTable) => {
				// makeAsync will reject if the result is null, but we double check anyway
				if (buildingTable == null) {
					throw new InsightError("no valid building table");
				}
				return makeAsync(this.getBuildingRows, "Building table was empty", buildingTable);
			})
			.then((buildingRows) => {
				return makeAsync(this.extractBuildingsFromTable, "Buildings table was empty", buildingRows, zip);
			})
			.then((buildings) => {
				for (let building of buildings as Building[]) {
					building.getRooms();
				}
			})
			.then(() => {
				return Promise.resolve(["asdf"]);
			})
			.catch((err) => {
				throw err;
			});
	}


	private extractBuildingsFromTable(buildingRows: any, zip: JSZip) {
		if (buildingRows == null || (buildingRows as Element[]).length === 0) {
			throw new InsightError("Building Table was empty");
		}
		let buildings: Building[] = [];
		for (let buildingRow of buildingRows as Element[]) {
			let building = BuildingFactory.createBuilding(buildingRow, zip);
			if (building) {
				buildings.push(building);
			}
		}
		return buildings;
	}

	private findBuildingTable(document: Document): Element | null {
		let buildingTableSearchStack: ChildNode[] = defaultTreeAdapter.getChildNodes(document);
		// TODO: can we move these declarations inside the loop for better readability?
		let currNode: ChildNode;
		let currElem: Element;
		let attributes: Attribute[];
		let buildingTable: Element | null = null;
		searchLoop: while (buildingTableSearchStack && buildingTableSearchStack.length > 0) {
			currNode = buildingTableSearchStack.pop() as ChildNode;
			if ("childNodes" in currNode) {
				buildingTableSearchStack.push(...defaultTreeAdapter.getChildNodes(currNode));
			}
			if (!defaultTreeAdapter.isElementNode(currNode)
				|| defaultTreeAdapter.getTagName(currNode) !== parse5.html.TAG_NAMES.TABLE) {
				continue;
			}
			currElem = currNode as Element;
			attributes = defaultTreeAdapter.getAttrList(currElem);
			if (!attributes) {
				continue;
			}
			// TODO: stricter check that this is the correct table (find a TD with a views-field class)
			for (let attribute of attributes) {
				if (attribute.name === "class" && attribute.value.includes("views-table")) {
					buildingTable = currElem;
					break searchLoop;
				}
			}
		}
		return buildingTable;
	}

	// ensure header cells contain correct classes
	// TODO: possibly remove, spec doesn't mention any requirements on table header
	private validateHeader(buildingTable: Element) {
		let header: Element | null = null;
		for (let child of defaultTreeAdapter.getChildNodes(buildingTable)) {
			if (defaultTreeAdapter.isElementNode(child)
				&& defaultTreeAdapter.getTagName(child) === parse5.html.TAG_NAMES.THEAD) {
				header = child;
				break;
			}
		}
		if (header == null) {
			throw new InsightError("The header is empty");
		}
		for (let child of defaultTreeAdapter.getChildNodes(header)) {
			if (defaultTreeAdapter.isElementNode(child)
				&& defaultTreeAdapter.getTagName(child) === parse5.html.TAG_NAMES.THEAD) {
				header = child;
				break;
			}
		}
	}

	private getBuildingRows(buildingTable: Element): Element[] {
		let buildingTableBody = getChildElements(buildingTable, true, parse5.html.TAG_NAMES.TBODY);

		if (buildingTableBody == null) {
			// TODO: if we use stricter checking,the table may not be empty
			throw new InsightError("the building table is empty");
		}
		let buildingRows = getChildElements(buildingTableBody as Element, false, parse5.html.TAG_NAMES.TR);
		if (buildingRows == null) {
			throw new InsightError("the building table is empty");
		}
		return buildingRows as Element[];
	}
}

