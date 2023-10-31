import {SectionPruned} from "./ISection";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Room} from "./IRoom";

export interface SectionDatasetModel extends DatasetModel{
    section: SectionPruned[]
}

export interface RoomDatasetModel extends DatasetModel{
	room: Room[]
}

export interface DatasetModel {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
}
