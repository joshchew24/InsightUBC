import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";

import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import InsightFacade from "../../src/controller/InsightFacade";
import {
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import {folderTest} from "@ubccpsc310/folder-test";

chai.use(chaiAsPromised);

let pairSections = getContentFromArchives("pair.zip");
let singleSection = getContentFromArchives("single_valid_course.zip");
let campusRooms = getContentFromArchives("campus.zip");

type Input = unknown;
type Output = InsightResult[];
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function()  {
	describe("addDataset success tests", function() {
		let sections: string;
		let facade: InsightFacade;

		before(function() {
			sections = singleSection;
		});

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should fulfill adding a new dataset with a valid ID", function() {
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.deep.equal(["1234"]);
		});
		it("should accept multiple datasets with unique IDs", function() {
			const first = facade.addDataset("1", sections, InsightDatasetKind.Sections);
			return expect(first).to.eventually.have.deep.members(["1"]).then(function() {
				const second = facade.addDataset("2", sections, InsightDatasetKind.Sections);
				return expect(second).to.eventually.have.deep.members(["1", "2"]).then(function() {
					const third = facade.addDataset("3", sections, InsightDatasetKind.Sections);
					return expect(third).to.eventually.have.deep.members(["1", "2", "3"]);
				});
			});

		});

		// note dataset can still include non valid files
		it("Should add a dataset but skip non JSON file", async function () {
			let includesPDF: string = getContentFromArchives("some_invalid_file_format.zip");
			return facade.addDataset("includesPDF", includesPDF, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.deep.equal(["includesPDF"]);
				});
		});

		// A dataset contains some invalid sections: section doesn't contain every field that can be used for a query
		it("Should add a dataset but skip invalid sections", async function () {
			let invalidSections = getContentFromArchives("courses_invalidSections.zip");
			return facade.addDataset("invalidSections", invalidSections, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.deep.equal(["invalidSections"]);
				});
		});

		// A dataset contains only one section: fields all present but some empty
		it("Should add dataset with section having empty fields", async function () {
			let emptyFieldsSection = getContentFromArchives("section_with_emptyFields.zip");
			return facade.addDataset("emptyFieldsSection", emptyFieldsSection, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.deep.equal(["emptyFieldsSection"]);
				});
		});

		it("Should be able to handle adding a large dataset", async function() {
			sections = pairSections;
			return facade.addDataset("sections", sections, InsightDatasetKind.Sections)
				.then((result) => {
					expect(result).to.deep.equal(["sections"]);
				});
		});
	});
	describe("addDataset invalid ID tests", function() {
		let sections: string;
		let facade: InsightFacade;

		before(function() {
			sections = singleSection;
		});

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject adding a dataset with an empty id", function() {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a dataset with an id containing an underscore", function() {
			const result = facade.addDataset("0_0", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a dataset with an existing id", function() {
			const first = facade.addDataset("24", sections, InsightDatasetKind.Sections);
			return expect(first).to.eventually.deep.equal(["24"]).then(function() {
				const result = facade.addDataset("24", sections, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});
	});

	describe("addDataset invalid content tests", function() {
		let sections: string;
		let facade: InsightFacade;

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject empty content", function() {
			sections = "";
			const result = facade.addDataset("empty", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject content that is not a zip file", function() {
			sections = "hehexd";
			const result = facade.addDataset("hehexd", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains no sections", function() {
			sections = getContentFromArchives("no_fields.zip");
			const result = facade.addDataset("a1b2c3", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that does not contain a result key", function() {
			sections = getContentFromArchives("missing_result.zip");
			const result = facade.addDataset("a1b2c3", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that does not contain a courses dir", function() {
			sections = getContentFromArchives("no_courses_dir.zip");
			const result = facade.addDataset("a1b2c3", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Course field)", function() {
			sections = getContentFromArchives("missing_Course.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing id field)", function() {
			sections = getContentFromArchives("missing_id.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Title field)", function() {
			sections = getContentFromArchives("missing_Title.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Professor field)", function() {
			sections = getContentFromArchives("missing_Professor.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Subject field)", function() {
			sections = getContentFromArchives("missing_Subject.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Year field)", function() {
			sections = getContentFromArchives("missing_Year.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Avg field)", function() {
			sections = getContentFromArchives("missing_Avg.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Pass field)", function() {
			sections = getContentFromArchives("missing_Pass.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Fail field)", function() {
			sections = getContentFromArchives("missing_Fail.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject dataset that contains invalid section (missing Audit field)", function() {
			sections = getContentFromArchives("missing_Audit.zip");
			const result = facade.addDataset("1234", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// Attempting to add a dataset with a file not in JSON format
		it("Should reject with an input dataset having only non JSON file", function() {
			let notJSONCourse = getContentFromArchives("only_nonjson_course.zip");
			return expect(facade.addDataset("notJSONCourse", notJSONCourse, InsightDatasetKind.Sections))
				.to.eventually.be.rejectedWith(InsightError);
		});


		// Attempting to add a dataset that contains no courses
		it("Should reject with an input dataset missing courses", async function () {
			let noCourses = getContentFromArchives("no_courses.zip");
			return expect(facade.addDataset("noCourses", noCourses, InsightDatasetKind.Sections))
				.to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("addDataset with HTML tests", function() {
		let rooms: string;
		let facade: InsightFacade;

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject with no building files in dataset", function() {
			rooms = getContentFromArchives("campusNoBuildingFiles.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with no building table rows in index", function() {
			rooms = getContentFromArchives("campusNoBuildingListedInTable.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when building's html content is invalid", function() {
			rooms = getContentFromArchives("campusInvalidBuildingContent.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when InsightDatasetKind is sections but is given html content", function() {
			rooms = getContentFromArchives("campus.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when InsightDatasetKind is rooms but is given json content", function() {
			rooms = singleSection;
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should accept. has only one building (WOOD) - used for debugging purposes", function() {
			rooms = getContentFromArchives("campusValidOnlyOneBuilding.zip");
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.deep.equal(["1234"]);
		});

		it("should accept dataset that contains HTML", function() {
			rooms = campusRooms;
			const result = facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.deep.equal(["1234"]);
		});


		// it("should return valid geolocation for a building", async function() {
		// 	rooms = getContentFromArchives("campus.zip");
		// 	await facade.addDataset("1234", rooms, InsightDatasetKind.Rooms);
		// 	const result = await facade.getBuildingLocation("1234", "DMP");
		// 	return expect(result).to.deep.equal({lat: 49.26125, lon: -123.24807});
		// });
	});

	describe("removeDataset", function() {
		let sections: string;
		let facade: InsightFacade;

		before(function() {
			sections = singleSection;
		});

		beforeEach(async function() {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("1234", sections, InsightDatasetKind.Sections);
		});

		it("should reject removing a dataset with an empty id", function() {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject removing a dataset with id containing an underscore", function() {
			const result = facade.removeDataset("0_0");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject removing a dataset that doesn't exist in the dataset", function() {
			const result = facade.removeDataset("9999");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should successfully remove dataset with id 1234", function() {
			const result = facade.removeDataset("1234");
			return expect(result).to.eventually.be.deep.equal("1234").then(function() {
				return expect(facade.listDatasets()).to.eventually.be.deep.equal([]);
			});
		});

		// Multiple removals of datasets
		it("Should remove multiple datasets from list", function () {
			return facade.addDataset("1", sections, InsightDatasetKind.Sections)
				.then(() => {
					facade.addDataset("2", sections, InsightDatasetKind.Sections)
						.then(async (result) => {
							expect(result).to.deep.equal(["1", "2"]);
							const result1 = await facade.removeDataset("1");
							expect(result1).to.deep.equal("1");
							const result2 = await facade.removeDataset("2");
							expect(result2).to.deep.equal("2");
							expect(facade.listDatasets()).to.deep.equal([]);
						});
				});
		});
	});

	describe("listDatasets", function() {
		let sections: string;
		let facade: InsightFacade;

		before(function() {
			sections = singleSection;
		});
		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should return an empty list when there are no datasets to list", function() {
			return expect(facade.listDatasets()).to.eventually.be.deep.equal([]);
		});

		it("should have one elem in the array that is the single dataset added in before", async function() {
			await facade.addDataset("test", sections, InsightDatasetKind.Sections);
			const expected: InsightDataset[] = [
				{
					id: "test",
					kind: InsightDatasetKind.Sections,
					numRows: 1
				}
			];
			const result = facade.listDatasets();
			return expect(result).to.eventually.have.deep.members(expected);
		});

		it("should show all datasets that have been added", async function() {
			await facade.addDataset("1", sections, InsightDatasetKind.Sections);
			let expected: InsightDataset[] = [
				{
					id: "1",
					kind: InsightDatasetKind.Sections,
					numRows: 1
				}
			];
			let result = await facade.listDatasets();
			expect(result).to.have.deep.members(expected);

			await facade.addDataset("2", sections, InsightDatasetKind.Sections);
			expected.push({
				id: "2",
				kind: InsightDatasetKind.Sections,
				numRows: 1
			});
			result = await facade.listDatasets();
			// expect(result).to.eventually.have.deep.members(expected);
			expect(result).to.have.deep.members(expected);
		});

		it("should not show datasets that have been removed", async function() {
			await facade.addDataset("1", sections, InsightDatasetKind.Sections);
			await facade.addDataset("2", sections, InsightDatasetKind.Sections);
			let expected: InsightDataset[] = [
				{
					id: "1",
					kind: InsightDatasetKind.Sections,
					numRows: 1
				},
				{
					id: "2",
					kind: InsightDatasetKind.Sections,
					numRows: 1
				}
			];
			let result = await facade.listDatasets();
			expect(result).to.have.deep.members(expected);

			await facade.removeDataset("2");
			expected.pop();
			return expect(facade.listDatasets()).to.eventually.be.deep.equal(expected);
		});
	});
	describe("performQuery", function() {
		let facade: InsightFacade;

		before ( async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("sections", pairSections, InsightDatasetKind.Sections);
			await facade.addDataset("single", singleSection, InsightDatasetKind.Sections);
		});

		function target(input: Input): Promise<Output> {
			return facade.performQuery(input);
		}

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnResult(actual: any, expected: Output): void {
			expect(actual).to.have.deep.members(expected);
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.an.instanceOf(InsightError);
			} else {
				expect(actual).to.be.an.instanceOf(ResultTooLargeError);
			}
		}

		folderTest<Input, Output, Error>(
			"performQuery tests",
			target,
			"./test/resources/json",
			{
				errorValidator,
				assertOnError,
				assertOnResult
			}
		);
	});

});
