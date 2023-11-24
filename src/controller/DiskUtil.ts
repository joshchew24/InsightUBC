import fs from "fs-extra";
import {RoomDatasetModel, SectionDatasetModel} from "../models/IModel";

export const PERSISTENT_DIR = "./data/";

// TODO: make this async
export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync(PERSISTENT_DIR + id + ".json");
}

// TODO: make this async
// retrieve dataset with given ID
export function retrieveDataset(id: string): SectionDatasetModel | RoomDatasetModel {
	const data = fs.readFileSync(PERSISTENT_DIR + id + ".json", "utf8");
	return JSON.parse(data);
}

export function retrieveAllDatasetIds(): string[] {
	let ids: string[] = [];
	fs.readdirSync(PERSISTENT_DIR).forEach((file) => {
		let id = file.split(".")[0];
		if (!id.includes("dataset_index")) {
			ids.push(file.split(".")[0]);
		}
	});
	return ids;
}
