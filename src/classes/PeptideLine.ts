export class PeptideLine {
	proteinSeq: string;
	peptideSeq: string;
	length: number;
	startIndex: number;
	isSplit: boolean;
	prefixSplit: number;
	suffixSplit: number;
	stackPosition: number;
	thickness: number;
	startAxisNumber: number;
	x1: number;
	x2: number;
	y: number;
	stroke: string;
	axisOffset: number;
	bioFunction: string;
	splitLines: Array<PeptideLine>;
	proteinId: string;
	stacked: boolean;

	constructor(
		proteinSequence: string,
		proteinId: string,
		peptideSequence: string,
		startIndex: number,
		startAxisNumber: number,
		stroke: string,
		bioFunction: string,
		stackPos = -1,
		stacked = false
	) {
		this.proteinSeq = proteinSequence;
		this.peptideSeq = peptideSequence;
		this.startIndex = startIndex;
		this.length = this.peptideSeq.length + 1;
		this.isSplit = false;
		this.prefixSplit = -1;
		this.suffixSplit = -1;
		this.stackPosition = stackPos;
		this.thickness = 14;
		this.startAxisNumber = startAxisNumber;
		this.x1 = this.x2 = this.y = 0;
		this.axisOffset = 0;
		this.bioFunction = bioFunction;
		this.stroke = stroke;
		this.splitLines = new Array<PeptideLine>();
		this.proteinId = proteinId;
		this.stacked = stacked;
	}

	getPixelLength(tickGap: number) {
		return (this.length - 1) * tickGap;
	}

	setPrefixSplit(prefixSplit: number) {
		this.isSplit = true;
		this.prefixSplit = prefixSplit;
	}
	setSuffixSplit(suffixSplit: number) {
		this.isSplit = true;
		this.suffixSplit = suffixSplit;
	}

	setStack(stackPos: number) {
		this.stackPosition = stackPos;
		this.stacked = true;
	}

	setThickness(thickness: number) {
		this.thickness = thickness;
	}

	isEqual(line: PeptideLine) {
		return (
			this.peptideSeq === line.peptideSeq &&
			this.startIndex === line.startIndex &&
			this.bioFunction.toLowerCase() === line.bioFunction.toLowerCase() &&
			this.isSplit === line.isSplit
		);
	}
}
