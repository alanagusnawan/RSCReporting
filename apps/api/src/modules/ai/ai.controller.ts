import { Controller, Post, Body, Get } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("api/v1/ai")
export class AiController {
  constructor(private aiService: AiService) {}

  @Get("status")
  getStatus() {
    return {
      available: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    };
  }

  @Post("generate-component")
  async generateComponent(@Body() body: { prompt: string; dataSource?: any }) {
    return await this.aiService.generateComponent(body.prompt || "", body.dataSource);
  }

  @Post("formula-helper")
  async generateFormula(@Body() body: { prompt: string }) {
    return await this.aiService.generateFormula(body.prompt || "");
  }

  @Post("chat")
  async chat(@Body() body: { message: string; history?: any[] }) {
    const reply = await this.aiService.chat(
      body.message || "",
      body.history || [],
    );
    return { reply };
  }
}
