import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Section, SectionPruned, SectionQuery} from "../models/ISection";
import fs from "fs-extra";
import {DatasetModel} from "../models/IModel";
import {handleQuery} from "../queryScripts/PerformQuery";
import {doesDatasetIDExist} from "./DiskUtil";
import {
	outputSectionDataset, retrieveDatasetModel,
	roomProcessingPromises, roomLogicAndOutput,
	sectionFileProcessingPromises, sectionLogicAndOutput
} from "./DatasetUtil";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	constructor() {
		// console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// id data validation
		if (!id || /^\s*$/.test(id) || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
		// check if id already exists in dataset
		if (doesDatasetIDExist(id)) {
			return Promise.reject(new InsightError("ID already exists"));
		}
		// checks if zip content exists
		if (!content) {
			return Promise.reject(new InsightError("Invalid Content"));
		}
		const zip = new JSZip();
		return zip.loadAsync(content, {base64: true})
			.then((data) => {
				// data validation
				if (!data) {
					throw new InsightError("Invalid Dataset: Missing data directory");
				}
				return data;
			})
			.then((data) => {
				if(kind === InsightDatasetKind.Sections) {
					// return an array of sections from content JSON if kind is Sections
					return sectionLogicAndOutput(data, id, kind);
				} else if(kind === InsightDatasetKind.Rooms){
					// return an array of rooms from content JSON if kind is Rooms
					return roomLogicAndOutput(data, id, kind);
				}
				throw new InsightError("Invalid Dataset Kind");
			})
			.catch((error) => {
				throw new InsightError(error.message);
			});
	}

	public removeDataset(id: string): Promise<string> {
		try {
			// id data validation
			if (!id || /^\s*$/.test(id) || id.includes("_")) {
				throw new InsightError("Invalid ID");
			}
			// check if id exists in dataset, else stop execution
			if(!doesDatasetIDExist(id)){
				throw new NotFoundError("ID not found");
			}
			// remove the dataset from disk
			fs.removeSync(`./data/${id}.json`);
			return Promise.resolve(id);
		} catch (err) {
			return Promise.reject(err);
		}
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return handleQuery(query);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		try {
			const datasetArr: DatasetModel[] = retrieveDatasetModel();
			// check if datasetArr contains dataset objects, if not return empty array
			if (datasetArr.length === 1 && datasetArr[0].id === undefined) {
				return Promise.resolve([]);
			}
			// return an array of InsightDataset objects
			const insightDatasetArr: InsightDataset[] = datasetArr.map((dataset) => {
				return {
					id: dataset.id,
					kind: InsightDatasetKind.Sections,
					numRows: dataset.section.length,
				};
			});
			return Promise.resolve(insightDatasetArr);
		} catch (err) {
			return Promise.reject(err);
		}
	}


}


