import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as DiskUtil from "./DiskUtil";
import {InsightData} from "../models/IModel";

export abstract class InsightDatasetClass implements InsightDataset {
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
		}
		return this._data;
	}

	public async addData(content: string) {
		if (this._data != null) {
			throw new InsightError("You cannot overwrite the contents of an existing dataset. Remove it instead.");
		}
		if (content == null) {
			throw new InsightError("No data content provided");
		}

		let result = await this.processFileContents(content);
		if (result.length === 0) {
			throw new InsightError("This dataset had no valid sections");
		}
		this._data = result;
		this.numRows = result.length;
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

	public writeToDisk() {
		return;
	}

	protected abstract processFileContents(content: string): Promise<any[]>;
}
