const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getAIClient = () => {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            console.error('Missing GEMINI_API_KEY environment variable');
            return null;
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI API timeout')), ms))
    ]);
};

/**
 * Generate a short 2-3 line response playing as a specific side.
 */
const generateBotArgument = async (topic, history, botName, botSide) => {
    try {
        const client = getAIClient();
        if (!client) throw new Error('Gemini API keys missing');
        
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `You are a participant in a structured debate about the topic: "${topic}".
Current debate history:
${history.map(a => `${a.side}: ${a.text}`).join('\n')}

You are ${botName}, debating on the ${botSide} side. Respond in exactly 2-3 lines. Maintain a formal debate tone.`;

        const result = await withTimeout(model.generateContent(prompt), 10000);
        return result.response.text().trim();
    } catch (error) {
        throw new Error('Bot API failure'); // Bubble up so debate loop can handle catch/skipping
    }
};

/**
 * Generate a short summary for the topic lobby.
 */
const generateTopicBrief = async (topic) => {
    try {
        const client = getAIClient();
        if (!client) return '';
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `Explain this debate topic in 2-3 simple lines: ${topic}`;
        const result = await withTimeout(model.generateContent(prompt), 8000);
        return result.response.text().trim();
    } catch (error) {
        console.error('Bot failed generating topic brief:', error);
        return '';
    }
};

/**
 * Suggest a brand new topic entirely
 */
const suggestTopic = async () => {
    try {
        const client = getAIClient();
        if (!client) throw new Error('Gemini API keys missing');
        
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
        
        const prompt = `Suggest one clear and engaging debate topic based on current trends (technology, society, politics, or ethics). Keep it concise.
Return ONLY valid JSON. No markdown, no explanation. Exactly matching this structure:
{
  "topic": "...",
  "brief": "2-3 line explanation"
}`;

        const result = await withTimeout(model.generateContent(prompt), 10000);
        let rawJson = result.response.text().trim();
        
        const match = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
            rawJson = match[1].trim();
        }
        
        return JSON.parse(rawJson);
    } catch (error) {
        console.error('Suggest topic failed:', error);
        return {
            topic: "Is AI doing more harm than good?",
            brief: "Discuss the impact of AI on society, jobs, and ethics."
        };
    }
};

/**
 * Evaluate the final debate and return structured JSON result.
 */
const evaluateDebate = async (topic, argumentsObj, evaluationInstructions) => {
    try {
        const client = getAIClient();
        if (!client) throw new Error('Gemini API keys missing');

        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        
        const formattedHistory = argumentsObj.map(a => `[${a.side === 'FOR' ? 'FOR' : 'AGAINST'}] User ${a.userId}: ${a.text}`).join('\n');
        const instructionsBlock = evaluationInstructions ? `\nFollow these rules: ${evaluationInstructions}\n` : '';

        const prompt = `You are an expert debate moderator. Analyze this debate about "${topic}" and declare a winner based on logic, clarity, and argument strength.${instructionsBlock}

Debate Transcript:
${formattedHistory}

Return ONLY valid JSON. No markdown, no explanation. Exactly matching this structure:
{
  "winner": "...",
  "reason": "...",
  "for_score": number, 
  "against_score": number,
  "feedback": "..."
}`;

        const result = await withTimeout(model.generateContent(prompt), 20000);
        let rawJson = result.response.text().trim();
        
        // safe fallback parsing
        const match = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
            rawJson = match[1].trim();
        }
        
        try {
            return JSON.parse(rawJson);
        } catch (e) {
            console.warn('Failed to parse Gemini output cleanly. Raw:', rawJson);
            return {
                winner: 'UNKNOWN',
                reason: 'Could not parse AI response',
                for_score: 0,
                against_score: 0,
                feedback: rawJson.substring(0, 500)
            };
        }
    } catch (error) {
        console.error('Error evaluating debate:', error);
        return {
             winner: 'ERROR',
             reason: 'Evaluation failed',
             for_score: 0,
             against_score: 0,
             feedback: 'Error occurred during AI processing.'
        };
    }
};

module.exports = {
    generateBotArgument,
    generateTopicBrief,
    suggestTopic,
    evaluateDebate
};
