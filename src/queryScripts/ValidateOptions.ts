import {InsightError} from "../controller/IInsightFacade";
import {validateQueryKey} from "./ValidateQuery";

/*
 "OPTIONS": {
 	"COLUMNS": [
 		"XXX_XXX",
 		"XXX_XXX"
 	],
 	"ORDER": "XXX_XXX"
 }
*/
export function validateOptions(query: object) {
	// TODO: redundant check, suppresses warnings when directly indexing query by "OPTIONS"
	if (!("OPTIONS" in query)) {
		throw new InsightError("Missing OPTIONS");
	}
	let options = query["OPTIONS"] as {[index: string]: string[] | string};
	if (!("COLUMNS" in options)) {
		throw new InsightError("OPTIONS missing COLUMNS");
	}
	let colKeys: string[] = options["COLUMNS"] as string[];
	if (!Array.isArray(colKeys)) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}
	for (let colKey of colKeys) {
		validateQueryKey("COLUMNS", colKey);
	}
	// numKeys is number of keys in Options object.
	// 1 key means we should only have a COLUMN object
	// 2 keys means we should only have a COLUMN and ORDER object
	let numKeys = Object.keys(options).length;
	if (numKeys === 1) {
		return;
	}
	if ((numKeys === 2 && !("ORDER" in options)) || numKeys > 2) {
		throw new InsightError("Invalid keys in OPTIONS");
	}
	let orderKey: string = options["ORDER"] as string;
	validateQueryKey("ORDER", orderKey);
	if (!colKeys.includes(orderKey)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}
}
