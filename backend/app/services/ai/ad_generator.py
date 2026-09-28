import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is not set in .env"
    )


client = genai.Client(
    api_key=GEMINI_API_KEY
)


def generate_ad(
    business_name: str,
    product_name: str,
    product_description: str | None,
    price: float,
    platform: str,
    objective: str,
    tone: str,
    additional_instructions: str | None = None,
):
    product_description = (
        product_description
        or "No product description provided."
    )

    additional_instructions = (
        additional_instructions
        or "No additional instructions."
    )

    prompt = f"""
You are the AI Marketing Strategist inside BizPilot AI,
an AI-powered business co-pilot for small businesses.

Create a realistic social media advertisement for
the following business and product.

BUSINESS
Business name: {business_name}

PRODUCT
Product name: {product_name}
Product description: {product_description}
Price: BDT {price}

CAMPAIGN
Platform: {platform}
Objective: {objective}
Content tone: {tone}

ADDITIONAL INSTRUCTIONS
{additional_instructions}

IMPORTANT RULES:

1. Do not invent product features.
2. Do not invent discounts unless explicitly requested.
3. Keep the price exactly as provided.
4. Make the copy natural for the selected platform.
5. Match the requested tone.
6. Focus on the selected campaign objective.
7. Make the CTA relevant to the objective.
8. Keep hashtags relevant and not excessive.
9. Target realistic customers.
10. Give a practical recommended posting time.
11. Make the advertisement suitable for a
    Bangladesh-based small business.
12. Do not make fake claims.
13. Return only valid JSON.

Generate:

- primary_text
- headline
- description
- cta
- hashtags
- audience
- best_time
- strategy
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "primary_text": {
                            "type": "string"
                        },
                        "headline": {
                            "type": "string"
                        },
                        "description": {
                            "type": "string"
                        },
                        "cta": {
                            "type": "string"
                        },
                        "hashtags": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "audience": {
                            "type": "string"
                        },
                        "best_time": {
                            "type": "string"
                        },
                        "strategy": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "primary_text",
                        "headline",
                        "description",
                        "cta",
                        "hashtags",
                        "audience",
                        "best_time",
                        "strategy"
                    ]
                }
            )
        )

        output_text = response.text

        if not output_text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        try:
            return json.loads(output_text)

        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Gemini returned invalid JSON."
            ) from exc

    except Exception as exc:
        print(
            "Gemini ad generation error:",
            repr(exc)
        )

        raise
    