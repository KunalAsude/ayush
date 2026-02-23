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
                const matchScore = matchCount / rule.if_symptoms.length;
                return { ...rule, matchScore };
            })
            .filter(rule => rule.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

        this.logger.debug(`Matched ${matchedRules.length} rule(s) out of ${rules.length}`);

        if(!matchedRules.length){
            this.logger.warn(`No rules matched for symptoms: [${normalizedSymptoms.join(', ')}]`);
            throw new NotFoundException('No matching condition found')
        }

        const topRule = matchedRules[0];
        this.logger.log(`Top rule: condition_id=${topRule.then_condition_id}, confidence_score=${topRule.matchScore.toFixed(2)}`);

        const condition = await this.conditionModel.findById(
            topRule.then_condition_id,
        );

        if (!condition) {
            this.logger.error(`Condition not found for id: ${topRule.then_condition_id}`);
            throw new NotFoundException('Condition not found');
        }

        this.logger.log(`Condition resolved: "${condition.ayurvedic_name}"`);

        const recommendation = await this.recommendationModel.findOne({
            condition_id:condition._id,
        });
        if (!recommendation) {
            this.logger.warn(`No recommendation found for condition: ${condition._id}`);
        }

        const disclaimer = await this.disclamierModel.findOne({
            type:'general',
        });

        return {
            matched_Condition:{
                id:condition._id,
                name:condition.ayurvedic_name,
                dosha:topRule.then_dosha,
                confidence: parseFloat(topRule.matchScore.toFixed(2)),
            },
            identified_symptoms:normalizedSymptoms,
            wellness_recommendation:recommendation,
            disclaimer:disclaimer?.text
        };
    }
}

