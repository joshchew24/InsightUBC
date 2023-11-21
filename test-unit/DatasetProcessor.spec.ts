import chai from "chai";
import chaiAsPromised from "chai-as-promised";

import {getContentFromArchives} from "../test/resources/archives/TestUtil";

import {InsightDatasetClass} from "../src/controller/DatasetProcessor";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";

const ROOMS_PATH = "rooms_datasets/";

let pairSections = getContentFromArchives("pair.zip");
let singleSection = getContentFromArchives("single_valid_course.zip");
let smallSections = getContentFromArchives("five_big_courses.zip");

let campusRooms = getContentFromArchives(ROOMS_PATH + "campus.zip");
let smallRooms = getContentFromArchives(ROOMS_PATH + "campus_small.zip");

chai.use(chaiAsPromised);

describe("InsightDatasetClass", () => {
	describe("Constructor", () => {
		it("should process file contents", () => {
			let dataset = new InsightDatasetClass(
				"test",
				InsightDatasetKind.Sections,
				0);
			console.log("lol");
			dataset.addData(smallSections).then(() => {
				console.log("we finished adding shit");
			}).catch(() => {
				console.log("oh no");
			});
		});
	});
});
