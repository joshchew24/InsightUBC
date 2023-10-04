import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Course, Section} from "../models/ICourse";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	private datasets: Map<string, any[]> = new Map<string, Course[]>();

	constructor() {
		// console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise( (resolve, reject) => {
			// Validate inputs
			if (!id || /^\s*$/.test(id) || id.includes("_")) {
				reject(new InsightError("Invalid ID"));
			}
			if (!content) {
				reject(new InsightError("Invalid Content"));
			}

			// Create a new JSZip instance and load the content
			const zip = new JSZip();
			zip.loadAsync(content, {base64: true}).then( (data) => {

				if(!data) {
					return reject(new InsightError("Invalid Dataset: Missing courses directory"));
				}

				// populate datasets field with zip based JSON data
				data.forEach((relativePath, file) => {
					data.file(relativePath)?.async("text").then((fileContent) => {
						const courseStr = relativePath.replace("courses/", "");
						const jsonResult: Section = JSON.parse(fileContent);
						this.datasets.set(courseStr, jsonResult.result);
					});
				});

				// check if id already exists in stored datasets
				if(this.datasets.has(id)){
					return reject(new InsightError("ID already exists"));
				}

				if(kind !== InsightDatasetKind.Sections ) {
					return reject(new InsightError("Invalid dataset kind"));
				}

				// add id to datasets and blank course object
				this.datasets.set(id, []);


				return resolve(Array.from(this.datasets.keys()));

			}).catch( (error) => {
				// Handle any errors that occur during zip.loadAsync or other processing
				reject(new InsightError(error.message));
			});
		});
	}

	// public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
	// 	return new Promise((resolve, reject) => {
	// 		// Validate inputs
	// 		if (!id || /^\s*$/.test(id) || id.includes("_")) {
	// 			reject(new InsightError("Invalid ID"));
	// 		}
	// 		if (!content) {
	// 			reject(new InsightError("Invalid Content"));
	// 		}
	//
	// 		// Create a new JSZip instance and load the content
	// 		const zip = new JSZip();
	// 		zip.loadAsync(content, {base64: true})
	// 			.then(() => {
	//
	//
	// 				// Navigate through the zip file and extract valid course sections
	// 				const coursesDir = zip.files["courses"];
	// 				if (!coursesDir) {
	// 					return reject(new InsightError("Invalid Dataset: Missing courses directory"));
	// 				}
	//
	// 				console.log(coursesDir);
	//
	// 				resolve([id]);
	// 			})
	// 			.catch((error) => {
	// 				// Handle any errors that occur during zip.loadAsync or other processing
	// 				reject(new InsightError(error.message));
	// 			});
	// 	});
	// }

	// public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
	// 	return new Promise((resolve, reject) => {
	// 		// Validate inputs
	// 		if (!id || /^\s*$/.test(id) || id.includes("_")) {
	// 			reject(new InsightError("Invalid ID"));
	// 			return;
	// 		}
	// 		if (!content) {
	// 			reject(new InsightError("Invalid Content"));
	// 			return;
	// 		}
	// 		// Check if id already exists in stored datasets
	// 		if(this.datasets.has(id)){
	// 			reject(new InsightError("ID already exists"));
	// 			return;
	// 		}
	// 		// Create a new JSZip instance and load the content
	// 		const zip = new JSZip();
	// 		zip.loadAsync(content, {base64: true})
	// 			.then(() => {
	// 				// Navigate through the zip file and extract valid course sections
	// 				const coursesDir = zip.folder("courses");
	// 				if (!coursesDir) {
	// 					return reject(new InsightError("Invalid Dataset: Missing courses directory"));
	// 				}
	// 				let processedData: any[] = [];
	// 				let fileProcessingPromises: Array<Promise<void>> = [];
	// 				coursesDir.forEach((relativePath, file) => {
	// 					const filePromise = file.async("text").then((fileContent) => {
	// 						try {
	// 							const jsonData = JSON.parse(fileContent);
	// 							if (this.isValidSection(jsonData)) {
	// 								processedData.push(this.processSection(jsonData));
	// 							}
	// 						} catch (e) {
	// 							// Only log the error, do not reject the promise, so that the process can continue
	// 							// console.error("Invalid JSON data in file: " + relativePath, e);
	// 						}
	// 					});
	// 					fileProcessingPromises.push(filePromise);
	// 				});
	// 				return Promise.all(fileProcessingPromises).then(() => {
	// 					// If no valid data was processed, reject the promise
	// 					if (processedData.length === 0) {
	// 						return reject(new InsightError("No valid sections found"));
	// 					}
	// 					// Add the dataset
	// 					this.datasets.set(id, processedData);
	// 					// Resolve with all dataset ids, not just the added one
	// 					// return as string[]
	// 					resolve(Array.from(this.datasets.keys()));
	// 				});
	// 			})
	// 			.catch((error) => {
	// 				// Handle any errors that occur during zip.loadAsync or other processing
	// 				reject(new InsightError(error.message));
	// 			});
	// 	});
	// }


	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	private isValidSection(section: any): boolean {
		if (!section.expected || !Array.isArray(section.expected)) {
			return false;
		}
		for (const expectedSection of section.expected) {
			if (typeof expectedSection.sections_uuid !== "string" ||
				typeof expectedSection.sections_id !== "string" ||
				typeof expectedSection.sections_title !== "string" ||
				typeof expectedSection.sections_instructor !== "string" ||
				typeof expectedSection.sections_dept !== "string" ||
				typeof expectedSection.sections_year !== "number" ||
				typeof expectedSection.sections_avg !== "number" ||
				typeof expectedSection.sections_pass !== "number" ||
				typeof expectedSection.sections_fail !== "number" ||
				typeof expectedSection.sections_audit !== "number"
			) {
				return false;
			}
		}
		return true;
	}


}
