import {InsightDataset, InsightError, InsightResult} from "../controller/IInsightFacade";
import {SectionPruned} from "../models/ISection";
import {doesDatasetIDExist, retrieveDataset} from "../controller/DiskUtil";
import {passesQuery, transformColumns, orderRows, processQueryToAST} from "./ExecuteQuery";
import {QueryASTNode} from "../models/QueryASTNode";
import {validateQuery} from "./ValidateQuery";
import {QueryWithID} from "../models/IQuery";

export function handleQuery(query: unknown, datasetList: InsightDataset[]): Promise<InsightResult[]> {
	let sectionList: SectionPruned[] = [];
	if (!isJSON) {
		return Promise.reject(new InsightError("Invalid query string"));
	}

	return Promise.resolve(query as object).then((queryToValidate) => {
		let queryWithID: QueryWithID;
		try {
			queryWithID = validateQuery(queryToValidate);
		} catch (error) {
			return Promise.reject(error);
		}
		return queryWithID;
	}).then((queryWithID) => {
		// construct tree and process the query
		let validQuery = (queryWithID as QueryWithID).query;
		// TODO: refactor to make this async
		sectionList = retrieveDataset((queryWithID as QueryWithID).id);
		return Promise.resolve(executeQuery(validQuery, sectionList));
	});
	// TODO: catch block to propagate errors
}

// returns true if input looks like valid JSON
export function isJSON(input: unknown): boolean {
	// checks if input is valid JSON
	// arrays are objects, so we must ensure that input is not an array
	return (input !== null && input !== undefined && typeof input === "object" && !Array.isArray(input));
}

function executeQuery(inputQuery: any, sectionList: SectionPruned[])  {
	let rawResult: SectionPruned[] = [];
	let queryTree: QueryASTNode = processQueryToAST(inputQuery);

	// iterate through section list and add sections to unprocessed result list that pass query
	for (let currSection of sectionList) {
		if(passesQuery(currSection, queryTree)) {
			rawResult.push(currSection);
		}
	}
	// should transform result sections to object containing just the columns given
	let processedResult = transformColumns(rawResult, inputQuery["OPTIONS"]["COLUMNS"]);
	// will order transformed results if order key is given, else return unordered result
	if (inputQuery["OPTIONS"]["ORDER"]) {
		return orderRows(processedResult, inputQuery["OPTIONS"]["ORDER"]);
	} else {
		return processedResult;
	}
}
