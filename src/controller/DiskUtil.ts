import fs from "fs-extra";
import {SectionPruned} from "../models/ISection";
import {SectionDatasetModel} from "../models/IModel";

// TODO: make this async
export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync("./data/" + id + ".json");
}

// TODO: make this async async
// retrieve dataset with given ID
export function retrieveDataset(id: string): SectionPruned[] {
	const data = fs.readFileSync("./data/" + id + ".json", "utf8");
	const dataset: SectionDatasetModel = JSON.parse(data);
	return dataset.section;
}

export function retrieveAllDatasetIds(): string[] {
	let ids: string[] = [];
	fs.readdirSync("./data/").forEach((file) => {
		ids.push(file.split(".")[0]);
	});
	return ids;
}
