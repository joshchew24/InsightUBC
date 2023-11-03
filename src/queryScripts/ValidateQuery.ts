import {InsightError} from "../controller/IInsightFacade";
import {QueryWithID} from "../models/IQuery";
import {validateFilter} from "./ValidateFilter";
import {isJSON} from "./PerformQuery";
import {doesDatasetIDExist} from "../controller/DiskUtil";

let idStringList: string[] = [];

// if query is valid, returns id_string, else false
export function validateQuery(query: object): QueryWithID {
	// reset the idStringList whenever we validate a new query.
	idStringList = [];
	validateRootStructure(query);
	validateBody(query);
	validateOptions(query);
	let idString: string = validateIDs(query);
	return {
		id: idString,
		query: query,
	};
}

// check if BODY (WHERE), OPTIONS, and optionally TRANSFORMATIONS are the only keys present
function validateRootStructure(query: object) {
	let rootKeys = Object.keys(query);
	let numKeys = rootKeys.length;
	if (numKeys < 1) {
		throw new InsightError("Invalid query string");
	}
	if (rootKeys[0] !== "WHERE") {
		throw new InsightError("Missing WHERE");
	}
	if (numKeys < 2 || rootKeys[1] !== "OPTIONS") {
		throw new InsightError("Missing OPTIONS");
	}
	if (numKeys === 2) {
		return;
	}
	if (numKeys !== 3 || rootKeys[2] !== "TRANSFORMATIONS") {
		throw new InsightError("Excess keys in query");
	}
}
// check that all id_strings in query are the same
// if same, return the id, else throw InsightError
function validateIDs(query: object): string | never {
	// is this possible to reach? how can you have a query that doesn't reference a dataset
	if (idStringList.length === 0) {
		throw new InsightError("something is definitely wrong if you got this error");
	}
	let idString = idStringList[0];
	if (idStringList.every((id) => id === idString)) {
		if (!doesDatasetIDExist(idString)) {
			throw new InsightError('Referenced dataset "' + idString + '" not added yet');
		}
		return idString;
	} else {
		throw new InsightError("Cannot query more than one dataset");
	}
}

function validateBody(query: object) {
	if (!("WHERE" in query)) {
		throw new InsightError("Missing WHERE");
	}
	// TODO: can WHERE have undefined?
	if (!isJSON(query["WHERE"])) {
		throw new InsightError("WHERE must be object");
	}
	validateWhere(query["WHERE"] as object);
}

function validateWhere(filter: object) {
	// if filter is empty, it is trivially valid
	let numKeys = Object.keys(filter).length;
	if (numKeys === 0) {
		return;
	}
	if (numKeys > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + numKeys);
	}
	validateFilter(filter);
}

/*
 "OPTIONS": {
 	"COLUMNS": [
 		"XXX_XXX",
 		"XXX_XXX"
 	],
 	"ORDER": "XXX_XXX"
 }
*/
function validateOptions(query: object) {
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

const Operators = ["LT", "GT", "EQ", "IS"];
const OperatorTypeMap: {[index: string]: number} = {
	LT: 0,
	GT: 0,
	EQ: 0,
	IS: 1,
};
const MathFields = ["avg", "pass", "fail", "audit", "year"];
const StringFields = ["dept", "id", "instructor", "title", "uuid"];
const allFields = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
// lol this is so hacky but whatever
const fields = [MathFields, StringFields];
const oppositeFields = [StringFields, MathFields];
// takes operator (oneof GT, LT, EQ, IS) and the qkey (idstring_field) and validates
// a valid qkey must be formatted properly, and field must be correct type based on operator
// updates the idStringList
export function validateQueryKey(fieldKey: string, qkey: string) {
	const regex = /^[^_]+_[^_]+$/g;
	if (!regex.test(qkey)) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}

	let split = qkey.split("_");
	if (split.length !== 2) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}
	let id = split[0];
	idStringList.push(id);
	let field = split[1];
	if (!allFields.includes(field)) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}
	// if fieldKey is in operators, we must validate the fieldType
	if (Operators.includes(fieldKey)) {
		let operatorType = OperatorTypeMap[fieldKey];
		if (fields[operatorType].includes(field)) {
			return;
		} else if (oppositeFields[operatorType].includes(field)) {
			throw new InsightError("Invalid key type in " + fieldKey);
		}
	}
}
