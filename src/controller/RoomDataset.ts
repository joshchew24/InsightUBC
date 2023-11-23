import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {defaultTreeAdapter} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Document, Element} from "parse5/dist/tree-adapters/default";
import {Attribute} from "parse5/dist/common/token";
import {makeAsync} from "./AsyncUtil";
import {Building, createBuilding} from "../models/Building";
import {getChildElements} from "./HTMLUtil";

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
				const index = zip.file(this.INDEX);
				if (!index) {
					throw new InsightError("'" + this.INDEX + "' was not found in the zip file.");
				}
				return index.async("text");
			})
			.catch((err) => {
				throw err;
			})
			.then((index: string) => {
				let document: Document = parse5.parse(index);
				if (!document || defaultTreeAdapter.getChildNodes(document).length === 0) {
					throw new InsightError("index is empty");
				}
				return makeAsync(this.findBuildingTable,"No valid building table", document);
			}).then((buildingTable) => {
				// makeAsync will reject if the result is null, but we double check anyway
				if (buildingTable == null) {
					throw new InsightError("no valid building table");
				}
				// this.validateHeader(buildingTable as Element);
				// for each building, construct building object and add to array
				return makeAsync(this.getBuildingRows, "Building table was empty", buildingTable);
			})
			.then((buildingRows) => {
				if (buildingRows == null || (buildingRows as Element[]).length === 0) {
					throw new InsightError("Building Table was empty");
				}
				let buildings: Building[] = [];
				for (let buildingRow of buildingRows as Element[]) {
					let building = createBuilding(buildingRow);
					if (building) {
						buildings.push(building);
					}
				}
			})
			.then(() => {
				return Promise.resolve(["asdf"]);
			})
			.catch((err) => {
				throw err;
			});
		// WIP
		// return Promise.resolve(["hi"]);
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

