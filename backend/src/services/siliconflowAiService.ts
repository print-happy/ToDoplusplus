// Filepath: /home/toxicsoda/ToDoplusplus/backend/src/services/siliconflowAiService.ts
import { ChatDeepSeek } from "@langchain/deepseek";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from 'zod';

// 定义硅基流动API的响应体结构 (根据您提供的示例)
interface SiliconFlowChoice {
  message: {
    role: string;
    content: string;
    reasoning_content?: string;
    tool_calls?: any[];
  };
  finish_reason: string;
}

interface SiliconFlowResponse {
  id: string;
  choices: SiliconFlowChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  model: string;
  object: string;
}

// 定义AI服务返回的结构化待办事项数据
export interface AiTodoData {
  xmlContent: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

// 定义输出解析器
const todoParser = StructuredOutputParser.fromZodSchema(
  z.object({
    title: z.string().describe("任务的标题"),
    description: z.string().optional().describe("任务的详细描述"),
    dueDate: z.string().describe("任务的截止日期，ISO 8601格式"),
    status: z.enum(['pending', 'completed']).describe("任务状态"),
    priority: z.enum(['low', 'medium', 'high']).describe("任务优先级")
  })
);

// 创建提示模板
const promptTemplate = new PromptTemplate({
  template: `你是一个任务提取助手。根据用户输入，提取任务的关键信息，并按照指定的格式输出。
当前时间: {currentTime}

用户输入: {input}

请提取以下信息：
{format_instructions}

请确保：
1. 截止日期是有效的ISO 8601格式
2. 根据任务的紧急程度和内容判断优先级
3. 状态默认为pending
4. 标题要简洁明了
5. 描述要详细但不过长`,
  inputVariables: ["input", "currentTime"],
  partialVariables: { format_instructions: todoParser.getFormatInstructions() }
});

/**
 * 从自然语言生成待办事项数据
 * @param naturalLanguageInput 用户的自然语言输入
 * @returns Promise<AiTodoData | null> 结构化的待办事项数据或null（如果失败）
 */
export async function generateTodoFromSiliconFlow(naturalLanguageInput: string): Promise<AiTodoData | null> {
  console.log('[AI SERVICE] generateTodoFromSiliconFlow called with input:', naturalLanguageInput);
  
  try {
    // 初始化 DeepSeek 模型
    const llm = new ChatDeepSeek({
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
      temperature: 0.7,
      apiKey: 'sk-xuuvwffyuzajucdzjzvqyyqydgedsjivrmdhydcsjjwiditr'
    });

    // 准备提示
    const currentTime = new Date().toISOString();
    const formattedPrompt = await promptTemplate.format({
      input: naturalLanguageInput,
      currentTime
    });

    // 调用模型
    console.log('[AI SERVICE] Sending request to DeepSeek API...');
    const aiMsg = await llm.invoke([
      ["system", formattedPrompt],
      ["human", naturalLanguageInput]
    ]);

    console.log('[AI SERVICE] Assistant message:', aiMsg.content);

    // 解析AI返回的结构化数据
    const parsedData = await todoParser.parse(aiMsg.content.toString());
    
    // 生成XML内容
    const xmlContent = generateXmlContent(parsedData);
    
    // 构建返回数据
    const aiTodoData: AiTodoData = {
      xmlContent,
      title: parsedData.title,
      description: parsedData.description,
      dueDate: new Date(parsedData.dueDate),
      status: parsedData.status,
      priority: parsedData.priority
    };

    console.log('[AI SERVICE] Generated AiTodoData:', aiTodoData);
    return aiTodoData;
  } catch (error) {
    console.error('[AI SERVICE] Error:', error);
    return null;
  }
}

/**
 * 生成XML内容
 */
function generateXmlContent(data: {
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
}): string {
  return `<todo>
  <title>${escapeXml(data.title)}</title>
  ${data.description ? `<description>${escapeXml(data.description)}</description>` : ''}
  <dueDate>${data.dueDate}</dueDate>
  <status>${data.status}</status>
  <priority>${data.priority}</priority>
</todo>`;
}

/**
 * 转义XML特殊字符
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
