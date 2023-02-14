
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