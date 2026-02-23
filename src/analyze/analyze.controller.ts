import { Controller, Post, Body, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AnalyzeDto } from "./dto/analyze.dto";
import { AnalyzeService } from "./analyze.service";

@ApiTags('Analyze')
@Controller('analyze-symptoms')
export class AnalyzeController {
    private readonly logger = new Logger(AnalyzeController.name);

    constructor(private AnalyzeService: AnalyzeService) { }

    @Post()
    @ApiOperation({ summary: 'Analyze symptoms and suggest AYUSH wellness guidance' })
    @ApiResponse({ status: 200, description: 'Wellness recommendation generated' })
    async analyze(@Body() dto: AnalyzeDto) {
        this.logger.log(`POST /analyze-symptoms - text: "${dto.text}"`);
        const result = await this.AnalyzeService.analyze(dto.text);
        this.logger.log(`Response: matched condition "${result.matched_Condition.name}" (confidence: ${result.matched_Condition.confidence})`);
        return result;
    }
}