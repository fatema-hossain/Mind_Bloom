"""
llm_adapter.py - Model-Agnostic LLM Adapter System

This module implements a Strategy/Adapter pattern for supporting multiple LLM providers
with automatic fallback to the rule-based chatbot when no API key is configured.

Supported Providers:
- OpenAI (GPT-4, GPT-3.5-turbo)
- Google Gemini (gemini-2.0-flash, gemini-1.5-pro)
- Mistral (mixtral-8x22b via OpenRouter)
- Anthropic Claude (claude-3-opus, claude-3-sonnet)
- Any OpenAI-compatible API

Architecture:
    ChatRequest → LLMRouter → [Provider Adapter] OR [Fallback Handler] → Response

IMPORTANT: The fallback handler is now initialized INSIDE the router to ensure
it's always available, even after module reloads.
"""

from __future__ import annotations

import os
import json
import time
import re
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

import requests


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    GEMINI = "gemini"
    MISTRAL = "mistral"
    ANTHROPIC = "anthropic"
    OPENROUTER = "openrouter"
    CUSTOM = "custom"  # Any OpenAI-compatible API


@dataclass
class LLMConfig:
    """Configuration for LLM provider."""
    provider: LLMProvider
    api_key: str
    model: str
    base_url: Optional[str] = None
    max_tokens: int = 500
    temperature: float = 0.7
    
    def is_valid(self) -> bool:
        """Check if configuration is valid."""
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_api_key_here")


@dataclass
class ChatMessage:
    """Standard chat message format."""
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class LLMResponse:
    """Standard response format from any LLM."""
    content: str
    provider: str
    model: str
    success: bool
    error: Optional[str] = None
    tokens_used: Optional[int] = None


class BaseLLMAdapter(ABC):
    """Abstract base class for LLM adapters."""
    
    def __init__(self, config: LLMConfig):
        self.config = config
    
    @abstractmethod
    def chat(self, messages: List[ChatMessage], max_tokens: Optional[int] = None) -> LLMResponse:
        """Send messages to LLM and get response."""
        pass
    
    @abstractmethod
    def test_connection(self) -> bool:
        """Test if the API connection works."""
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return human-readable provider name."""
        pass


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for OpenAI API (GPT-4, GPT-3.5-turbo)."""
    
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    DEFAULT_MODEL = "gpt-3.5-turbo"
    
    @property
    def provider_name(self) -> str:
        return "OpenAI"
    
    def chat(self, messages: List[ChatMessage], max_tokens: Optional[int] = None) -> LLMResponse:
        try:
            base_url = self.config.base_url or self.DEFAULT_BASE_URL
            model = self.config.model or self.DEFAULT_MODEL
            
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [{"role": m.role, "content": m.content} for m in messages],
                "max_tokens": max_tokens or self.config.max_tokens,
                "temperature": self.config.temperature
            }
            
            response = requests.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens")
            
            return LLMResponse(
                content=content,
                provider=self.provider_name,
                model=model,
                success=True,
                tokens_used=tokens
            )
            
        except Exception as e:
            return LLMResponse(
                content="",
                provider=self.provider_name,
                model=self.config.model or self.DEFAULT_MODEL,
                success=False,
                error=str(e)
            )
    
    def test_connection(self) -> bool:
        try:
            response = self.chat([ChatMessage(role="user", content="Hi")], max_tokens=5)
            return response.success
        except:
            return False


class GeminiAdapter(BaseLLMAdapter):
    """Adapter for Google Gemini API."""
    
    DEFAULT_MODEL = "gemini-2.0-flash"
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    
    @property
    def provider_name(self) -> str:
        return "Google Gemini"
    
    def chat(self, messages: List[ChatMessage], max_tokens: Optional[int] = None) -> LLMResponse:
        try:
            model = self.config.model or self.DEFAULT_MODEL
            
            # Convert messages to Gemini format
            contents = []
            system_instruction = None
            
            for msg in messages:
                if msg.role == "system":
                    system_instruction = msg.content
                else:
                    role = "user" if msg.role == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": msg.content}]
                    })
            
            url = f"{self.BASE_URL}/models/{model}:generateContent?key={self.config.api_key}"
            
            payload = {
                "contents": contents,
                "generationConfig": {
                    "maxOutputTokens": max_tokens or self.config.max_tokens,
                    "temperature": self.config.temperature
                }
            }
            
            if system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
            
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            
            return LLMResponse(
                content=content,
                provider=self.provider_name,
                model=model,
                success=True
            )
            
        except Exception as e:
            return LLMResponse(
                content="",
                provider=self.provider_name,
                model=self.config.model or self.DEFAULT_MODEL,
                success=False,
                error=str(e)
            )
    
    def test_connection(self) -> bool:
        try:
            response = self.chat([ChatMessage(role="user", content="Hi")], max_tokens=5)
            return response.success
        except:
            return False


class MistralAdapter(BaseLLMAdapter):
    """Adapter for Mistral AI API."""
    
    DEFAULT_MODEL = "mistral-large-latest"
    BASE_URL = "https://api.mistral.ai/v1"
    
    @property
    def provider_name(self) -> str:
        return "Mistral AI"
    
    def chat(self, messages: List[ChatMessage], max_tokens: Optional[int] = None) -> LLMResponse:
        try:
            model = self.config.model or self.DEFAULT_MODEL
            
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [{"role": m.role, "content": m.content} for m in messages],
                "max_tokens": max_tokens or self.config.max_tokens,
                "temperature": self.config.temperature
            }
            
            response = requests.post(
                f"{self.BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens")
            
            return LLMResponse(
                content=content,
                provider=self.provider_name,
                model=model,
                success=True,
                tokens_used=tokens
            )
            
        except Exception as e:
            return LLMResponse(
                content="",
                provider=self.provider_name,
                model=self.config.model or self.DEFAULT_MODEL,
                success=False,
                error=str(e)
            )
    
    def test_connection(self) -> bool:
        try:
            response = self.chat([ChatMessage(role="user", content="Hi")], max_tokens=5)
            return response.success
        except:
            return False


class OpenRouterAdapter(BaseLLMAdapter):
    """Adapter for OpenRouter API (access to multiple models)."""
    
    DEFAULT_MODEL = "mistralai/mixtral-8x22b-instruct"
    BASE_URL = "https://openrouter.ai/api/v1"
    
    @property
    def provider_name(self) -> str:
        return "OpenRouter"
    
    def chat(self, messages: List[ChatMessage], max_tokens: Optional[int] = None) -> LLMResponse:
        try:
            model = self.config.model or self.DEFAULT_MODEL
            
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "Mind Bloom Chatbot"
            }
            
            payload = {
                "model": model,
                "messages": [{"role": m.role, "content": m.content} for m in messages],
                "max_tokens": max_tokens or self.config.max_tokens,
                "temperature": self.config.temperature
            }
            
            response = requests.post(
                f"{self.BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens")
            
            return LLMResponse(
                content=content,
                provider=self.provider_name,
                model=model,
                success=True,
                tokens_used=tokens
            )
            
        except Exception as e:
            return LLMResponse(
                content="",
                provider=self.provider_name,
                model=self.config.model or self.DEFAULT_MODEL,
                success=False,
                error=str(e)
            )
    
    def test_connection(self) -> bool:
        try:
            response = self.chat([ChatMessage(role="user", content="Hi")], max_tokens=5)
            return response.success
        except:
            return False


class AnthropicAdapter(BaseLLMAdapter):
    """Adapter for Anthropic Claude API."""
    
    DEFAULT_MODEL = "claude-3-sonnet-20240229"
    BASE_URL = "https://api.anthropic.com/v1"
    
    @property
    def provider_name(self) -> str:
        return "Anthropic Claude"
    
    def chat(self, messages: List[ChatMessage], max_tokens: Optional[int] = None) -> LLMResponse:
        try:
            model = self.config.model or self.DEFAULT_MODEL
            
            # Extract system message
            system_content = ""
            chat_messages = []
            
            for msg in messages:
                if msg.role == "system":
                    system_content = msg.content
                else:
                    chat_messages.append({"role": msg.role, "content": msg.content})
            
            headers = {
                "x-api-key": self.config.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": model,
                "messages": chat_messages,
                "max_tokens": max_tokens or self.config.max_tokens
            }
            
            if system_content:
                payload["system"] = system_content
            
            response = requests.post(
                f"{self.BASE_URL}/messages",
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            content = data["content"][0]["text"]
            
            return LLMResponse(
                content=content,
                provider=self.provider_name,
                model=model,
                success=True
            )
            
        except Exception as e:
            return LLMResponse(
                content="",
                provider=self.provider_name,
                model=self.config.model or self.DEFAULT_MODEL,
                success=False,
                error=str(e)
            )
    
    def test_connection(self) -> bool:
        try:
            response = self.chat([ChatMessage(role="user", content="Hi")], max_tokens=5)
            return response.success
        except:
            return False


# =============================================================================
# LLM ADAPTER FACTORY
# =============================================================================

def create_adapter(config: LLMConfig) -> BaseLLMAdapter:
    """Factory function to create the appropriate adapter based on provider."""
    adapters = {
        LLMProvider.OPENAI: OpenAIAdapter,
        LLMProvider.GEMINI: GeminiAdapter,
        LLMProvider.MISTRAL: MistralAdapter,
        LLMProvider.OPENROUTER: OpenRouterAdapter,
        LLMProvider.ANTHROPIC: AnthropicAdapter,
        LLMProvider.CUSTOM: OpenAIAdapter,  # Custom uses OpenAI-compatible format
    }
    
    adapter_class = adapters.get(config.provider, OpenAIAdapter)
    return adapter_class(config)


# =============================================================================
# API KEY AUTO-DETECTION
# =============================================================================

def detect_provider_from_key(api_key: str) -> Tuple[Optional[LLMProvider], Optional[str], str]:
    """
    Auto-detect which LLM provider an API key belongs to.
    
    Uses a combination of:
    1. Key format pattern matching
    2. Validation API calls
    
    Args:
        api_key: The API key to detect
    
    Returns:
        Tuple of (provider, suggested_model, status_message)
        Provider is None if detection fails
    """
    if not api_key or not api_key.strip():
        return None, None, "Empty API key"
    
    api_key = api_key.strip()
    
    # Pattern-based detection first (fast)
    detected_provider = _detect_by_pattern(api_key)
    
    if detected_provider:
        # Validate with actual API call
        is_valid, model, message = _validate_key(detected_provider, api_key)
        if is_valid:
            return detected_provider, model, message
    
    # If pattern detection failed or key was invalid, try all providers
    return _try_all_providers(api_key)


def _detect_by_pattern(api_key: str) -> Optional[LLMProvider]:
    """Detect provider based on API key format patterns."""
    
    # OpenAI: starts with "sk-" (standard) or "sk-proj-" (project keys)
    if api_key.startswith("sk-"):
        return LLMProvider.OPENAI
    
    # Anthropic: starts with "sk-ant-"
    if api_key.startswith("sk-ant-"):
        return LLMProvider.ANTHROPIC
    
    # OpenRouter: starts with "sk-or-"
    if api_key.startswith("sk-or-"):
        return LLMProvider.OPENROUTER
    
    # Gemini/Google AI: typically starts with "AIza"
    if api_key.startswith("AIza"):
        return LLMProvider.GEMINI
    
    # Mistral: typically 32-character hex string or longer alphanumeric
    if re.match(r'^[a-zA-Z0-9]{32,}$', api_key) and not api_key.startswith("sk-"):
        # Could be Mistral - needs validation
        return LLMProvider.MISTRAL
    
    return None


def _validate_key(provider: LLMProvider, api_key: str) -> Tuple[bool, Optional[str], str]:
    """Validate API key by making a lightweight API call."""
    
    try:
        if provider == LLMProvider.OPENAI:
            return _validate_openai(api_key)
        elif provider == LLMProvider.GEMINI:
            return _validate_gemini(api_key)
        elif provider == LLMProvider.MISTRAL:
            return _validate_mistral(api_key)
        elif provider == LLMProvider.ANTHROPIC:
            return _validate_anthropic(api_key)
        elif provider == LLMProvider.OPENROUTER:
            return _validate_openrouter(api_key)
    except Exception as e:
        return False, None, f"Validation error: {str(e)}"
    
    return False, None, "Unknown provider"


def _validate_openai(api_key: str) -> Tuple[bool, Optional[str], str]:
    """Validate OpenAI API key."""
    try:
        response = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            # Find a suitable model
            models = [m["id"] for m in data.get("data", [])]
            suggested = "gpt-3.5-turbo"
            if "gpt-4" in models:
                suggested = "gpt-4"
            elif "gpt-4-turbo" in models:
                suggested = "gpt-4-turbo"
            return True, suggested, f"OpenAI key valid. {len(models)} models available."
        elif response.status_code == 401:
            return False, None, "Invalid OpenAI API key"
        else:
            return False, None, f"OpenAI API error: {response.status_code}"
    except requests.Timeout:
        return False, None, "OpenAI API timeout"
    except Exception as e:
        return False, None, f"OpenAI validation failed: {str(e)}"


def _validate_gemini(api_key: str) -> Tuple[bool, Optional[str], str]:
    """Validate Google Gemini API key and list available models."""
    try:
        response = requests.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            # Filter models that support generateContent (chat/text generation)
            available_models = []
            for m in data.get("models", []):
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    model_name = m.get("name", "").replace("models/", "")
                    available_models.append(model_name)
            
            # Pick best default model
            suggested = "gemini-2.0-flash-exp"
            if "gemini-1.5-pro" in available_models:
                suggested = "gemini-1.5-pro"
            elif "gemini-1.5-flash" in available_models:
                suggested = "gemini-1.5-flash"
            elif available_models:
                suggested = available_models[0]
            
            model_list = ", ".join(available_models[:5])  # Show first 5
            if len(available_models) > 5:
                model_list += f"... (+{len(available_models) - 5} more)"
            
            return True, suggested, f"✅ Gemini key valid! Models: {model_list}"
        elif response.status_code == 400:
            return False, None, "❌ Invalid API key format"
        elif response.status_code == 403:
            return False, None, "❌ API key unauthorized or disabled"
        else:
            return False, None, f"❌ Gemini API error: {response.status_code}"
    except requests.Timeout:
        return False, None, "⏱️ Gemini API timeout - try again"
    except Exception as e:
        return False, None, f"❌ Validation failed: {str(e)}"


def _validate_mistral(api_key: str) -> Tuple[bool, Optional[str], str]:
    """Validate Mistral API key."""
    try:
        response = requests.get(
            "https://api.mistral.ai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            models = [m.get("id", "") for m in data.get("data", [])]
            suggested = "mistral-large-latest"
            return True, suggested, f"Mistral key valid. {len(models)} models available."
        elif response.status_code == 401:
            return False, None, "Invalid Mistral API key"
        else:
            return False, None, f"Mistral API error: {response.status_code}"
    except requests.Timeout:
        return False, None, "Mistral API timeout"
    except Exception as e:
        return False, None, f"Mistral validation failed: {str(e)}"


def _validate_anthropic(api_key: str) -> Tuple[bool, Optional[str], str]:
    """Validate Anthropic API key by making a minimal request."""
    try:
        # Anthropic doesn't have a models list endpoint, so we make a minimal chat request
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1,
                "messages": [{"role": "user", "content": "Hi"}]
            },
            timeout=10
        )
        if response.status_code == 200:
            return True, "claude-3-sonnet-20240229", "Anthropic key valid."
        elif response.status_code == 401:
            return False, None, "Invalid Anthropic API key"
        else:
            return False, None, f"Anthropic API error: {response.status_code}"
    except requests.Timeout:
        return False, None, "Anthropic API timeout"
    except Exception as e:
        return False, None, f"Anthropic validation failed: {str(e)}"


def _validate_openrouter(api_key: str) -> Tuple[bool, Optional[str], str]:
    """Validate OpenRouter API key."""
    try:
        response = requests.get(
            "https://openrouter.ai/api/v1/auth/key",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10
        )
        if response.status_code == 200:
            return True, "mistralai/mixtral-8x22b-instruct", "OpenRouter key valid."
        elif response.status_code == 401:
            return False, None, "Invalid OpenRouter API key"
        else:
            return False, None, f"OpenRouter API error: {response.status_code}"
    except requests.Timeout:
        return False, None, "OpenRouter API timeout"
    except Exception as e:
        return False, None, f"OpenRouter validation failed: {str(e)}"


def _try_all_providers(api_key: str) -> Tuple[Optional[LLMProvider], Optional[str], str]:
    """Try validating with all providers if pattern detection failed."""
    providers_to_try = [
        LLMProvider.OPENAI,
        LLMProvider.GEMINI,
        LLMProvider.MISTRAL,
        LLMProvider.OPENROUTER,
        LLMProvider.ANTHROPIC,
    ]
    
    for provider in providers_to_try:
        is_valid, model, message = _validate_key(provider, api_key)
        if is_valid:
            return provider, model, f"Detected: {provider.value}. {message}"
    
    return None, None, "Could not detect provider. Please select manually."


# =============================================================================
# LLM ROUTER - Main Entry Point
# =============================================================================

class LLMRouter:
    """
    Routes chat requests to either an external LLM or the fallback chatbot.
    
    Decision Flow:
        1. Check if LLM config exists and is valid
        2. If yes → route to external LLM via adapter
        3. If no → route to fallback rule-based chatbot
    
    IMPORTANT: Fallback handler is now initialized internally to ensure
    it's always available, even after hot reloads.
    """
    
    def __init__(self):
        self._config: Optional[LLMConfig] = None
        self._adapter: Optional[BaseLLMAdapter] = None
        self._fallback_handler = None
        self._initialize_fallback()  # Always initialize fallback first!
        self._load_config_from_env()
    
    def _initialize_fallback(self):
        """Initialize the fallback handler internally."""
        try:
            # Import fallback module here to avoid circular imports
            # and ensure it's always loaded with the router
            from fallback_chatbot import fallback_handler
            self._fallback_handler = fallback_handler
            print("[LLM Router] Fallback handler initialized successfully")
        except ImportError as e:
            print(f"[LLM Router] WARNING: Could not load fallback_chatbot: {e}")
            # Create a simple inline fallback as last resort
            self._fallback_handler = self._emergency_fallback
        except Exception as e:
            print(f"[LLM Router] WARNING: Fallback init error: {e}")
            self._fallback_handler = self._emergency_fallback
    
    def _emergency_fallback(self, message: str) -> str:
        """Emergency fallback when fallback_chatbot module fails to load."""
        return (
            "Thank you for reaching out. I'm here to listen and support you. "
            "While I'm having some technical difficulties, please know that help is available. "
            "If you're in distress, please contact a healthcare professional or crisis helpline."
        )
    
    def _load_config_from_env(self):
        """Load LLM configuration from environment variables."""
        provider = os.getenv("LLM_PROVIDER", "").lower()
        api_key = os.getenv("LLM_API_KEY", "")
        model = os.getenv("LLM_MODEL", "")
        base_url = os.getenv("LLM_BASE_URL", "")
        
        # Also check provider-specific env vars
        if not api_key:
            api_key = (
                os.getenv("OPENROUTER_API_KEY", "") or
                os.getenv("OPENAI_API_KEY", "") or
                os.getenv("GEMINI_API_KEY", "") or
                os.getenv("MISTRAL_API_KEY", "") or
                os.getenv("ANTHROPIC_API_KEY", "")
            )
            
            # Auto-detect provider from key
            if os.getenv("OPENROUTER_API_KEY"):
                provider = provider or "openrouter"
            elif os.getenv("OPENAI_API_KEY"):
                provider = provider or "openai"
            elif os.getenv("GEMINI_API_KEY"):
                provider = provider or "gemini"
            elif os.getenv("MISTRAL_API_KEY"):
                provider = provider or "mistral"
            elif os.getenv("ANTHROPIC_API_KEY"):
                provider = provider or "anthropic"
        
        if api_key and provider:
            try:
                self.configure(
                    provider=LLMProvider(provider),
                    api_key=api_key,
                    model=model or None,
                    base_url=base_url or None
                )
            except ValueError:
                print(f"[LLM] Unknown provider: {provider}")
    
    def configure(
        self,
        provider: LLMProvider,
        api_key: str,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ):
        """Configure the LLM adapter."""
        self._config = LLMConfig(
            provider=provider,
            api_key=api_key,
            model=model or "",
            base_url=base_url,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        if self._config.is_valid():
            self._adapter = create_adapter(self._config)
            print(f"[LLM] Configured: {self._adapter.provider_name}")
        else:
            self._adapter = None
            print("[LLM] Invalid configuration - will use fallback")
    
    def set_fallback_handler(self, handler):
        """Set the fallback chat handler (old rule-based chatbot)."""
        self._fallback_handler = handler
    
    def is_llm_available(self) -> bool:
        """Check if external LLM is configured and available."""
        return self._adapter is not None and self._config is not None and self._config.is_valid()
    
    def get_active_provider(self) -> str:
        """Get the name of the currently active provider."""
        if self.is_llm_available():
            return self._adapter.provider_name
        return "Rule-Based Fallback"
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        patient_context: Optional[Dict] = None,
        max_tokens: int = 400
    ) -> Dict[str, Any]:
        """
        Route chat request to appropriate handler.
        
        Args:
            messages: List of {"role": str, "content": str} dicts
            patient_context: Optional patient data for context
            max_tokens: Maximum tokens for response
        
        Returns:
            Dict with response, provider info, and success status
        """
        
        # Convert to ChatMessage objects
        chat_messages = [ChatMessage(role=m["role"], content=m["content"]) for m in messages]
        
        # Add system prompt with patient context if available
        if patient_context:
            system_prompt = self._build_system_prompt(patient_context)
            chat_messages.insert(0, ChatMessage(role="system", content=system_prompt))
        
        # Route to LLM if available
        if self.is_llm_available():
            response = self._adapter.chat(chat_messages, max_tokens)
            
            if response.success:
                return {
                    "response": response.content,
                    "provider": response.provider,
                    "model": response.model,
                    "success": True,
                    "using_llm": True
                }
            else:
                # LLM failed - try fallback
                print(f"[LLM] Request failed: {response.error}, using fallback")
        
        # Use fallback handler
        return self._use_fallback(messages[-1]["content"] if messages else "")
    
    def _build_system_prompt(self, patient_context: Dict) -> str:
        """Build system prompt with patient context."""
        return (
            "You are a compassionate mental health assistant for Mind Bloom, "
            "a Postpartum Depression (PPD) risk assessment platform designed for Bangladeshi mothers. "
            "Use ONLY the provided patient assessment data to inform your responses:\n\n"
            f"{json.dumps(patient_context, indent=2)}\n\n"
            "Guidelines:\n"
            "- Be empathetic, supportive, and non-judgmental\n"
            "- Do NOT invent or assume information not in the data\n"
            "- Encourage professional help for high-risk assessments\n"
            "- Provide practical coping suggestions when appropriate\n"
            "- Always prioritize the patient's safety and wellbeing\n"
            "- Be culturally sensitive to Bangladeshi context"
        )
    
    def _use_fallback(self, user_message: str) -> Dict[str, Any]:
        """Use the fallback rule-based chatbot."""
        if self._fallback_handler:
            try:
                reply = self._fallback_handler(user_message)
                return {
                    "response": reply,
                    "provider": "Rule-Based Fallback",
                    "model": "TF-IDF + FAQ",
                    "success": True,
                    "using_llm": False
                }
            except Exception as e:
                print(f"[Fallback] Error: {e}")
        
        # Ultimate fallback
        return {
            "response": (
                "Thank you for sharing. I'm here to listen and support you. "
                "Could you tell me a bit more about what's on your mind?"
            ),
            "provider": "Default Fallback",
            "model": "Static",
            "success": True,
            "using_llm": False
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test the current LLM configuration."""
        if not self.is_llm_available():
            return {
                "success": False,
                "provider": "None",
                "error": "No LLM configured"
            }
        
        success = self._adapter.test_connection()
        return {
            "success": success,
            "provider": self._adapter.provider_name,
            "model": self._config.model,
            "error": None if success else "Connection test failed"
        }


# =============================================================================
# GLOBAL ROUTER INSTANCE
# =============================================================================

# Singleton router instance
_router: Optional[LLMRouter] = None


def get_llm_router() -> LLMRouter:
    """Get or create the global LLM router instance."""
    global _router
    if _router is None:
        _router = LLMRouter()
    return _router


def configure_llm(
    provider: str,
    api_key: str,
    model: Optional[str] = None,
    base_url: Optional[str] = None
) -> bool:
    """
    Configure the LLM router with a new provider.
    Called by admin endpoints.
    """
    router = get_llm_router()
    try:
        router.configure(
            provider=LLMProvider(provider.lower()),
            api_key=api_key,
            model=model,
            base_url=base_url
        )
        return router.is_llm_available()
    except ValueError:
        return False


def get_llm_status() -> Dict[str, Any]:
    """Get current LLM configuration status."""
    router = get_llm_router()
    
    # Ensure fallback is initialized (defensive check)
    if router._fallback_handler is None:
        router._initialize_fallback()
    
    return {
        "llm_available": router.is_llm_available(),
        "active_provider": router.get_active_provider(),
        "fallback_available": router._fallback_handler is not None,
        "fallback_type": "Rule-Based FAQ" if router._fallback_handler is not None else "None"
    }


def auto_detect_and_configure(api_key: str) -> Dict[str, Any]:
    """
    Auto-detect provider from API key and configure the router.
    
    Args:
        api_key: The API key to detect and configure
    
    Returns:
        Dict with success status, detected provider, and message
    """
    provider, model, message = detect_provider_from_key(api_key)
    
    if provider is None:
        return {
            "success": False,
            "provider": None,
            "model": None,
            "message": message
        }
    
    # Configure the router
    success = configure_llm(
        provider=provider.value,
        api_key=api_key,
        model=model
    )
    
    if success:
        return {
            "success": True,
            "provider": provider.value,
            "model": model,
            "message": f"Auto-configured {provider.value} with model {model}"
        }
    else:
        return {
            "success": False,
            "provider": provider.value,
            "model": model,
            "message": f"Detected {provider.value} but configuration failed"
        }

