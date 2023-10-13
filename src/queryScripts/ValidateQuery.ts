import {InsightError} from "../controller/IInsightFacade";
import {QueryWithID} from "../models/IQuery";
import {validateFilter} from "./ValidateFilter";
import {isJSON} from "./PerformQuery";

// if query is valid, returns id_string, else false
export function validateQuery(query: object): QueryWithID {
	validateRootStructure(query);
	validateBody(query);
	validateOptions(query);
	let idString: string = validateIDs(query);
	// TODO: doesDatasetIDExist
	return {
		id: idString,
		query: query
	};
}

// check if BODY (WHERE) and OPTIONS are the only keys present
// check if all IDs in query are the same
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

function validateOptions(query: object) {
	if (!("OPTIONS" in query)) {
		throw new InsightError("Missing OPTIONS");
	}
	// TODO: validate OPTIONS object
	// TODO: if ORDER key exists, corresponding value should also exist in COLUMNS key_list
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
export function validateQueryKey(fieldKey: string, qkey: string) {
	const regex = /^[^_]+_[^_]+$/g;
	if (!regex.test(qkey)) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}

	let split = qkey.split("_");
	if (split.length !== 2) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}
	// TODO: validate ID?
	let id = split[0];
	let field = split[1];
	if (!(field in allFields)) {
		throw new InsightError("Invalid key " + qkey + " in " + fieldKey);
	}
	// if fieldKey is in operators, we must validate the fieldType
	if (fieldKey in Operators) {
		let operatorType = OperatorTypeMap[fieldKey];
		if (field in fields[operatorType]) {
			return;
		} else if (field in oppositeFields[operatorType]) {
			throw new InsightError("Invalid key type in " + fieldKey);
		}
	}
}
