import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import * as DiskUtil from "./DiskUtil";
import {InsightData} from "../models/IModel";

export class InsightDatasetClass implements InsightDataset {
	// id, kind, numRows have to be public because the interface is not modifiable
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public numRows: number;
	private _data?: InsightData[];

	// If creating a new dataset, use 0
	// If modelling a dataset that already has been added, you must know all the fields (id, kind, numRows)
	public constructor(id: string, kind: InsightDatasetKind, numRows: number) {
		this.validateID(id);	// throws InsightError with invalid ID
		this.id = id;
		this.kind = kind;
		if (numRows < 0) {
			throw new InsightError("numRows cannot be negative");
		}
		this.numRows = numRows;
	}

	// if this is a new dataset, you must call addData with raw content first
	public async getData() {
		if (this.numRows === 0) {
			throw new InsightError("Dataset contains no valid sections (have you called addData?)");
		}
		if (this._data == null) {
			// TODO: refactor DiskUtil.retrieveDataset
			// this._data = await DiskUtil.retrieveDataset(this.id);
			return this._data;
		}
	}

	public async addData(content: string) {
		if (this._data != null) {
			throw new InsightError("You cannot overwrite the contents of an existing dataset. Remove it instead.");
		}
		if (content == null) {
			throw new InsightError("No data content provided");
		}
		console.log("we're about to process the file contents");
		let result = await this.processFileContents(content);
		console.log("done");
		console.log(result);
		return result;
	}

	private async processFileContents(content: string) {
		let zip: JSZip = new JSZip();
		try {
			await zip.loadAsync(content, {base64: true, createFolders: false});
			const coursesDirectory = zip.folder("courses");
			if (!coursesDirectory) {
				throw new InsightError("The 'courses' directory was not found in the zip file");
			}
			const promises: any[] = [];
			// console.log(coursesDirectory);
			coursesDirectory.forEach((relativePath, file) => {
				// console.log("relativePath:" + relativePath);
				// console.log("file:" + file);
				// console.log("file name:" + file.name);
				// console.log("zip file:" + zip.file(file.name));
				// console.log("async read:" + zip.file(file.name)?.async("text"));
				promises.push(zip.file(file.name)?.async("text"));
			});
			console.log(promises);
			let results = [];
			for (const promise of promises) {
				try {
					// eslint-disable-next-line no-await-in-loop
					results.push(await promise);
				} catch (err) {
					console.log(err);
				}
			}
			console.log(results);
			let response = await Promise.all(promises);
			console.log("response: " + JSON.stringify(response));
			// Promise.all(promises).then((result) => {
			// 	for (let item of result) {
			// 		console.log(item);
			// 	}
			// 	console.log(result);
			// });
		} catch (err) {
			console.log("fat error yo:" + err);
		}
	}
		// }
		// await zip.loadAsync(content, {base64: true, createFolders: false});
		// const data = await Promise.all(Object.keys(zip.files)
		// 	.filter((path) => {
		// 		return this.isValidPath(path);
		// 	})
		// 	.map(async (path) => {
		// 		// console.log(path);
		// 		return zip.file(path)?.async("text");
		// 	}));
		// console.log(data);
			// .then(async () => {
			// 	const fileReadingPromises = Object.keys(zip.files)
			// 		.filter((path) => {
			// 			return this.isValidPath(path);
			// 		})
			// 		.map(async (path) => {
			// 			console.log(path);
			// 			return zip.file(path)?.async("text");
			// 		});
			// 	console.log(fileReadingPromises);
			// 	return Promise.all(fileReadingPromises);
			// }).then((fileContents) => {
			// 	// Handle the file contents here
			// 	console.log(fileContents);
			// }).catch((err) => {
			// 	throw new InsightError(err);
			// });
	// }

	private isValidPath(path: string) {
		let parts = path.split("/");
		if (this.kind === InsightDatasetKind.Sections) {
			return (parts.length === 2 && parts[0] === "courses" && parts[1] !== "");
		} else {
			// NEED TO HANDLE index.htm somehow...
			return true;
		}
	}

	private validateID(id: string) {
		if (id == null || !id.trim() || id.includes("_")) {
			throw new InsightError("Invalid ID: '" + id + "'");
		}
			// check if id already exists in dataset
		if (DiskUtil.doesDatasetIDExist(id)) {
			throw new InsightError("Dataset ID: '" + id + "', already exists");
		}
	}

}
