import fs from "fs-extra";

export function doesDatasetIDExist(id: string): boolean {
	return fs.existsSync("./data/" + id + ".json");
}
