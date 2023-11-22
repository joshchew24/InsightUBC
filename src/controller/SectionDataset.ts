import {InsightDatasetClass} from "./InsightDatasetClass";
import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export class SectionDataset extends InsightDatasetClass {

	private readonly SECTIONS_DIR = "courses";
	protected async processFileContents(content: string): Promise<any[]> {
		let zip: JSZip = new JSZip();
		return zip.loadAsync(content, {base64: true, createFolders: false})
			.catch((err) => {
				throw new InsightError("Error loading zip file from content parameter");
			})
			.then(() => {
				const dataDirectory = zip.folder(this.SECTIONS_DIR);
				if (!dataDirectory) {
					throw new InsightError("The " + this.SECTIONS_DIR + " directory was not found in the zip file");
				}
				return dataDirectory;
			})
			.catch((err) => {
				throw err;
			}).then((dataDirectory) => {
				const promises: any[] = [];
				dataDirectory.forEach((relativePath, file) => {
					promises.push(zip.file(file.name)?.async("text"));
				});
				return Promise.all(promises);
			})
			.catch((err) => {
				throw new InsightError("Error reading a file in the zip: " + err);
			});
	}
}
