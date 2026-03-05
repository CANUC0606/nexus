import { enviarMensagem, RespostaClaude } from '../claude';
import { Mensagem } from '../../store/taskStore';
import { PerfilVivo } from '../../store/userStore';
import { ArmDefinition } from './types';

export interface TaskDecomposerInput {
  mensagem: string;
  perfil: PerfilVivo;
  historico: Mensagem[];
}

export const taskDecomposerArm: ArmDefinition<TaskDecomposerInput, RespostaClaude> = {
  name: 'task_decomposer',
  description: 'Quebra tarefas em micro-etapas usando o motor principal do NEXUS.',
  execute: async ({ mensagem, perfil, historico }) => enviarMensagem(mensagem, perfil, historico),
};
