import {InsightError} from "../controller/IInsightFacade";
import {Transform} from "stream";
import {validateQuery} from "./ValidateQuery";

export function validateTransformations(query: object) {
	if (!("TRANSFORMATIONS" in query)) {
		throw new InsightError("Excess keys in query");
	}
	let transformations = query["TRANSFORMATIONS"];
	if (typeof transformations !== "object" || transformations === null || Array.isArray(transformations)) {
		throw new InsightError("Invalid query string");
	}
	let transformationKeys = Object.keys(transformations);
	if (!("GROUP" in transformations)) {
		throw new InsightError("TRANSFORMATIONS missing GROUP");
	}
	if (!("APPLY" in transformations)) {
		throw new InsightError("TRANSFORMATIONS missing APPLY");
	}
	if (transformationKeys.length > 2) {
		throw new InsightError("Extra keys in TRANSFORMATIONS");
	}

	let group = transformations["GROUP"];
	if (!Array.isArray(group)) {
		throw new InsightError("GROUP must be a non-empty array");
	}
	validateGroup(group);
	let apply = transformations["APPLY"];
	if (!Array.isArray(apply)) {
		throw new InsightError("APPLY must be an array");
	}
	validateApply(apply);
}

function validateGroup(group: string[]) {
	return;
}

function validateApply(apply: object[]) {
	return;
}
