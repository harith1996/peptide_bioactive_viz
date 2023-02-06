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
	peptides: Array<Peptide>;
	mainContainerId: string;
	mainSvg: d3.Selection<BaseType, unknown, HTMLElement, any>;
	svgWidth: number;
	svgHeight: number;
	tickLimit: number;
	tickSize: number;
	padding: number;
	axisGap: number

	constructor(
		proteins: Array<Protein>,
		peptides: Array<Peptide>,
		mainContainerId: string,
		width = 1000,
		height = 2000
	) {
		this.proteins = proteins;
		this.peptides = peptides;
		this.mainContainerId = mainContainerId;
		this.svgWidth = width;
		this.svgHeight = height;
		this.tickSize = 20;
		this.padding = 100;
		this.axisGap = 300;
		this.tickLimit = Math.ceil(this.svgWidth / this.tickSize);
		this.mainSvg = d3
			.select(this.mainContainerId)
			.attr("width", this.svgWidth)
			.attr("height", this.svgHeight);
	}

	buildAxis(protein: string) {
		let prot = this.proteins.find((p: Protein) => {
			return p.Entry === protein;
		});
		let sequenceString = prot?.Sequence || "";
		let sequenceIndices = Array.from(Array(sequenceString.length).keys());
		let stringifiedIndices = sequenceIndices.map((n) => "" + n);
		let number_of_axes = Math.ceil(sequenceString.length / this.tickLimit);
		let axes = [];

		if (stringifiedIndices.length > 1) {
			Array.from(Array(number_of_axes).keys()).forEach((i) => {
				let axisDomain = stringifiedIndices.slice(
					i * this.tickLimit,
					(i + 1) * this.tickLimit
				);
				let isFullWidth = axisDomain.length === this.tickLimit;
				let seqScale = d3
					.scalePoint()
					.domain(axisDomain)
					.range([this.padding, axisDomain.length * this.tickSize - (isFullWidth ? this.padding : 0)]);
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
