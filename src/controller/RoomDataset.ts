import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";

export class RoomDataset extends InsightDatasetClass {
	private readonly ROOMS_DIR = "campus/discover/buildings-and-classrooms";

	protected async processFileContents(content: string): Promise<any[]> {
		return Promise.resolve(["hi"]);
	}
}
