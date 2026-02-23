import { ApiProperty } from "@nestjs/swagger";
import { IsString,IsNotEmpty } from "class-validator";

export class AnalyzeDto{
    @ApiProperty({
        example:'I have burning feet and tired all the time',
    })
    @IsNotEmpty()
    @IsString()
    text:string;
}