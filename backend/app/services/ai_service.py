import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
        self.model = "gemini-2.5-flash"

    def process_complaint(self, complaint_description: str):
        prompt = f"""
        Analyze the following complaint description and provide:
        1. A concise summary of the complaint.
        2. A suggested temporary response to the user that has an solution to the problem like give some solution that may work.
        3. A category for the complaint (e.g., 'Technical Issue', 'Billing Inquiry', 'Feature Request', 'Service Disruption', 'General Feedback').

        Complaint Description:
        "{complaint_description}"

        Please format your response as a JSON object with the following keys:
        'summary': '...',
        'suggested_response': '...',
        'category': '...'
        """
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]
        generate_content_config = types.GenerateContentConfig(
           
            response_mime_type="text/plain",
        )
        try:
            response_text = ""
            for chunk in self.client.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=generate_content_config,
            ):
                response_text += chunk.text or ""
            print('Raw Gemini response:', response_text)
            import json
            try:
                parsed_output = json.loads(response_text)
            except Exception:
                # Try to extract JSON substring if present
                import re
                match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if match:
                    parsed_output = json.loads(match.group(0))
                else:
                    raise ValueError('Gemini did not return valid JSON')
            return parsed_output
        except Exception as e:
            print(f"Error processing complaint with Gemini AI: {e}")
            return {
                "summary": "AI processing failed.",
                "suggested_response": "We are currently experiencing technical difficulties. Please bear with us.",
                "category": "Uncategorized"
            }