import {SectionPruned} from "../models/ISection";
import {QueryASTNode} from "../models/QueryASTNode";
import {InsightResult} from "../controller/IInsightFacade";
import {Room} from "../models/IRoom";

export function processQueryToAST(queryItem: any) {
	if (Object.keys(queryItem).length === 0) {
		// node with dummy key and no children should automatically pass PassesQuery
		return new QueryASTNode("no_filter", []);
	}
	// at top level key[0] WHERE has one key and value
	let queryItemKey = Object.keys(queryItem)[0];
	let itemChildren = queryItem[queryItemKey];

	/* if the current query item has a value that isn't a list we've reached our base case (comparison with key : value)
	   else we iterate through list to make a new node for each child */
	if (queryItemKey === "NOT") {
		let notNode = new QueryASTNode(queryItemKey, []);
		let childNode = processQueryToAST(itemChildren);
		notNode.addChild(childNode);
		return notNode;
	} else if (!Array.isArray(itemChildren)) {
		// make final node with key:value, add to list of MCOMPARISON/SCOMPARISON node
		let leafItemKey = Object.keys(itemChildren)[0];
		let leaf = new QueryASTNode(leafItemKey, itemChildren[leafItemKey]);
		return new QueryASTNode(queryItemKey, [leaf]);
	} else {
		let currRoot = new QueryASTNode(queryItemKey, []);
		for (let childItem of itemChildren) {
			currRoot.addChild(processQueryToAST(childItem));
		}
		return currRoot;
	}
}

export function passesQuery(currClass: SectionPruned | Room, query: QueryASTNode): boolean {
	// if class doesn't pass any of the query execution return false; will only return true if query works
	let includeClass = false;
	let queryNodeKey = query.key;
	let queryChildren = query.children as QueryASTNode[];

	switch (queryNodeKey) {
		case "AND":
			includeClass = true;
			for (const child of query.children as QueryASTNode[]) {
				includeClass = includeClass && passesQuery(currClass, child);
			}
			return includeClass;
		case "OR":
			for (const child of queryChildren) {
				includeClass = includeClass || passesQuery(currClass, child);
			}
			return includeClass;
		case "LT":
			return passesMComparator(currClass, queryChildren[0], "LT");
		case "GT":
			return passesMComparator(currClass, queryChildren[0], "GT");
		case "EQ":
			return passesMComparator(currClass, queryChildren[0], "EQ");
		case "NOT": {
			return !passesQuery(currClass, queryChildren[0]);
		}
		case "IS": {
			return matchesSField(currClass, queryChildren[0]);
		}
		case "no_filter": {
			return true;
		}
		default:
			return includeClass;
	}
}

export function mapColumns(rawResult: any, columns: string[]) {
	let transformedResult: InsightResult[] = [];
	for (const currClass of rawResult) {
		let transformedClass: InsightResult = {};
		for (const column of columns) {
			if (!(column in transformedClass)) {
				let fieldName = column.split("_")[1];
				transformedClass[column] = currClass.getField(fieldName);
			}
		}
		transformedResult.push(transformedClass);
	}
	return transformedResult;
}

export function orderRows(result: InsightResult[], order: any): InsightResult[] {
	let undirectedResult;
	let orderKeys: string[];
	if(typeof order === "string") {
		orderKeys = [order];
	} else {
		orderKeys = order["keys"];
	}
	undirectedResult = result.sort((class1, class2) => {
		for(let key of orderKeys) {
			// will return something if a tiebreak for the key exists
			if (class1[key] < class2[key]) {
				return -1;
			}
			if (class1[key] > class2[key]) {
				return 1;
			}
		}
		// keep order as is
		return 0;
	});

	// by default, we are already sorting in ascending order; then reverse list if direction is DOWN
	if(order["dir"] && order["dir"] === "DOWN") {
		return undirectedResult.reverse();
	} else {
		return undirectedResult;
	}
}

// HELPER FUNCTIONS

function passesMComparator(currClass: SectionPruned | Room, mComparison: QueryASTNode, mComparator: string) {
	let fieldName = mComparison.key.split("_")[1];
	let mValue: number = mComparison.children as number;
	let classField: number = 0;
	if(currClass.getField) {
		classField = currClass.getField(fieldName) as number;
	}
	switch (mComparator) {
		case "LT":
			return classField < mValue;
		case "GT":
			return classField > mValue;
		case "EQ":
			return classField === mValue;
		default:
			return true;
	}
}

function matchesSField(currClass: SectionPruned | Room, sComparison: QueryASTNode) {
	let fieldName = sComparison.key.split("_")[1];
	let sValue: string = sComparison.children as string;
	let field: string = "";
	if(currClass.getField) {
		field = currClass.getField(fieldName) as string;
	}

	if (sValue === "*" || sValue === "**") {
		return true;
	}

	if (field === "" && sValue !== "") {
		return false;
	}

	// sValue isn't empty when removing asterisk
	if (sValue.startsWith("*") && sValue.endsWith("*")) {
		return field.includes(sValue.slice(1, -1));
	} else if (sValue.startsWith("*")) {
		return field.endsWith(sValue.slice(1));
	} else if (sValue.endsWith("*")) {
		return field.startsWith(sValue.slice(0, -1));
	} else {
		return sValue === field;
	}
}

// TODO: finish
export function transformResult(inputQueryElement: string, processedResult: any): InsightResult[] {
	return [];
}
