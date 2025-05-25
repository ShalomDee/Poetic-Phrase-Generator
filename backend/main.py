# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from contextlib import asynccontextmanager

import torch
import logging
from typing import Optional
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the Shakespeare poetry model on startup"""
    global model, tokenizer
    try:
        logger.info("Loading Shakespeare poetry model...")
        model_name = "striki-ai/william-shakespeare-poetry"

        tokenizer = GPT2Tokenizer.from_pretrained(model_name)
        model = GPT2LMHeadModel.from_pretrained(model_name)

        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        model.eval()

        logger.info(f"Model loaded successfully on {device}")
        yield  # Server runs during this time
    finally:
        logger.info("Shutting down Poetic Phrase Generator.")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Poetic Phrase Generator",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and tokenizer
model = None
tokenizer = None

class PoemRequest(BaseModel):
    activity: str
    place: str
    temperature: float = 0.8
    max_length: int = 100
    custom_prompt: Optional[str] = None

class PoemResponse(BaseModel):
    poem: str
    success: bool
    error: Optional[str] = None

def clean_generated_text(text: str, original_prompt: str) -> str:
    """Clean and format the generated text"""
    # Remove the original prompt from the generated text
    if text.startswith(original_prompt):
        text = text[len(original_prompt):].strip()
    
    # Split by sentences and take the first few complete ones
    sentences = re.split(r'[.!?]+', text)
    
    # Filter out very short or incomplete sentences
    good_sentences = []
    for sentence in sentences[:3]:  # Take first 3 sentences max
        sentence = sentence.strip()
        if len(sentence) > 10 and not sentence.endswith(('and', 'or', 'but', 'the', 'a', 'an')):
            good_sentences.append(sentence)
    
    if good_sentences:
        result = ". ".join(good_sentences)
        if not result.endswith(('.', '!', '?')):
            result += "."
        return result
    
    # Fallback: return first 100 characters if sentence splitting fails
    return text[:100].strip() + "..." if len(text) > 100 else text.strip()

@app.post("/generate-poem", response_model=PoemResponse)
async def generate_poem(request: PoemRequest):
    """Generate a Shakespearean-style poem based on activity and place"""
    global model, tokenizer
    
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Use custom prompt if provided, otherwise create default
        if request.custom_prompt:
            prompt = request.custom_prompt
        else:
            prompt = f"In fair {request.place} where {request.activity} doth bloom, "
        
        # Tokenize the prompt
        inputs = tokenizer.encode(prompt, return_tensors="pt")
        
        # Move to same device as model
        device = next(model.parameters()).device
        inputs = inputs.to(device)
        
        # Generate text
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_length=inputs.shape[1] + request.max_length,
                temperature=request.temperature,
                do_sample=True,
                top_p=0.9,
                top_k=50,
                pad_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.2,
                length_penalty=1.0,
                no_repeat_ngram_size=2
            )
        
        # Decode the generated text
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Clean and format the result
        poem = clean_generated_text(generated_text, prompt)
        
        return PoemResponse(poem=poem, success=True)
        
    except Exception as e:
        logger.error(f"Error generating poem: {e}")
        return PoemResponse(
            poem="Alas, the muse has fled this day, no verse can I create.",
            success=False,
            error=str(e)
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(next(model.parameters()).device) if model else "none"
    }

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "Poetic Phrase Generator API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)