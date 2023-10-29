// iterates through all files in the zip and returns an array of sections
import JSZip from "jszip";
import {Section, SectionPruned, SectionQuery} from "../models/ISection";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {DatasetModel} from "../models/IModel";
import fs from "fs-extra";
import {DomNode, Room} from "../models/IRoom";
import {parse, parseFragment} from "parse5";
import {ChildNode, Document} from "parse5/dist/tree-adapters/default";


// ================$ ROOMS $=======================================

export function roomLogicAndOutput(data: JSZip, id: string, kind: InsightDatasetKind): Promise<string[]>{
	return roomProcessingPromises(data)
		.then((roomArr) => {
			// return outputRoomDataset(id, kind, roomArr);
			return Promise.resolve([]);
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}

export function roomProcessingPromises(data: JSZip): Promise<Room[]>{
	const roomArr: Room[] = [];
	const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
		return data.file(relativePath)?.async("text").then((fileContent) => {
			// check file ends with .htm before parsing
			if (!relativePath.endsWith(".htm")) {
				return;
			}

			const parse5AST = parse(fileContent);
			const DomNodes = parse5AST.childNodes as DomNode[];
			// dig through child nodes recursively
			console.log(relativePath);
			recurseAST(DomNodes, parse5AST.childNodes.length);


		}).catch((error) => {
			return Promise.reject(error);
		});
	});
	return Promise.all(fileProcessingPromises).then(() => {
	// check if roomArr is empty
		if (roomArr.length === 0) {
			throw new InsightError("No valid rooms in dataset");
		}
		return roomArr.flat();
	});
}


function recurseAST(childNodes: DomNode[], size: number){

	if(size === 0){
		return;
	}

	for(let i = 0; i < size; i++){


		if(childNodes[i].nodeName === "#text" && childNodes[i].parentNode?.nodeName === "td"){
			// console.log("entered");

			const trimmed = childNodes[i].value?.trim();
			if (trimmed !== "") {
				console.log("attribute", getClassAttributeValue(childNodes[i].parentNode?.attrs ?? []));
				console.log("trimmed: ", trimmed);
			}
		}

		// console.log(childNodes);
		// if node has child nodes,
		// recurse
		if(childNodes[i].childNodes !== undefined){
			// console.log("has child nodes");
			// console.log(childNodes[i].nodeName);
			// console.log(childNodes[i].childNodes);
			// console.log("abc parent: ", childNodes[i].parentNode.nodeName);


			recurseAST(childNodes[i].childNodes ?? [], childNodes[i].childNodes?.length ?? 0);
		}

		// console.log(tableArrayStrings);
	}
}

function getClassAttributeValue(attrs: Array<{name?: string, value?: string}>): string | null {
	for (let attr of attrs) {
		if (attr.name === "class") {
			return attr.value || null;
		}
	}
	return null;
}

// ================$ SECTIONS $=======================================

export function sectionLogicAndOutput(data: JSZip, id: string, kind: InsightDatasetKind): Promise<string[]>{
	return sectionFileProcessingPromises(data)
		.then((sectionArr) => {
			return outputSectionDataset(id, kind, sectionArr);
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}

export function sectionFileProcessingPromises(data: JSZip): Promise<Section[]>{
	const sectionArr: Section[] = [];
	const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
		return data.file(relativePath)?.async("text").then((fileContent) => {
		// check if fileContent is undefined
			if (!fileContent) {
				return;
			}
		// if start doesnt contain {" and the end doesnt contain "} then its not a json file
			if (!fileContent.startsWith("{") || !fileContent.endsWith("}")) {
				return;
			}
			const sectionQuery: SectionQuery = JSON.parse(fileContent);
			let sections: Section[] = JSON.parse(fileContent).result;
			let section: Section;
			for (section of sections) {
			// check if section is "overall"
				if (section.Section === "overall") {
					section.Year = "1900";
				}
			// check if section is valid
				if (isValidSection(section)) {
				// throw new InsightError("Invalid JSON data in file: " + relativePath);
					sectionArr.push(section);
				}
			}
		}).catch((error) => {
			return Promise.reject(error);
		});
	});
	return Promise.all(fileProcessingPromises).then(() => {
	// check if sectionArr is empty
		if (sectionArr.length === 0) {
			throw new InsightError("No valid sections in dataset");
		}
		return sectionArr.flat();
	});
}

// checks if JSON data injected the Section object with valid fields (i.e. not undefined)
export function isValidSection(section: Section): boolean {
	if(!section.Course){
		return false;
		// throw new InsightError("Invalid Course");
	}
	if(!section.id){
		return false;
		// throw new InsightError("Invalid id");
	}
	if(section.Title === undefined){
		return false;
		// throw new InsightError("Invalid Title");
	}
	if(section.Professor === undefined){
		return false;
		// throw new InsightError("Invalid Professor");
	}
	if(section.Subject === undefined){
		return false;
		// throw new InsightError("Invalid Subject");
	}
	if(!section.Year){
		return false;
		// throw new InsightError("Invalid Year");
	}
	if(section.Avg === undefined || section.Avg < 0){
		return false;
		// throw new InsightError("Invalid Avg");
	}
	if(section.Pass === undefined || section.Pass < 0){
		return false;
		// throw new InsightError("Invalid Pass");
	}
	if(section.Fail === undefined || section.Fail < 0){
		return false;
		// throw new InsightError("Invalid Fail");
	}
	return !(section.Audit === undefined || section.Audit < 0);

}

export function outputSectionDataset(id: string, kind: InsightDatasetKind, sectionArr: Section[]): string[] {

	// the dataset output with the pruned version of the original JSON input
	const newDataset: DatasetModel = {
		id: id,
		kind: kind,
		numRows: sectionArr.length,
		section: sectionArr.map((section) => {
			return new SectionPruned(section);
		})
	};
	// outputs JSON file for an id
	fs.outputFileSync(`./data/${id}.json`, JSON.stringify(newDataset, null, 4));
	// TODO: room for potential improvement for computation speed
	// return ids from datasetArr
	const datasetArr: DatasetModel[] = retrieveDatasetModel();
	return datasetArr.map((dataset) => dataset.id);
}

export function retrieveDatasetModel(): DatasetModel[] {
	try {
		// retrieve all JSON files from ./data if it exists
		const files = fs.readdirSync("./data");
		// return an array of dataset objects
		const datasetArr: DatasetModel[] = [];
		// iterate through all files in ./data
		files.forEach((file) => {
			if (file.endsWith(".json")) {
				const data = fs.readFileSync(`./data/${file}`, "utf8");
				const dataset: DatasetModel = JSON.parse(data);
				datasetArr.push(dataset);
			}
		});
		return datasetArr;
	} catch (err) {
		return [];
	}
}
