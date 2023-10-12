export class QueryASTNode {
	public value: any;
	public children: QueryASTNode[] | string | number;

	constructor(key: any, value: QueryASTNode[]) {
		this.value = key;
		this.children = value;

	}

}
