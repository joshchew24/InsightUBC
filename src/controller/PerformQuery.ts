import {InsightDataset, InsightResult} from "./IInsightFacade";

export function performQuery(query: unknown, datasetList: InsightDataset[]): Promise<InsightResult[]> {
	return Promise.reject("Not implemented.");
}
