/**
 * 服务端API代理
 * 转发请求到OpenRouter API并处理响应
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 配置CORS
app.use('*', cors());

// OpenRouter API基础URL - 使用负载均衡器
const OPENROUTER_API_URL = 'https://openrouter-load-balancer.dongsuo.workers.dev';

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// 代理获取模型列表
app.get('/api/free/models', async (c) => {
  try {
    console.log('Fetching models from OpenRouter...');
    const requestUrl = `${OPENROUTER_API_URL}/free/models`;
    console.log('Request URL:', requestUrl);
    
    // 添加请求头日志
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      // 不添加其他自定义头
    });
    
    // 发送请求
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter models API error: Status ${response.status}, Body:`, errorText);
      return c.json({ 
        error: `Failed to fetch models from OpenRouter: ${response.status}`, 
        details: errorText 
      }, response.status);
    }
    
    // 解析响应数据
    let data;
    try {
      const responseText = await response.text();
      console.log('Response text:', responseText);
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return c.json({ 
        error: 'Failed to parse response', 
        message: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, 500);
    }
    
    console.log('Response data type:', typeof data);
    console.log('Response data structure:', Array.isArray(data) ? 'array' : Object.keys(data).join(', '));
    
    // 如果是数组格式，则直接将其包装为所需结构
    if (Array.isArray(data)) {
      console.log(`Received array of ${data.length} models`);
      const freeModels = data.filter(model => !model.pricing || model.pricing?.prompt === '0');
      return c.json({
        all_models: data,
        free_models: freeModels,
        free_models_count: freeModels.length
      });
    }
    
    // 如果是标准OpenRouter格式，处理data属性
    if (data.data && Array.isArray(data.data)) {
      console.log(`Received ${data.data.length} models in data property`);
      const freeModels = data.data.filter(model => !model.pricing || model.pricing?.prompt === '0');
      return c.json({
        all_models: data.data,
        free_models: freeModels,
        free_models_count: freeModels.length
      });
    }
    
    // 如果返回的格式未知，记录并返回原始数据
    console.log('Received unexpected data format from OpenRouter:', data);
    return c.json(data);
  } catch (error) {
    // 更详细的错误日志
    console.error('Error fetching models:');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('This may be a network connectivity issue to the OpenRouter API');
    }
    
    return c.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 代理聊天完成请求
app.post('/api/chat/completions', async (c) => {
  try {
    const requestUrl = `${OPENROUTER_API_URL}/chat/completions`;
    let body;
    
    try {
      body = await c.req.json();
      console.log('Forwarding chat completion request to:', requestUrl);
      console.log('Request for model:', body.model);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return c.json({ 
        error: 'Invalid request body', 
        message: 'Failed to parse request JSON'
      }, 400);
    }
    
    // 发送请求，超时设置为 50 秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);
    
    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Chat API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter chat API error: Status ${response.status}, Body:`, errorText);
        return c.json({ 
          error: `Failed to get chat completion from OpenRouter: ${response.status}`, 
          details: errorText 
        }, response.status);
      }
      
      const data = await response.json();
      return c.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // 更详细的错误日志
    console.error('Error in chat completions:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    if (error.name === 'AbortError') {
      return c.json({
        error: 'Request timeout',
        message: 'The request to OpenRouter API timed out after 50 seconds'
      }, 504);
    }
    
    return c.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;