import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

interface GeneratedTodo {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface AIGenerationRequest {
  description: string;
  targetDate: string; // 已经计算好的具体日期，格式：YYYY-MM-DD
}

class AIService {
  private model: ChatOpenAI;

  constructor() {
    // 配置硅基流动的DeepSeek模型
    this.model = new ChatOpenAI({
      modelName: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
      openAIApiKey: 'sk-tiexalkgzyxveowgbgljdshjtwpmzwdqlwmvwqbtgsdvwmjy',
      configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',
      },
      temperature: 0.3, // 降低随机性，提高响应速度
      maxTokens: 500, // 减少token数量，提高响应速度
      timeout: 60000, // 60秒超时
    });
  }

  /**
   * 生成待办事项（AI只负责内容生成，不涉及日期计算）
   * @param request 包含描述和已计算好的目标日期
   * @returns 生成的待办事项列表（不包含日期）
   */
  async generateTodos(request: AIGenerationRequest): Promise<GeneratedTodo[]> {
    try {
      const { description, targetDate } = request;

      console.log('AI内容生成请求:', {
        description: description.substring(0, 100),
        targetDate
      });

      const systemPrompt = `你是一个专业的任务规划助手。根据用户的描述，快速生成合理的待办事项。

重要说明：
1. 你只需要生成任务的标题、描述和优先级
2. 不要生成或计算任何日期信息
3. 任务的截止日期已经由系统计算好了：${targetDate}

用户描述：${description}
目标日期：${targetDate}

请严格按照以下JSON格式返回结果，不要包含任何日期字段：
[
  {
    "title": "任务标题",
    "description": "任务描述",
    "priority": "high|medium|low"
  }
]

要求：
1. 生成1-3个相关的待办事项
2. 任务标题简洁，不超过15个字
3. 任务描述简要，不超过30个字
4. 优先级：紧急重要=high，一般=medium，不急=low
5. 不要包含任何日期信息，日期由系统处理`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`请为以下描述生成待办事项内容（不包含日期）：${description}`)
      ];

      const response = await this.model.invoke(messages, {
        timeout: 60000, // 60秒超时
      });
      const content = response.content as string;

      // 尝试解析JSON响应
      try {
        const todos = JSON.parse(content);
        
        // 验证返回的数据格式
        if (!Array.isArray(todos)) {
          throw new Error('AI返回的不是数组格式');
        }

        // 验证每个待办事项的格式
        const validatedTodos: GeneratedTodo[] = todos.map((todo: any) => {
          if (!todo.title || !todo.priority) {
            throw new Error('AI返回的待办事项格式不完整');
          }

          // 验证优先级
          if (!['low', 'medium', 'high'].includes(todo.priority)) {
            todo.priority = 'medium'; // 默认中等优先级
          }

          return {
            title: todo.title.substring(0, 50), // 限制标题长度
            description: todo.description || '',
            priority: todo.priority as 'low' | 'medium' | 'high'
          };
        });

        return validatedTodos;
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
        console.error('AI原始响应:', content);
        
        // 如果解析失败，返回一个基于用户输入的默认待办事项
        return [{
          title: request.description.substring(0, 20) || '新任务',
          description: `基于您的描述"${request.description}"创建的任务`,
          priority: 'medium'
        }];
      }
    } catch (error) {
      console.error('AI生成待办事项失败:', error);
      
      // 如果AI调用失败，返回一个基于用户输入的默认待办事项
      return [{
        title: request.description.substring(0, 20) || '新任务',
        description: `基于您的描述"${request.description}"创建的任务`,
        priority: 'medium'
      }];
    }
  }
}

export const aiService = new AIService();
export { GeneratedTodo, AIGenerationRequest };
