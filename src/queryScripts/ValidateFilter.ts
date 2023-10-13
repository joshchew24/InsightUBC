import {InsightError} from "../controller/IInsightFacade";
import {isJSON} from "./PerformQuery";

type ValidationFunction = (filter: any) => void;
enum FilterKeys {
	"AND" = "AND",
	"OR" = "OR",
	"LT" = "LT",
	"GT" = "GT",
	"EQ" = "EQ",
	"IS" = "IS",
	"NOT" = "NOT"
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
// lol this is so hacky but whatever
const fields = [MathFields, StringFields];
const oppositeFields = [StringFields, MathFields];

let filterValidationMap: {[index: string]: ValidationFunction} = {
	AND: validateLogic,
	OR: validateLogic,
	LT: validateMComparison,
	GT: validateMComparison,
	EQ: validateMComparison,
	IS: validateSComparison,
	NOT: validateNegation
};

// filter must have one key
export function validateFilter(filter: {[index: string]: any}) {
	let key = Object.keys(filter)[0];
	validateFilterKey(key);
	// double check this behaviour
	if (key !== FilterKeys.AND && key !== FilterKeys.OR) {
		basicValidate(key, filter[key]);
	}
	filterValidationMap[key](filter);
}

function validateFilterKey(key: string) {
	if (!(key in FilterKeys)) {
		throw new InsightError("Invalid filter key:" + key);
	}
}

// for mcomparison, scomparison, and negate, the value in the KV pair should be an object with a single key
function basicValidate(key: string, value: object) {
	if (!isJSON(value)) {
		throw new InsightError(key + " must be object");
	}
	let numKeys = Object.keys(value).length;
	if (numKeys !== 1) {
		throw new InsightError(key + " should only have 1 key, has " + numKeys);
	}
}

/* logic can have an array of filters
 e.g. AND: [{}, {}, {}]
 		   ^filterArr ^
 */
function validateLogic(filter: {[index: string]: object[]}) {
	let logic = Object.keys(filter)[0];
	let filterArr = filter[logic];
	if (!Array.isArray(filterArr) || filterArr.length === 0) {
		throw new InsightError(logic + " must be a non-empty array");
	}
	for (let elem of filterArr) {
		validateFilter(elem);
	}
}

// e.g. "GT": {"XXX_year": 2010}
// <operator>: {<attribute == qkey: value>}
function validateMComparison(filter: {[index: string]: {[index: string]: number}}) {
	let operator = Object.keys(filter)[0];
	let attribute = filter[operator];
	let qkey = Object.keys(attribute)[0];
	let value = attribute[qkey];
	if (typeof value !== "number") {
		throw new InsightError("Invalid value type in " + operator + ", should be number");
	}
	validateQueryKey(operator, qkey);
}

// e.g. "IS": {"XXX_title": "*asdf"}
function validateSComparison(filter: {[index: string]: {[index: string]: string}}) {
	let operator = Object.keys(filter)[0];
	let attribute = filter[operator];
	let qkey = Object.keys(attribute)[0];
	let value = attribute[qkey];
	validateQueryKey(operator, qkey);
	validateWildcard(operator, value);
}

// TODO: refactor to use in validateOPTIONS
// takes operator (oneof GT, LT, EQ, IS) and the qkey (idstring_field) and validates
// a valid qkey must be formatted properly, and field must be correct type based on operator
function validateQueryKey(operator: string, qkey: string) {
	const regex = /^[^_]+_[^_]+$/g;
	if (!regex.test(qkey)) {
		throw new InsightError("Invalid key " + qkey + " in " + operator);
	}

	let split = qkey.split("_");
	if (split.length !== 2) {
		throw new InsightError("Invalid key " + qkey + " in " + operator);
	}
	// TODO: validate ID?
	let id = split[0];
	let field = split[1];
	let operatorType = OperatorTypeMap[operator];
	if (field in fields[operatorType]) {
		return;
	} else if (field in oppositeFields[operatorType]) {
		throw new InsightError("Invalid key type in " + operator);
	} else {
		throw new InsightError("Invalid key " + qkey + " in " + operator);
	}
}

function validateWildcard(operator: string, inputString: string) {
	if (typeof inputString !== "string") {
		throw new InsightError("Invalid value type in " + operator + ", should be string");
	}
	const regex = /^\*?[^*]*\*?$/g;
	if (!regex.test(inputString)) {
		throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
	}
}

// e.g. "NOT": {"XXX": {XXX}}
// 			   ^  toNegate  ^
function validateNegation(filter: {[index: string]: object}) {
	let toNegate = filter["NOT"];
	validateFilter(toNegate);
}

