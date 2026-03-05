export interface ArmDefinition<TInput, TResult> {
  name: string;
  description: string;
  execute: (input: TInput) => Promise<TResult>;
}

export type ArmRegistry = Record<string, ArmDefinition<any, any>>;
