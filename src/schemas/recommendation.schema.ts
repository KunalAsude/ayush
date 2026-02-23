import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class Diet {
  @Prop({ type: [String], default: [] })
  recommended: string[];

  @Prop({ type: [String], default: [] })
  avoid: string[];
}
export const DietSchema = SchemaFactory.createForClass(Diet);

@Schema({ collection: 'recommendations' })
export class Recommendation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Condition', required: true })
  condition_id: Types.ObjectId;

  @Prop({ type: DietSchema })
  diet: Diet;

  @Prop({type:[String]})
  lifestyle:string[]

  @Prop({type:[String]})
  yoga_practices:string[]
}
export const RecommendationSchema =
  SchemaFactory.createForClass(Recommendation);

