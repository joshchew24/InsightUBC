import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {SectionPruned} from "../models/ISection";
import {retrieveDataset} from "../controller/DiskUtil";
import {mapColumns, orderRows, passesQuery, processQueryToAST, transformResult} from "./ExecuteQuery";
import {QueryASTNode} from "../models/QueryASTNode";
import {validateQuery} from "./ValidateQuery";
import {QueryWithID} from "../models/IQuery";
import {Room} from "../models/IRoom";
import {RoomDatasetModel, SectionDatasetModel} from "../models/IModel";

export function handleQuery(query: unknown): Promise<InsightResult[]> {
	let currDataset: SectionDatasetModel | RoomDatasetModel;
	if (!isJSON) {
		return Promise.reject(new InsightError("Invalid query string"));
	}

	return Promise.resolve(query as object)
		.then((queryToValidate) => {
			let queryWithID: QueryWithID;
			// TODO: This try catch block is unnecessary, errors should propagate to the promise chain catch
			try {
				queryWithID = validateQuery(queryToValidate);
			} catch (error) {
				return Promise.reject(error);
			}
			return queryWithID;
		})
		.then((queryWithID: QueryWithID) => {
			// construct tree and process the query
			let validQuery = queryWithID.query;
			// TODO: refactor to make this async
			currDataset = retrieveDataset(queryWithID.id);
			return Promise.resolve(executeQuery(validQuery, currDataset));
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}

// returns true if input looks like valid JSON
export function isJSON(input: unknown): boolean {
	// checks if input is valid JSON
	// arrays are objects, so we must ensure that input is not an array
	return input !== null && input !== undefined && typeof input === "object" && !Array.isArray(input);
}

// TODO: need to refactor to take into account rooms
function executeQuery(inputQuery: any, currDataset: SectionDatasetModel | RoomDatasetModel) {
	let rawResult = [];
	let queryTree: QueryASTNode = processQueryToAST(inputQuery["WHERE"]);
	let resultSize = 0;

	if(currDataset.kind === InsightDatasetKind.Rooms) {
		let roomDataset = currDataset as RoomDatasetModel;
		for (let room of roomDataset.room) {
			let currRoom = new Room(room);
			if(passesQuery(currRoom, queryTree)) {
				if (resultSize <= 5000) {
					rawResult.push(currRoom);
					resultSize++;
				} else {
					throw new ResultTooLargeError(
						"The result is too big. " + "Only queries with a maximum of 5000 results are supported."
					);
				}
			}
		}

	} else if(currDataset.kind === InsightDatasetKind.Sections) {
		let sectionDataset = currDataset as SectionDatasetModel;
		// iterate through section list and add sections to unprocessed result list that pass query
		for (let section of sectionDataset.section) {
			let currSection = new SectionPruned(section);
			if (passesQuery(currSection, queryTree)) {
				if (resultSize <= 5000) {
					rawResult.push(currSection);
					resultSize++;
				} else {
					throw new ResultTooLargeError(
						"The result is too big. " + "Only queries with a maximum of 5000 results are supported."
					);
				}
			}
		}
	}

	if (inputQuery["TRANSFORMATIONS"]) {
		rawResult = transformResult(inputQuery["TRANSFORMATIONS"], rawResult);
	}
	// TODO: might need to check that implementation is okay with transformations
	// should transform result sections to object containing just the columns given
	let processedResult = mapColumns(rawResult, inputQuery["OPTIONS"]["COLUMNS"]);
	// will order transformed results if order key is given, else return unordered result
	if (inputQuery["OPTIONS"]["ORDER"]) {
		return  orderRows(processedResult, inputQuery["OPTIONS"]["ORDER"]);
	} else {
		return processedResult;
	}
}
