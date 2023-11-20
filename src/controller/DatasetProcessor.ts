// import {InsightDatasetKind, InsightError} from "./IInsightFacade";
// import JSZip from "jszip";
// import * as DiskUtil from "./DiskUtil";
//
// class Dataset {
// 	private readonly _id: string;
// 	raw_content: string;
// 	kind: InsightDatasetKind;
//
// 	private _zip: JSZip = new JSZip();
//
// 	public constructor(id: string, content: string, kind: InsightDatasetKind) {
// 		this.validateID(id);	// throws InsightError with invalid ID
// 		this._id = id;
// 		this.processFileContents(content);
//
// 	}
//
// 	private validateID(id: string) {
// 		if (id == null || !id.trim() || id.includes("_")) {
// 			throw new InsightError("Invalid ID: '" + id + "'");
// 		}
// 		// check if id already exists in dataset
// 		if (DiskUtil.doesDatasetIDExist(id)) {
// 			throw new InsightError("Dataset ID: '" + id + "', already exists");
// 		}
// 	}
//
// 	public get id(): string {
// 		return this._id;
// 	}
//
// 	private processFileContents(content: string) {
// 		if (content == null) {
// 			throw new InsightError("Content parameter is null or undefined");
// 		}
// 	}
// }
