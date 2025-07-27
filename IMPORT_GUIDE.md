# Conversation Import Guide

## Overview
The conversation import feature allows you to upload JSON files containing conversation data and automatically create profiles with AI-analyzed personality traits, preferences, and characteristics.

## File Requirements

### Size Limit
- **Maximum file size**: 10MB
- **Recommended**: Under 5MB for faster processing

### Format Requirements
- **File type**: JSON only
- **Structure**: Array of message objects or object with `messages` array

### Message Format
Each message should have:
```json
{
  "from": "Sender Name",
  "text": "Message content",
  "timestamp": "2024-01-01 12:00"
}
```

## Supported JSON Formats

### Format 1: Direct Array
```json
[
  {
    "from": "Sarah",
    "text": "Hello! How are you?",
    "timestamp": "2024-01-01 12:00"
  },
  {
    "from": "Me",
    "text": "I'm good, thanks!",
    "timestamp": "2024-01-01 12:01"
  }
]
```

### Format 2: Object with Messages Array
```json
{
  "messages": [
    {
      "from": "Sarah",
      "text": "Hello! How are you?",
      "timestamp": "2024-01-01 12:00"
    },
    {
      "from": "Me",
      "text": "I'm good, thanks!",
      "timestamp": "2024-01-01 12:01"
    }
  ]
}
```

## How to Use

1. **Go to Profiles page**
2. **Click "Import Conversation" button**
3. **Select your JSON file**
4. **Enter a profile name** (auto-generated from filename)
5. **Click "Import & Analyze"**
6. **Wait for AI analysis** (can take 10-30 seconds)
7. **Profile will appear in your profiles list**

## What the AI Extracts

The AI analyzes the conversation and extracts:

- **Likes**: Hobbies, interests, foods, activities
- **Personality Tags**: Character traits, behaviors
- **Inside Jokes**: Recurring themes, references
- **Details**: Facts, preferences, personal info
- **Conversation Goals**: What they want from conversations
- **Bio**: Short personality description

## Tips for Better Results

### Message Quality
- **More messages = better analysis** (aim for 20+ messages)
- **Diverse topics** help extract more preferences
- **Natural conversation** works better than formal text

### Content Types
- **Personal interests** (hobbies, food, music)
- **Daily activities** (work, school, routines)
- **Opinions and preferences** (likes/dislikes)
- **Emotional expressions** (emojis, feelings)

### File Preparation
- **Clean the data** (remove system messages, errors)
- **Keep timestamps** for conversation flow
- **Use consistent sender names**
- **Include both sides** of the conversation

## Example Results

From the sample conversation, the AI might extract:

```json
{
  "likes": ["psychology", "reading", "hiking", "photography", "cooking", "Italian food", "nature", "sunset"],
  "personality_tags": ["curious", "appreciative", "creative", "passionate", "introspective"],
  "inside_jokes": ["beautiful moments", "life is too short"],
  "details": {
    "favorite_cuisine": "Italian",
    "favorite_activity": "photography",
    "favorite_time": "sunset"
  },
  "conversation_goals": ["sharing experiences", "connecting through interests"],
  "bio": "A thoughtful and creative person who finds joy in life's simple pleasures, from reading psychology books to capturing beautiful sunsets through photography."
}
```

## Troubleshooting

### Common Issues
- **"Invalid JSON file"**: Check JSON syntax, use a validator
- **"No messages found"**: Ensure messages are in correct format
- **"File too large"**: Reduce file size or split into multiple files
- **"Analysis failed"**: Try with fewer messages or different content

### Performance
- **Large files** (5MB+) may take longer to process
- **Complex conversations** require more AI processing time
- **Network issues** can cause timeouts

## Sample Files

Use `sample_conversation.json` as a reference for the correct format. 