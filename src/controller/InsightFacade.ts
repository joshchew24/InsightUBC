import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise((resolve, reject) => {
			// Validate inputs
			if (!id || /^\s*$/.test(id) || id.includes("_")) {
				reject(new InsightError("Invalid ID"));
			}
			if (!content) {
				reject(new InsightError("Invalid Content"));
			}
			// ...other validations

			// Create a new JSZip instance and load the content
			const zip = new JSZip();
			zip.loadAsync(content, {base64: true})
				.then(() => {
					// Navigate through the zip file and extract valid course sections
					const coursesDir = zip.folder("courses");
					if (!coursesDir) {
						reject(new InsightError("Invalid Dataset: Missing courses directory"));
					}
					// ...process the zip content and update the internal model

					// Assume updatedDatasets is an array of strings representing the IDs of all datasets
					// currently stored in the internal model after the new dataset has been added.
					const updatedDatasets: string[] = [id];  // Assuming id is added to updatedDatasets
					resolve(updatedDatasets);
				})
				.catch((error) => {
					// Handle any errors that occur during zip.loadAsync or other processing
					reject(new InsightError(error.message));
				});
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
}
