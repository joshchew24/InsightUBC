// export interface Room {
// 	fullname: string;    // Full building name.
// 	shortname: string;   // Short building name.
// 	number: string;      // The room number. Not always a number so represented as a string.
// 	name: string;        // The room id. Should be rooms_shortname + "_" + rooms_number.
// 	address: string;     // The building address.
// 	lat: number;         // The latitude of the building.
// 	lon: number;         // The longitude of the building.
// 	seats: number;       // The number of seats in the room.
// 	type: string;        // The room type.
// 	furniture: string;   // The room furniture.
// 	href: string;        // The link to the full details online.
// }

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

export class Room {
	public fullname: string;    // Full building name.
	public shortname: string;   // Short building name.
	public number: string;      // The room number. Not always a number so represented as a string.
	public name: string;        // The room id. Should be rooms_shortname + "_" + rooms_number.
	public address: string;     // The building address.
	public lat: number;         // The latitude of the building.
	public lon: number;         // The longitude of the building.
	public seats: number;       // The number of seats in the room.
	public type: string;        // The room type.
	public furniture: string;   // The room furniture.
	public href: string;        // The link to the full details online.

	constructor(
		fullname: string,
		shortname: string,
		number: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = number;
		this.name = `${shortname}_${number}`;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}

	public getField?(fieldName: string) {
		let fieldValue: string | number;

		switch (fieldName) {
			case "fullname":
				fieldValue = this.fullname;
				break;
			case "shortname":
				fieldValue = this.shortname;
				break;
			case "number":
				fieldValue = this.number;
				break;
			case "name":
				fieldValue = this.name;
				break;
			case "address":
				fieldValue = this.address;
				break;
			case "lat":
				fieldValue = this.lat;
				break;
			case "lon":
				fieldValue = this.lon;
				break;
			case "seats":
				fieldValue = this.seats;
				break;
			case "type":
				fieldValue = this.type;
				break;
			case "furniture":
				fieldValue = this.furniture;
				break;
			case "href":
				fieldValue = this.href;
				break;
			default:
				fieldValue = "";
		}

		return fieldValue;
	}
}
