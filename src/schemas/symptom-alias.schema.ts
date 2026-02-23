import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'symptom_aliases' })
export class SymptomAlias extends Document {
  @Prop({ required: true })
  input: string;

  @Prop({ required: true })
  normalized: string;
}

export const SymptomAliasSchema =
  SchemaFactory.createForClass(SymptomAlias);
