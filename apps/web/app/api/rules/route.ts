import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const RULES_PATH = path.resolve(process.cwd(), '../server/src/rules/rule-based.yaml');

export async function GET() {
  try {
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const rules = yaml.load(raw);
    return NextResponse.json({ rules });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load rules', detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.rules)) {
      return NextResponse.json({ error: 'Invalid rules format' }, { status: 400 });
    }
    const yamlStr = yaml.dump(body.rules, { lineWidth: 120 });
    fs.writeFileSync(RULES_PATH, yamlStr, 'utf8');
    // 通知后端 reload
    try {
      await fetch(process.env.NEXT_PUBLIC_CHAT_API_URL + '/chat/reload', { method: 'POST' });
    } catch (e) {
      // ignore reload error, still return success
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save rules', detail: String(err) }, { status: 500 });
  }
} 