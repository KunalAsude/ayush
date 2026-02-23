import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyzeController } from './analyze.controller';
import { Rule, RuleSchema } from '../schemas/rule.schema';
import { Condition, ConditionSchema } from '../schemas/condition.schema';
import { Recommendation, RecommendationSchema } from '../schemas/recommendation.schema';
import { Disclaimer, DisclaimerSchema } from '../schemas/disclaimer.schema';
import { SymptomAlias, SymptomAliasSchema } from '../schemas/symptom-alias.schema';
import { NormalizationService } from '../common/normalization.service';
import { AnalyzeService } from './analyze.service';

@Module({
    imports:[
        MongooseModule.forFeature([
            {name:Rule.name,schema:RuleSchema},
            {name:Condition.name,schema:ConditionSchema},
            {name:Disclaimer.name,schema:DisclaimerSchema},
            {name:Recommendation.name,schema:RecommendationSchema},
            {name:SymptomAlias.name,schema:SymptomAliasSchema}
        ]),
    ],
    controllers:[AnalyzeController],
    providers:[AnalyzeService,NormalizationService]
})
export class analyzeModule {}