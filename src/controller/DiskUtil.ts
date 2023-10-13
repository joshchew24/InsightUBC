import fs from "fs-extra";
import {SectionPruned} from "../models/ISection";
import {DatasetModel} from "../models/IModel";

// TODO: make this async
export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync("./data/" + id + ".json");
}

// TODO: implement stub
// TODO: make this async async
// retrieve dataset with given ID
export function retrieveDataset(id: string): SectionPruned[] {
	const data = fs.readFileSync("./data/" + id + ".json", "utf8");
	const dataset: DatasetModel = JSON.parse(data);
	return dataset.section;
}
