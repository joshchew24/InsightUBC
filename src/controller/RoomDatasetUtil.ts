import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {DomNode, Room} from "../models/IRoom";
import {parse} from "parse5";
import {GeoResponse} from "../models/IGeoResponse";
import {outputDataset} from "./CommonDatasetUtil";

export function roomLogicAndOutput(data: JSZip, id: string, kind: InsightDatasetKind): Promise<string[]>{
	return roomProcessingPromises(data)
		.then((roomArr) => {
			// return outputRoomDataset(id, kind, roomArr);
			return outputDataset(id, kind, roomArr);
		})
		.catch((error) => {
			return Promise.reject(error);
		});
}

async function combineMasterAndRoomLogic(roomArr: Room[], masterRoomArr: Room[]): Promise<Room[]> {
	if (roomArr.length === 0) {
		throw new InsightError("No valid sections in dataset");
	}
	if (masterRoomArr.length === 0 || roomArr.length === 0) {
		throw new InsightError("No valid room in dataset");
	}

	const geoPromises = masterRoomArr.map(async (room) => {
		try {
			const geoData = await fetchData(room.address);
			room.lat = geoData.lat;
			room.lon = geoData.lon;
			return room;
		} catch (error) {
			// console.error(`Failed to fetch lat/lon for address: ${room.address}`, error);
			return null;
		}
	});

	const updatedRooms: Array<Room | null> = await Promise.all(geoPromises);

	const combinedRoomArr = roomArr.map((room) => {
		const masterRoom = updatedRooms.find((masterRoomFind) => masterRoomFind?.shortname === room.shortname);
		return {...room, ...masterRoom};
	}).filter((room) => room.lon !== undefined || room.lat !== undefined);

	return combinedRoomArr;
}


function processZipContent(data: JSZip, masterRoomArr: Room[], roomArr: Room[]) {
	const fileProcessingPromises = Object.keys(data.files).map((relativePath) => {
		return data.file(relativePath)?.async("text").then((fileContent) => {
			// check file ends with .htm before parsing
			if (!relativePath.endsWith(".htm")) {
				return;
			}

			const parse5AST = parse(fileContent);
			// typecast parse5 to Domnode for easier type checking
			const DomNodes = parse5AST.childNodes as DomNode[];
			// dig through child nodes recursively

			// check if file is in building or is master index
			let buildingCode = "";
			if (relativePath.includes("/buildings-and-classrooms/")) {
				buildingCode = relativePath
					.split("/buildings-and-classrooms/")[1]
					.split("/")[0].replace(".htm", "");
			} else {
				// master index of buildings
				masterRecurseAST(DomNodes, parse5AST.childNodes.length, masterRoomArr, {});
				return masterRoomArr;
			}


			// recurse through all nodes, start populating array if buildingCode is not empty
			recurseAST(DomNodes, parse5AST.childNodes.length, roomArr, buildingCode, {});
			return roomArr;

		}).catch((error) => {
			return Promise.reject(error);
		});
	});
	return fileProcessingPromises;
}

export function roomProcessingPromises(data: JSZip): Promise<Room[]>{
	const roomArr: Room[] = [];
	const masterRoomArr: Room[] = [];
	const fileProcessingPromises = processZipContent(data, masterRoomArr, roomArr);
	return Promise.all(fileProcessingPromises).then(() => {
		return combineMasterAndRoomLogic(roomArr, masterRoomArr);
	});
}

// make rooms filled with fullname, shortname, and address
function masterRecurseAST(currNode: DomNode[], size: number, roomArr: Room[], room: Room) {

	// base case
	if(size === 0){
		return;
	}

	for(let i = 0; i < size; i++){
		// check if node is nested in valid table class
		const classAttribute = getAttributeValue(currNode[i].parentNode?.attrs ?? []);
		if(classAttribute !== null){
			room = masterIterativelyPopulateRoom(classAttribute, room, currNode[i]);
			// address is the last content added for each room for master index
			if(room.address !== undefined){
				// if room does not already exist in roomArr, then add it
				if(!roomArr.includes(room)){
					roomArr.push(room);
				}
				room = {} as Room;
			}
		}

		// if node has child nodes then recurse
		if(currNode[i].childNodes !== undefined){
			masterRecurseAST(currNode[i].childNodes ?? [],
				currNode[i].childNodes?.length ?? 0,
				roomArr,
				room);
		}
	}
}

function recurseAST(currNode: DomNode[],
	size: number,
	roomArr: Room[],
	buildingCode: string,
	room: Room) {

	// base case
	if(size === 0){
		return;
	}

	for(let i = 0; i < size; i++){
		// check if node is nested in valid table class
		const classAttribute = getAttributeValue(currNode[i].parentNode?.attrs ?? []);
		if(classAttribute !== null){
			room.shortname = buildingCode;
			room = iterativelyPopulateRoom(classAttribute, room, currNode[i]);
			if(room.type !== undefined){
				// if room does not already exist in roomArr, then add it
				if(!roomArr.includes(room)){
					roomArr.push(room);
				}
				room = {} as Room;
			}
		}

		// if node has child nodes then recurse
		if(currNode[i].childNodes !== undefined){
			recurseAST(currNode[i].childNodes ?? [],
				currNode[i].childNodes?.length ?? 0,
				roomArr,
				buildingCode,
				room);
		}

	}
}

function masterIterativelyPopulateRoom(attribute: string, room: Room, currNode: DomNode): Room {
	switch (attribute) {
		case "views-field views-field-title":					// fullname
			if (currNode.childNodes?.[0].value !== undefined) {
				const fullName = currNode.childNodes?.[0].value;
				room.fullname = fullName;
			}
			break;
		case "views-field views-field-field-building-code": 	// shortname
			if (currNode.value?.trim() !== "") {
				const shortName = currNode.value?.trim();
				if (shortName === "Code") {
					break;
				}
				room.shortname = shortName;
			}
			break;
		// name (shortname + room number
		case "views-field views-field-field-building-address": 	// address
			if (currNode.value?.trim() !== "") {
				const address = currNode.value?.trim();
				if (address === "Address" || address === undefined) {
					break;
				}

				room.address = address;

			}
			break;
	}
	return room;
}

function iterativelyPopulateRoom(attribute: string, room: Room, currNode: DomNode): Room {
	switch(attribute) {
		case "views-field views-field-field-room-number":	 	// number
			if(currNode.childNodes?.[0].value !== undefined) {
				room.number = currNode.childNodes?.[0].value ?? "";
				room.href = getAttributeValue(currNode.attrs ?? [], "href") ?? "";
			}
			break;
		case "views-field views-field-field-room-capacity":		// seats
			if(currNode.value?.trim() !== "") {
				const number = currNode.value?.trim();
				if(number === "Capacity") {
					break;
				}
				room.seats = Number(number);
			}
			break;
		case "views-field views-field-field-room-type":			// type
			if(currNode.value?.trim() !== "") {
				const type = currNode.value?.trim();
				if(type === "Room type") {
					break;
				}
				room.type = type;
			}
			break;
		case "views-field views-field-field-room-furniture":	// furniture
			if(currNode.value?.trim() !== "") {
				const furniture = currNode.value?.trim();
				if(furniture === "Furniture type") {
					break;
				}
				room.furniture = furniture;
			}
			break;
	}
	return room;
}

function getAttributeValue(attrs: Array<{name?: string, value?: string}>, attrKey = "class"): string | null {
	for (let attr of attrs) {
		if (attr.name === attrKey) {
			return attr.value || null;
		}
	}
	return null;
}

async function fetchData(rawAddress: string | undefined): Promise<GeoResponse> {
	if(rawAddress === undefined || rawAddress === ""){
		throw new InsightError("Empty address");
	}
	const baseURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team279/";
	const encodedAddress = encodeURIComponent(rawAddress);
	const fullURL = baseURL + encodedAddress;

	return fetch(fullURL)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			return response.json();
		})
		.then((data) => {
			// console.log(data);
			return data;
		})
		.catch((error) => {
			// console.log("There was a problem with the fetch operation:", error.message);
			// throw error;
		});
}


