export class QueryASTNode {
	public value: any;
	public children: QueryASTNode[] | string | number;

	constructor(key: any, value: QueryASTNode[]) {
		this.value = key;
		this.children = value;

	}

	// function should only add child to node with list of QueryASTNodes as children
	public addChild(childNode: QueryASTNode) {
		if(Array.isArray(this.children)) {
			this.children.push(childNode);
		}
	}

}
