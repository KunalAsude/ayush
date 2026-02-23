import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SymptomAlias } from 'src/schemas/symptom-alias.schema';
import { Model } from 'mongoose';

@Injectable()
export class NormalizationService {
  constructor(
    @InjectModel(SymptomAlias.name)
    private aliasmodel: Model<SymptomAlias>,
  ) {}

  async normalizeText(text: string): Promise<string[]> {
    const aliases = await this.aliasmodel.find().lean();

    const normalizedSymptoms = new Set<string>();
    
    for ( const alias of aliases){
        if (text.toLowerCase().includes(alias.input.toLowerCase())){
            normalizedSymptoms.add(alias.normalized)
        }
    }
    return Array.from(normalizedSymptoms);
  }
}
