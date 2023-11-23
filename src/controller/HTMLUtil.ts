import {defaultTreeAdapter} from "parse5";
import * as parse5 from "parse5";
import {ChildNode, Element, Node, ParentNode, TextNode} from "parse5/dist/tree-adapters/default";


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
