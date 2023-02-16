import * as d3 from "d3";
import { BaseType } from "d3";
import { PeptideLine } from "./PeptideLine";
import { Protein, Peptide } from "../common/types";
import { Swatches } from "./Swatches";

type PeptideStack = {
	peptideLines: PeptideLine[];
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
const customColorScheme = d3.schemeTableau10
	.slice(0, 7)
	.concat([d3.schemeTableau10[9]]);

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
	indexStack: Array<PeptideStack>;
	colorScale: d3.ScaleOrdinal<string, unknown, never>;
	matureProteinStart: number;

	constructor(
		proteins: Array<Protein>,
		peptides: Array<Peptide>,
		mainSvgId: string,
		width = 1600,
		height = 1500,
		matureProteinStart = 15
	) {
		this.proteins = proteins;
		this.peptides = peptides;
		this.mainSvgId = mainSvgId;
		this.svgWidth = width;
		this.svgHeight = height;
		this.tickGap = 20;
		this.padding = 1 * this.tickGap; //multiple of tickGap
		this.axisGap = 500;
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
		line.splitLines = splitLines;
		return splitLines;
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
			line.stroke,
			line.bioFunction
		);
		suffixLine.setSplit(0);
		suffixLine.splitLines = [line];
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

	stageForRendering(lines: PeptideLine[], proteinID: string) {
		let stackPos = 0;
		let stacked = 0;
		let startIndex = 0;
		let proteinSeq = this.getSequence(proteinID);
		while (stacked < lines.length) {
			let line =
				this.indexStack[
					startIndex % proteinSeq!.length
				].peptideLines.pop();
			if (!line) {
				startIndex++;
				stackPos = Math.floor(startIndex / proteinSeq!.length);
				continue;
			}
			this.stageLineForRender(line!, stackPos);
			startIndex += line!.length;
			stackPos = Math.floor(startIndex / proteinSeq!.length);
			stacked++;
		}
	}

	splitLine(line: PeptideLine, excessLength: number) {
		line.setSplit(line.length - excessLength);
		line.peptideSeq = line.peptideSeq.slice(0, line.length - excessLength);
		line.length = line.length - excessLength;
	}

	stageLineForRender(line: PeptideLine, stackPos: number) {
		let axis = this.axes[line.startAxisNumber];
		line.x1 = this.padding + axis.pointScale("" + line.startIndex);
		line.x2 =
			this.padding +
			axis.pointScale("" + (line.startIndex + line.length - 1));
		let axisOffset = line.startIndex % this.maxAxisLength;
		line.y =
			line.startAxisNumber * this.axisGap +
			stackPos * (line.thickness + this.stackGap) +
			30;
		line.axisOffset = axisOffset;
		line.stackPosition = stackPos;
		line.stackPos = stackPos;
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
				});
			});
		}
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
				p.peptide,
				p.seqIndex[0],
				axisNumber,
				this.getLineStroke(p),
				p.function
			);
		});

		//process the lines for splits
		lines = this.getProcessedLines(lines);

		//sort peptides
		this.buildPeptideStack(lines, proteinId);

		this.stageForRendering(lines, proteinId);

		if (lines.length > 0) {
			let legend = Swatches(this.colorScale);
			let node = document.querySelector("#legend");
			node?.firstChild?.remove();
			node?.appendChild(legend);
		}

		//stack lines
		this.mainSvg
			.append("g")
			.selectAll("rect")
			.data(lines)
			.join("rect")
			.attr("x", (d) => d.x1)
			.attr("width", (d) => d.x2 - d.x1)
			.attr("y", (d) => d.y)
			.attr("height", (d) => d.thickness)
			.attr("fill", (d) => d.stroke)
			.attr("stroke-width", "2px")
			.attr("stroke", "rgba(255,255,255,1)");
	}
}
