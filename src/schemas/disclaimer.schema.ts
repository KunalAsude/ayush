import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'disclaimers' })
export class Disclaimer extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  text: string;
}

export const DisclaimerSchema =
  SchemaFactory.createForClass(Disclaimer);
