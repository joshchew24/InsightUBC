import fs from "fs-extra";
import {SectionPruned} from "../models/ISection";

// TODO: make this async
export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync("./data/" + id + ".json");
}

// TODO: implement stub
// TODO: make this async async
// retrieve dataset with given ID
export function retrieveDataset(id: string): SectionPruned[] {
	return [];
}
