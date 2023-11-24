import {defaultTreeAdapter} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Document, Element, Node, ParentNode, TextNode} from "parse5/dist/tree-adapters/default";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {getFileFromZip} from "./DatasetUtil";
import {makeAsync} from "./AsyncUtil";
import {Attribute} from "parse5/dist/common/token";
import {Building, BuildingFields} from "../models/Building";
import {RoomFields} from "../models/Room";


export function findTableInHTML(documentString: string, docName: string = "document") {
	let document: Document = parse5.parse(documentString);
	if (!document || defaultTreeAdapter.getChildNodes(document).length === 0) {
		throw new InsightError(docName + " is empty");
	}
	return makeAsync(findTable,"No valid table", document);
}

function findTable(document: Document): Element | null {
	let tableSearchStack: ChildNode[] = defaultTreeAdapter.getChildNodes(document);
	// TODO: can we move these declarations inside the loop for better readability?
	let currNode: ChildNode;
	let currElem: Element;
	let attributes: Attribute[];
	let buildingTable: Element | null = null;
	searchLoop: while (tableSearchStack && tableSearchStack.length > 0) {
		currNode = tableSearchStack.pop() as ChildNode;
		if ("childNodes" in currNode) {
			tableSearchStack.push(...defaultTreeAdapter.getChildNodes(currNode));
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

export function getTableRows(buildingTable: Element): Element[] {
	let tableBody = getChildElements(buildingTable,
		true, parse5.html.TAG_NAMES.TBODY);
	if (tableBody == null) {
		// TODO: if we use stricter checking,the table may not be empty
		throw new InsightError("the table is empty");
	}

	let rows = getChildElements(tableBody as Element,
		false, parse5.html.TAG_NAMES.TR);
	if (rows == null) {
		throw new InsightError("the table is empty");
	}

	return rows as Element[];
}


export function getChildElements(parent: Element,
								 findFirst: boolean,
								 tag?: parse5.html.TAG_NAMES): Element | Element[] | null {
	let children: Element[] = [];
	for (let child of defaultTreeAdapter.getChildNodes(parent)) {
		if (defaultTreeAdapter.isElementNode(child)
		&& (!tag || defaultTreeAdapter.getTagName(child) === tag)) {
			if (findFirst) {
				return child;
			}
			children.push(child);
		}
	}
	if (children.length === 0) {
		return null;
	}
	return children;
}

type ChildTypes = "element" | "text";
const typeMap: Record<ChildTypes, (node: Node) => boolean> = {
	element: defaultTreeAdapter.isElementNode,
	text: defaultTreeAdapter.isTextNode
};

// if you request a specific tag, type must be child
export function getChildNodes(parent: ParentNode,
								 findFirst: boolean,
								 type?: ChildTypes,
								 tag?: parse5.html.TAG_NAMES): ChildNode | ChildNode[] | null {
	let children: ChildNode[] = [];
	// so far, we only need element and text nodes
	for (let child of defaultTreeAdapter.getChildNodes(parent)) {
		if ((!type || typeMap[type](child)) // defaultTreeAdapter.isElementNode(child)
		&& (!tag || (type === "element" && defaultTreeAdapter.getTagName(child as Element) === tag))) {
			if (findFirst) {
				return child;
			}
			children.push(child);
		}
	}
	if (children.length === 0) {
		return null;
	}
	return children;
}

export function validateAndGetTableFields(
	tableCellsArr: Element[],
	fieldObject: BuildingFields | RoomFields,
	validClasses: string[],
	getFieldFunction: (...args: any[]) => void) {

	for (let cell of tableCellsArr) {
		let attrList = defaultTreeAdapter.getAttrList(cell);
		for (let attr of attrList) {
			if (attr.name === "class" && validClasses.includes(attr.value)) {
				getFieldFunction(cell, attr.value, fieldObject);
			}
		}
	}
	// if we were not able to get all fields for this building, it's not valid so return null
	// TODO: this is slightly bugged - null values might not exist if the property was never created
	if (Object.values(fieldObject).some((value) => value === undefined)) {
		return null;
	}
	return fieldObject;
}
