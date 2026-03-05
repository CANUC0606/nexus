import { capturarTextoComOCR, OCRSource } from '../ocr';
import { ArmDefinition } from './types';

export interface OCRArmInput {
  source?: OCRSource;
}

export interface OCRArmResult {
  canceled: boolean;
  texto: string;
  imageUri: string | null;
}

export const ocrArm: ArmDefinition<OCRArmInput, OCRArmResult> = {
  name: 'ocr_vision',
  description: 'Ler texto de imagem (camera/galeria) para dar visão ao NEXUS.',
  execute: async ({ source = 'gallery' }) => capturarTextoComOCR(source),
};
