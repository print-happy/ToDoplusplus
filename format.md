const options = {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk-xuuvwffyuzajucdzjzvqyyqydgedsjivrmdhydcsjjwiditr',
    'Content-Type': 'application/json'
  },
  body: '{"model":"deepseek-ai/DeepSeek-R1-Distill-Qwen-7B","stream":false,"max_tokens":512,"enable_thinking":true,"thinking_budget":4096,"min_p":0.05,"temperature":0.7,"top_p":0.7,"top_k":50,"frequency_penalty":0.5,"n":1,"stop":[],"messages":[{"role":"user","content":"我明天要完成操作系统作业，后天要完成人工智能作业"},{"role"}:"system","content":"现在时间2025年5月18日23:00"]}'
};

fetch('https://api.siliconflow.cn/v1/chat/completions', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));

{
  "id": "<string>",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "<string>",
        "reasoning_content": "<string>",
        "tool_calls": [
          {
            "id": "<string>",
            "type": "function",
            "function": {
              "name": "<string>",
              "arguments": "<string>"
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 123,
    "total_tokens": 123
  },
  "created": 123,
  "model": "<string>",
  "object": "chat.completion"
}