import fs from "fs-extra";
import {RoomDatasetModel, SectionDatasetModel} from "../models/IModel";

// TODO: make this async
export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync("./data/" + id + ".json");
}

// TODO: make this async
// retrieve dataset with given ID
export function retrieveDataset(id: string): SectionDatasetModel | RoomDatasetModel {
	const data = fs.readFileSync("./data/" + id + ".json", "utf8");
	return JSON.parse(data);
}

export function retrieveAllDatasetIds(): string[] {
	let ids: string[] = [];
	fs.readdirSync("./data/").forEach((file) => {
		ids.push(file.split(".")[0]);
	});
	return ids;
}
