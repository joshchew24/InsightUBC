import {InsightError} from "../controller/IInsightFacade";
import {FilterKeys, QueryWithID} from "../models/IQuery";

// if query is valid, returns id_string, else false
export function validateQuery(query: object): QueryWithID {
	validateRootStructure(query);
	validateBody(query);
	validateOptions(query);
	let idString: string = validateIDs(query);
	return {
		id: idString,
		query: query
	};
}

// check if BODY (WHERE) and OPTIONS are the only keys present
// check if all IDs in query are the same
// doesDatasetIDExist()
// if (id is in datasetlist)
function validateRootStructure(query: object) {
	if (Object.keys(query).length !== 2) {
		throw new InsightError("Excess keys in query");
	}
}
// check that all id_strings in query are the same
// if same, return the id, else throw InsightError
function validateIDs(query: object): string | never {
	let idStrings: string[] = [];
	// TODO: populate idStrings from query keys
	if (idStrings.every((id) => id === idStrings[0])) {
		return idStrings[0];
	} else {
		throw new InsightError("Cannot query more than one dataset");
	}
}

function validateBody(query: object) {
	if (!("WHERE" in query)) {
		throw new InsightError("Missing WHERE");
	}
	let filter = query["WHERE"] as object;
	validateFilter(filter);
}

// TODO: implement recursive(?) filter validation
function validateFilter(filter: object) {
	// if filter is empty, it is trivially valid
	if (Object.keys(filter).length === 0) {
		return;
	}
	validateFilterKey(Object.keys(filter)[0]);
}
function validateFilterKey(key: string) {
	if (!(key in FilterKeys)) {
		throw new InsightError("Invalid filter key:" + key);
	}
}

function validateOptions(query: object) {
	if (!("OPTIONS" in query)) {
		throw new InsightError("Missing OPTIONS");
	}
	// TODO: validate OPTIONS object
	// TODO: if ORDER key exists, corresponding value should also exist in COLUMNS key_list
}

