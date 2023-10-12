import {InsightDataset, InsightError, InsightResult} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import {SectionPruned} from "../models/ISection";
import {passesQuery, transformColumns, orderRows, processQueryToAST} from "./ExecuteQuery";
import {QueryASTNode} from "../models/QueryASTNode";

export function performQuery(query: unknown, datasetList: InsightDataset[]): Promise<InsightResult[]> {
	let sectionList: SectionPruned[] = [];
	if (!isJSON) {
		return Promise.reject(new InsightError("query is not valid JSON"));
	}
	// if (id is in datasetlist)

	let promiseChain = Promise.resolve(query);
	promiseChain.then((queryToValidate) => {
		if (!isValidQuery(queryToValidate)) {
			return Promise.reject(new InsightError("query does not follow the EBNF"));
		}
		return queryToValidate;
	}).then((validQuery) => {
		// construct tree and process the query
		return Promise.resolve(executeQuery(validQuery, sectionList));
	});
	return Promise.reject("Not implemented.");
}

function isJSON(input: unknown): boolean {
	// checks if input is valid JSON
	// arrays are objects, so we must ensure that input is not an array
	return (input !== null && input !== undefined && typeof input === "object" && !Array.isArray(input));
}

function isValidQuery(query: unknown): boolean {
	return false;
}

function executeQuery(validQuery: any, sectionList: SectionPruned[])  {
	let rawResult: SectionPruned[] = [];
	let queryTree: QueryASTNode = processQueryToAST(validQuery);

	// iterate through section list and add sections to unprocessed result list that pass query
	for (let currSection of sectionList) {
		if(passesQuery(currSection, queryTree)) {
			rawResult.push(currSection);
		}
	}
	// TODO: from rawResult handle transforming rawResult
	// should transform result sections to object containing just the columns given
	let processedResult = transformColumns(rawResult, validQuery["OPTIONS"]["COLUMNS"]);
	// TODO: from transformation, perform a sort if ORDER is given
	// will order transformed results if order key is given, else return unordered result
	if (validQuery["OPTIONS"]["ORDER"]) {
		return orderRows(processedResult, validQuery["OPTIONS"]["ORDER"]);
	} else {
		return processedResult;
	}
}
