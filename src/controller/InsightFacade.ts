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
		const datasetArr: DatasetModel[] = this.retrieveDataset();
		if (datasetArr.some((dataset) => dataset.id === id)) {
			return Promise.reject(new InsightError("ID already exists"));
		}

		// section type should Sections only
		if (kind !== InsightDatasetKind.Sections) {
			return Promise.reject(new InsightError("Invalid dataset kind"));
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
					throw new InsightError("Invalid Dataset: Missing courses directory");
				}
				return data;
			})
			.then((data) => {
				// return an array of sections from content JSON
				return this.fileProcessingPromises(data);
			})
			.then((sectionArr) => {
				// write the dataset to disk
				return this.outputDataset(id, kind, sectionArr);
			})
			.catch((error) => {
				throw new InsightError(error.message);
			});
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	// iterates through all files in the zip and returns an array of sections
	private fileProcessingPromises(data: JSZip): Promise<Section[]>{
		const sectionArr: Section[] = [];
		const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
			return data.file(relativePath)?.async("text").then((fileContent) => {
				// check if fileContent is undefined
				if (!fileContent) {
					return;
				}
				// if start doesnt contain {" and the end doesnt contain "} then its not a json file
				if (!fileContent.startsWith("{") || !fileContent.endsWith("}")) {
					return Promise.resolve([]);
				}
				const sectionQuery: SectionQuery = JSON.parse(fileContent);
				sectionQuery.result.forEach((section: Section) => {
					// check if year is "overall"
					if (section.Year === "overall") {
						section.Year = "1900";
					}
					// check if section is valid
					if (this.isValidSection(section)) {
						// throw new InsightError("Invalid JSON data in file: " + relativePath);
						sectionArr.push(section);
					}
				});
			});
		});
		return Promise.all(fileProcessingPromises).then(() => {
			// check if sectionArr is empty
			if (sectionArr.length === 0) {
				throw new InsightError("No valid sections in dataset");
			}
			return sectionArr.flat();
		});
	}

	// checks if JSON data injected the Section object with valid fields (i.e. not undefined)
	private isValidSection(section: Section): boolean {
		if(!section.Course){
			return false;
			// throw new InsightError("Invalid Course");
		}
		if(!section.id){
			return false;
			// throw new InsightError("Invalid id");
		}
		if(section.Title === undefined){
			return false;
			// throw new InsightError("Invalid Title");
		}
		if(section.Professor === undefined){
			return false;
			// throw new InsightError("Invalid Professor");
		}
		if(section.Subject === undefined){
			return false;
			// throw new InsightError("Invalid Subject");
		}
		if(!section.Year){
			return false;
			// throw new InsightError("Invalid Year");
		}
		if(section.Avg === undefined || section.Avg < 0){
			return false;
			// throw new InsightError("Invalid Avg");
		}
		if(section.Pass === undefined || section.Pass < 0){
			return false;
			// throw new InsightError("Invalid Pass");
		}
		if(section.Fail === undefined || section.Fail < 0){
			return false;
			// throw new InsightError("Invalid Fail");
		}
		if(section.Audit === undefined || section.Audit < 0){
			return false;
			// throw new InsightError("Invalid Audit");
		}

		return true;
	}

	private outputDataset(id: string, kind: InsightDatasetKind,
						  sectionArr: Section[] ): string[] {


		// the dataset output with the pruned version of the orignal JSON input
		const newDataset: DatasetModel = {
			id: id,
			kind: kind,
			numRows: sectionArr.length,
			section: sectionArr.map((section) => {
				const sectionPruned: SectionPruned = {
					title: section.Title,
					uuid: section.id,
					instructor: section.Professor,
					audit: section.Audit,
					year: section.Year,
					id: section.Course,
					pass: section.Pass,
					fail: section.Fail,
					avg: section.Avg,
					dept: section.Subject
				};
				return sectionPruned;
			})
		};

		fs.outputFileSync(`./data/${id}.json`, JSON.stringify(newDataset, null, 4));

		// return ids from datasetArr
		const datasetArr: DatasetModel[] = this.retrieveDataset();
		return datasetArr.map((dataset) => dataset.id);
	}

	private retrieveDataset(): DatasetModel[] {
		try {
			// retrieve all JSON files from ./data if it exists
			const files = fs.readdirSync("./data");
			// return an array of dataset objects
			const datasetArr: DatasetModel[] = [];
			// iterate through all files in ./data
			files.forEach((file) => {
				if (file.endsWith(".json")) {
					const data = fs.readFileSync(`./data/${file}`, "utf8");
					const dataset: DatasetModel = JSON.parse(data);
					datasetArr.push(dataset);
				}
			});
			return datasetArr;
		} catch (err) {
			return [];
		}
	}

}


