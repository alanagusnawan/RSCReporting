import { Injectable, Logger, BadRequestException } from "@nestjs/common";

@Injectable()
export class AiService {
  private logger = new Logger(AiService.name);
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    if (!this.apiKey) {
      this.logger.warn(
        "GEMINI_API_KEY is not defined in environment variables.",
      );
    } else {
      this.logger.log(`Gemini AI service ready with model: ${this.model}`);
    }
  }

  async callGemini(
    prompt: string,
    systemInstruction?: string,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new BadRequestException(
        "GEMINI_API_KEY is not set in environment.",
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Gemini API error (${response.status}): ${errText}`);
        throw new BadRequestException(
          `Gemini API error: ${response.statusText}`,
        );
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text;
    } catch (err: any) {
      this.logger.error(`Failed to call Gemini: ${err.message}`);
      throw err;
    }
  }

  async generateComponent(
    prompt: string,
    dataSourceContext?: any,
  ): Promise<any> {
    const dsDescription = dataSourceContext
      ? `\nActive Data Source Schema:\n${JSON.stringify(dataSourceContext, null, 2)}\nMake sure to automatically bind chart, gauge, table, and text components to the actual fields present in this schema (e.g. dataConfig.dataPath, dataConfig.categoryField, dataConfig.valueField, and formula expressions =Fields.field).`
      : "";

    const system = `You are an expert Telerik and Kendo UI Report Architect.
Given a user requirement and active data source, return ONLY valid JSON representing complete components to place on canvas with automatic data source binding.
Available components: DataGrid, BarChart, PieChart, LineChart, DonutChart, AreaChart, CircularGauge, ArcGauge, LinearGauge, TextBox, Card, Badge, Barcode, QrCode.
${dsDescription}

JSON output structure:
{
  "components": [
    {
      "id": "c_ai_1",
      "type": "DataGrid" | "BarChart" | "PieChart" | "CircularGauge" | "TextBox",
      "name": string,
      "section": "ReportHeader" | "Detail" | "PageFooter",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "value": string,
      "category": string,
      "style": { "fontSize": 10, "fontWeight": "normal", "color": "#0f172a" },
      "dataConfig": {
        "mode": "dataSource",
        "dataPath": "items",
        "categoryField": "name",
        "valueField": "price",
        "min": 0,
        "max": 100,
        "target": 80,
        "unit": "%",
        "valueExpression": "=Sum(Fields.price)",
        "columns": [
          { "id": "col1", "title": "Product", "field": "name", "width": 180 },
          { "id": "col2", "title": "Qty", "field": "quantity", "width": 60 },
          { "id": "col3", "title": "Total", "field": "=Fields.quantity * Fields.price", "width": 120 }
        ]
      }
    }
  ],
  "explanation": "Brief description of what was designed and bound"
}
Output NO MARKDOWN TICKS, ONLY RAW VALID JSON.`;

    const raw = await this.callGemini(prompt, system);
    try {
      const clean = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(clean);
    } catch {
      return {
        components: [
          {
            id: `c_ai_${Date.now()}`,
            type: "TextBox",
            name: "AiGenerated",
            section: "Detail",
            x: 24,
            y: 80,
            width: 320,
            height: 40,
            value: raw.slice(0, 100),
          },
        ],
        explanation: "Generated from AI prompt",
      };
    }
  }

  async generateFormula(
    prompt: string,
  ): Promise<{ formula: string; explanation: string }> {
    const system = `You are an Expression Language Expert for Telerik Reporting.
Expressions start with '='.
Available functions: Sum(Fields.x), Count(Fields.x), Avg(Fields.x), Min(Fields.x), Max(Fields.x), IIf(cond, trueVal, falseVal), Upper(x), Lower(x), Concat(a,b), FormatCurrency(val, "id-ID", "IDR"), FormatNumber(val, decimals), FormatDate(d, "id-ID").
Examples:
- "hitung subtotal dengan diskon 10%": "=Fields.price * Fields.quantity * 0.9"
- "jika amount diatas 1 juta tandai prioritas tinggi": "=IIf(Fields.amount > 1000000, 'High Priority', 'Normal')"
Return ONLY valid JSON:
{ "formula": "=...", "explanation": "..." }
NO MARKDOWN TICKS, ONLY RAW JSON.`;

    const raw = await this.callGemini(prompt, system);
    try {
      const clean = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(clean);
    } catch {
      return { formula: `=${prompt}`, explanation: "Expression converted" };
    }
  }

  async chat(
    message: string,
    history: Array<{ role: "user" | "model"; text: string }> = [],
  ): Promise<string> {
    const system = `You are the AI Assistant for the RSC Enterprise Reporting Studio (Telerik & Takumi PDF engine).
Provide concise, professional advice on designing reports, structuring datasets, binding fields, configuring charts/gauges/grids, and layout optimization.
Respond in Indonesian if user asks in Indonesian, or English if user asks in English.`;

    return await this.callGemini(message, system);
  }
}
