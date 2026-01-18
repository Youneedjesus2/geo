import os
import json
import re
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv
from typing import Dict


load_dotenv()

# set up clients
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ============================================
# ERROR CLASSES (Railway-Oriented Programming)
# ============================================

class AuditError:
    """
    WHY: standardize error handling
    WHEN: Any error that user needs to know about
    """
    def __init__(self, source: str, error_type: str, message: str, fix_hint: str = ""):
        self.source = source          # "gemini" or "openai"
        self.error_type = error_type  # "MODEL_ERROR", "API_ERROR", etc.
        self.message = message        # What went wrong
        self.fix_hint = fix_hint      # How to fix it

    # to convert the error to a dictionary which can be easily serialized to JSON. serializing is the process of converting a Python object into a JSON-compatible format.
    def to_dict(self):
        return {
            "source": self.source,
            "error_type": self.error_type,
            "message": self.message,
            "fix_hint": self.fix_hint
        }

# ================================================
# PROMPTS (Strategy Pattern - we can swap these)
# ============================================
## STRATEGY PATTERN is a design pattern that allows you to select an algorithm at runtime. here we are using it to select the search prompt or the analysis prompt.
def get_search_prompt(business_name: str, city: str) -> str:
    """
    WHY: Separate prompts from logic (Single Responsibility)
    REASONING: If we want to change the prompt, we change it ONCE here
    """
    return f"""Find the following real-world information about "{business_name}" in "{city}":

    1. Exact street address (number, street, suite/unit if any)
    2. Phone number (format: XXX-XXX-XXXX)
    3. Operating hours for each day (Monday-Sunday)
    4. Any special offers for new customers/patients

    Format your response as:
    Address: [full address]
    Phone: [phone number]
    Hours: [list each day]
    Offers: [list any offers or write "None found"]
    """

def get_analysis_prompt(business_name:str, search_results: str) -> str:
    """
    WHY: GPT's job is ANALYSIS, not search
    """
    return f"""You are analyzing search results about "{business_name}".

    SEARCH RESULTS:
    {search_results}

    Your job: Extract structured data and identify any inconsistencies or missing info.
    If information is missing or unclear, explicitly state "NOT FOUND" for that field.
    """

# ============================================
# GEMINI HANDLER (with Google Search grounding)
# ============================================

def query_gemini(business_name: str, city: str) -> Dict: # return a dictionary with the search results
    """
    WHY: Isolated function for Gemini (Single Responsibility)
    RETURNS: Dictionary with 'success', 'data', and 'error' keys
    
    REASONING: Always return the SAME shape so caller doesn't need to guess
    """
    try:
        # Use Gemini 2.5 Flash (stable model with search grounding support)
        # Alternative: 'gemini-3-pro-preview' or 'gemini-3-flash-preview'
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            tools='google_search_retrieval'  # Enable Google Search grounding
        )
        
        response = model.generate_content(
            get_search_prompt(business_name, city),
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # Low temp for factual responses
            )
        )
        
        return {
            "success": True,
            "data": response.text,
            "error": None
        }

    except Exception as e:
        error = AuditError(
            source="gemini",
            error_type=type(e).__name__,
            message=str(e),
            fix_hint="Check: 1) GEMINI_API_KEY is set in .env, 2) API key is valid, 3) Model name is correct"
        )
        return {
            "success": False,
            "data": None,
            "error": error.to_dict()
        }

# ============================================
# OPENAI HANDLER (for analysis, not search)
# ============================================

def query_openai(business_name: str, city: str, context: str, premium: bool = False) -> Dict:
    """
    Analyzes search results using GPT-5.2 with optimal settings
    
    Args:
        business_name: The business being audited
        city: Location context
        context: Search results from Gemini
        premium: If True, uses gpt-5.2-pro with xhigh effort
    
    Returns:
        Dict with success, data, error, and token_usage
    """
    try:
        # Choose model and effort based on tier
        if premium:
            model = "gpt-5.2-pro"
            effort = "xhigh"
        else:
            model = "gpt-5.2"
            effort = "high"
        
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": """You are a Schema.org expert specializing in LocalBusiness structured data.
                    
                    Your task: Extract business information and format it for Schema.org JSON-LD.
                    
                    For each piece of information:
                    1. Extract the exact value
                    2. Rate confidence (HIGH/MEDIUM/LOW)
                    3. Note the source
                    4. Flag any inconsistencies
                    
                    Required fields:
                    - Business name (legal name vs DBA)
                    - Full street address (number, street, suite/unit, city, state, ZIP)
                    - Phone number(s) - primary and any alternates
                    - Hours of operation - each day, including holidays
                    - Special offers or promotions
                    - Business type (restaurant, medical, retail, etc.)
                    
                    Format output as:
                    ## EXTRACTED DATA
                    [structured list]
                    
                    ## CONFIDENCE ASSESSMENT
                    [what's certain, what's unclear]
                    
                    ## SCHEMA.ORG RECOMMENDATIONS
                    [which Schema.org @type to use, required fields]
                    
                    ## RED FLAGS
                    [missing data, inconsistencies, potential issues]
                    """
                },
                {
                    "role": "user",
                    "content": f"""Audit: {business_name} in {city}
                    
                    SEARCH RESULTS FROM GOOGLE:
                    {context}
                    
                    Provide thorough analysis for Schema.org JSON-LD generation."""
                }
            ],
            
            # GPT-5.2 new parameters
            reasoning={
                "effort": effort  # "high" or "xhigh"
            },
            text={
                "verbosity": "high"  # Detailed output
            },
            
            # Standard parameters
            temperature=0.1,
            max_output_tokens=4000,
        )
        
        # Extract usage stats (helpful for cost tracking)
        usage = response.usage
        token_details = {
            "input_tokens": usage.prompt_tokens,
            "output_tokens": usage.completion_tokens,
            "total_tokens": usage.total_tokens,
        }
        
        # GPT-5.2 exposes reasoning token count
        if hasattr(usage, 'completion_tokens_details'):
            token_details["reasoning_tokens"] = usage.completion_tokens_details.reasoning_tokens
        
        return {
            "success": True,
            "data": response.choices[0].message.content,
            "error": None,
            "token_usage": token_details,
            "model_used": model
        }
        
    except Exception as e:
        error = AuditError(
            source="openai",
            error_type=type(e).__name__,
            message=str(e),
            fix_hint="Check: 1) API key valid, 2) Sufficient credits, 3) Model name correct"
        )
        return {
            "success": False,
            "data": None,
            "error": error.to_dict(),
            "token_usage": None,
            "model_used": None
        }

# ============================================
# SCHEMA BUILDER (The money shot)
# ============================================
def build_schema_json(business_name: str, city: str, extracted_data: Dict) -> Dict:
    """
    WHY: Convert messy text into structured Schema.org format
    REASONING: This is what businesses will copy-paste into their website
    
    TODO: Parse the AI responses and extract structured fields
    For now, returns a template
    """
    return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business_name,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": city,
            # TODO: Parse streetAddress, postalCode from AI response
        },
        # TODO: Add telephone, openingHours, offers
    }

# ============================================
# FIELD COMPARISON & ANALYSIS
# ============================================
# we normalize so that punctuation or casing dont affect matching  import re = regular expression
def determine_status(value1: str, value2: str) -> str:
    """
    Compare two AI responses and determine field status.
    
    WHY: This is the core comparison logic - determines if AIs agree
    PATTERN: Railway-Oriented (returns consistent format)
    
    Args:
        value1: Gemini's value
        value2: GPT's value
    
    Returns:
        'MATCH' | 'MISMATCH' | 'MISSING'
    """
    #handle missing data
    if not value1 or not value2:
        return 'MISSING'

    not_found_phrases = ["not found", "unknown", "n/a", "unavailable"]
    v1_lower = value1.lower().strip()
    v2_lower = value2.lower().strip()


    for phrase in not_found_phrases:
        if phrase in v1_lower or phrase in v2_lower:
            return 'MISSING'

    #step 2 normalize for comparison remove punctuation and lowercase
    
    def normalize(text: str) -> str:
        #remove special chars, extra spaces, lowercase
        return re.sub(r'[^\w\s]', '', text).lower().strip()  # ✅ sub + raw string

    normalized_v1 = normalize(v1_lower)
    normalized_v2 = normalize(v2_lower)

    #step 3 compare normalized values
    if normalized_v1 == normalized_v2:
        return 'MATCH'
    else:
        return 'MISMATCH'


def parse_ai_response_with_gpt(text: str) -> Dict:
    """
    Use GPT to parse another AI's unstructured text into structured fields.
    
    WHY: AI is best at parsing AI output (meta!)
    PATTERN: Single Responsibility - one job, parse text
    
    Args:
        text: Raw text from Gemini or GPT containing business info
    
    Returns:
        Dict with keys: address, phone, hours, description
    """
    try:
        # Ask GPT to extract structured data from the text
        parsing_prompt = f"""
        Extract business information from the text below into JSON format.
        
        Return a JSON object with these exact keys:
        - address: Full street address (string, or "Not Found")
        - phone: Phone number (string, or "Not Found")  
        - hours: Operating hours (string, or "Not Found")
        - description: Business description (string, or "Not Found")
        
        TEXT TO PARSE:
        {text}
        
        Return ONLY valid JSON, no markdown formatting.
        """
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Use cheap model for parsing
            messages=[
                {"role": "system", "content": "You extract structured data from text. Return only valid JSON."},
                {"role": "user", "content": parsing_prompt}
            ],
            response_format={"type": "json_object"},  # Force JSON output
            temperature=0.1,
            max_tokens=500
        )
        
        # Parse the JSON response
        import json
        parsed = json.loads(response.choices[0].message.content)
        
        # Ensure all keys exist (with defaults)
        return {
            "address": parsed.get("address", "Not Found"),
            "phone": parsed.get("phone", "Not Found"),
            "hours": parsed.get("hours", "Not Found"),
            "description": parsed.get("description", "Not Found")
        }
        
    except Exception as e:
        # If parsing fails, return empty values
        return {
            "address": "Error parsing",
            "phone": "Error parsing",
            "hours": "Error parsing",
            "description": "Error parsing"
        }

def calculate_score(fields: Dict) -> int:
    """
    Calculate reputation score based on field status.
    
    WHY: Quantify business's AI visibility health
    PATTERN: Pure function (same input = same output)
    
    Args:
        fields: Dict with address, phone, hours, description
                Each field has a 'status' key: MATCH/MISMATCH/MISSING
    
    Returns:
        Score from 0-100
    """
    #base score
    score = 50

    #define points for each field when they match

    match_points = {
        "address": 30,
        "phone": 25,
        "hours": 25,
        "description": 20,
    }

    #process each field
    for field_name, field_data in fields.items():
        status = field_data.get("status", "MISSING")

        if status == "MATCH":
            #add bonus for matching fields
            score+=match_points.get(field_name, 0)
        elif status == "MISMATCH":
            #penalty for conflicting data
            score-=15
        elif status == "MISSING":
            #smaller penalty for missing data
            score-=10
    
    #clamp score between 0 and 100
    return max(0, min(100, score))


def compare_and_score(gemini_text: str, gpt_text: str, business_name: str, city: str) -> Dict:


    #step 1 parse both AI responses into structured data
    gemini_fields = parse_ai_response_with_gpt(gemini_text)
    gpt_fields = parse_ai_response_with_gpt(gpt_text)


    #step 2 compare fields and determine status
    fields = {
         "address": {
            "label": "Business Address",
            "value": gemini_fields["address"],  # Use Gemini as source of truth
            "gemini_value": gemini_fields["address"],
            "gpt_value": gpt_fields["address"],
            "status": determine_status(gemini_fields["address"], gpt_fields["address"])
        },
        "phone": {
            "label": "Phone Number",
            "value": gemini_fields["phone"],
            "gemini_value": gemini_fields["phone"],
            "gpt_value": gpt_fields["phone"],
            "status": determine_status(gemini_fields["phone"], gpt_fields["phone"])
        },
        "hours": {
            "label": "Operating Hours",
            "value": gemini_fields["hours"],
            "gemini_value": gemini_fields["hours"],
            "gpt_value": gpt_fields["hours"],
            "status": determine_status(gemini_fields["hours"], gpt_fields["hours"])
        },
        "description": {
            "label": "Business Description",
            "value": gemini_fields["description"],
            "gemini_value": gemini_fields["description"],
            "gpt_value": gpt_fields["description"],
            "status": determine_status(gemini_fields["description"], gpt_fields["description"])
        }
    }

    #step 3 calculate score
    score = calculate_score(fields)

    #step 4 generate missing info suggestions
    missing_info = []
    for field_name, field_data in fields.items():
        if field_data["status"] == "MISSING":
            missing_info.append(f"Add {field_data['label']} to your website and business listings")
        elif field_data["status"] == "MISMATCH":
            missing_info.append(f"Standardize {field_data['label']} across all platforms")
    
    # Step 5: Generate executive summary
    if score >= 90:
        summary = f"{business_name} has excellent AI visibility. All major platforms show consistent information."
    elif score >= 70:
        summary = f"{business_name} has good AI visibility with minor inconsistencies that should be addressed."
    elif score >= 50:
        summary = f"{business_name} has fair AI visibility. Several data gaps were detected across platforms."
    else:
        summary = f"{business_name} has poor AI visibility. Significant data issues detected across multiple platforms."
    
    # Step 6: Build Schema.org JSON-LD
    schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business_name,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": fields["address"]["value"],
            "addressLocality": city
        },
        "telephone": fields["phone"]["value"],
        "openingHours": fields["hours"]["value"],
        "description": fields["description"]["value"]
    }
    
    
    schema_json = json.dumps(schema, indent=2)
    
    # Step 7: Return everything
    return {
        "score": score,
        "summary": summary,
        "fields": fields,
        "missing_info_suggestions": missing_info,
        "schema_json": schema_json
    }
# ============================================
# MAIN ORCHESTRATOR (Facade Pattern)
# ============================================
def run_audit(business_name: str, city: str) -> Dict:
    """
    WHY: This is the FACADE - simple interface, complex work behind it
    
    FLOW:
    1. Gemini searches Google
    2. GPT analyzes Gemini's findings
    3. We build structured schema
    4. Return everything + errors
    """
    errors = []
    warnings = []
    
    # Step 1: Search with Gemini
    gemini_result = query_gemini(business_name, city)
    if not gemini_result["success"]:
        errors.append(gemini_result["error"])
        gemini_text = "Search failed"
    else:
        gemini_text = gemini_result["data"]
    
    # Step 2: Analyze with GPT (using Gemini's results)
    gpt_result = query_openai(business_name, city, gemini_text)
    if not gpt_result["success"]:
        errors.append(gpt_result["error"])
        gpt_text = "Analysis failed"
    else:
        gpt_text = gpt_result["data"]
    
        # Step 3: Compare and score (NEW!)
    if gemini_result["success"] and gpt_result["success"]:
        # Both AIs succeeded - do full comparison
        unified = compare_and_score(gemini_text, gpt_text, business_name, city)
    else:
        # One or both failed - return empty unified results
        unified = {
            "score": 0,
            "summary": "Audit incomplete due to API errors",
            "fields": {},
            "missing_info_suggestions": ["Retry audit when services are available"],
            "schema_json": "{}"
        }
    
    # Step 4: Add warnings if needed
    if not gemini_result["success"] and not gpt_result["success"]:
        warnings.append("Both AI services failed. Check your API keys and quotas.")
    
    # Step 5: Return NEW unified format
    return {
        "status": "success" if not errors else "partial_success",
        "unified_results": unified,  # NEW!
        "raw_outputs": {              # Keep for debugging
            "gemini": gemini_text,
            "gpt": gpt_text
        },
        "errors": errors,
        "warnings": warnings
    }