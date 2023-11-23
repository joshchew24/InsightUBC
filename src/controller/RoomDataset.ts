import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {defaultTreeAdapter, parse} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Document, Element} from "parse5/dist/tree-adapters/default";
import {Attribute} from "parse5/dist/common/token";

export class RoomDataset extends InsightDatasetClass {
	private readonly ROOMS_DIR = "campus/discover/buildings-and-classrooms";
	private readonly INDEX = "index.htm";

	protected async processFileContents(content: string): Promise<any[]> {
		let zip: JSZip = new JSZip();
		// TODO: add return here
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
				if (!document || !document.childNodes) {
					throw new InsightError("index is empty");
				}
				let buildingTableSearchStack: ChildNode[] = defaultTreeAdapter.getChildNodes(document);
				// TODO: can we move these declarations inside the loop for better readability?
				let currNode: ChildNode;
				let currElem: Element;
				let attributes: Attribute[];
				let buildingTable: Element;
				searchLoop: while (buildingTableSearchStack.length > 0) {
					currNode = buildingTableSearchStack.pop() as ChildNode;
					// if (!currNode) {
					// 	// shouldn't happen because of loop invariant but needed to suppress warnings
					// 	continue;
					// }
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
					for (let attribute of attributes) {
						if (attribute.name === "class" && attribute.value.includes("views-table")) {
							buildingTable = currElem;
							break searchLoop;
						}
					}
					// if (!("class" in currNode.attrs)) {
					// 	continue;
					// }
					// let classes = currNode.attrs["class"];
					// if (classes.includes("views-field")) {
					// 	// do stuff
					// }
						// && "class" in currNode.attrs
						// && currNode.attrs["class"].includes("views-field")) {
						// do stuff
				}
				return Promise.resolve(["asdf"]);
				// let buildingTable = this.findBuildingTable(document);
			});
		// WIP
		// return Promise.resolve(["hi"]);
	}
}

