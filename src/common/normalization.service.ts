import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SymptomAlias } from 'src/schemas/symptom-alias.schema';
import { Condition } from 'src/schemas/condition.schema';
import { Model } from 'mongoose';

@Injectable()
export class NormalizationService {
  private readonly stopWords = new Set([
    'a',
    'an',
    'the',
    'i',
    'have',
    'has',
    'had',
    'is',
    'am',
    'are',
    'was',
    'were',
    'in',
    'on',
    'at',
    'of',
    'for',
    'to',
    'and',
    'with',
    'all',
    'time',
  ]);

  private readonly builtInAliases: Array<{ input: string; normalized: string }> = [
    { input: 'chest pain', normalized: 'burning sensation in chest and throat' },
    { input: 'chest burn', normalized: 'burning sensation in chest and throat' },
    { input: 'tired', normalized: 'fatigue' },
    { input: 'very tired', normalized: 'fatigue' },
    { input: 'weak', normalized: 'general debility' },
    { input: 'weakness', normalized: 'general debility' },
    { input: 'pee a lot', normalized: 'excessive urination' },
    { input: 'peeing a lot', normalized: 'excessive urination' },
    { input: 'urinating frequently', normalized: 'excessive urination' },
    { input: 'high thirst', normalized: 'increased thirst' },
    { input: 'always thirsty', normalized: 'increased thirst' },
    { input: 'swollen joints', normalized: 'joint swelling' },
    { input: 'joint redness', normalized: 'redness of joints' },
    { input: 'belching', normalized: 'sour eructation' },
    { input: 'bloated stomach', normalized: 'heaviness in abdomen' },
    { input: 'fat belly', normalized: 'fat accumulation in abdomen' },
  ];

  constructor(
    @InjectModel(SymptomAlias.name)
    private aliasmodel: Model<SymptomAlias>,

    @InjectModel(Condition.name)
    private conditionModel: Model<Condition>,
  ) {}

  private normalizePhrase(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(value: string): string[] {
    return this.normalizePhrase(value)
      .split(' ')
      .filter((token) => token && !this.stopWords.has(token));
  }

  private isTokenSubset(aliasInput: string, text: string): boolean {
    const aliasTokens = this.tokenize(aliasInput);
    const textTokenSet = new Set(this.tokenize(text));

    if (!aliasTokens.length || !textTokenSet.size) {
      return false;
    }

    return aliasTokens.every((token) => textTokenSet.has(token));
  }

  private tokenOverlapScore(source: string, textTokens: Set<string>): number {
    const sourceTokens = this.tokenize(source);
    if (!sourceTokens.length || !textTokens.size) {
      return 0;
    }

    const overlap = sourceTokens.filter((token) => textTokens.has(token)).length;
    return overlap / sourceTokens.length;
  }

  async normalizeText(text: string): Promise<string[]> {
    const aliases = await this.aliasmodel.find().lean();
    const conditions = await this.conditionModel
      .find()
      .select({ symptoms: 1, _id: 0 })
      .lean();
    const normalizedText = this.normalizePhrase(text);
    const textTokenSet = new Set(this.tokenize(text));

    const allAliases = [...aliases, ...this.builtInAliases];
    const canonicalSymptoms = new Set<string>();

    for (const alias of allAliases) {
      canonicalSymptoms.add(alias.normalized);
    }

    for (const condition of conditions) {
      for (const symptom of condition.symptoms ?? []) {
        canonicalSymptoms.add(this.normalizePhrase(symptom));
      }
    }

    const variantsBySymptom = new Map<string, Set<string>>();

    for (const symptom of canonicalSymptoms) {
      variantsBySymptom.set(symptom, new Set([symptom]));
    }

    for (const alias of allAliases) {
      const normalizedSymptom = this.normalizePhrase(alias.normalized);
      const aliasInput = this.normalizePhrase(alias.input);
      if (!variantsBySymptom.has(normalizedSymptom)) {
        variantsBySymptom.set(normalizedSymptom, new Set([normalizedSymptom]));
      }
      variantsBySymptom.get(normalizedSymptom)?.add(aliasInput);
    }

    const normalizedSymptoms = new Set<string>();

    for (const [symptom, variants] of variantsBySymptom) {
      let matched = false;

      for (const variant of variants) {
        if (
          normalizedText.includes(variant) ||
          this.isTokenSubset(variant, text)
        ) {
          matched = true;
          break;
        }

        const overlapScore = this.tokenOverlapScore(variant, textTokenSet);
        const variantTokens = this.tokenize(variant);
        if (variantTokens.length >= 2 && overlapScore >= 0.7) {
          matched = true;
          break;
        }
      }

      if (matched) {
        normalizedSymptoms.add(symptom);
      }
    }

    return Array.from(normalizedSymptoms);
  }
}
