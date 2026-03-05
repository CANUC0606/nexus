import { ocrArm } from './ocrArm';
import { taskDecomposerArm } from './taskDecomposerArm';
import { ArmRegistry } from './types';

const registry: ArmRegistry = {
  [ocrArm.name]: ocrArm,
  [taskDecomposerArm.name]: taskDecomposerArm,
};

export function listarBracos() {
  return Object.values(registry).map((arm) => ({
    name: arm.name,
    description: arm.description,
  }));
}

export async function executarBraco<TInput, TResult>(
  nome: string,
  input: TInput
): Promise<TResult> {
  const arm = registry[nome];
  if (!arm) {
    throw new Error(`Braço não encontrado: ${nome}`);
  }

  return arm.execute(input) as Promise<TResult>;
}
