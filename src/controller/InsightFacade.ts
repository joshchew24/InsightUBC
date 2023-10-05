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
		const datasetArr: DatasetModel[] = this.retrieveDataset();

		// id data validation
		if (!id || /^\s*$/.test(id) || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
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
				return this.outputDataset(id, kind, sectionArr, datasetArr);
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

	private fileProcessingPromises(data: JSZip): Promise<Section[]>{
		const sectionArr: Section[] = [];
		const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
			return data.file(relativePath)?.async("text").then((fileContent) => {
				if (!fileContent) {
					return;
				}

				// if start doesnt contain {" and the end doesnt contain "} then its not a json file
				if (!fileContent.startsWith("{") || !fileContent.endsWith("}")) {
					return Promise.resolve([]);
				}
				const courseStr = relativePath.replace("courses/", "");
				const sectionQuery: SectionQuery = JSON.parse(fileContent);

				sectionQuery.result.forEach((section: Section) => {
					if (this.isValidSection(section)) {
						// throw new InsightError("Invalid JSON data in file: " + relativePath);
						sectionArr.push(section);
					}
				});
			});
		});
		return Promise.all(fileProcessingPromises).then(() => {
			return sectionArr.flat();
		});
	}

	private isValidSection(section: Section): boolean {

		if(!section.Course){
			return false;
			// throw new InsightError("Invalid Course");
		}
		if(!section.id){
			return false;
			// throw new InsightError("Invalid id");
		}
		if(typeof section.Title !== "string"){
			return false;
			// throw new InsightError("Invalid Title");
		}
		if(typeof section.Professor !== "string"){
			return false;
			// throw new InsightError("Invalid Professor");
		}
		if(typeof section.Subject !== "string"){
			return false;
			// throw new InsightError("Invalid Subject");
		}
		if(!section.Year){
			return false;
			// throw new InsightError("Invalid Year");
		}
		if(typeof section.Avg !== "number" || section.Pass < 0){
			return false;
			// throw new InsightError("Invalid Avg");
		}
		if(typeof section.Pass !== "number" || section.Pass < 0){
			return false;
			// throw new InsightError("Invalid Pass");
		}
		if(typeof section.Fail !== "number" || section.Fail < 0){
			return false;
			// throw new InsightError("Invalid Fail");
		}
		if(typeof section.Audit !== "number" || section.Audit < 0){
			return false;
			// throw new InsightError("Invalid Audit");
		}

		return true;
	}

	private outputDataset(id: string, kind: InsightDatasetKind,
						  sectionArr: Section[],
						  datasetArr: DatasetModel[] ): string[] {

		const datasetMap: Map<string, SectionPruned[]> = new Map<string, SectionPruned[]>();

		datasetArr.forEach((dataset) => {
			if(!datasetMap.has(dataset.id)) {
				datasetMap.set(dataset.id, dataset.section);
			}
		});

		if (datasetMap.has(id)) {
			throw new InsightError("ID already exists");
		}

		if (kind !== InsightDatasetKind.Sections) {
			throw new InsightError("Invalid dataset kind");
		}

		datasetMap.set(id, sectionArr);

		// new dataset array to remove repeated id
		const newDatasetArr: DatasetModel[] = [];

		// for each id in datasetMap, add the id and the section array to newDatasetArr
		// throw error if section array is empty
		for(const key of datasetMap.keys()){
			const arrSize = datasetMap.get(key)?.length;
			if(arrSize === 0){
				throw new InsightError("Empty dataset");
			}
			newDatasetArr.push({
				id: key,
				section: datasetMap.get(key) as SectionPruned[]
			});
		}

		fs.outputFileSync(`./data/${id}.json`, JSON.stringify(newDatasetArr, null, 4));
		return Array.from(datasetMap.keys());
	}

	private retrieveDataset(): DatasetModel[] {
		try {
			// retrieve all JSON files from ./data if it exists
			const files = fs.readdirSync("./data");
			const datasetArr: DatasetModel[] = [];
			files.forEach((file) => {
				if (file.endsWith(".json")) {
					const data = fs.readFileSync(`./data/${file}`, "utf8");
					const dataset: DatasetModel[] = JSON.parse(data);
					datasetArr.push(...dataset);
				}
			});
			return datasetArr;

		} catch (err) {
			return [];
		}
	}

}


