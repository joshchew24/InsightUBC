import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as DiskUtil from "./DiskUtil";
import {Dataset, Header, InsightData} from "../models/IModel";
import fs from "fs-extra";
import {PERSISTENT_DIR} from "./DiskUtil";

export abstract class InsightDatasetClass implements InsightDataset {
	// id, kind, numRows have to be public because the interface is not modifiable
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public numRows: number;
	private _data?: InsightData[];

	// If creating a new dataset, use 0
	// If modelling a dataset that already has been added, you must know all the fields (id, kind, numRows)
	public constructor(id: string, kind: InsightDatasetKind, numRows: number) {
		this.validateID(id);		// throws InsightError with invalid ID
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

	// try to add data from content string into this dataset
	// Stores data in memory only
	// returns void on success, throws error on failure
	public async addData(content: string) {
		if (this._data != null) {
			throw new InsightError("You cannot overwrite the contents of an existing dataset. Remove it instead.");
		}
		if (content == null) {
			throw new InsightError("No data content provided");
		}

		let result = await this.processFileContents(content);
		if (result.length === 0) {
			throw new InsightError("This dataset had no data");
		}
		this._data = result;
		this.numRows = result.length;
	}

	// returns void on success, throws error on failure
	public async writeToDisk() {
		if (this.numRows === 0) {
			throw new InsightError("This dataset has no data");
		}
		let header = this.toObject();
		let toDisk = JSON.stringify([header]);
		if (!fs.existsSync(`${PERSISTENT_DIR}dataset_index.json`)) {
			fs.mkdirSync(PERSISTENT_DIR);
		} else {
			let indexString = fs.readFileSync(`${PERSISTENT_DIR}dataset_index.json`, {encoding: "utf8"});
			let index: Header[] = JSON.parse(indexString);
			index.push(header);
			toDisk = JSON.stringify(index);
		}

		fs.outputFileSync(`${PERSISTENT_DIR}dataset_index.json`, toDisk);


		let dataset = JSON.stringify(this.toObject(true));
		return fs.outputFileSync(PERSISTENT_DIR + this.id + ".json", dataset);
			// .catch(() => {
			// 	throw new InsightError("There was a problem writing the dataset to disk");
			// });
	}

	private toObject(withData: boolean = false): Dataset | Header {
		return {
			id: this.id,
			kind: this.kind,
			numRows: this.numRows,
			...(withData ? {data: this._data} : {}),
		};
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

	protected abstract processFileContents(content: string): Promise<InsightData[]>;
}
