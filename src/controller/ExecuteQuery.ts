import {SectionPruned} from "../models/ISection";
import {QueryASTNode} from "../models/QueryASTNode";
import {InsightResult} from "./IInsightFacade";


// TODO: create an AST using the provided QUERY
export function processQueryToAST(query: any) {
	return new QueryASTNode("", []);
}

// TODO: check if section should be included in result given query
export function passesQuery(currSection: SectionPruned, query: QueryASTNode) {
	return false;
}

// TODO: given an unprocessed list of sections, return list with sections transformed to only include keys given by columns
export function transformColumns(rawResult: SectionPruned[], columns: any[]) {
	let transformedResult: InsightResult[] = [];

	return transformedResult;
}

// TODO: if order is given, order result
export function orderRows(result: InsightResult[], order: any) {
	return result;
}
