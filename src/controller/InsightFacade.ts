import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Section, SectionQuery} from "../models/ISection";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	private datasets: Map<string, Section> = new Map<string, Section>();
	private newDataset: Map<string, Section> = new Map<string, Section>();

	constructor() {
		// console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
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
					return Promise.reject(new InsightError("Invalid Dataset: Missing courses directory"));
				}

				const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
					return data.file(relativePath)?.async("text").then((fileContent) => {
						if (!fileContent) {
							return;
						}
						// console.log(relativePath);

						const courseStr = relativePath.replace("courses/", "");
						const sectionQuery: SectionQuery = JSON.parse(fileContent);

						if (sectionQuery.result.length === 0) {
							return Promise.reject(new InsightError("No valid sections found"));
						}

						sectionQuery.result.forEach((section: Section) => {

							// console.log(section);

							if (!this.isValidSection(section)) {
								return Promise.reject(new InsightError("Invalid JSON data in file: " + relativePath));
							}

							// console.log(courseStr);
							this.datasets.set(courseStr, section);
						});
					});
				});

				return Promise.all(fileProcessingPromises)
					.then(() => {
						return this.finalAddDataset(id, kind);
					});
			})
			.catch((error) => {
				// return Promise.reject(new InsightError(error.message));
				console.log("Error triggered");
				return this.finalAddDataset(id, kind);
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

	private finalAddDataset(id: string, kind: InsightDatasetKind): Promise<string[]> {
		if (this.newDataset.has(id)) {
			return Promise.reject(new InsightError("ID already exists"));
		}

		if (kind !== InsightDatasetKind.Sections) {
			return Promise.reject(new InsightError("Invalid dataset kind"));
		}

		this.newDataset.set(id, {} as Section);
        // console.log(this.newDataset.keys());
		return Promise.resolve(Array.from(this.newDataset.keys()));
	}


}
