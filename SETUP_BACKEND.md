# Backend Setup Guide

## Current Issue
The Supabase Edge Functions are returning 500 errors because the API keys are not configured in your Supabase project.

## Quick Fix (5 minutes)

### Step 1: Get Your API Keys

1. **OpenAI** (You already have this): 
   - Key: `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`

2. **Gemini** (Recommended - Free tier available):
   - Go to: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

3. **Anthropic** (Optional):
   - Go to: https://console.anthropic.com/
   - Get API key from settings

4. **Groq** (Optional - Very fast, free tier):
   - Go to: https://console.groq.com/
   - Get API key

### Step 2: Add Keys to Supabase

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/settings/functions

2. Click on "Edge Functions" in the left sidebar

3. Click on "Manage secrets" or "Environment variables"

4. Add these secrets (one by one):
   ```
   Name: OPENAI_API_KEY
   Value: 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
   
   Name: Gemini_API_Key
   Value: [Your Gemini API Key]
   
   Name: ANTHROPIC_API_KEY (optional)
   Value: [Your Anthropic API Key]
   
   Name: GROQ_API_KEY (optional)
   Value: [Your Groq API Key]
   ```

5. Click "Save" or "Add secret"

### Step 3: Redeploy Edge Functions (if needed)

The secrets should be available immediately, but if not:

1. Go to: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/functions
2. Find the "chat" function
3. Click "Redeploy" or "Deploy"

### Step 4: Test

1. Refresh your app at http://localhost:8081/
2. Try sending a message
3. It should work now!

## Alternative: Use OpenAI Only

If you want to use only OpenAI (which you already have the key for), you can:

1. Add only the `OPENAI_API_KEY` to Supabase secrets
2. In your app, select "GPT-5" or "Think Deeper" from the model selector
3. This will use OpenAI instead of Gemini

## Troubleshooting

### Still getting 500 errors?

1. Check the Supabase logs:
   - Go to: https://supabase.com/dashboard/project/ncdhbxracduskwrberpl/logs/edge-functions
   - Look for error messages

2. Make sure the secret names match exactly:
   - `OPENAI_API_KEY` (not `OpenAI_API_Key`)
   - `Gemini_API_Key` (not `GEMINI_API_KEY`)
   - `ANTHROPIC_API_KEY`
   - `GROQ_API_KEY`

3. Wait 1-2 minutes after adding secrets for them to propagate

### Need help?

Check the Supabase documentation:
- https://supabase.com/docs/guides/functions/secrets
