declare module 'snarkjs' {
  export const groth16: {
    fullProve: (input: any, wasmFilePath: string, zkeyFilePath: string) => Promise<{
      proof: any;
      publicSignals: string[];
    }>;
    verify: (verificationKey: any, publicSignals: any[], proof: any) => Promise<boolean>;
  };
} 