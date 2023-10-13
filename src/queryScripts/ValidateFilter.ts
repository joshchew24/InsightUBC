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

// filter must have one key
export function validateFilter(filter: {[index: string]: any}) {
	let key = Object.keys(filter)[0];
	validateKey(key);
	// double check this behaviour
	if (key !== FilterKeys.AND && key !== FilterKeys.OR) {
		basicValidate(key, filter[key]);
	}
	filterValidationMap[key](filter);
}

function validateKey(key: string) {
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

let filterValidationMap: {[index: string]: ValidationFunction} = {
	AND: validateLogic,
	OR: validateLogic,
	LT: validateMComparison,
	GT: validateMComparison,
	EQ: validateMComparison,
	IS: validateSComparison,
	NOT: validateNegation
};

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

// e.g. "GT": {"XXX_year": "2010"}
function validateMComparison(key: {[index: string]: number}) {
	return;
}

// e.g. "IS": {"XXX_title": "*asdf"}
function validateSComparison(key: {[index: string]: string}) {
	return;
}

// e.g. "NOT": {"XXX": {XXX}}
// 			   ^  toNegate  ^
function validateNegation(filter: {[index: string]: object}) {
	let toNegate = filter["NOT"];
	validateFilter(toNegate);
}

