import {InsightError} from "./IInsightFacade";
import {QueryWithID} from "../models/IQuery";

// if query is valid, returns id_string, else false
export function validateQuery(query: object): QueryWithID {
	checkRootStructure(query);
	checkBody(query);
	checkOptions(query);
	let idString: string = checkIDs(query);
	return {
		id: idString,
		query: query
	};
}

// check if BODY (WHERE) and OPTIONS are the only keys present
// check if all IDs in query are the same
// doesDatasetIDExist()
// if (id is in datasetlist)
function checkRootStructure(query: object) {
	if (Object.keys(query).length !== 2) {
		throw new InsightError("Excess keys in query");
	}
}
// check that all id_strings in query are the same
// if same, return the id, else throw InsightError
function checkIDs(query: object): string | never {
	let idStrings: string[] = [];
	// TODO: populate idStrings from query keys
	if (idStrings.every((id) => id === idStrings[0])) {
		return idStrings[0];
	} else {
		throw new InsightError("Cannot query more than one dataset");
	}
}

function checkBody(query: object) {
	if (!("WHERE" in query)) {
		throw new InsightError("Missing WHERE");
	}
	// TODO: validate WHERE object
}

function checkOptions(query: object) {
	if (!("OPTIONS" in query)) {
		throw new InsightError("Missing OPTIONS");
	}
	// TODO: validate OPTIONS object
	// TODO: if ORDER key exists, corresponding value should also exist in COLUMNS key_list
}

