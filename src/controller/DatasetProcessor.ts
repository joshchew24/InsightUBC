import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import * as DiskUtil from "./DiskUtil";
import {InsightData, SectionData, RoomData} from "../models/IModel";

export class InsightDatasetClass implements InsightDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	private _data?: InsightData[];

	// If numRows is provided, this assumes the dataset already exists on disk.
	// If numRows is not provided, this will try to add the dataset provided in the content parameter
	public constructor(id: string, kind: InsightDatasetKind, numRows?: number | undefined, content?: string,) {
		this.validateID(id);	// throws InsightError with invalid ID
		this.id = id;
		this.kind = kind;

		if (numRows != null) {
			this.numRows = numRows;
			return;
		}
		if (content == null) {
			throw new InsightError(
				"Content parameter is null or undefined, and numRows not provided"
			);
		}

		this.processFileContents(content);
		if (this._data == null) {
			throw new InsightError("Something went wrong with processing content parameter");
		}
		this.numRows = this._data.length;
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

	private processFileContents(content: string) {
		let zip: JSZip = new JSZip();
		zip.loadAsync(content, {base64: true}).then((loaded_zip) => {
			console.log(zip);
			console.log(loaded_zip);
		});
		let asdf: SectionData = {
			uuid: "asdf",
			id: "asdf",
			title: "asdf",
			instructor: "asdf",
			dept: "asdf",
			year: 1,
			avg: 1,
			pass: 1,
			fail: 1,
			audit: 1
		};
		this._data = [asdf];
	}

}
