import * as d3 from "d3";
import { BaseType } from "d3";

type Protein = {
	Entry: string;
	Sequence: string;
};

type Peptide = {
	entry: string;
	sequence: string;
	proteinID: string;
	peptide: string;
	category: string;
	function: string;
	secondary_function: string;
};

export default class PeptideStackVis {
	proteins: Array<Protein>;		
	peptides: Array<Peptide>;										//Datasets
	mainSvgId: string;												//id of svg in parent
	mainSvg: d3.Selection<BaseType, unknown, HTMLElement, any>;		//svg element
	svgWidth: number;												//width of plot
	svgHeight: number;												//height of plot
	padding: number;												//horizontal padding
	tickLimit: number;												//maximum number of ticks on one axis
	tickGap: number;												//gap between each tick
	axisGap: number													//vertical gap between split axes

	constructor(
		proteins: Array<Protein>,
		peptides: Array<Peptide>,
		mainSvgId: string,
		width = 1000,
			height = 2000
	) {
		this.proteins = proteins;
		this.peptides = peptides;
		this.mainSvgId = mainSvgId;
		this.svgWidth = width;
		this.svgHeight = height;
		this.tickGap = 20;
		this.padding = 100;
		this.axisGap = 300;
		this.tickLimit = Math.ceil(this.svgWidth / this.tickGap);
		this.mainSvg = d3
			.select(this.mainSvgId)
			.attr("width", this.svgWidth)
			.attr("height", this.svgHeight);
	}

	/**
	 * Builds axes out of amino acid sequence of the given protein
	 * @param protein Entry name of the protein
	 */
	buildSplitAxes(protein: string) {
		let prot = this.proteins.find((p: Protein) => {
			return p.Entry === protein;
		});
		let sequenceString = prot?.Sequence || "";
		let sequenceIndices = Array.from(Array(sequenceString.length).keys());	//convert "ASOFUBNQOUFBEGQEOGBU..." => [0,1,2,3,4,5,6,7, ...]
		let stringifiedIndices = sequenceIndices.map((n) => "" + n);			//converts [0,1,2,3,...] => ["0", "1", "2", "3", ...] to use with d3.scalePoint()
		let number_of_axes = Math.ceil(sequenceString.length / this.tickLimit); 
		let axes = [];
		if (stringifiedIndices.length > 1) {
			Array.from(Array(number_of_axes).keys()).forEach((i) => {
				let axisDomain = stringifiedIndices.slice(
					i * this.tickLimit,
					(i + 1) * this.tickLimit
				);
				let isFullWidth = axisDomain.length === this.tickLimit;			//does the axis span the full plot's width?
				let seqScale = d3
					.scalePoint()
					.domain(axisDomain)
					.range([this.padding, axisDomain.length * this.tickGap - (isFullWidth ? this.padding : 0)]);		//add padding only if axis is full width
				let seqAxis = d3.axisBottom(seqScale).tickFormat((d, t) => {
					return sequenceString[parseInt(d)];
				});
				this.mainSvg
					.append("g")
					.call(seqAxis)
					.attr("transform", `translate(0,${i * this.axisGap})`);	
				axes.push(seqAxis);
			});
		}
	}
}
