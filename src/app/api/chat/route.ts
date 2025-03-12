import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message } = await req.json();
  const apiKey = process.env.MOONSHOT_API_KEY || 'your-moonshot-api-key';
  const url = 'https://api.moonshot.cn/v1/chat/completions';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: message }],
        stream: true,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('API request failed');

    return new NextResponse(response.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}