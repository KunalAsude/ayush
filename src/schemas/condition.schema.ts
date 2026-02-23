import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'conditions' })
export class Condition extends Document {


  @Prop({ required: true, index: true })
  common_name: string;

  @Prop({ required: true })
  ayurvedic_name: string;

  @Prop({ required: true })
  ayush_system: string;

  @Prop({ type: [String], required: true })
  symptoms: string[];

  @Prop({ type: String })
  dosha_pattern: string;

  @Prop({ type: [String] })
  red_flags: string[];
}
export const ConditionSchema = SchemaFactory.createForClass(Condition);
