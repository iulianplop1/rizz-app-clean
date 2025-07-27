import requests
import time
from datetime import datetime
from flask import Flask, request, jsonify
import os
import json

# --- CONFIG ---
ACCESS_TOKEN = "IGAAOVfq7OEChBZAE81dVdYQ2pyLTJPY2U3b29ZARDFtSk9nMzFLQzRHY0tOYl9PeEk2ZAFBNWDZA0ZAmd1YUtsSVdvT215OVpOWmEwWjRfaDd3aHlOQXFLZADVQYzI0eGhvT2JKWDhzLU1VY0I5ZAEF2Q3Q5UVZAOeGFMVWNfZA3FPaTRRbwZDZD"
POLL_INTERVAL = 30  # seconds

# --- HELPERS ---
def get_my_pages(access_token):
    url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={access_token}"
    resp = requests.get(url)
    try:
        resp.raise_for_status()
    except requests.HTTPError:
        print(f"\n[ERROR] Facebook API response: {resp.text}\n")
        raise
    return resp.json()['data']

def get_page_ig_id(page_id, page_access_token):
    url = f"https://graph.facebook.com/v19.0/{page_id}?fields=instagram_business_account&access_token={page_access_token}"
    resp = requests.get(url)
    resp.raise_for_status()
    ig_info = resp.json().get('instagram_business_account')
    return ig_info['id'] if ig_info else None

def get_ig_conversations(ig_id, page_access_token):
    # Use parentheses for nested fields in Graph API
    url = (
        f"https://graph.facebook.com/v19.0/{ig_id}/conversations?platform=instagram"
        f"&fields=participants,messages.limit(1)(message,from,to,created_time)"
        f"&access_token={page_access_token}"
    )
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json().get('data', [])

def get_sender_name(participants, sender_id):
    for p in participants:
        if p['id'] == sender_id:
            return p.get('name', f"@{sender_id}")
    return f"@{sender_id}"

def print_new_message(msg, participants):
    sender_id = msg['from']['id']
    sender_name = get_sender_name(participants, sender_id)
    text = msg.get('message', '')
    ts = msg.get('created_time')
    dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S%z")
    print(f"\n🟢 New message from: {sender_name}")
    print(f"🕒 At: {dt.strftime('%Y-%m-%d %H:%M')}")
    print(f'💬 Message: "{text}"')

PROFILE_PATH = "profiles.json"

def load_profiles():
    if not os.path.exists(PROFILE_PATH):
        return {}
    with open(PROFILE_PATH, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except Exception:
            return {}

def save_profiles(profiles):
    with open(PROFILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(profiles, f, indent=2, ensure_ascii=False)

def get_or_create_profile(user_id, username=None):
    profiles = load_profiles()
    if user_id in profiles:
        # Ensure all new fields exist for old profiles
        profile = profiles[user_id]
        profile.setdefault("likes", [])
        profile.setdefault("personality_tags", [])
        profile.setdefault("inside_jokes", [])
        profile.setdefault("details", {})
        profile.setdefault("conversation_goals", [])
        profile.setdefault("previous_messages", [])
        profile.setdefault("memory_vector_ids", [])
        return profile, profiles
    # Default profile structure
    profile = {
        "user_id": user_id,
        "username": username or user_id,
        "name": username or user_id,
        "tone_preference": "flirty",
        "likes": [],
        "personality_tags": [],
        "inside_jokes": [],
        "details": {},
        "conversation_goals": [],
        "previous_messages": [],
        "memory_vector_ids": []
    }
    profiles[user_id] = profile
    save_profiles(profiles)
    return profile, profiles

USER_PROFILE_PATH = "user_profile.json"
def load_user_profile():
    if not os.path.exists(USER_PROFILE_PATH):
        # Default user info
        user_profile = {
            "name": "Iulian",
            "gender": "male",
            "age": 19,
            "interests": ["fitness", "travel", "music"],
            "personality": ["funny", "confident", "adventurous"],
            "bio": "I'm a 19-year-old guy who loves fitness, travel, and good conversation."
        }
        with open(USER_PROFILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(user_profile, f, indent=2, ensure_ascii=False)
        return user_profile
    with open(USER_PROFILE_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def log_my_reply(girl_id, text, timestamp=None):
    profiles = load_profiles()
    profile = profiles.get(girl_id)
    if not profile:
        return False
    if not timestamp:
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    profile["previous_messages"].append({
        "from": "Me",
        "text": text,
        "timestamp": timestamp
    })
    profile["previous_messages"] = profile["previous_messages"][-50:]
    profiles[girl_id] = profile
    save_profiles(profiles)
    return True

def main():
    seen_message_ids = set()
    print("Starting Instagram DM listener...")
    # 1. Get my Facebook Pages
    pages = get_my_pages(ACCESS_TOKEN)
    if not pages:
        print("No Facebook Pages found.")
        return
    page = pages[0]
    page_id = page['id']
    page_access_token = page['access_token']
    # 2. Get IG Business Account ID
    ig_id = get_page_ig_id(page_id, page_access_token)
    if not ig_id:
        print("No Instagram Business Account connected to this page.")
        return
    print(f"Monitoring IG Business Account ID: {ig_id}")
    while True:
        try:
            # 3. Fetch IG conversations
            conversations = get_ig_conversations(ig_id, page_access_token)
            for conv in conversations:
                participants = conv.get('participants', {}).get('data', [])
                messages = conv.get('messages', {}).get('data', [])
                if not messages:
                    continue
                msg = messages[0]
                msg_id = msg['id']
                # Only print if not seen and not sent by me
                my_ids = [p['id'] for p in participants if p.get('username') == page.get('name') or p.get('id') == ig_id]
                if msg_id not in seen_message_ids and msg['from']['id'] not in my_ids:
                    print_new_message(msg, participants)
                    seen_message_ids.add(msg_id)
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    app = Flask(__name__)

    VERIFY_TOKEN = "iulian"

    # Map Instagram user IDs to custom names
    USER_ID_TO_NAME = {
        "1367480801045644": "Jessica",  # Example: replace with your own mappings
        # Add more as needed
    }

    def load_instagram_business_id():
        settings_file = 'settings.json'
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings_data = json.load(f)
                return settings_data.get('apiKeys', {}).get('instagramBusinessId', '')
        return ''

    MY_IG_ID = load_instagram_business_id()  # Dynamically loaded

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

    def call_gemini_extraction(prompt):
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
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 512}
        }
        resp = requests.post(url, headers=headers, json=data)
        try:
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"[x] Gemini extraction API error: {e}, {resp.text}")
            return None

    def extract_profile_fields(ai_response):
        import re, json as pyjson
        if not ai_response:
            return {}
        try:
            raw = ai_response['candidates'][0]['content'].get('parts', [{}])[0].get('text', '')
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                return pyjson.loads(match.group(0))
            else:
                # Try a more lenient regex (greedy match)
                match2 = re.search(r'\{.*\}', raw, re.DOTALL)
                if match2:
                    try:
                        return pyjson.loads(match2.group(0))
                    except Exception as e2:
                        print(f"[x] Fallback JSON parse error: {e2}")
                print(f"[x] Gemini extraction output did not contain JSON. Raw: {raw}")
        except Exception as e:
            print(f"[x] Failed to parse Gemini extraction output: {e}")
            print(f"[x] Raw extraction response: {ai_response}")
        return {}

    @app.route('/webhook', methods=['GET', 'POST'])
    def webhook():
        if request.method == 'GET':
            # Verification challenge from Meta
            mode = request.args.get('hub.mode')
            token = request.args.get('hub.verify_token')
            challenge = request.args.get('hub.challenge')
            if mode == 'subscribe' and token == VERIFY_TOKEN:
                return (challenge or '', 200)
            return ('Verification failed', 403)

        if request.method == 'POST':
            data = request.json
            if not data:
                return (jsonify(success=False, error="No JSON payload received"), 400)
            # Instagram webhook structure
            for entry in data.get('entry', []):
                for messaging_event in entry.get('messaging', []):
                    sender_id = messaging_event['sender']['id']
                    recipient_id = messaging_event['recipient']['id']
                    timestamp = messaging_event['timestamp'] // 1000  # ms to seconds
                    dt = datetime.fromtimestamp(timestamp)
                    message = messaging_event.get('message', {})
                    text = message.get('text', '')

                    if sender_id == MY_IG_ID:
                        # Message sent by you, so recipient_id is the girl's IG ID
                        girl_id = recipient_id
                        profile, profiles = get_or_create_profile(girl_id)
                        sender_label = "Me"
                        # Log your message only, do NOT trigger AI
                        profile["previous_messages"].append({
                            "from": sender_label,
                            "text": text,
                            "timestamp": dt.strftime('%Y-%m-%d %H:%M')
                        })
                        profile["previous_messages"] = profile["previous_messages"][-50:]
                        profiles[girl_id] = profile
                        save_profiles(profiles)
                        print(f"\n🟢 New message from: {sender_label}")
                        print(f"🕒 At: {dt.strftime('%Y-%m-%d %H:%M')}")
                        print(f'💬 Message: "{text}"')
                        # --- Preferences Extraction for my own messages ---
                        user_profile = load_user_profile()
                        extraction_prompt = build_extraction_prompt(text, sender_is_me=True)
                        extraction_response = call_gemini_extraction(extraction_prompt)
                        extracted = extract_profile_fields(extraction_response)
                        # Update user profile fields
                        if extracted:
                            for field in ["likes", "personality_tags", "inside_jokes"]:
                                if field in extracted and isinstance(extracted[field], list):
                                    user_profile[field] = list(set(user_profile.get(field, []) + extracted[field]))
                            if "details" in extracted and isinstance(extracted["details"], dict):
                                user_profile["details"] = {**user_profile.get("details", {}), **extracted["details"]}
                            with open(USER_PROFILE_PATH, 'w', encoding='utf-8') as f:
                                json.dump(user_profile, f, indent=2, ensure_ascii=False)
                            print(f"[DEBUG] Updated user_profile.json with: {extracted}")
                        else:
                            print(f"[DEBUG] No new preferences extracted for user profile.")
                        continue  # Skip the rest of the loop for your own messages

                    else:
                        # Message sent by her
                        girl_id = sender_id
                        profile, profiles = get_or_create_profile(girl_id)
                        sender_label = profile.get("name", f"@{girl_id}")
                        USER_ID_TO_NAME[girl_id] = sender_label
                        # Log her message
                        profile["previous_messages"].append({
                            "from": sender_label,
                            "text": text,
                            "timestamp": dt.strftime('%Y-%m-%d %H:%M')
                        })
                        profile["previous_messages"] = profile["previous_messages"][-50:]
                        profiles[girl_id] = profile
                        save_profiles(profiles)
                        print(f"\n🟢 New message from: {sender_label}")
                        print(f"🕒 At: {dt.strftime('%Y-%m-%d %H:%M')}")
                        print(f'💬 Message: "{text}"')

                    # --- AI Wingman Logic ---
                    def send_telegram_message(text):
                        TELEGRAM_BOT_TOKEN = "8154549688:AAGJZ2caoEBX3zgH-g-HOz_yh8pCB_pvZeo"
                        TELEGRAM_CHAT_ID = "1765306779"
                        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                        data = {"chat_id": TELEGRAM_CHAT_ID, "text": text}
                        try:
                            resp = requests.post(url, data=data)
                            print(f"[→] Sent message to Telegram: {resp.status_code}")
                        except Exception as e:
                            print(f"[x] Failed to send Telegram message: {e}")

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
                            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
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
                            raw = ai_response['candidates'][0]['content']['parts'][0]['text']
                            match = re.search(r'\{[\s\S]*\}', raw)
                            if match:
                                replies = pyjson.loads(match.group(0))
                                return [replies.get(f'reply_{i+1}', '') for i in range(3)]
                        except Exception as e:
                            print(f"[x] Failed to parse Gemini output: {e}")
                        return []

                    if sender_id != MY_IG_ID:
                        # Only trigger AI reply for her messages
                        def build_prompt(profile, last_message):
                            user_profile = load_user_profile()
                            my_likes = ", ".join(user_profile.get("likes", []))
                            my_personality = ", ".join(user_profile.get("personality", []))
                            my_personality_tags = ", ".join(user_profile.get("personality_tags", []))
                            my_jokes = "; ".join(user_profile.get("inside_jokes", []))
                            my_details = "; ".join([f"{k}: {v}" for k, v in user_profile.get("details", {}).items()])
                            my_bio = user_profile.get("bio", "")
                            my_name = user_profile.get("name", "")
                            my_gender = user_profile.get("gender", "")
                            my_age = user_profile.get("age", "")

                            user_info = (
                                f"My info:\n"
                                f"Name: {my_name}\n"
                                f"Gender: {my_gender}\n"
                                f"Age: {my_age}\n"
                                f"Likes: {my_likes}\n"
                                f"Personality: {my_personality}\n"
                                f"Personality tags: {my_personality_tags}\n"
                                f"Inside jokes: {my_jokes}\n"
                                f"Details: {my_details}\n"
                                f"Bio: {my_bio}\n"
                            )

                            likes = ", ".join(profile.get("likes", []))
                            personality = ", ".join(profile.get("personality_tags", []))
                            jokes = "; ".join(profile.get("inside_jokes", []))
                            details = "; ".join([f"{k}: {v}" for k, v in profile.get("details", {}).items()])
                            goals = "; ".join(profile.get("conversation_goals", []))
                            history = "\n".join(
                                [f"{m['from']}: {m['text']}" for m in profile.get("previous_messages", [])[-20:]]
                            )
                            return (
                                f"You are the user's flirty texting assistant.\n"
                                f"{user_info}"
                                f"Girl's name: {profile.get('name')}\n"
                                f"Likes: {likes}\n"
                                f"Personality: {personality}\n"
                                f"Inside jokes: {jokes}\n"
                                f"Details: {details}\n"
                                f"Conversation goals: {goals}\n"
                                f"Recent conversation:\n{history}\n"
                                f"Her last message: '{last_message}'\n"
                                f"Suggest 3 flirty replies. Output as JSON with keys reply_1, reply_2, reply_3, each containing only the reply text. Do not include any explanations or context, only the replies."
                            )

                        # 1. Build prompt
                        prompt = build_prompt(profile, text)
                        # [TESTING] Send the prompt to Telegram so you can see it
                        send_telegram_message("[TEST] Prompt to Gemini:\n\n" + prompt)
                        # 2. Call Gemini
                        ai_response = call_gemini(prompt)
                        # 3. Extract replies
                        reply_options = extract_replies(ai_response)
                        # 4. Format and send to Telegram
                        if reply_options:
                            message = "Here are 3 flirty reply options:\n\n" + "\n\n".join([
                                f"{i+1}. {r}" for i, r in enumerate(reply_options)
                            ])
                        else:
                            message = "[AI Wingman] Sorry, couldn't generate replies."
                        send_telegram_message(message)

                    # --- Preferences Extraction (for both her and my messages, always runs) ---
                    # Determine which profile to update (her or mine)
                    if sender_id == MY_IG_ID:
                        # Update my user profile
                        user_profile = load_user_profile()
                        extraction_prompt = build_extraction_prompt(text, sender_is_me=True)
                        extraction_response = call_gemini_extraction(extraction_prompt)
                        extracted = extract_profile_fields(extraction_response)
                        # Update user profile fields
                        if extracted:
                            for field in ["likes", "personality_tags", "inside_jokes"]:
                                if field in extracted and isinstance(extracted[field], list):
                                    user_profile[field] = list(set(user_profile.get(field, []) + extracted[field]))
                            if "details" in extracted and isinstance(extracted["details"], dict):
                                user_profile["details"] = {**user_profile.get("details", {}), **extracted["details"]}
                            with open(USER_PROFILE_PATH, 'w', encoding='utf-8') as f:
                                json.dump(user_profile, f, indent=2, ensure_ascii=False)
                    else:
                        # Update her profile
                        extraction_prompt = build_extraction_prompt(text, sender_is_me=False)
                        extraction_response = call_gemini_extraction(extraction_prompt)
                        extracted = extract_profile_fields(extraction_response)
                        if extracted:
                            for field in ["likes", "personality_tags", "inside_jokes"]:
                                if field in extracted and isinstance(extracted[field], list):
                                    profile[field] = list(set(profile.get(field, []) + extracted[field]))
                            if "details" in extracted and isinstance(extracted["details"], dict):
                                profile["details"] = {**profile.get("details", {}), **extracted["details"]}
                            profiles[girl_id] = profile
                            save_profiles(profiles)

            return (jsonify(success=True), 200)
        # Explicit fallback return
        return ('Method not allowed', 405)

    if __name__ == '__main__':
        app.run(port=5000) 