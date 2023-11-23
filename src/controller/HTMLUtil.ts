import {defaultTreeAdapter} from "parse5";
import * as parse5 from "parse5";
import {Element} from "parse5/dist/tree-adapters/default";


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
