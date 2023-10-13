import {SectionPruned} from "../models/ISection";
import {QueryASTNode} from "../models/QueryASTNode";
import {InsightResult} from "../controller/IInsightFacade";


// TODO: create an AST using the provided QUERY
export function processQueryToAST(query: any) {
	let rootNode: QueryASTNode = new QueryASTNode(query["WHERE"], []);
	return new QueryASTNode("", []);
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

export function orderRows(result: InsightResult[], order: any) {
	return result.sort((section1, section2) => {
		if (section1[order] < section2[order]) {
			return -1;
		}
		if (section1[order] > section2[order]) {
			return 1;
		}
		return 0;
	});
}
