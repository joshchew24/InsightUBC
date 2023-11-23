import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {defaultTreeAdapter, parse} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Document, Element} from "parse5/dist/tree-adapters/default";
import {Attribute} from "parse5/dist/common/token";
import {makeAsync} from "./AsyncUtil";

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
				let document: Document = parse(index);
				if (!document || defaultTreeAdapter.getChildNodes(document).length === 0) {
					throw new InsightError("index is empty");
				}
				return makeAsync(this.findBuildingTable,"No valid building table", document);
				// return this.findBuildingTable(document);
			}).then((buildingTable) => {
				// if (buildingTable == null) {
				// 	throw new InsightError("no valid building table");
				// }
				this.validateHeader(buildingTable as Element);
				// for each building, construct building object and add to array
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

	private validateHeader(buildingTable: Element) {
		console.log(buildingTable);
	}
}

