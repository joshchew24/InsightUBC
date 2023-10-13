import {SectionPruned} from "../models/ISection";
import {QueryASTNode} from "../models/QueryASTNode";
import {InsightResult} from "../controller/IInsightFacade";


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
	if (queryItemKey === "NOT"){
		let notNode = new QueryASTNode(queryItemKey, []);
		let childNode = processQueryToAST(itemChildren);
		notNode.addChild(childNode);
		return notNode;
	} else if(!Array.isArray(itemChildren)) {
		// make final node with key:value, add to list of MCOMPARISON/SCOMPARISON node
		let leafItemKey = Object.keys(itemChildren)[0];
		let leaf = new QueryASTNode(leafItemKey, itemChildren[leafItemKey]);
		return new QueryASTNode(queryItemKey, [leaf]);
	} else {
		let currRoot = new QueryASTNode(queryItemKey, []);
		for(let childItem of itemChildren) {
			currRoot.addChild(processQueryToAST(childItem));
		}
		return currRoot;
	}
}

export function passesQuery(currSection: SectionPruned, query: QueryASTNode): boolean {
	// if section doesn't pass any of the query execution return false; will only return true if query works
	let includeSection = false;
	let queryNodeKey = query.key;
	let queryChildren = query.children as QueryASTNode[];

	switch (queryNodeKey) {
		case "AND":
			includeSection = true;
			for(const child of query.children as QueryASTNode[]) {
				includeSection = includeSection && passesQuery(currSection, child);
			}
			return includeSection;
		case "OR":
			for(const child of queryChildren) {
				includeSection = includeSection || passesQuery(currSection, child);
			}
			return includeSection;
		case "LT":
			return passesMComparator(currSection, queryChildren[0], "LT");
		case "GT":
			return passesMComparator(currSection, queryChildren[0], "GT");
		case "EQ":
			return passesMComparator(currSection, queryChildren[0], "EQ");
		case "NOT": {
			return !passesQuery(currSection, queryChildren[0]);
		}
		case "IS": {
			return matchesSField(currSection, queryChildren[0]);
		}
		case "no_filter": {
			return true;
		}
		default:
			return includeSection;
	}
}

export function transformColumns(rawResult: SectionPruned[], columns: string[]) {
	let transformedResult: InsightResult[] = [];
	for(const section of rawResult) {
		let transformedSection: InsightResult = {};
		for(const column of columns) {
			if(!(column in transformedSection)) {
				let fieldName = column.split("_")[1];
				transformedSection[column] = section.getField(fieldName);
			}
		}
		transformedResult.push(transformedSection);
	}
	return transformedResult;
}

export function orderRows(result: InsightResult[], order: string) {
	return result.sort((section1, section2) => {
		if (section1[order] < section2[order]) {
			return -1;
		}
		if (section1[order] > section2[order]) {
			return 1;
		}
		// keep order as is
		return 0;
	});
}


// HELPER FUNCTIONS

function passesMComparator(section: SectionPruned, mComparison: QueryASTNode, mComparator: string) {
	let fieldName = mComparison.key.split("_")[1];
	let mValue: number = mComparison.children as number;
	let sectionField: number = section.getField(fieldName) as number;
	switch(mComparator) {
		case "LT":
			return sectionField < mValue;
		case "GT":
			return sectionField > mValue;
		case "EQ":
			return sectionField === mValue;
		default:
			return true;
	}
}

function matchesSField(section: SectionPruned, sComparison: QueryASTNode) {
	let fieldName = sComparison.key.split("_")[1];
	let sValue: string = sComparison.children as string;
	let field: string = section.getField(fieldName) as string;

	if(sValue === "*" || sValue === "**") {
		return true;
	}

	if(field === "" && sValue !== "") {
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
