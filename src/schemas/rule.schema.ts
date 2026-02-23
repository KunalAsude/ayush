import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'rules' })
export class Rule extends Document {
  @Prop({ required: true })
  rule_id: string;

  @Prop({ type: [String], required: true })
  if_symptoms: string[];

  @Prop({ type: Types.ObjectId, ref: 'Condition', required: true })
  then_condition_id: Types.ObjectId;

  @Prop({ type: [String] })
  then_dosha: string[];

  @Prop({ required: true })
  confidence: number;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);
