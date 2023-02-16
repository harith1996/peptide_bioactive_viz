export class PeptideLine {
	proteinSeq: string;
	peptideSeq: string;
	length: number;
	startIndex: number;
	isSplit: boolean;
	splitPosition: number;
	stackPosition: number;
	thickness: number;
	startAxisNumber: number;
	x1: number;
	x2: number;
	y: number;
	stroke: string;
	axisOffset: number;
	bioFunction:string;
	stagingIndex: number;

	constructor(
		proteinSequence: string,
		peptideSequence: string,
		startIndex: number,
		startAxisNumber: number,
		stroke: string,
		bioFunction: string,
		stagingIndex = 0
	) {
		this.proteinSeq = proteinSequence;
		this.peptideSeq = peptideSequence;
		this.startIndex = startIndex;
		this.length = this.peptideSeq.length;
		this.isSplit = false;
		this.splitPosition = -1;
		this.stackPosition = -1;
		this.thickness = 10;
		this.startAxisNumber = startAxisNumber;
		this.x1 = this.x2 = this.y = 0;
		this.axisOffset = 0;
		this.bioFunction = bioFunction;
		this.stroke = stroke;
		this.stagingIndex = stagingIndex;
	}

	getPixelLength(tickGap: number) {
		return (this.length - 1) * tickGap;
	}

	setSplit(splitPos: number) {
		this.isSplit = true;
		this.splitPosition = splitPos;
	}

	setStack(stackPos: number) {
		this.stackPosition = stackPos;
	}

	setThickness(thickness: number) {
		this.thickness = thickness;
	}
}