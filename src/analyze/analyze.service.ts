import { InjectModel } from "@nestjs/mongoose"
import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { NormalizationService } from "src/common/normalization.service"
import { Rule } from "src/schemas/rule.schema"
import { Model } from "mongoose"
import { Recommendation } from "src/schemas/recommendation.schema"
import { Condition } from "src/schemas/condition.schema"
import { Disclaimer } from "src/schemas/disclaimer.schema"

export class AnalyzeService {
    private readonly logger = new Logger(AnalyzeService.name);
    private readonly ayushRecommendationThreshold = Number(
        process.env.AYUSH_RECOMMENDATION_THRESHOLD ?? 0.45,
    );

    private readonly generalLifestyleSuggestion = {
        diet: {
            recommended: [
                'balanced whole-food meals',
                'adequate hydration',
                'high-fiber vegetables and fruits',
            ],
            avoid: [
                'excess sugar',
                'ultra-processed food',
                'late-night heavy meals',
            ],
        },
        lifestyle: [
            '30 minutes of daily physical activity',
            '7-8 hours of regular sleep',
            'stress management through breathing or meditation',
        ],
        yoga_practices: ['walking', 'gentle stretching', 'anuloma viloma'],
    };

    constructor(
        private normalizationService:NormalizationService,

        @InjectModel(Condition.name)
        private conditionModel : Model<Condition>,

        @InjectModel(Rule.name)
        private ruleModel:Model<Rule>,

        @InjectModel(Disclaimer.name)
        private disclamierModel : Model<Disclaimer>,

        @InjectModel(Recommendation.name)
        private recommendationModel :Model<Recommendation>,

    ){}

    private getSeverityLabel(score: number): 'low' | 'moderate' | 'high' {
        if (score >= 0.75) return 'high';
        if (score >= this.ayushRecommendationThreshold) return 'moderate';
        return 'low';
    }

    async analyze(text:string){
        this.logger.debug(`Normalizing input text: "${text}"`);
        const normalizedSymptoms = await this.normalizationService.normalizeText(text);
        this.logger.debug(`Normalized symptoms: [${normalizedSymptoms.join(', ')}]`);

        if(!normalizedSymptoms.length){
            this.logger.warn(`No recognizable symptoms found in text: "${text}"`);
            throw new NotFoundException('No recognizable symptoms found');
        }

        const rules = await this.ruleModel.find().lean();
        this.logger.debug(`Loaded ${rules.length} rules from DB`);

        const matchedRules = rules
            .map(rule => {
                const matchCount = rule.if_symptoms.filter(symptom =>
                    normalizedSymptoms.includes(symptom),
                ).length;
                const symptomCoverage = matchCount / rule.if_symptoms.length;
                const baseConfidence = typeof rule.confidence === 'number' ? rule.confidence : 0;
                const finalScore = (symptomCoverage * 0.7) + (baseConfidence * 0.3);
                return { ...rule, matchCount, symptomCoverage, finalScore };
            })
            .filter(rule => rule.matchCount > 0)
            .sort((a, b) => b.finalScore - a.finalScore);

        this.logger.debug(`Matched ${matchedRules.length} rule(s) out of ${rules.length}`);

        if(!matchedRules.length){
            this.logger.warn(`No rules matched for symptoms: [${normalizedSymptoms.join(', ')}]`);
            throw new NotFoundException('No matching condition found')
        }

        const topRule = matchedRules[0];
        this.logger.log(
            `Top rule: condition_id=${topRule.then_condition_id}, matched=${topRule.matchCount}/${topRule.if_symptoms.length}, final_score=${topRule.finalScore.toFixed(2)}`,
        );

        const condition = await this.conditionModel.findById(
            topRule.then_condition_id,
        );

        if (!condition) {
            this.logger.error(`Condition not found for id: ${topRule.then_condition_id}`);
            throw new NotFoundException('Condition not found');
        }

        this.logger.log(`Condition resolved: "${condition.ayurvedic_name}"`);

        const recommendation = await this.recommendationModel.findOne({
            $or: [
                { condition_name: condition.common_name },
                { condition_id: condition._id },
            ],
        });
        if (!recommendation) {
            this.logger.warn(`No recommendation found for condition: ${condition._id}`);
        }

        const severity = this.getSeverityLabel(topRule.finalScore);
        const shouldProvideAyushRecommendation =
            topRule.finalScore >= this.ayushRecommendationThreshold;

        if (!shouldProvideAyushRecommendation) {
            this.logger.warn(
                `Score ${topRule.finalScore.toFixed(2)} below threshold ${this.ayushRecommendationThreshold.toFixed(2)}. Returning general lifestyle guidance.`,
            );
        }

        const disclaimer = await this.disclamierModel.findOne({
            type:'general',
        });

        return {
            matched_Condition:{
                id:condition._id,
                name:condition.ayurvedic_name,
                dosha:topRule.then_dosha,
                severity,
            },
            identified_symptoms:normalizedSymptoms,
            recommendation_type: shouldProvideAyushRecommendation ? 'ayush' : 'general',
            wellness_recommendation:
                shouldProvideAyushRecommendation && recommendation
                    ? recommendation
                    : this.generalLifestyleSuggestion,
            disclaimer:disclaimer?.text
        };
    }
}

