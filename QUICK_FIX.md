# 🚀 Quick Fix for 500 Error

## The Problem
Your Edge Functions need API keys to work. They're not set in Supabase yet.

## The Solution (2 minutes)

### Option 1: Add Gemini API Key (FREE & RECOMMENDED)

1. **Get Gemini API Key** (Free):
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to Supabase**:
   - Visit: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/settings/vault
   - Click "New secret"
   - Name: `Gemini_API_Key`
   - Value: [paste your Gemini key]
   - Click "Save"

3. **Test**:
   - Refresh your app
   - Send a message
   - ✅ Should work!

### Option 2: Use Your Existing OpenAI Key

1. **Add to Supabase**:
   - Visit: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/settings/vault
   - Click "New secret"
   - Name: `OPENAI_API_KEY`
   - Value: `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`
   - Click "Save"

2. **Change Model in App**:
   - In the chat interface, click the model selector
   - Choose "Smart (GPT-5)" or "Think Deeper"

3. **Test**:
   - Send a message
   - ✅ Should work!

## Where to Add Secrets

Go to one of these URLs:
- **Vault (Recommended)**: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/settings/vault
- **Edge Functions Settings**: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/settings/functions

## Need More Help?

Check the full guide: `SETUP_BACKEND.md`
