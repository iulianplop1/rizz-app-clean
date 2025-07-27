from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
import json
import uuid
from datetime import datetime

# Get the absolute path to the frontend build folder
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_FOLDER = os.path.join(BASE_DIR, 'frontend', 'build')

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')
CORS(app)

# Simple session management (in production, use proper session management)
current_user = None

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILES_PATH = os.path.join(DATA_DIR, 'profiles.json')
USER_PROFILE_PATH = os.path.join(DATA_DIR, 'user_profile.json')
USERS_PATH = os.path.join(DATA_DIR, 'users.json')

# Helper functions
def load_users():
    """Load users from users.json file"""
    if not os.path.exists(USERS_PATH):
        # Create empty users file if it doesn't exist
        save_users({})
        return {}
    try:
        with open(USERS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}

def save_users(users):
    """Save users to users.json file"""
    with open(USERS_PATH, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def create_user(username, password, email="", is_admin=False):
    """Create a new user in the users.json file"""
    users = load_users()
    users[username] = {
        "password": password,
        "email": email,
        "created_at": datetime.now().isoformat(),
        "is_admin": is_admin
    }
    save_users(users)
    return True

def authenticate_user(username, password):
    """Authenticate user against users.json"""
    users = load_users()
    if username in users:
        return users[username]["password"] == password
    return False

def get_user_data_paths(username):
    """Get file paths for user-specific data"""
    if username == 'iulian_plop':
        # Use original paths for main account
        return {
            'profiles': PROFILES_PATH,
            'user_profile': USER_PROFILE_PATH,
            'settings': os.path.join(DATA_DIR, 'settings.json')
        }
    else:
        # Use user-specific paths
        user_data_dir = os.path.join(DATA_DIR, f'users/{username}')
        return {
            'profiles': os.path.join(user_data_dir, 'profiles.json'),
            'user_profile': os.path.join(user_data_dir, 'user_profile.json'),
            'settings': os.path.join(user_data_dir, 'settings.json')
        }

def load_profiles(username=None):
    username = username or current_user
    if not username:
        # Fallback to original path
        profiles_path = PROFILES_PATH
    else:
        paths = get_user_data_paths(username)
        profiles_path = paths['profiles']
    
    if not os.path.exists(profiles_path):
        return {}
    with open(profiles_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_profiles(profiles, username=None):
    username = username or current_user
    if not username:
        # Fallback to original path
        profiles_path = PROFILES_PATH
    else:
        paths = get_user_data_paths(username)
        profiles_path = paths['profiles']
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(profiles_path), exist_ok=True)
    with open(profiles_path, 'w', encoding='utf-8') as f:
        json.dump(profiles, f, indent=2, ensure_ascii=False)

def load_user_profile(username=None):
    username = username or current_user
    if not username:
        # Fallback to original path
        user_profile_path = USER_PROFILE_PATH
    else:
        paths = get_user_data_paths(username)
        user_profile_path = paths['user_profile']
    
    if not os.path.exists(user_profile_path):
        return {}
    with open(user_profile_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_user_profile(profile, username=None):
    username = username or current_user
    if not username:
        # Fallback to original path
        user_profile_path = USER_PROFILE_PATH
    else:
        paths = get_user_data_paths(username)
        user_profile_path = paths['user_profile']
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(user_profile_path), exist_ok=True)
    with open(user_profile_path, 'w', encoding='utf-8') as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)

def build_prompt(profile, user_profile, last_message):
    # Helper to trim lists from the left (oldest first)
    def trim_left(lst, n):
        return lst[n:] if n < len(lst) else []

    # Start with full lists
    my_likes = list(user_profile.get("likes", []))
    my_personality = list(user_profile.get("personality", []))
    my_personality_tags = list(user_profile.get("personality_tags", []))
    my_jokes = list(user_profile.get("inside_jokes", []))
    my_details = user_profile.get("details", {})
    my_bio = user_profile.get("bio", "")
    my_name = user_profile.get("name", "")
    my_gender = user_profile.get("gender", "")
    my_age = user_profile.get("age", "")

    likes = list(profile.get("likes", []))
    personality = list(profile.get("personality_tags", []))
    jokes = list(profile.get("inside_jokes", []))
    details = profile.get("details", {})
    goals = list(profile.get("conversation_goals", []))
    history = "\n".join(
        [f"{m['from']}: {m['text']}" for m in profile.get("previous_messages", [])[-20:]]
    )

    # Compose prompt as a function to allow re-generation after trimming
    def compose_prompt():
        user_info = (
            f"My info:\n"
            f"Name: {my_name}\n"
            f"Gender: {my_gender}\n"
            f"Age: {my_age}\n"
            f"Likes: {', '.join(my_likes)}\n"
            f"Personality: {', '.join(my_personality)}\n"
            f"Personality tags: {', '.join(my_personality_tags)}\n"
            f"Inside jokes: {'; '.join(my_jokes)}\n"
            f"Details: {'; '.join([f'{k}: {v}' for k, v in my_details.items()])}\n"
            f"Bio: {my_bio}\n"
        )
        return (
            f"You are the user's texting assistant.\n"
            "Respond as if you are a real person texting on Instagram. Be natural, engaging, and authentic. Use emojis, slang, or humor if appropriate. Avoid sounding robotic or generic.\n"
            f"{user_info}"
            f"Girl's name: {profile.get('name')}\n"
            f"Likes: {', '.join(likes)}\n"
            f"Personality: {', '.join(personality)}\n"
            f"Inside jokes: {'; '.join(jokes)}\n"
            f"Details: {'; '.join([f'{k}: {v}' for k, v in details.items()])}\n"
            f"Conversation goals: {'; '.join(goals)}\n"
            f"Recent conversation:\n{history}\n"
            f"Her last message: '{last_message}'\n"
            f"Suggest 3 replies. Output as JSON with keys reply_1, reply_2, reply_3, each containing only the reply text. Do not include any explanations or context, only the replies."
        )

    prompt = compose_prompt()
    MAX_PROMPT_LEN = 400000  # aggressive approach, about 100,000 tokens
    # If prompt is too long, trim personality_tags and likes (oldest first)
    while len(prompt) > MAX_PROMPT_LEN and (my_personality_tags or my_likes or personality or likes):
        # Prioritize trimming personality_tags, then likes, from both profiles
        if my_personality_tags:
            my_personality_tags = trim_left(my_personality_tags, 1)
        elif my_likes:
            my_likes = trim_left(my_likes, 1)
        elif personality:
            personality = trim_left(personality, 1)
        elif likes:
            likes = trim_left(likes, 1)
        prompt = compose_prompt()
    return prompt

def call_gemini(prompt):
    # Load API key from settings
    api_key = ""
    settings_file = 'settings.json'
    if os.path.exists(settings_file):
        try:
            with open(settings_file, 'r') as f:
                settings_data = json.load(f)
                api_key = settings_data.get('apiKeys', {}).get('geminiApiKey', '')
        except Exception as e:
            print(f"[WARNING] Could not load settings: {e}")
    if not api_key:
        print(f"[ERROR] No Gemini API key configured. Please set your API key in Settings.")
        return {'error': 'No Gemini API key configured. Please set your API key in Settings.'}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192}
    }
    resp = requests.post(url, headers=headers, json=data)
    try:
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[x] Gemini API error: {e}, {resp.text}")
        return None

def extract_replies(ai_response):
    import re, json as pyjson
    if not ai_response:
        return []
    try:
        # Try the expected structure first
        raw = ai_response['candidates'][0]['content']['parts'][0]['text']
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            replies = pyjson.loads(match.group(0))
            return [replies.get(f'reply_{i+1}', '') for i in range(3)]
    except Exception as e:
        print(f"[x] Failed to parse Gemini output: {e}")
        print(f"[x] Full Gemini response: {ai_response}")
        # Try to extract text from other possible locations
        try:
            # Sometimes the text is directly in 'content' or 'text'
            candidate = ai_response.get('candidates', [{}])[0]
            if 'content' in candidate and isinstance(candidate['content'], str):
                raw = candidate['content']
            elif 'text' in candidate:
                raw = candidate['text']
            else:
                raw = str(candidate)
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                replies = pyjson.loads(match.group(0))
                return [replies.get(f'reply_{i+1}', '') for i in range(3)]
        except Exception as e2:
            print(f"[x] Fallback parse error: {e2}")
            print(f"[x] Fallback raw: {raw}")
    return []

def build_extraction_prompt(message, sender_is_me=False):
    who = "my" if sender_is_me else "her"
    return (
        f"Analyze the following message and extract any new information about the sender.\n"
        f"Return a JSON object with these fields:\n"
        f"- likes: list of things {who} likes (e.g. foods, animals, hobbies)\n"
        f"- personality_tags: list of personality traits\n"
        f"- inside_jokes: list of inside jokes or references\n"
        f"- details: dictionary of any other facts (e.g. pet names, favorite places, birthday, etc.)\n"
        f"Respond ONLY with a valid JSON object and nothing else.\n"
        f"Message: \"{message}\""
    )

def extract_profile_fields(ai_response):
    import re, json as pyjson
    if not ai_response:
        return {}
    try:
        raw = ai_response['candidates'][0]['content'].get('parts', [{}])[0].get('text', '')
        print(f"[DEBUG] Raw AI response text: {raw}")
        
        # Try to extract JSON from markdown code blocks first
        code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', raw)
        if code_block_match:
            try:
                return pyjson.loads(code_block_match.group(1))
            except Exception as e:
                print(f"[DEBUG] Failed to parse code block JSON: {e}")
        
        # Try regular JSON extraction
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            try:
                return pyjson.loads(match.group(0))
            except Exception as e:
                print(f"[DEBUG] Failed to parse regular JSON: {e}")
        
        # Try more lenient regex
        match2 = re.search(r'\{.*\}', raw, re.DOTALL)
        if match2:
            try:
                return pyjson.loads(match2.group(0))
            except Exception as e2:
                print(f"[DEBUG] Fallback JSON parse error: {e2}")
        
        print(f"[DEBUG] No valid JSON found in response. Raw: {raw}")
    except Exception as e:
        print(f"[DEBUG] Failed to parse Gemini extraction output: {e}")
        print(f"[DEBUG] Raw extraction response: {ai_response}")
    return {}

# API Endpoints
@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    profiles = load_profiles()
    profile_list = list(profiles.values())
    
    # Add user profile to the list
    user_profile = load_user_profile()
    if user_profile:
        user_as_profile = {
            "user_id": "me",
            "name": user_profile.get("name", "Me"),
            "likes": user_profile.get("likes", []),
            "personality_tags": user_profile.get("personality_tags", []),
            "inside_jokes": user_profile.get("inside_jokes", []),
            "details": user_profile.get("details", {}),
            "conversation_goals": user_profile.get("conversation_goals", []),
            "previous_messages": user_profile.get("previous_messages", []),
            "memory_vector_ids": user_profile.get("memory_vector_ids", []),
            "bio": user_profile.get("bio", ""),
            "gender": user_profile.get("gender", ""),
            "age": user_profile.get("age", ""),
            "is_me": True  # Flag to identify this as the user's own profile
        }
        profile_list.insert(0, user_as_profile)  # Add user profile at the beginning
    
    return jsonify(profile_list)

@app.route('/api/profiles/<user_id>', methods=['GET'])
def get_profile(user_id):
    profiles = load_profiles()
    profile = profiles.get(user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(profile)

@app.route('/api/profiles/<user_id>', methods=['PUT'])
def update_profile(user_id):
    profiles = load_profiles()
    data = request.json
    profiles[user_id] = data
    save_profiles(profiles)
    return jsonify({'success': True})

@app.route('/api/profiles/<user_id>', methods=['DELETE'])
def delete_profile(user_id):
    profiles = load_profiles()
    if user_id not in profiles:
        return jsonify({'error': 'Profile not found'}), 404
    
    # Don't allow deleting user profile
    if user_id == 'me':
        return jsonify({'error': 'Cannot delete user profile'}), 400
    
    # Remove the profile
    del profiles[user_id]
    save_profiles(profiles)
    
    print(f"[DEBUG] Deleted profile: {user_id}")
    return jsonify({'success': True, 'message': f'Profile {user_id} deleted successfully'})

@app.route('/api/user', methods=['GET'])
def get_user_profile():
    return jsonify(load_user_profile())

@app.route('/api/user/profile', methods=['GET'])
def get_user_as_profile():
    """Get user profile formatted as a profile for display on Profiles page"""
    user_profile = load_user_profile()
    
    # Convert user profile to profile format
    profile = {
        "user_id": "me",
        "name": user_profile.get("name", "Me"),
        "likes": user_profile.get("likes", []),
        "personality_tags": user_profile.get("personality_tags", []),
        "inside_jokes": user_profile.get("inside_jokes", []),
        "details": user_profile.get("details", {}),
        "conversation_goals": user_profile.get("conversation_goals", []),
        "previous_messages": user_profile.get("previous_messages", []),
        "memory_vector_ids": user_profile.get("memory_vector_ids", []),
        "bio": user_profile.get("bio", ""),
        "gender": user_profile.get("gender", ""),
        "age": user_profile.get("age", ""),
        "is_me": True  # Flag to identify this as the user's own profile
    }
    
    return jsonify(profile)

@app.route('/api/user', methods=['PUT'])
def update_user_profile():
    data = request.json
    save_user_profile(data)
    return jsonify({'success': True})

@app.route('/api/conversations/<user_id>', methods=['GET'])
def get_conversation(user_id):
    profiles = load_profiles()
    profile = profiles.get(user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(profile.get('previous_messages', []))

@app.route('/api/conversations/<user_id>', methods=['POST'])
def add_message(user_id):
    profiles = load_profiles()
    profile = profiles.get(user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    msg = request.json
    profile.setdefault('previous_messages', []).append(msg)
    save_profiles(profiles)
    
    # Analyze message for user profile updates if it's from "Me"
    if msg.get('from') == 'Me':
        print(f"[DEBUG] Analyzing message from Me: {msg.get('text', '')}")
        user_profile = load_user_profile()
        extraction_prompt = build_extraction_prompt(msg.get('text', ''), sender_is_me=True)
        print(f"[DEBUG] Extraction prompt: {extraction_prompt}")
        extraction_response = call_gemini(extraction_prompt)
        print(f"[DEBUG] Extraction response: {extraction_response}")
        extracted = extract_profile_fields(extraction_response)
        print(f"[DEBUG] Extracted fields: {extracted}")
        
        # Update user profile with extracted information
        if extracted:
            print(f"[DEBUG] Before update - user_profile likes: {user_profile.get('likes', [])}")
            for field in ["likes", "personality_tags", "inside_jokes"]:
                if field in extracted and isinstance(extracted[field], list):
                    old_value = user_profile.get(field, [])
                    new_value = list(set(old_value + extracted[field]))
                    user_profile[field] = new_value
                    print(f"[DEBUG] Updated {field}: {old_value} -> {new_value}")
            if "details" in extracted and isinstance(extracted["details"], dict):
                old_details = user_profile.get("details", {})
                user_profile["details"] = {**old_details, **extracted["details"]}
                print(f"[DEBUG] Updated details: {old_details} -> {user_profile['details']}")
            
            print(f"[DEBUG] About to save user profile: {user_profile}")
            save_user_profile(user_profile)
            print(f"[DEBUG] User profile saved successfully")
            print(f"[DEBUG] Updated user profile with: {extracted}")
        else:
            print(f"[DEBUG] No data extracted from message")
    
    return jsonify({'success': True})

@app.route('/api/ai/reply', methods=['POST'])
def ai_reply():
    data = request.json
    user_id = data.get('user_id')
    last_message = data.get('last_message', '')
    profiles = load_profiles()
    user_profile = load_user_profile() or {}
    profile = profiles.get(user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    goal = data.get('goal')
    tone = data.get('tone')
    language = data.get('language')
    prompt = build_prompt(profile, user_profile, last_message)
    if goal:
        prompt += f"\nConversation goal: {goal}\n"
    if tone:
        prompt += f"\nTone preference: {tone}\n"
    if language and language.strip():
        prompt += f"\nReply in this language: {language.strip()}\n"
    print(f"[PROMPT TO GEMINI]:\n{prompt}\n{'-'*40}")
    ai_response = call_gemini(prompt)
    reply_options = extract_replies(ai_response)
    return jsonify({
        'reply_1': reply_options[0] if len(reply_options) > 0 else '',
        'reply_2': reply_options[1] if len(reply_options) > 1 else '',
        'reply_3': reply_options[2] if len(reply_options) > 2 else '',
    })

@app.route('/api/ai/polish', methods=['POST'])
def ai_polish():
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message', '')
    tone = data.get('tone', '')
    language = data.get('language', '')
    profiles = load_profiles()
    user_profile = load_user_profile() or {}
    profile = profiles.get(user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    prompt = (
        f"Rewrite the following message to be more attractive, clear, and engaging. "
        f"Keep the meaning, but improve the style."
    )
    if tone:
        prompt += f"\nTone: {tone}."
    if language:
        prompt += f"\nLanguage: {language}."
    prompt += f"\nMessage: \"{message}\""
    prompt += "\nOutput only the improved message, nothing else."
    print(f"[POLISH PROMPT TO GEMINI]:\n{prompt}\n{'-'*40}")
    ai_response = call_gemini(prompt)
    # Extract the improved message from the response
    improved = ''
    if ai_response and 'candidates' in ai_response and len(ai_response['candidates']) > 0:
        candidate = ai_response['candidates'][0]
        if 'content' in candidate and 'parts' in candidate['content'] and len(candidate['content']['parts']) > 0:
            improved = candidate['content']['parts'][0]['text'].strip()
    return jsonify({'polished': improved})

@app.route('/api/analytics', methods=['GET'])
def analytics():
    # Placeholder: Return dummy analytics
    return jsonify({
        'total_profiles': len(load_profiles()),
        'total_messages': sum(len(p.get('previous_messages', [])) for p in load_profiles().values()),
    })

@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        # Load settings from file
        settings_file = 'settings.json'
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings_data = json.load(f)
                # Ensure we have the expected structure
                if settings_data is None:
                    settings_data = {}
                return jsonify(settings_data)
        else:
            # Return default settings
            default_settings = {
                'apiKeys': {
                    'geminiApiKey': '',
                    'instagramBusinessId': '',
                    'telegramBotToken': '',
                    'telegramChatId': ''
                },
                'preferences': {
                    'autoExtractPreferences': True,
                    'autoGenerateReplies': False,
                    'sendTelegramNotifications': True,
                    'enableWebhook': True,
                    'maxMessagesPerProfile': 50,
                    'aiTemperature': 0.7,
                    'defaultTone': 'flirty'
                }
            }
            return jsonify(default_settings)
    except Exception as e:
        print(f"Error loading settings: {e}")
        return jsonify({'error': 'Failed to load settings'}), 500

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    try:
        import os
        print('Current working directory:', os.getcwd())
        data = request.json
        settings_file = 'settings.json'
        
        # Save settings to file
        with open(settings_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error saving settings: {e}")
        return jsonify({'error': 'Failed to save settings'}), 500

@app.route('/api/test-gemini', methods=['POST'])
def test_gemini():
    try:
        data = request.json
        api_key = data.get('apiKey')
        
        if not api_key:
            return jsonify({'error': 'API key is required'}), 400
        
        # Test the API key with a simple request
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        test_data = {
            "contents": [{"parts": [{"text": "Hello, this is a test message."}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 50}
        }
        
        response = requests.post(url, headers=headers, json=test_data)
        response.raise_for_status()
        
        return jsonify({'success': True, 'message': 'API key is valid'})
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Invalid API key or connection failed'}), 400
    except Exception as e:
        print(f"Error testing Gemini API: {e}")
        return jsonify({'error': 'Failed to test API key'}), 500

@app.route('/api/import-conversation', methods=['POST'])
def import_conversation():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        profile_name = request.form.get('profile_name', 'Imported Profile')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.json'):
            return jsonify({'error': 'File must be a JSON file'}), 400
        
        # Read and parse the JSON file
        try:
            data = json.loads(file.read().decode('utf-8'))
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON file'}), 400
        
        # Extract messages from the data
        messages = []
        if isinstance(data, list):
            messages = data
        elif isinstance(data, dict) and 'messages' in data:
            messages = data['messages']
        else:
            return jsonify({'error': 'No messages found in JSON file'}), 400
        
        if not messages:
            return jsonify({'error': 'No messages found in file'}), 400
        
        # Validate message format
        for i, msg in enumerate(messages):
            if not isinstance(msg, dict) or 'text' not in msg:
                return jsonify({'error': f'Invalid message format at index {i}'}), 400
        
        print(f"[DEBUG] Importing {len(messages)} messages for profile: {profile_name}")
        
        # Generate a unique user ID for the new profile
        user_id = str(uuid.uuid4())
        
        # Create initial profile structure
        profile = {
            "user_id": user_id,
            "name": profile_name,
            "likes": [],
            "personality_tags": [],
            "inside_jokes": [],
            "details": {},
            "conversation_goals": [],
            "previous_messages": [],
            "memory_vector_ids": []
        }
        
        # Add messages to profile
        for msg in messages:
            profile["previous_messages"].append({
                "from": msg.get('from', 'Unknown'),
                "text": msg['text'],
                "timestamp": msg.get('timestamp', 'Unknown')
            })
        
        # Analyze all messages to extract personality traits
        print(f"[DEBUG] Analyzing {len(messages)} messages for personality extraction")
        
        # Filter out messages from "Me" to only analyze the other person's messages
        other_person_messages = [msg for msg in messages if msg.get('from', '').lower() not in ['me', 'you', 'iulian']]
        print(f"[DEBUG] Found {len(other_person_messages)} messages from other person")
        
        if not other_person_messages:
            print(f"[DEBUG] No messages from other person found, using all messages")
            other_person_messages = messages
        
        # Combine other person's messages for analysis
        all_text = " ".join([msg['text'] for msg in other_person_messages])
        
        # Create a comprehensive analysis prompt
        analysis_prompt = f"""Analyze this conversation and extract detailed information about the person's personality, preferences, and characteristics.

Conversation text: "{all_text}"

Extract and return a JSON object with these fields:
- likes: list of things they like (foods, activities, hobbies, interests, etc.)
- personality_tags: list of personality traits and characteristics
- inside_jokes: list of inside jokes, references, or recurring themes
- details: dictionary of any other facts (favorite places, pet names, birthday, etc.)
- conversation_goals: list of their conversation goals or what they want from conversations
- bio: a short bio description based on their personality

Respond ONLY with a valid JSON object and nothing else."""

        # Call AI for analysis
        print(f"[DEBUG] Analysis prompt: {analysis_prompt}")
        analysis_response = call_gemini(analysis_prompt)
        print(f"[DEBUG] Analysis response: {analysis_response}")
        extracted = extract_profile_fields(analysis_response)
        
        if extracted:
            print(f"[DEBUG] Extracted profile data: {extracted}")
            # Update profile with extracted information
            for field in ["likes", "personality_tags", "inside_jokes", "conversation_goals"]:
                if field in extracted and isinstance(extracted[field], list):
                    profile[field] = extracted[field]
            
            if "details" in extracted and isinstance(extracted["details"], dict):
                profile["details"] = extracted["details"]
            
            if "bio" in extracted:
                profile["bio"] = extracted["bio"]
        else:
            print(f"[DEBUG] No data extracted from conversation analysis")
        
        # Save the new profile
        profiles = load_profiles()
        profiles[user_id] = profile
        save_profiles(profiles)
        
        print(f"[DEBUG] Successfully created profile: {profile_name} with {len(messages)} messages")
        
        return jsonify({
            'success': True,
            'profile': profile,
            'message': f'Successfully imported {len(messages)} messages and created profile "{profile_name}"'
        })
        
    except Exception as e:
        print(f"[ERROR] Error importing conversation: {e}")
        return jsonify({'error': f'Failed to import conversation: {str(e)}'}), 500

@app.route('/api/simulate-conversation', methods=['POST'])
def simulate_conversation():
    try:
        data = request.json
        personality = data.get('personality', {})
        user_message = data.get('userMessage', '')
        conversation_history = data.get('conversationHistory', [])
        difficulty = data.get('difficulty', 'medium')
        mode = data.get('mode', 'practice')
        
        # Build simulation prompt based on personality and context
        simulation_prompt = build_simulation_prompt(personality, user_message, conversation_history, difficulty, mode)
        
        print(f"[DEBUG] Simulation prompt: {simulation_prompt}")
        # Use the same call_gemini method as the working "Get Replies" button
        ai_response = call_gemini(simulation_prompt)
        print(f"[DEBUG] AI response from call_gemini: {ai_response}")
        
        # Extract the response text from the AI response
        if ai_response and 'candidates' in ai_response and len(ai_response['candidates']) > 0:
            try:
                candidate = ai_response['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content'] and len(candidate['content']['parts']) > 0:
                    response_text = candidate['content']['parts'][0]['text'].strip()
                    return jsonify({'response': response_text})
                else:
                    return jsonify({'response': "Hey! That's interesting. Tell me more! 😊"})
            except (KeyError, IndexError) as e:
                print(f"[ERROR] Error parsing simulation response: {e}")
                return jsonify({'response': "Hey! That's interesting. Tell me more! 😊"})
        else:
            return jsonify({'response': "Hey! That's interesting. Tell me more! 😊"})
            
    except Exception as e:
        print(f"Error in conversation simulation: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500

def build_simulation_prompt(personality, user_message, conversation_history, difficulty, mode):
    """Build a comprehensive prompt for conversation simulation"""
    
    # Personality context
    likes = ", ".join(personality.get('likes', []))
    personality_traits = ", ".join(personality.get('personality', []))
    description = personality.get('description', '')
    
    # Difficulty adjustments
    difficulty_settings = {
        'easy': {
            'response_style': 'friendly and encouraging',
            'engagement_level': 'high',
            'complexity': 'simple and direct'
        },
        'medium': {
            'response_style': 'balanced and natural',
            'engagement_level': 'moderate',
            'complexity': 'normal conversation flow'
        },
        'hard': {
            'response_style': 'challenging and selective',
            'engagement_level': 'low',
            'complexity': 'complex and nuanced'
        }
    }
    
    settings = difficulty_settings.get(difficulty, difficulty_settings['medium'])
    
    # Mode adjustments
    mode_instructions = {
        'practice': 'Respond naturally as this personality would in a real conversation.',
        'training': 'Provide helpful responses with occasional challenges to help the user improve.',
        'advanced': 'Create complex scenarios and challenging responses to test advanced skills.'
    }
    
    mode_instruction = mode_instructions.get(mode, mode_instructions['practice'])
    
    # Build conversation context
    conversation_context = ""
    if conversation_history:
        recent_messages = conversation_history[-6:]  # Last 6 messages for context
        conversation_context = "\n".join([
            f"{msg['from']}: {msg['text']}" for msg in recent_messages
        ])
    
    prompt = f"""You are roleplaying as a girl with the following personality:

Name: {personality.get('name', 'Girl')}
Description: {description}
Likes: {likes}
Personality Traits: {personality_traits}

Difficulty Level: {difficulty}
- Response Style: {settings['response_style']}
- Engagement Level: {settings['engagement_level']}
- Complexity: {settings['complexity']}

Mode: {mode}
{mode_instruction}

Recent conversation:
{conversation_context}

User's message: "{user_message}"

Respond as this personality would naturally respond. Keep responses authentic to the personality traits and difficulty level. 
Respond in 1-3 sentences maximum, as if you're texting on Instagram.

Response:"""

    return prompt

def call_gemini_simulation(prompt):
    """Call Gemini API for simulation responses"""
    try:
        # Load API key from settings
        api_key = ""
        settings_file = 'settings.json'
        if os.path.exists(settings_file):
            try:
                with open(settings_file, 'r') as f:
                    settings_data = json.load(f)
                    api_key = settings_data.get('apiKeys', {}).get('geminiApiKey', '')
            except Exception as e:
                print(f"[WARNING] Could not load settings: {e}")
        
        # Fallback to hardcoded key if no settings key
        if not api_key:
            api_key = "AIzaSyBJYFwycbxfwTal-Dfoh-wdb3kN_PhsEJo"
            print(f"[WARNING] Using fallback API key")
        
        if not api_key:
            return "Error: No Gemini API key configured. Please set your API key in Settings."
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.8,
                "maxOutputTokens": 150,
                "topP": 0.9,
                "topK": 40
            }
        }
        
        print(f"[DEBUG] Sending request to Gemini API...")
        response = requests.post(url, headers=headers, json=data)
        
        print(f"[DEBUG] Response status: {response.status_code}")
        print(f"[DEBUG] Response headers: {response.headers}")
        
        if response.status_code != 200:
            print(f"[ERROR] API returned status {response.status_code}: {response.text}")
            return f"API Error: {response.status_code} - {response.text}"
        
        result = response.json()
        print(f"[DEBUG] API Response: {result}")
        
        if 'candidates' in result and len(result['candidates']) > 0:
            try:
                candidate = result['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content'] and len(candidate['content']['parts']) > 0:
                    response_text = candidate['content']['parts'][0]['text'].strip()
                    print(f"[DEBUG] Generated response: {response_text}")
                    return response_text
                else:
                    print(f"[ERROR] Invalid response structure: {candidate}")
                    return "Hey! That's interesting. Tell me more! 😊"
            except (KeyError, IndexError) as e:
                print(f"[ERROR] Error parsing response structure: {e}")
                print(f"[ERROR] Full response: {result}")
                return "Hey! That's interesting. Tell me more! 😊"
        else:
            print(f"[ERROR] No candidates in response: {result}")
            return "Hey! That's interesting. Tell me more! 😊"
            
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request error calling Gemini for simulation: {e}")
        return f"Network Error: {str(e)}"
    except Exception as e:
        print(f"[ERROR] Unexpected error calling Gemini for simulation: {e}")
        return f"Error: {str(e)}"

VERIFY_TOKEN = 'iulian'

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    def load_instagram_business_id():
        settings_file = 'settings.json'
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings_data = json.load(f)
                return settings_data.get('apiKeys', {}).get('instagramBusinessId', '')
        return ''

    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            return (challenge or '', 200)
        return ('Verification failed', 403)

    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify(success=False, error="No JSON payload received"), 400
        profiles = load_profiles()
        for entry in data.get('entry', []):
            for messaging_event in entry.get('messaging', []):
                sender_id = messaging_event['sender']['id']
                recipient_id = messaging_event['recipient']['id']
                timestamp = messaging_event['timestamp'] // 1000  # ms to seconds
                from datetime import datetime
                dt = datetime.fromtimestamp(timestamp)
                message = messaging_event.get('message', {})
                text = message.get('text', '')
                MY_IG_ID = load_instagram_business_id()  # Dynamically loaded
                if sender_id == MY_IG_ID:
                    girl_id = recipient_id
                    sender_label = "Me"
                else:
                    girl_id = sender_id
                    sender_label = profiles.get(girl_id, {}).get('name', f"@{girl_id}")
                profile = profiles.get(girl_id)
                if not profile:
                    profile = {
                        "user_id": girl_id,
                        "name": sender_label,
                        "likes": [],
                        "personality_tags": [],
                        "inside_jokes": [],
                        "details": {},
                        "conversation_goals": [],
                        "previous_messages": [],
                        "memory_vector_ids": []
                    }
                profile["previous_messages"].append({
                    "from": sender_label,
                    "text": text,
                    "timestamp": dt.strftime('%Y-%m-%d %H:%M')
                })
                profile["previous_messages"] = profile["previous_messages"][-50:]
                
                # --- Preference Extraction ---
                extraction_prompt = build_extraction_prompt(text, sender_is_me=(sender_id == MY_IG_ID))
                extraction_response = call_gemini(extraction_prompt)
                extracted = extract_profile_fields(extraction_response)
                if extracted:
                    for field in ["likes", "personality_tags", "inside_jokes"]:
                        if field in extracted and isinstance(extracted[field], list):
                            profile[field] = list(set(profile.get(field, []) + extracted[field]))
                    if "details" in extracted and isinstance(extracted["details"], dict):
                        profile["details"] = {**profile.get("details", {}), **extracted["details"]}
                
                # --- User Profile Analysis (when you send messages) ---
                if sender_id == MY_IG_ID:
                    print(f"[DEBUG] Analyzing your message: {text}")
                    user_profile = load_user_profile()
                    user_extraction_prompt = build_extraction_prompt(text, sender_is_me=True)
                    user_extraction_response = call_gemini(user_extraction_prompt)
                    user_extracted = extract_profile_fields(user_extraction_response)
                    if user_extracted:
                        print(f"[DEBUG] Extracted user data: {user_extracted}")
                        for field in ["likes", "personality_tags", "inside_jokes"]:
                            if field in user_extracted and isinstance(user_extracted[field], list):
                                user_profile[field] = list(set(user_profile.get(field, []) + user_extracted[field]))
                        if "details" in user_extracted and isinstance(user_extracted["details"], dict):
                            user_profile["details"] = {**user_profile.get("details", {}), **user_extracted["details"]}
                        save_user_profile(user_profile)
                        print(f"[DEBUG] Updated user profile with: {user_extracted}")
                    else:
                        print(f"[DEBUG] No user data extracted from your message")
                
                profiles[girl_id] = profile
        save_profiles(profiles)
        return jsonify(success=True), 200
    return ('Method not allowed', 405)

@app.route('/api/photo-ai-response', methods=['POST'])
def photo_ai_response():
    # Accept photo and run OCR+conversation extraction via EasyOCR
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo uploaded'}), 400
    photo = request.files['photo']
    image_bytes = photo.read()
    import numpy as np
    import cv2
    import easyocr
    from PIL import Image
    import io

    # Load image with PIL and convert to numpy array
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image_np = np.array(image)

    # Run EasyOCR
    reader = easyocr.Reader(['en', 'ro'], gpu=False)
    results = reader.readtext(image_np, detail=1)

    # Each result: (bbox, text, conf)
    # We'll use the y-coordinate of the top-left bbox for order, x for sender
    messages = []
    for bbox, text, conf in results:
        if conf < 0.5 or not text.strip():
            continue
        # bbox: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
        x = min([pt[0] for pt in bbox])
        y = min([pt[1] for pt in bbox])
        messages.append({'text': text.strip(), 'x': x, 'y': y})

    # Sort by y (top to bottom)
    messages.sort(key=lambda m: m['y'])

    # Heuristic: left half = Girl, right half = Boy
    width = image_np.shape[1]
    conversation = []
    for m in messages:
        sender = 'Girl' if m['x'] < width / 2 else 'Boy'
        conversation.append({'from': sender, 'text': m['text']})

    # Optionally, pass the conversation to Gemini for reply suggestions
    # (If you want to skip Gemini, just return the conversation array)
    # --- Gemini reply suggestion logic ---
    api_key = ''
    settings_file = 'settings.json'
    import os, json as pyjson
    if os.path.exists(settings_file):
        try:
            with open(settings_file, 'r') as f:
                settings_data = pyjson.load(f)
                api_key = settings_data.get('apiKeys', {}).get('geminiApiKey', '')
        except Exception as e:
            print(f"[WARNING] Could not load settings: {e}")
    if not api_key:
        return jsonify({'conversation': conversation, 'reply_1': '', 'reply_2': '', 'reply_3': ''})

    # Load user profile for details
    user_profile = load_user_profile() or {}
    my_name = user_profile.get('name', '')
    my_gender = user_profile.get('gender', '')
    my_age = user_profile.get('age', '')
    my_bio = user_profile.get('bio', '')

    # Limit conversation length to avoid token limits
    max_messages = 15  # Keep only the last 15 messages to stay within token limits
    if len(conversation) > max_messages:
        conversation = conversation[-max_messages:]
        print(f"[INFO] Conversation truncated to last {max_messages} messages to avoid token limits")

    # Build prompt for Gemini
    tone = request.form.get('tone', '').strip()
    goal = request.form.get('goal', '').strip()
    
    conversation_text = '\n'.join([f"{m['from']}: {m['text']}" for m in conversation])
    print(f"[INFO] Conversation length: {len(conversation)} messages, {len(conversation_text)} characters")
    
    prompt = (
        "You are an AI assistant. Here is a chat conversation between a Girl and a Boy. "
        f"My info: Name: {my_name}, Gender: {my_gender}, Age: {my_age}, Bio: {my_bio}. "
        "The conversation is in the correct order. "
        + (f"The desired tone for the reply is: {tone}. " if tone else "")
        + (f"The conversation goal is: {goal}. " if goal else "")
        + "Suggest 3 different replies for the boy to answer back to the girl. "
        "Conversation:\n" + conversation_text + "\n\n"
        "IMPORTANT: Output ONLY a valid JSON object in this exact format with no additional text:\n"
        '{"reply_1": "first reply here", "reply_2": "second reply here", "reply_3": "third reply here"}\n\n'
        "Make sure all 3 replies are different and engaging. Each reply should be unique and provide different conversation directions."
    )
    print("[PHOTO AI PROMPT TO GEMINI]:\n" + prompt + "\n" + "-"*40)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192}
    }
    import requests
    resp = requests.post(url, headers=headers, json=data)
    try:
        resp.raise_for_status()
        result = resp.json()
        import re
        raw = result['candidates'][0]['content']['parts'][0]['text']
        print(f"[DEBUG] Raw Gemini response: {raw}")
        
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            parsed = pyjson.loads(match.group(0))
            print(f"[DEBUG] Parsed JSON: {parsed}")
            
            reply_1 = parsed.get('reply_1', '')
            reply_2 = parsed.get('reply_2', '')
            reply_3 = parsed.get('reply_3', '')
            
            # Debug: Check which replies are empty
            print(f"[DEBUG] reply_1: '{reply_1}' (empty: {not reply_1})")
            print(f"[DEBUG] reply_2: '{reply_2}' (empty: {not reply_2})")
            print(f"[DEBUG] reply_3: '{reply_3}' (empty: {not reply_3})")
            
            # If any replies are empty, try to generate fallback responses
            if not reply_1 or not reply_2 or not reply_3:
                print("[DEBUG] Some replies are empty, checking alternative parsing...")
                
                # Try alternative parsing - sometimes AI might use different key names
                all_replies = []
                for key in parsed:
                    if 'reply' in key.lower() and parsed[key]:
                        all_replies.append(parsed[key])
                
                # Fill missing replies with fallbacks if we have some
                if len(all_replies) >= 1 and not reply_1:
                    reply_1 = all_replies[0] if len(all_replies) > 0 else "That's interesting!"
                if len(all_replies) >= 2 and not reply_2:
                    reply_2 = all_replies[1] if len(all_replies) > 1 else "Tell me more about that."
                if len(all_replies) >= 3 and not reply_3:
                    reply_3 = all_replies[2] if len(all_replies) > 2 else "I'd love to hear your thoughts on this."
            
            return jsonify({
                'conversation': conversation,
                'reply_1': reply_1,
                'reply_2': reply_2,
                'reply_3': reply_3
            })
        else:
            print("[DEBUG] No JSON found in response, returning empty replies")
            return jsonify({'conversation': conversation, 'reply_1': '', 'reply_2': '', 'reply_3': ''})
    except Exception as e:
        print(f"[x] Gemini API error: {e}")
        if hasattr(resp, 'text'):
            print(f"[x] Response text: {resp.text}")
        return jsonify({'conversation': conversation, 'reply_1': '', 'reply_2': '', 'reply_3': ''})

@app.route('/api/regenerate-replies', methods=['POST'])
def regenerate_replies():
    """Generate new AI replies for an existing conversation"""
    try:
        # Get the conversation from form data
        conversation_json = request.form.get('conversation')
        if not conversation_json:
            return jsonify({'error': 'No conversation provided'}), 400
            
        conversation = json.loads(conversation_json)
        
        # Load API key
        api_key = ''
        settings_file = 'settings.json'
        if os.path.exists(settings_file):
            try:
                with open(settings_file, 'r') as f:
                    settings_data = json.load(f)
                    api_key = settings_data.get('apiKeys', {}).get('geminiApiKey', '')
            except Exception as e:
                print(f"[WARNING] Could not load settings: {e}")
        
        if not api_key:
            return jsonify({'error': 'No API key configured'}), 400

        # Load user profile for details
        user_profile = load_user_profile() or {}
        my_name = user_profile.get('name', '')
        my_gender = user_profile.get('gender', '')
        my_age = user_profile.get('age', '')
        my_bio = user_profile.get('bio', '')

        # Limit conversation length to avoid token limits
        max_messages = 15  # Keep only the last 15 messages to stay within token limits
        if len(conversation) > max_messages:
            conversation = conversation[-max_messages:]
            print(f"[INFO] Regenerate: Conversation truncated to last {max_messages} messages to avoid token limits")

        # Build prompt for Gemini
        tone = request.form.get('tone', '').strip()
        goal = request.form.get('goal', '').strip()
        
        conversation_text = '\n'.join([f"{m['from']}: {m['text']}" for m in conversation])
        print(f"[INFO] Regenerate: Conversation length: {len(conversation)} messages, {len(conversation_text)} characters")
        
        prompt = (
            "You are an AI assistant. Here is a chat conversation between a Girl and a Boy. "
            f"My info: Name: {my_name}, Gender: {my_gender}, Age: {my_age}, Bio: {my_bio}. "
            "The conversation is in the correct order. "
            + (f"The desired tone for the reply is: {tone}. " if tone else "")
            + (f"The conversation goal is: {goal}. " if goal else "")
            + "Generate 3 completely different and unique replies for the boy to answer back to the girl. "
            "Conversation:\n" + conversation_text + "\n\n"
            "IMPORTANT: Output ONLY a valid JSON object in this exact format with no additional text:\n"
            '{"reply_1": "first reply here", "reply_2": "second reply here", "reply_3": "third reply here"}\n\n'
            "Make sure all 3 replies are different, creative, and engaging. Each reply should offer a different conversation direction or tone."
        )
        
        print("[REGENERATE PROMPT TO GEMINI]:\n" + prompt + "\n" + "-"*40)
        
        # Call Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ],
            "generationConfig": {"temperature": 0.8, "maxOutputTokens": 8192}
        }
        
        import requests
        resp = requests.post(url, headers=headers, json=data)
        
        try:
            resp.raise_for_status()
            result = resp.json()
            import re
            raw = result['candidates'][0]['content']['parts'][0]['text']
            print(f"[DEBUG] Raw Gemini regenerate response: {raw}")
            
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                parsed = json.loads(match.group(0))
                print(f"[DEBUG] Parsed regenerate JSON: {parsed}")
                
                reply_1 = parsed.get('reply_1', '')
                reply_2 = parsed.get('reply_2', '')
                reply_3 = parsed.get('reply_3', '')
                
                # Debug: Check which replies are empty
                print(f"[DEBUG] regenerate reply_1: '{reply_1}' (empty: {not reply_1})")
                print(f"[DEBUG] regenerate reply_2: '{reply_2}' (empty: {not reply_2})")
                print(f"[DEBUG] regenerate reply_3: '{reply_3}' (empty: {not reply_3})")
                
                # If any replies are empty, try to generate fallback responses
                if not reply_1 or not reply_2 or not reply_3:
                    print("[DEBUG] Some regenerate replies are empty, checking alternative parsing...")
                    
                    # Try alternative parsing - sometimes AI might use different key names
                    all_replies = []
                    for key in parsed:
                        if 'reply' in key.lower() and parsed[key]:
                            all_replies.append(parsed[key])
                    
                    # Fill missing replies with fallbacks if we have some
                    if len(all_replies) >= 1 and not reply_1:
                        reply_1 = all_replies[0] if len(all_replies) > 0 else "That's interesting!"
                    if len(all_replies) >= 2 and not reply_2:
                        reply_2 = all_replies[1] if len(all_replies) > 1 else "Tell me more about that."
                    if len(all_replies) >= 3 and not reply_3:
                        reply_3 = all_replies[2] if len(all_replies) > 2 else "I'd love to hear your thoughts on this."
                
                return jsonify({
                    'reply_1': reply_1,
                    'reply_2': reply_2,
                    'reply_3': reply_3
                })
            else:
                print("[DEBUG] No JSON found in regenerate response")
                return jsonify({'error': 'Failed to parse AI response'}), 500
        except Exception as e:
            print(f"[x] Gemini regenerate API error: {e}")
            if hasattr(resp, 'text'):
                print(f"[x] Regenerate Response text: {resp.text}")
            return jsonify({'error': 'Failed to generate AI responses'}), 500
            
    except Exception as e:
        print(f"[x] Regenerate endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    global current_user
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400
    
    # Authenticate using users.json
    if authenticate_user(username, password):
        current_user = username
        user_data = {
            'username': username,
            'profile': load_user_profile(username),
            'isAuthenticated': True
        }
        return jsonify({'success': True, 'user': user_data})
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    global current_user
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    profile_data = data.get('profile', {})
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400
    
    # Check if user already exists
    users = load_users()
    if username in users:
        return jsonify({'success': False, 'error': 'Username already exists'}), 409
    
    # Create new user in users.json
    create_user(username, password, email, is_admin=False)
    
    # Set current user
    current_user = username
    
    # Create user-specific data directories
    user_data_dir = os.path.join(DATA_DIR, f'users/{username}')
    os.makedirs(user_data_dir, exist_ok=True)
    
    # Create empty profiles for new user
    user_profiles_path = os.path.join(user_data_dir, 'profiles.json')
    with open(user_profiles_path, 'w', encoding='utf-8') as f:
        json.dump({}, f, indent=2, ensure_ascii=False)
    
    # Create user profile
    user_profile = {
        'name': profile_data.get('name', ''),
        'gender': profile_data.get('gender', ''),
        'age': profile_data.get('age', 18),
        'bio': profile_data.get('bio', ''),
        'interests': profile_data.get('interests', []),
        'personality': profile_data.get('personality', []),
        'goals': profile_data.get('goals', []),
        'preferences': profile_data.get('preferences', {
            'defaultTone': 'flirty',
            'enableNotifications': True,
            'autoGenerate': False
        })
    }
    
    # Save user profile in user-specific directory
    user_profile_path = os.path.join(user_data_dir, 'user_profile.json')
    with open(user_profile_path, 'w', encoding='utf-8') as f:
        json.dump(user_profile, f, indent=2, ensure_ascii=False)
    
    # Create empty settings for new user
    user_settings = {
        "apiKeys": {
            "geminiApiKey": "",
            "instagramBusinessId": "",
            "telegramBotToken": "",
            "telegramChatId": ""
        },
        "preferences": {
            "aiTemperature": 0.7,
            "autoExtractPreferences": True,
            "autoGenerateReplies": False,
            "defaultTone": profile_data.get('preferences', {}).get('defaultTone', 'flirty'),
            "enableWebhook": True,
            "maxMessagesPerProfile": 50,
            "sendTelegramNotifications": True
        }
    }
    
    user_settings_path = os.path.join(user_data_dir, 'settings.json')
    with open(user_settings_path, 'w', encoding='utf-8') as f:
        json.dump(user_settings, f, indent=2, ensure_ascii=False)
    
    user_data = {
        'username': username,
        'profile': user_profile,
        'isAuthenticated': True
    }
    
    return jsonify({'success': True, 'user': user_data})

@app.route('/api/auth/set-user', methods=['POST'])
def set_current_user():
    """Set the current user for this session"""
    global current_user
    data = request.get_json()
    username = data.get('username')
    if username:
        current_user = username
        return jsonify({'success': True, 'current_user': current_user})
    return jsonify({'success': False, 'error': 'Username required'}), 400

@app.route('/api/auth/users', methods=['GET'])
def get_all_users():
    """Get all registered users (admin only)"""
    global current_user
    
    # Check if current user is admin
    users = load_users()
    if not current_user or current_user not in users or not users[current_user].get('is_admin', False):
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    
    # Return users without passwords
    safe_users = {}
    for username, user_data in users.items():
        safe_users[username] = {
            'email': user_data.get('email', ''),
            'created_at': user_data.get('created_at', ''),
            'is_admin': user_data.get('is_admin', False)
        }
    
    return jsonify({'success': True, 'users': safe_users})

@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    data = request.get_json()
    username = data.get('username')
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    
    users = load_users()
    if username in users and users[username]['password'] == old_password:
        users[username]['password'] = new_password
        save_users(users)
        return jsonify({'success': True, 'message': 'Password changed successfully'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# Serve React app for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        # Let Flask handle API routes
        return app.send_static_file('index.html')
    
    # Serve static files if they exist
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Serve index.html for all other routes (React Router)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 