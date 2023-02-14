import * as d3 from "d3";
import { BaseType, color, min, sort } from "d3";

export type Protein = {
	Entry: string;
	Sequence: string;
};

export type Peptide = {
	proteinID: string;
	peptide: string;
	category: string;
	function: string;
	seqIndex: Array<number>;
};

type IndexStack = {
	freeStackPos: number;
	maxLength: number;
};

class PeptideLine {
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

	constructor(
		proteinSequence: string,
		peptideSequence: string,
		startIndex: number,
		startAxisNumber: number,
		stroke: string,
		bioFunction: string
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

export class PeptideStackVis {
	/**
	 * A visualization for stacking peptides as lines on a sequence scale
	 */
	proteins: Array<Protein>;
	peptides: Array<Peptide>; //Datasets
	mainSvgId: string; //id of svg in parent
	mainSvg: d3.Selection<BaseType, unknown, HTMLElement, any>; //svg element
	svgWidth: number; //width of plot
	svgHeight: number; //height of plot
	padding: number; //horizontal padding
	maxAxisLength: number; //maximum number of ticks on one axis
	tickGap: number; //gap between each tick
	axisGap: number; //vertical gap between split axes
	stackGap: number; // vertical gap between lines
	axes: any;
	indexStack: Array<IndexStack>;
	colorScale:(bioFunction : string) => string;

	constructor(
		proteins: Array<Protein>,
		peptides: Array<Peptide>,
		mainSvgId: string,
		width = 1600,
		height = 1500
	) {
		this.proteins = proteins;
		this.peptides = peptides;
		this.mainSvgId = mainSvgId;
		this.svgWidth = width;
		this.svgHeight = height;
		this.tickGap = 20;
		this.padding = 1 * this.tickGap; //multiple of tickGap
		this.axisGap = 500;
		this.stackGap = 5;
		this.maxAxisLength = Math.ceil(
			(this.svgWidth - 2 * this.padding) / this.tickGap
		);
		this.mainSvg = d3
			.select(this.mainSvgId)
			.attr("width", this.svgWidth)
			.attr("height", this.svgHeight);
		this.axes = [];
		this.indexStack = [];
		this.colorScale = this.buildColorScale(peptides);
	}

	clearVis() {
		this.mainSvg.selectAll("*").remove();
	}

	/**
	 * Builds axes out of amino acid sequence of the given protein
	 * @param protein Entry name of the protein
	 */
	buildSplitAxes(protein: string) {
		let sequenceString = this.getSequence(protein);
		let sequenceIndices = this.getSequenceIndices(sequenceString);
		let stringifiedIndices = sequenceIndices.map((n) => "" + n); //converts [0,1,2,3,...] => ["0", "1", "2", "3", ...] to use with d3.scalePoint()
		let number_of_axes = Math.ceil(
			sequenceString.length / this.maxAxisLength
		);
		if (stringifiedIndices.length > 1) {
			this.indexStack = stringifiedIndices.map((s,i) => {
				return {
					freeStackPos: 0,
					maxLength: stringifiedIndices.length - i
				};
			});

			Array.from(Array(number_of_axes).keys()).forEach((i) => {
				let axisDomain = stringifiedIndices.slice(
					i * this.maxAxisLength,
					(i + 1) * this.maxAxisLength
				);
				let pointScale = d3
					.scalePoint()
					.domain(axisDomain)
					.range([0, axisDomain.length * this.tickGap]);
				let seqAxis = d3.axisBottom(pointScale).tickFormat((d, t) => {
					return sequenceString[parseInt(d)];
				});
				this.mainSvg
					.append("g")
					.style("font", "14px courier")
					.call(seqAxis)
					.attr(
						"transform",
						`translate(${this.padding},${i * this.axisGap})`
					);
				this.axes.push({
					axis: seqAxis,
					pointScale: pointScale,
					protein: protein,
					startIndex: i * this.maxAxisLength,
					length: seqAxis.length,
				});
			});
		}
	}

	getSequence(protein: string) {
		let prot = this.proteins.find((p: Protein) => {
			return p.Entry === protein;
		});
		return prot?.Sequence || "";
	}

	getSequenceIndices(sequenceString: string) {
		return Array.from(Array(sequenceString.length).keys()); //convert "ASOFUBNQOUFBEGQEOGBU..." => [0,1,2,3,4,5,6,7, ...]
	}

	comparePeptideIndex(peptideA: Peptide, peptideB: Peptide) {
		let startA = peptideA.seqIndex[0];
		let startB = peptideB.seqIndex[0];
		let out = -1;
		if (startA < startB) {
			if (peptideA.peptide.length > peptideB.peptide.length) {
				out = -1;
			} else out = 1;
		} else if (startA === startB) {
			if (peptideA.peptide.length > peptideB.peptide.length) {
				out = -1;
			} else out = 0;
		} else out = 1;
		return out;
	}

	findPeptides(protein: string) {
		return this.peptides.filter((p) => {
			return p.proteinID === protein;
		});
	}

	findSeqIndex(peptide: Peptide) {
		let sequenceString = this.getSequence(peptide.proteinID);
		return sequenceString.search(peptide.peptide);
	}

	getSequencedPeptides(peptides: Peptide[]) {
		return peptides.map((p) => {
			let index = this.findSeqIndex(p);
			p.seqIndex = [index, index + p.peptide.length];
			return p;
		});
	}

	isValidIndex(peptide: Peptide) {
		return peptide.seqIndex[0] !== -1;
	}

	getSortedPeptides(sequencedPeptides: Peptide[]) {
		let sortedPeptides = sequencedPeptides.sort((pA, pB) => {
			return this.comparePeptideIndex(pA, pB);
		});
		return sortedPeptides;
	}

	getSuffixLine(line: PeptideLine, excessLength: number, axisNum: number) {
		let suffixSeq = line.peptideSeq.slice(
			line.length - excessLength,
			line.length
		);
		let suffixLine = new PeptideLine(
			line.proteinSeq,
			suffixSeq,
			line.startIndex + line.length - excessLength,
			axisNum + 1,
			this.colorScale(line.bioFunction),
			line.bioFunction
		);
		suffixLine.setSplit(0);
		return suffixLine;
	}

	getStartAxisNumber(startIndex: number) {
		return Math.floor(startIndex / this.maxAxisLength);
	}

	getProcessedLines(lines: PeptideLine[]) {
		let splitLines = new Array<PeptideLine>();
		lines = lines.reduce((acc, line) => {
			let axisNumber = this.getStartAxisNumber(line.startIndex);
			line.startAxisNumber = axisNumber;
			if (line.startIndex > -1) {
				//check if line should be split
				splitLines = splitLines.concat(this.getSplitLines(line, axisNumber));
				//prepare for render
				this.stageLineForRender(line);
				acc.push(line);
			}
			return acc;
		}, new Array<PeptideLine>());
		splitLines.forEach((l) => this.stageLineForRender(l));
		return lines.concat(splitLines);
	}

	//Checks if line needs to split, and returns the suffix line in a list
	getSplitLines(line:PeptideLine, axisNumber: number) {
		let splitLines = new Array<PeptideLine>();
		if (!line.isSplit) {
			let excessLength =
				line.length +
				(line.startIndex % this.maxAxisLength) -
				this.maxAxisLength;
			if (excessLength > 0) {
				splitLines.push(
					this.getSuffixLine(line, excessLength, axisNumber)
				);
				this.splitLine(line, excessLength);
			}
		}
		return splitLines;
	}

	splitLine(line:PeptideLine, excessLength:number) {
		line.setSplit(line.length - excessLength);
		line.peptideSeq = line.peptideSeq.slice(
			0,
			line.length - excessLength
		);
		line.length = line.length - excessLength;
	}

	incrementStack(line: PeptideLine) {
		let s = line.startIndex;
		if (s > -1) {
			for (let i = s; i < s + line.length; i++) {
				this.indexStack[i].freeStackPos++;
			}
		}
	}

	getFreeStackPos(line: PeptideLine) {
		let s = line.startIndex;
		let indexes = this.indexStack.slice(s, s+ line.length).map( i => i.freeStackPos);
		return min(indexes) || 0;
	}

	stageLineForRender(line: PeptideLine) {
			let axis = this.axes[line.startAxisNumber];
			line.x1 = this.padding + axis.pointScale("" + line.startIndex);
			line.x2 =
				this.padding +
				axis.pointScale("" + (line.startIndex + line.length - 1));
			let axisOffset = line.startIndex % this.maxAxisLength;
			let stackPos = this.getFreeStackPos(line);
			line.y =
				line.startAxisNumber * this.axisGap +
				stackPos * (line.thickness + this.stackGap) +
				30;
			line.axisOffset = axisOffset;
			line.stackPosition = stackPos;
			this.incrementStack(line);
	}

	buildColorScale(peptides:Peptide[]) {
		let uniqueFunctions = this.getUniqueBioFunctions(peptides);
		return function(bioFunction:string) {
			return d3.schemeTableau10[uniqueFunctions.indexOf(bioFunction) % 10]
		}
	}

	getUniqueBioFunctions(peptides:Peptide[]) {
		let functions = peptides.map(p=>p.function);
		return Array.from(new Set(functions));
	}

	findProteinById(protein:string) {
		return this.proteins.find(p=> p.Entry === protein);
	}

	stackPeptides(proteinId: string) {
		//get protein sequence
		let protSeq = this.getSequence(proteinId);

		//find peptides
		let peptides = this.findPeptides(proteinId);

		//find peptides' start and end indexes on the protein chain
		peptides = this.getSequencedPeptides(peptides);

		//sort peptides
		peptides = this.getSortedPeptides(peptides);


		//make PeptideLine for each peptide
		let lines = peptides.map((p) => {
			let axisNumber = this.getStartAxisNumber(p.seqIndex[0]);
			return new PeptideLine(
				protSeq,
				p.peptide,
				p.seqIndex[0],
				axisNumber,
				this.colorScale(p.function),
				p.function
			);
		});

		//process the lines for splits
		lines = this.getProcessedLines(lines);

		//stack lines
		this.mainSvg
			.append("g")
			.selectAll("line")
			.data(lines)
			.join("line")
			.attr("x1", (d) => d.x1)
			.attr("x2", (d) => d.x2)
			.attr("y1", (d) => d.y)
			.attr("y2", (d) => d.y)
			.attr("stroke", (d) => d.stroke)
			.attr("stroke-width", (d) => d.thickness);
		// lines.forEach((line) => {
		// 	this.stackPeptide(line);
		// 	this.incrementStack(line);
		// });
	}
}
