export interface SectionQuery {
	result: Section[];
	rank:   number;
}

export interface Section {
	tier_eighty_five: number;
	tier_ninety:      number;
	Title:            string;
	Section:          string;
	Detail:           string;
	tier_seventy_two: number;
	Other:            number;
	Low:              number;
	tier_sixty_four:  number;
	id:               number;
	tier_sixty_eight: number;
	tier_zero:        number;
	tier_seventy_six: number;
	tier_thirty:      number;
	tier_fifty:       number;
	Professor:        string;
	Audit:            number;
	tier_g_fifty:     number;
	tier_forty:       number;
	Withdrew:         number;
	Year:             string;
	tier_twenty:      number;
	Stddev:           number;
	Enrolled:         number;
	tier_fifty_five:  number;
	tier_eighty:      number;
	tier_sixty:       number;
	tier_ten:         number;
	High:             number;
	Course:           string;
	Session:          string;
	Pass:             number;
	Fail:             number;
	Avg:              number;
	Campus:           string;
	Subject:          string;
}

export interface SectionPruned {
	title:            string;
	// originally id
	uuid:               number;
	instructor:        string;
	audit:            number;
	year:             string;
	// originally Course
	id:           	string;
	pass:             number;
	fail:             number;
	avg:              number;
	// originally Subject
	dept:          string;
}
