export interface QueryWithID {
	id: string;
	query: object;
}

export enum FilterKeys {
	"AND" = "AND",
	"OR" = "OR",
	"LT" = "LT",
	"GT" = "GT",
	"EQ" = "EQ",
	"IS" = "IS",
	"NOT" = "NOT"
}
