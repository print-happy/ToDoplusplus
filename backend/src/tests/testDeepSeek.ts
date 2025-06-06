import { ChatDeepSeek } from "@langchain/deepseek";

async function testDeepSeek() {
  try {
    console.log('开始测试 DeepSeek API...');
    
    const testInput = "我明天下午3点要开会讨论项目A";
    console.log('测试输入:', testInput);

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-xuuvwffyuzajucdzjzvqyyqydgedsjivrmdhydcsjjwiditr',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        messages: [
          {
            role: 'system',
            content: '你是一个任务提取助手。请提取用户输入中的任务信息，包括时间、事件等关键信息。'
          },
          {
            role: 'user',
            content: testInput
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI 响应:', data.choices[0].message.content);
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
testDeepSeek(); 