export interface Room {
	fullname: string;    // Full building name.
	shortname: string;   // Short building name.
	number: string;      // The room number. Not always a number so represented as a string.
	name: string;        // The room id. Should be rooms_shortname + "_" + rooms_number.
	address: string;     // The building address.
	lat: number;         // The latitude of the building.
	lon: number;         // The longitude of the building.
	seats: number;       // The number of seats in the room.
	type: string;        // The room type.
	furniture: string;   // The room furniture.
	href: string;        // The link to the full details online.
}

// // HTML DOM nodes from parse5
export interface DomNode {
	nodeName: string;
	tagName?: string;
	value?: string;
	attrs?: Array<{[key: string]: any}>;
	namespaceURI: string;
	childNodes?: DomNode[];
	parentNode?: DomNode;
}
