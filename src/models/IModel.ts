import {SectionPruned} from "./ISection";
import {InsightDatasetKind} from "../controller/IInsightFacade";

export interface DatasetModel {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    section: SectionPruned[]
}
