import * as d3 from "d3";

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
	mainSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;

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
		this.mainSvg = d3
			.select(this.mainContainerId)
			.append("svg")
			.attr("width", width)
			.attr("height", height);
	}

	buildAxis(protein: string) {
		let prot = this.proteins.find((p: Protein) => {
			return p.Entry === protein;
		});
		let sequenceString = prot?.Sequence || "";
		let sequence = Array.from(sequenceString);

		if (sequence.length > 1) {
			let seqScale = d3.scaleOrdinal().domain(sequence).range([1000,2000]);
			this.mainSvg
				.append("g")
				.call(d3.axisBottom(seqScale));
		}
	}
}
