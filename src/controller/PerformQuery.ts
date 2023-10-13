import {InsightDataset, InsightError, InsightResult} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import {SectionPruned} from "../models/ISection";
import {doesDatasetIDExist, retrieveDataset} from "./DiskUtil";
import {passesQuery, transformColumns, orderRows, processQueryToAST} from "./ExecuteQuery";
import {QueryASTNode} from "../models/QueryASTNode";
import {validateQuery} from "./ValidateQuery";
import {QueryWithID} from "../models/IQuery";

export function performQuery(query: unknown, datasetList: InsightDataset[]): Promise<InsightResult[]> {
	let sectionList: SectionPruned[] = [];
	if (!isJSON) {
		return Promise.reject(new InsightError("Invalid query string"));
	}

	Promise.resolve(query as object).then((queryToValidate) => {
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
	return Promise.reject("Not implemented.");
}

// returns true if input looks like valid JSON
function isJSON(input: unknown): boolean {
	// checks if input is valid JSON
	// arrays are objects, so we must ensure that input is not an array
	return (input !== null && input !== undefined && typeof input === "object" && !Array.isArray(input));
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
