import * as d3 from "d3";
import { BaseType } from "d3";
import { PeptideLine } from "./PeptideLine";
import { Protein, Peptide } from "../common/types";
import { Swatches } from "./Swatches";

type PeptideStack = {
	peptideLines: PeptideLine[];
};

type Axis = {
	axis: d3.Axis<string>;
	pointScale: d3.ScalePoint<string>;
	axisNode: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	height: number;
};

const importantFunctions = [
	"ACE-inhibitory",
	"Antimicrobial",
	"Antioxidant",
	"DPP-IV Inhibitor",
	"Opioid",
	"immunomodulatory",
	"Anticancer",
	"Others",
];
const customColorScheme = [
	"#CC6677",
	"#DDCC77",
	"#117733",
	"#88CCEE",
	"#999933",
	"#44AA99",
	"#AA4499",
	"#DDDDDD",
];

const arrowPathD = `M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z`;

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
	axisThickness: number; //vertical thickness of an axis. Default = 30
	stackGap: number; // vertical gap between lines
	matureProteinStart: number; //offset on the protein sequence, where the mature protein starts. Default = 15
	axes: Array<Axis>;
	indexStack: Array<PeptideStack>;
	colorScale: d3.ScaleOrdinal<string, unknown, never>;
	guideMarkGap: number; // number of ticks between guide marks

	constructor(
		proteins: Array<Protein>,
		peptides: Array<Peptide>,
		mainSvgId: string,
		width = window.innerWidth * 0.8,
		height = 1500,
		matureProteinStart = 15
	) {
		this.proteins = proteins;
		this.peptides = peptides;
		this.mainSvgId = mainSvgId;
		this.svgWidth = width;
		this.svgHeight = height;
		this.tickGap = 20;
		this.padding = 3 * this.tickGap; //multiple of tickGap
		this.axisGap = 500;
		this.axisThickness = 30;
		this.stackGap = 1;
		this.maxAxisLength = Math.ceil(
			(this.svgWidth - 2 * this.padding) / this.tickGap
		);
		this.mainSvg = d3
			.select(this.mainSvgId)
			.attr("width", this.svgWidth)
			.attr("height", this.svgHeight);
		this.axes = [];
		this.indexStack = [];
		this.colorScale = this.buildColorScale();
		this.matureProteinStart = matureProteinStart;
		this.guideMarkGap = 5;
	}

	clearVis() {
		this.mainSvg.selectAll("*").remove();
	}

	getProteinById(protein: string) {
		return this.proteins.find((p) => p.Entry === protein);
	}

	getPeptides(protein: string) {
		return this.peptides.filter((p) => {
			return p.proteinID === protein;
		});
	}

	getSequence(protein: string) {
		let prot = this.proteins.find((p: Protein) => {
			return p.Entry === protein;
		});
		return prot?.Sequence.slice(this.matureProteinStart) || "";
	}

	//convert "ASOFUBNQOUFBEGQEOGBU..." => [0,1,2,3,4,5,6,7, ...]
	getSequenceIndices(sequenceString: string) {
		return Array.from(Array(sequenceString.length).keys());
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

	getStartAxisNumber(startIndex: number) {
		return Math.floor(startIndex / this.maxAxisLength);
	}

	getUniqueBioFunctions(peptides: Peptide[]) {
		let functions = peptides.map((p) => p.function);
		return Array.from(new Set(functions));
	}

	getLineStroke(peptide: Peptide) {
		let isImportantFunction = importantFunctions.indexOf(peptide.function);
		let stroke = customColorScheme[7];
		if (isImportantFunction > -1) {
			stroke = this.colorScale(peptide.function) as string;
		}
		return stroke;
	}

	//Checks if line needs to split, and returns the suffix line in a list
	getSplitLines(line: PeptideLine, axisNumber: number) {
		let splitLines = new Array<PeptideLine>();
		let excessLength =
			line.length +
			(line.startIndex % this.maxAxisLength) -
			this.maxAxisLength -
			1;
		if (excessLength > 0) {
			let suffixLine = this.getSuffixLine(line, excessLength, axisNumber);
			
			this.getSplitLines(suffixLine, axisNumber + 1)
			splitLines.push(suffixLine);
			this.splitLine(line, excessLength);
		}
		line.splitLines = splitLines;
		return splitLines;
	}

	getSuffixLine(line: PeptideLine, excessLength: number, axisNum: number) {
		let suffixSeq = line.peptideSeq.slice(
			line.length - excessLength - 1,
			line.length
		);
		let suffixLine = new PeptideLine(
			line.proteinSeq,
			line.proteinId,
			suffixSeq,
			line.startIndex + line.length - excessLength - 1,
			axisNum + 1,
			line.stroke,
			line.bioFunction
		);
		suffixLine.setPrefixSplit(0);
		return suffixLine;
	}

	getProcessedLines(lines: PeptideLine[]) {
		let processedLines = new Array<PeptideLine>();
		let splitLines = new Array<PeptideLine>();
		lines = lines.reduce((acc, line, index) => {
			let axisNumber = this.getStartAxisNumber(line.startIndex);
			line.startAxisNumber = axisNumber;
			if (line.startIndex > -1) {
				//check if line should be split
				splitLines = splitLines.concat(
					this.getSplitLines(line, axisNumber)
				);
				acc.push(line);
			}
			return acc;
		}, processedLines);
		processedLines = processedLines.concat(splitLines);
		return processedLines;
	}

	getPeptidesStartingWith(
		sequencedPeptides: PeptideLine[],
		startIndex: number
	) {
		let peptides = sequencedPeptides.filter(
			(p) => p.startIndex === startIndex
		);
		peptides = peptides.sort((pA, pB) => pA.length - pB.length);
		return peptides;
	}

	buildPeptideStack(sequencedPeptides: PeptideLine[], proteinID: string) {
		let proteinSequence = this.getSequence(proteinID) || "";
		Array.from(proteinSequence).forEach((s, i) => {
			this.indexStack.push({
				peptideLines: this.getPeptidesStartingWith(
					sequencedPeptides,
					i
				),
			});
		});
	}

	getLineWithStackPos(
		lines: PeptideLine[],
		stackPos: number,
		startIndex: number
	) {
		return lines.find((l) => {
			return (
				l.stackPosition === stackPos &&
				l.startIndex === startIndex &&
				l.prefixSplit === 0
			);
		});
	}

	updateStackPos(lines: PeptideLine[], proteinID: string) {
		let stackPos = 0;
		let stacked = 0;
		let cumulativeStartIndex = 0;
		let proteinSeq = this.getSequence(proteinID);
		while (stacked < lines.length) {
			let startIndex = cumulativeStartIndex % proteinSeq!.length;
			let indexLines = this.indexStack[startIndex].peptideLines;
			//for each startIndex, check if there exists a splitLine with same stackPosition.
			//if yes, increment startIndex by the length of splitLine
			let existingLine = this.getLineWithStackPos(
				indexLines,
				stackPos,
				startIndex
			);
			let indexIncrement = 1;
			if (existingLine === undefined) {
				let line = indexLines.pop();
				if (!line) {
					cumulativeStartIndex++;
					stackPos = Math.floor(
						cumulativeStartIndex / proteinSeq!.length
					);
					continue;
				}
				if (line.stackPosition === -1) {
					line.stackPosition = stackPos;
				}
				// eslint-disable-next-line no-loop-func
				line.splitLines.forEach((l) => {
					l.stackPosition = stackPos;
				});
				indexIncrement = line!.length - 1;
				stacked++;
			} else {
				indexIncrement = existingLine.length - 1;
			}
			cumulativeStartIndex += indexIncrement;
			stackPos = Math.floor(cumulativeStartIndex / proteinSeq!.length);
		}
	}

	splitLine(line: PeptideLine, excessLength: number) {
		line.setSuffixSplit(line.length - excessLength);
		line.peptideSeq = line.peptideSeq.slice(
			0,
			line.length - excessLength - 1
		);
		line.length = line.length - excessLength;
	}

	isEdgeLine(line: PeptideLine, axisLength: number) {
		if (line.length + line.axisOffset >= axisLength) {
			return true;
		} else return false;
	}

	stageLineForRender(line: PeptideLine) {
		let axis = this.axes[line.startAxisNumber];
		let axisOffset = line.startIndex % this.maxAxisLength;
		line.axisOffset = axisOffset;
		let scale = axis.pointScale;
		let isEdgeLine = this.isEdgeLine(line, scale.domain().length);
		line.x1 = this.padding + scale("" + line.startIndex)!;
		line.x2 =
			this.padding +
			scale(
				"" + (line.startIndex + (line.length - (isEdgeLine ? 2 : 1)))
			)!;
		if (isEdgeLine) {
			line.x2 += this.tickGap;
		}
		line.y =
			axis.height +
			line.stackPosition * (line.thickness + this.stackGap) +
			this.axisThickness;
	}

	buildColorScale() {
		let scale = d3
			.scaleOrdinal()
			.domain(importantFunctions)
			.range(customColorScheme);
		return scale;
	}

	/**
	 * Builds axes out of amino acid sequence of the given protein
	 * @param protein Entry name of the protein
	 */
	renderSplitAxes(protein: string) {
		let sequenceString = this.getSequence(protein);
		let sequenceIndices = this.getSequenceIndices(sequenceString);
		let stringifiedIndices = sequenceIndices.map((n) => "" + n); //converts [0,1,2,3,...] => ["0", "1", "2", "3", ...] to use with d3.scalePoint()
		let number_of_axes = Math.ceil(
			sequenceString.length / this.maxAxisLength
		);
		if (stringifiedIndices.length > 1) {
			Array.from(Array(number_of_axes).keys()).forEach((i, index) => {
				let axisDomain = stringifiedIndices
					.slice(i * this.maxAxisLength, (i + 1) * this.maxAxisLength)
					.concat(["dummy"]);
				let tickScale = d3
					.scalePoint()
					.domain(axisDomain)
					.range([0, axisDomain.length * this.tickGap]);
				let tickAxis = d3.axisBottom(tickScale).tickFormat((d, t) => {
					return "";
				});

				let labelScale = d3
					.scalePoint()
					.domain(axisDomain.slice(0, -1))
					.range([0, (axisDomain.length - 1) * this.tickGap]);

				let labelAxis = d3
					.axisBottom(labelScale)
					.tickFormat((d, t) => {
						return sequenceString[parseInt(d)];
					})
					.tickSize(0)
					.tickPadding(10);

				let axisGroup = this.mainSvg.append("g");
				axisGroup
					.style("font", "14px courier")
					.call(tickAxis)
					.attr(
						"transform",
						`translate(${this.padding},${i * this.axisGap})`
					);
				axisGroup
					.append("g")
					.style("font", "14px courier")
					.call(labelAxis)
					.attr("transform", `translate(${this.tickGap / 2},0)`);
				this.axes.push({
					axis: tickAxis,
					pointScale: tickScale,
					axisNode: axisGroup,
					height: 0,
				});
			});
		}
	}

	getStackHeight(lines: PeptideLine[], axisNum: number) {
		let axisLines = lines.filter((l) => l.startAxisNumber === axisNum);
		return d3.max(axisLines.map((l) => l.stackPosition));
	}

	getAxisHeight(axisNum: number, lines: PeptideLine[]) {
		let stackHeight = this.getStackHeight(lines, axisNum - 1) || 0;
		return (
			(axisNum > 0 ? 1 : 0) *
				(stackHeight + 5) *
				(lines[0].thickness + this.stackGap) +
			this.axisThickness
		);
	}

	updateHeights(lines: PeptideLine[]) {
		let height = 0;
		if (lines.length) {
			Array(this.axes.length)
				.fill(0)
				.forEach((v, axisNum) => {
					let axis = this.axes[axisNum];
					let axisGap = this.getAxisHeight(axisNum, lines);
					axis.height = height + axisGap;
					axis.axisNode.attr(
						"transform",
						`translate(${this.padding},${axis.height})`
					);
					let axisLines = lines.filter(
						(l) => l.startAxisNumber === axisNum
					);
					axisLines.forEach((l) => this.stageLineForRender(l));
					height += axisGap;
					this.svgHeight = height + axisGap;
				});
			this.mainSvg.attr("height", this.svgHeight);
		}
	}

	renderLines(lines: PeptideLine[]) {
		if (lines.length > 0) {
			let legend = Swatches(this.colorScale);
			let node = document.querySelector("#legend");
			node?.firstChild?.remove();
			node?.appendChild(legend);
		}

		//add groups for wrapping lines and split arrows
		let lineGroups = this.mainSvg
			.append("g")
			.selectAll("g")
			.data(lines)
			.join("g");

		//add lines
		lineGroups
			.attr("transform", (d) => `translate(${d.x1}, ${d.y})`)
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", (d) => d.x2 - d.x1)
			.attr("height", (d) => d.thickness)
			.attr("fill", (d) => d.stroke)
			.attr("stroke-width", "1px")
			.attr("stroke", "rgba(255,255,255,1)");

		//add split arrows
		let prefixArrows = lineGroups.append("path").attr("d", (d) => {
			if (d.prefixSplit > -1) {
				return arrowPathD;
			} else {
				return "";
			}
		});
		let suffixArrows = lineGroups.append("path").attr("d", (d) => {
			if (d.suffixSplit > -1) {
				return arrowPathD;
			} else {
				return "";
			}
		});
		//move & flip arrows according to split location
		
		prefixArrows.attr(
			"transform",
			(d) =>
				`translate(0,0),
					scale(-1,1)`
		);
		suffixArrows.attr(
			"transform",
			(d) =>
				`translate(${d.x2 - d.x1},0),
					scale(1,1)`
		);
	}

	renderAxisGuideMarks() {
		let guideMarks = this.mainSvg.append("g").attr("class", "guidemarks");
		this.axes.forEach((axis, index) => {
			let lineExtent =
				index < this.axes.length - 1
					? this.axes[index + 1].height
					: this.mainSvg.attr("height");
			let scale = axis.pointScale;
			let domain = scale.domain();
			domain.forEach((value, index) => {
				if (index % this.guideMarkGap === 0) {
					let x = (scale(value) || 0) + this.padding;
					let y1 = axis.height;
					let y2 = lineExtent;
					guideMarks
						.append("line")
						.attr("x1", x)
						.attr("x2", x)
						.attr("y1", y1)
						.attr("y2", y2)
						.attr("stroke", "lightgray")
						.attr("stroke-dasharray", "4 1");
				}
			});
		});
	}

	renderPeptideLines(proteinId: string) {
		//get protein sequence
		let protSeq = this.getSequence(proteinId);

		//find peptides
		let peptides = this.getPeptides(proteinId);

		//find peptides' start and end indexes on the protein chain
		peptides = this.getSequencedPeptides(peptides);

		//make PeptideLine for each peptide
		let lines = peptides.map((p) => {
			let axisNumber = this.getStartAxisNumber(p.seqIndex[0]);
			return new PeptideLine(
				protSeq,
				proteinId,
				p.peptide,
				p.seqIndex[0],
				axisNumber,
				this.getLineStroke(p),
				p.function
			);
		});

		//process the lines for splits
		lines = this.getProcessedLines(lines);

		this.buildPeptideStack(lines, proteinId);

		this.updateStackPos(lines, proteinId);

		this.updateHeights(lines);

		this.renderLines(lines);

		this.renderAxisGuideMarks();
	}
}
