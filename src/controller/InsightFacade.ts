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

		// console.log("id: " + id);
		const datasetArr: DatasetModel[] = this.retrieveDataset();

		const datasets: Map<string, SectionPruned[]> = new Map<string, SectionPruned[]>();

		if (!id || /^\s*$/.test(id) || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
		if (!content) {
			return Promise.reject(new InsightError("Invalid Content"));
		}


		const zip = new JSZip();
		return zip.loadAsync(content, {base64: true})
			.then((data) => {
				if (!data) {
					throw new InsightError("Invalid Dataset: Missing courses directory");
				}

				// prune data of non JSON files
				const files = data.filter((relativePath, file) => {
					return relativePath.endsWith(".json");
				});


				return data;
			})
			.then((data) => {
				// return an array of sections
				return this.fileProcessingPromises(data);
			})
			.then((sectionArr) => {
				return this.outputDataset(id, kind, sectionArr, datasetArr);
			})
			.catch((error) => {
				throw new InsightError(error.message);
				// return this.outputDataset(id, kind, datasets, []);
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

	private isValidSection(section: Section): boolean {
		if (!section.Course ||
			!section.id ||
			!section.Title ||
			!section.Professor ||
			!section.Subject ||
			!section.Year ||
			!section.Avg ||
			!section.Pass ||
			!section.Fail ||
			!section.Audit) {
			return false;
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

		// console.log(sectionArr);

		// new dataset array to remove repeated id
		const newDatasetArr: DatasetModel[] = [];
		datasetMap.forEach((value, key) => {
			value.forEach((section) => {
				newDatasetArr.push({
					id: key,
					section: value
				});
			});
		});

		// console.log(newDatasetArr);

		// console.log(datasetArr);

        // console.log(this.newDataset.keys());
		// console.log(JSON.stringify(datasetArr, null, 4));
		// console.log(datasetMap.keys());

		fs.outputFileSync("./data/dataset.json", JSON.stringify(newDatasetArr, null, 4));
		return Array.from(datasetMap.keys());
	}

	private retrieveDataset(): DatasetModel[] {
		try {
			const data = fs.readFileSync("./data/dataset.json", "utf8");
			const datasetArr: DatasetModel[] = JSON.parse(data);
			// console.log(datasetArr);
			return datasetArr;
		} catch (err) {
			// console.log(err);
			return [];
		}
	}

	private fileProcessingPromises(data: JSZip): Promise<Section[]>{

		const sectionArr: Section[] = [];

		const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
			return data.file(relativePath)?.async("text").then((fileContent) => {
				if (!fileContent) {
					return;
				}
				// console.log(relativePath);

				const courseStr = relativePath.replace("courses/", "");
				const sectionQuery: SectionQuery = JSON.parse(fileContent);

				if (sectionQuery.result.length === 0) {
					throw new InsightError("No valid sections found");
				}

				sectionQuery.result.forEach((section: Section) => {

					// console.log(section);

					if (!this.isValidSection(section)) {
						// console.log("triggered");
						throw new InsightError("Invalid JSON data in file: " + relativePath);
					}

					sectionArr.push(section);

				});
			});
		});
		return Promise.all(fileProcessingPromises).then(() => {
			return Promise.resolve(sectionArr);
		});

		// return Promise.all(data.map((file) => {
		// 	return file.async("text").then((fileContent) => {
		// 		if (!fileContent) {
		// 			return;
		// 		}
		// 		// console.log(relativePath);
		//
		// 		const courseStr = file.name.replace("courses/", "");
		// 		const sectionQuery: SectionQuery = JSON.parse(fileContent);
		//
		// 		if (sectionQuery.result.length === 0) {
		// 			throw new InsightError("No valid sections found");
		// 		}
		//
		// 		sectionQuery.result.forEach((section: Section) => {
		//
		// 			// console.log(section);
		//
		// 			if (!this.isValidSection(section)) {
		// 				// console.log("triggered");
		// 				throw new InsightError("Invalid JSON data in file: " + file.name);
		// 			}
		//
		// 			sectionArr.push(section);
		//
		// 		});
		// 	});
		// }
		// )).then(() => {
		// 	return Promise.resolve(sectionArr);
		// }
		// );
	}
}

