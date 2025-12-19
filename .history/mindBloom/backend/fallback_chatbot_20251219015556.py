ver"""
fallback_chatbot.py – Rule-based chat handler for Mind Bloom.

This module implements a lightweight, in-memory matching system using TF-IDF 
to map user messages onto a set of predefined prompts and responses.
No external APIs or paid services are required.

This serves as the FALLBACK when no LLM API key is configured.

Safety note: The responses here are supportive and general. The chatbot
does not diagnose medical conditions or provide professional mental health
advice. For urgent or life-threatening situations (e.g. suicidal ideation),
the bot encourages the user to contact a crisis hotline or a qualified
mental health professional.
"""

from __future__ import annotations

import re
import random
from typing import Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ----------------------------------------------------------------------
# Define a set of prompts and their associated responses.
# When adding mental-health related prompts, keep responses empathetic 
# and avoid giving clinical advice.
# ----------------------------------------------------------------------
FAQ: Dict[str, List[str]] = {
    # Greetings
    "hello": [
        "Hello! I'm here to listen. How are you feeling today?",
        "Hi there 👋. I'm Mind Bloom's chatbot. How can I support you?",
    ],
    "hi": [
        "Hi! I'm glad you're reaching out. What's on your mind?",
        "Hey there. Feel free to share how you're doing.",
    ],
    "good morning": [
        "Good morning! I hope your day is starting well. What's on your mind?"
    ],
    "good evening": [
        "Good evening! How are you feeling tonight?"
    ],
    
    # Feelings and emotions
    "i feel sad": [
        "I'm sorry that you're feeling sad. Sometimes talking about it can help. Would you like to share more?",
        "It sounds like you're going through a tough time. I'm here to listen if you'd like to talk about what's making you sad.",
    ],
    "i feel depressed": [
        "Feeling depressed can be very heavy. Remember that you're not alone—many new parents feel this way. It might help to speak to a trusted friend, family member or healthcare provider.",
        "I'm sorry you're feeling this way. While I can't provide medical advice, it might help to talk to someone you trust. I'm here to listen.",
    ],
    "i feel anxious": [
        "Anxiety can be overwhelming. Taking a few slow, deep breaths can sometimes help calm things down. Would you like to talk about what's making you feel anxious?",
        "Many people feel anxious when faced with big changes. Sharing your thoughts can help lighten the load. What has been on your mind lately?",
    ],
    "i am stressed": [
        "Being stressed is common during big life changes. Taking short breaks, even a few minutes, can help. What's been causing you stress?",
        "It sounds like you have a lot on your plate. I'm here to listen if you want to share more.",
    ],
    "i feel lonely": [
        "Feeling lonely can be hard. Connecting with friends or family members, even through a quick message, might help. Would you like to talk about what's making you feel this way?",
        "It's okay to feel lonely sometimes. Is there someone you trust that you could reach out to today? I'm here to listen too.",
    ],
    
    # General motherhood and postpartum questions
    "what is postpartum depression": [
        "Postpartum depression (PPD) is a type of depression that can affect parents after childbirth. It involves emotional highs and lows, frequent crying, fatigue, guilt and anxiety. It's common to feel overwhelmed, but if these feelings persist, it's important to speak with a healthcare professional.",
        "PPD is a mood disorder that happens after you give birth. Symptoms can include sadness, irritability, guilt, anxiety and difficulty caring for your baby. Talking to a doctor or counselor can be very helpful."
    ],
    "is it normal to feel overwhelmed after giving birth": [
        "Absolutely. Adjusting to life with a newborn is challenging, and many parents feel overwhelmed. It's important to ask for help and rest whenever possible.",
        "Feeling overwhelmed as a new parent is very common. It might help to talk to loved ones or a doctor about how you're feeling.",
    ],
    
    # Encourage self-care
    "how can i take care of myself": [
        "Small acts of self-care can make a big difference. Try to rest when you can, eat nourishing food, and reach out to someone you trust to talk about your feelings.",
        "Self-care could include asking for help with chores, taking a short walk, or practicing deep breathing. Everyone's needs are different—what makes you feel more grounded?",
    ],
    
    # General conversation
    "tell me a joke": [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What did the fish say when he hit the wall? Dam!",
    ],
    "how are you": [
        "I'm just a program, but I'm here and ready to listen to you!",
        "I'm here to help you as best as I can. How are you feeling?",
    ],
    
    # Risk level specific guidance
    "low": [
        "Your risk level is low, which is encouraging. Self-care remains important, though. Here are some ideas:\n"
        "1. Emotional well-being: share your feelings with someone you trust or join a support group.\n"
        "2. Rest: sleep when your baby sleeps and accept help with chores or childcare.\n"
        "3. Healthy habits: eat balanced meals, stay hydrated and take gentle walks or do light exercise.\n"
        "4. Stay connected: spend time with your partner and friends and avoid alcohol and recreational drugs.\n"
        "5. Monitor your mood: if you start to feel overwhelmed or your symptoms worsen, contact a healthcare provider for extra support."
    ],
    "medium": [
        "Your risk level is moderate. In addition to the self-care tips, consider these steps:\n"
        "1. Professional support: schedule a consultation with a mental-health professional or therapist.\n"
        "2. Coping strategies: ask about therapies like cognitive-behavioural or interpersonal therapy which can be effective for postpartum depression.\n"
        "3. Continue self-care: rest, eat well and stay physically active when possible.\n"
        "4. Build a support network: reach out to loved ones and join support groups for new parents.\n"
        "5. Watch your symptoms: if they persist beyond two weeks or interfere with daily life, contact your healthcare provider."
    ],
    "high": [
        "Your risk level is high. It's important to seek prompt professional help. Consider the following:\n"
        "1. Mental-health care: contact a doctor or therapist as soon as possible to discuss treatment options.\n"
        "2. Emotional well-being: talk openly with trusted friends or family about your feelings.\n"
        "3. Fear and anxiety: discuss any fears or anxieties with your healthcare provider to develop coping strategies.\n"
        "4. Relationships: communicate with your partner and set boundaries with family members to reduce stress.\n"
        "5. Family support: build a support network by asking for help with chores or childcare.\n"
        "6. Crisis planning: if you experience thoughts of harming yourself or your baby, seek immediate help by contacting a crisis hotline or emergency services."
    ],

    # Assessment results and guidance
    "epds assessment results": [
        "Hello! I'm here to help you understand your EPDS assessment results. Based on your responses, you may have some risk of postpartum depression. How can I assist you today?"
    ],
    "assessment results": [
        "Hello! I'm here to help you understand your assessment results. How can I assist you today?"
    ],
    "provide some guidance": [
        "Based on your description, here are some observations and suggestions:\n"
        "1. Emotional well-being: If you're experiencing persistent sadness, hopelessness or loss of interest, talk to a mental-health professional for support.\n"
        "2. Fear and anxiety: It's normal to feel anxious about pregnancy or motherhood; share your concerns with your doctor or a therapist and learn coping strategies.\n"
        "3. Relationships: Stressful relationships can add to your burden; communicate with loved ones, set boundaries and consider couples counseling if needed.\n"
        "4. Support network: Building a support network is crucial — reach out to family, friends and support groups for help.\n"
        "5. Self-care: Rest when you can, eat nourishing foods and engage in light physical activity. If your symptoms persist or worsen, seek medical advice."
    ],
    
    # Coping strategies and support
    "coping strategies postpartum": [
        "Here are some things you can do at home to feel better while seeing a doctor: rest when the baby is sleeping, ask family and friends for help, make time to go out or spend time with your partner, talk about your feelings, join support groups and avoid major life changes.",
        "Postpartum depression can be treated with therapy, support groups, self-care, social support and sometimes medication; working with a doctor helps you decide which options are best."
    ],
    "build a support network": [
        "Building a support network includes talking with your partner or family about your feelings, joining support groups of other mothers and making time to connect with friends.",
        "You can ask your doctor or local health center about support groups, and reach out to community centers, libraries or places of worship for parenting groups and programs."
    ],
    "relationship support postpartum": [
        "Postpartum depression can strain relationships. Try to communicate openly with your partner about your feelings, set boundaries with extended family and ask for support from family or friends. Couples therapy may also help strengthen relationships."
    ],
    
    # Information about screening tools
    "what is phq-9": [
        "The PHQ-9 is a 9-item questionnaire used to screen for depression. Each item is scored from 0 to 3; total scores range from 0 to 27. A high score suggests more severe symptoms and may require further evaluation."
    ],
    "what is epds": [
        "The Edinburgh Postnatal Depression Scale (EPDS) is a 10-item questionnaire used to identify women who may be experiencing postpartum depression. Each answer is scored from 0 to 3, giving a maximum total score of 30. A score above 10 suggests depression may be present; if you have thoughts of harming yourself or your baby, contact your doctor or go to the nearest emergency room."
    ],
    
    # Treatment and resource queries
    "postpartum depression treatment": [
        "Postpartum depression is treatable. Options may include:\n"
        "1. Therapy: Cognitive-behavioral or interpersonal therapy can help you understand and cope with your feelings.\n"
        "2. Support groups: Talking with other parents who are experiencing similar feelings can be validating and helpful.\n"
        "3. Self-care and social support: Rest, eat nutritious foods, stay physically active and lean on friends and family.\n"
        "4. Medication: Antidepressants may be recommended by your doctor if symptoms are severe.\n"
        "5. Work with a healthcare provider to decide which combination of treatments is best for you."
    ],
    "postpartum depression resources": [
        "If you need support, here are some resources:\n"
        "1. Call the Suicide and Crisis Lifeline by dialing 988 (United States) or your local emergency number if you have thoughts of harming yourself or your baby.\n"
        "2. National Maternal Mental Health Hotline: 1-833-TLC-MAMA (1-833-852-6262).\n"
        "3. Postpartum Support International helpline: 1-800-944-4773.\n"
        "4. In Bangladesh, you can call the Kaan Pete Roi helpline at 01742441122 (8 pm–12 am).\n"
        "5. Your healthcare provider, local hospital or mental-health professional can help connect you with support groups and treatment options."
    ],
    "postpartum depression symptoms": [
        "Symptoms of postpartum depression may include persistent sadness, loss of interest or pleasure, fatigue, difficulty sleeping, irritability, guilt, anxiety and feelings of being overwhelmed. Some people may also fear harming themselves or their baby. If these symptoms last longer than two weeks or interfere with daily life, talk to a healthcare provider."
    ],
    "postpartum depression danger signs": [
        "Danger signs of postpartum mood disorders include thoughts of hurting yourself or your baby, hallucinations, delusions, extreme agitation or confusion, and rapid mood swings. Seek immediate help from a healthcare professional or call a crisis hotline if you experience these symptoms."
    ],
    "self care postpartum": [
        "Here are some self-care tips after childbirth:\n"
        "1. Rest as much as possible—sleep when your baby sleeps and accept help with chores and childcare.\n"
        "2. Make time to socialise or spend time with your partner and avoid major life changes.\n"
        "3. Talk about your feelings with supportive friends, family or a counselor and join support groups.\n"
        "4. Eat healthy foods, stay hydrated and engage in physical activity.\n"
        "5. If you have persistent or worsening symptoms, seek guidance from a healthcare provider."
    ],
    
    # Additional intents
    "emotional well-being postpartum": [
        "Here are some suggestions for maintaining emotional well-being after childbirth:\n"
        "1. Talk about your feelings with a trusted person or join a support group.\n"
        "2. Rest and sleep when your baby sleeps—ask for help with chores or childcare when you can.\n"
        "3. Eat nourishing foods, stay hydrated and engage in light physical activity.\n"
        "4. Avoid alcohol and recreational drugs.\n"
        "5. If feelings of sadness or anxiety persist for more than two weeks, contact a healthcare provider or mental-health professional."
    ],
    "fear of pregnancy": [
        "It's normal to have fears or anxiety related to pregnancy and motherhood. Here are some suggestions:\n"
        "1. Talk to a healthcare provider or therapist about your fears and learn coping strategies.\n"
        "2. Attend prenatal or parenting classes to prepare for childbirth and newborn care.\n"
        "3. Share your worries with a partner, family member or friend for support.\n"
        "4. Practice relaxation techniques such as deep breathing, meditation or gentle stretching.\n"
        "5. Break tasks into small steps and focus on what you can control."
    ],
    "relationships postpartum": [
        "Relationships can be strained after a baby arrives. Here are some ideas to help:\n"
        "1. Communicate openly with your partner about your feelings and needs.\n"
        "2. Set boundaries with extended family and prioritise your immediate family's well-being.\n"
        "3. Ask for help with childcare or household tasks to reduce stress.\n"
        "4. Make time to spend with your partner, even short moments, to maintain connection.\n"
        "5. Consider couples counseling if you feel your relationship is under strain."
    ],
    "family support postpartum": [
        "Building a supportive family environment is important after childbirth:\n"
        "1. Share your feelings and needs with family members and accept their help.\n"
        "2. Ask relatives or friends to assist with chores, meals or childcare so you can rest.\n"
        "3. Make time to spend with your partner and older children to foster connection.\n"
        "4. Talk to other parents or join a support group to gain perspective and support.\n"
        "5. Communicate boundaries and expectations clearly to avoid misunderstandings."
    ],
    "support network postpartum": [
        "Here are some tips for building a support network after childbirth:\n"
        "1. Talk to your partner, family and close friends about how you're feeling and ask for their support.\n"
        "2. Join local parenting groups or online forums to connect with other new parents.\n"
        "3. Attend support groups offered by hospitals, community organizations or mental-health charities.\n"
        "4. Ask your healthcare provider for recommendations on local resources and support services.\n"
        "5. Stay connected with friends, even through calls or messages, to avoid isolation."
    ],
    "postpartum depression risk factors": [
        "Risk factors for postpartum depression include a personal or family history of depression or anxiety, a lack of social support, stressful life events, complications during pregnancy or delivery, financial stress and hormonal changes. If you think you're at risk, talk to your healthcare provider for support."
    ],
    "postpartum psychosis": [
        "Postpartum psychosis is a rare but serious mental health emergency that can occur after childbirth. Symptoms may include severe agitation, confusion, paranoia, hallucinations, rapid mood swings and thoughts of harming yourself or your baby. It requires immediate medical attention; contact emergency services or go to the hospital if you suspect it."
    ],
    "help someone postpartum depression": [
        "If someone you care about is experiencing postpartum depression, you can help by:\n"
        "1. Learning the signs of depression and encouraging them to seek medical care.\n"
        "2. Being a good listener and letting them share their feelings without judgment.\n"
        "3. Offering to help with daily tasks like cooking, cleaning or running errands.\n"
        "4. Offering to watch their baby while they sleep or rest.\n"
        "5. Encouraging them to see a therapist or mental-health provider and offering to accompany them if needed."
    ],
    "baby blues vs postpartum depression": [
        "The 'baby blues' affect up to 75% of new mothers and include mood swings, crying spells and anxiety. These symptoms usually begin within a few days of delivery and go away within two weeks without treatment.\n"
        "Postpartum depression is more serious and lasts longer, with symptoms such as extreme sadness, irritability, fatigue, guilt and difficulty caring for yourself or your baby. If symptoms persist beyond two weeks or interfere with daily life, contact your healthcare provider."
    ],
    
    # Thank you / goodbye
    "thank you": [
        "You're welcome! I'm always here if you need to talk. Take care of yourself 💜",
        "I'm glad I could help. Remember, you're not alone in this journey."
    ],
    "goodbye": [
        "Goodbye! Take care of yourself, and don't hesitate to reach out whenever you need support.",
        "Bye for now! Wishing you strength and peace. I'm here whenever you need me."
    ],
}

# Precompute the TF-IDF vectors for the FAQ keys
_vectorizer = TfidfVectorizer().fit(FAQ.keys())
_faq_matrix = _vectorizer.transform(FAQ.keys())
_faq_keys = list(FAQ.keys())


def _match_intent(message: str) -> str:
    """Match the user's message to one of the FAQ keys using cosine similarity.
    
    Returns an empty string if the similarity is below a threshold.
    """
    text = message.strip().lower()
    if not text:
        return ""
    input_vec = _vectorizer.transform([text])
    similarities = cosine_similarity(input_vec, _faq_matrix)[0]
    best_idx = similarities.argmax()
    best_score = similarities[best_idx]
    # Threshold for a confident match (adjust as needed)
    if best_score >= 0.25:
        return _faq_keys[best_idx]
    return ""


def _is_crisis(message: str) -> bool:
    """Detect crisis keywords (self-harm, suicide, etc.)."""
    crisis_keywords = [
        "suicide",
        "kill myself",
        "self-harm",
        "end my life",
        "hurt myself",
        "want to die",
        "harm my baby",
        "hurt my baby",
    ]
    text = message.lower()
    return any(kw in text for kw in crisis_keywords)


def get_fallback_response(message: str, risk_level: Optional[str] = None) -> str:
    """
    Main entry point for the fallback chatbot.
    
    Args:
        message: User's message
        risk_level: Optional risk level (low/medium/high) for personalized guidance
    
    Returns:
        Chatbot response string
    """
    message = message or ""
    
    # Crisis handling first
    if _is_crisis(message):
        return (
            "I'm really sorry that you're feeling this way. "
            "Your safety is the most important thing. "
            "Please contact a trusted friend, family member or a crisis hotline in your area immediately. "
            "If you're in Bangladesh, you can call the Kaan Pete Roi helpline at 01742441122 (8 pm–12 am). "
            "In the US, dial 988 for the Suicide and Crisis Lifeline."
        )
    
    # Check if user is asking about their specific risk level
    if risk_level and risk_level.lower() in FAQ:
        # User has a risk level, check if they're asking about it
        risk_keywords = ["my risk", "my result", "my assessment", "what should i do", "guidance", "help me"]
        if any(kw in message.lower() for kw in risk_keywords):
            responses = FAQ[risk_level.lower()]
            return random.choice(responses)
    
    # Try to match intent
    key = _match_intent(message)
    if key:
        responses = FAQ[key]
        return random.choice(responses)
    
    # Neutral fallback if we can't match the intent
    return (
        "Thank you for sharing. I'm here to listen and support you. "
        "Could you tell me a bit more about what's on your mind? "
        "I can help with questions about postpartum depression, self-care tips, "
        "coping strategies, or just be here to listen."
    )


# For direct import as a handler function
def fallback_handler(message: str) -> str:
    """Simple handler function for use with LLMRouter."""
    return get_fallback_response(message)

