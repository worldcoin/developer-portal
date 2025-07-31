export type MerkleTreeResponse = {
  root: string;
  proof: { Left?: string; Right?: string }[];
};
