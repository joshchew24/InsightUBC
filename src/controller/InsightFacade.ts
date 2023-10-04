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
		const datasets: Map<string, Section[]> = new Map<string, Section[]>();

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
				return data;
			})
			.then((data) => {
				// return an array of sections
				return this.fileProcessingPromises(data);
			})
			.then((sectionArr) => {
				return this.outputDataset(id, kind, datasets, sectionArr);
			})
			.catch((error) => {
				// return Promise.reject(new InsightError(error.message));
				console.log("Error triggered");
				return this.outputDataset(id, kind, datasets, []);
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
						  dataset: Map<string, Section[]>,
						  sectionArr: Section[] ): string[] {
		if (dataset.has(id)) {
			throw new InsightError("ID already exists");
		}

		if (kind !== InsightDatasetKind.Sections) {
			throw new InsightError("Invalid dataset kind");
		}

		dataset.set(id, sectionArr);

		let datasetArr: DatasetModel[] = [];

		dataset.forEach((value, key) => {
			value.forEach((section) => {
				datasetArr.push({
					id: key,
					section: {
						Title: section.Title,
						id: section.id,
						Professor: section.Professor,
						Audit: section.Audit,
						Year: section.Year,
						Course: section.Course,
						Session: section.Session,
						Pass: section.Pass,
						Fail: section.Fail,
						Avg: section.Avg,
						Subject: section.Subject,
					}
				});
			});
		});

        // console.log(this.newDataset.keys());
		// console.log(JSON.stringify(datasetArr, null, 4));
		fs.outputFileSync("./data/dataset.json", JSON.stringify(datasetArr, null, 4));
		return Array.from(dataset.keys());
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
						throw new InsightError("Invalid JSON data in file: " + relativePath);
					}

					sectionArr.push(section);

				});
			});
		});
		return Promise.all(fileProcessingPromises).then(() => {
			return Promise.resolve(sectionArr);
		}
		);
	}
}

