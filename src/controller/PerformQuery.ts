import {InsightDataset, InsightError, InsightResult} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import {SectionPruned} from "../models/ISection";

export function performQuery(query: unknown, datasetList: InsightDataset[]): Promise<InsightResult[]> {
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
		// // construct tree and process the query
		// processQuery(validQuery, sectionList);
		return Promise.resolve(validQuery);
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

// function processQuery(validQuery, sectionList) {
// 	return Promise.reject("Not implemented");
// }
