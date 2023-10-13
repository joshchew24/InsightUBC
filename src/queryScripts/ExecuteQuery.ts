import {SectionPruned} from "../models/ISection";
import {QueryASTNode} from "../models/QueryASTNode";
import {InsightResult} from "../controller/IInsightFacade";


export function processQueryToAST(queryItem: any) {
	let queryItemKey = Object.keys(queryItem)[0];
	let itemChildren = queryItem[queryItemKey];

	// if the current query item has a value that isn't a list we've reached our base case (some field)
	// else we iterate through list to make a new node for each child
	if(!Array.isArray(itemChildren)) {
		return new QueryASTNode(queryItemKey, itemChildren);
	} else {
		let currRoot = new QueryASTNode(queryItemKey, []);
		for(let childItem of itemChildren) {
			currRoot.addChild(processQueryToAST(childItem));
		}
		return currRoot;
	}
}

// TODO: check if section should be included in result given query
export function passesQuery(currSection: SectionPruned, query: QueryASTNode) {
	// if section doesn't pass any of the query execution return false; will only return true if query works

	return true;
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
