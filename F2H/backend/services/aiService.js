import { GoogleGenerativeAI } from '@google/generative-ai';
import pkg from '@google-cloud/aiplatform';
const { TextGenerationModel } = pkg;
const { VertexAI } = pkg;
// Or alternatively:

// Rest of your code...
class AIService {
  constructor() {
    // Initialize Gemini API
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Initialize Vertex AI (optional, for more advanced features)
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
      });
    }

    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Generate interview questions based on role and job description
   * @param {string} role - Job role
   * @param {string} jobDescription - Job description text
   * @param {number} questionCount - Number of questions to generate
   * @param {string} difficulty - Difficulty level
   * @returns {Array} Array of generated questions
   */
  async generateInterviewQuestions(role, jobDescription = '', questionCount = 5, difficulty = 'intermediate') {
    try {
      const prompt = `Generate ${questionCount} interview questions for a ${role} position.

${jobDescription ? `Job Description: ${jobDescription}` : ''}

Requirements:
- Difficulty level: ${difficulty}
- Mix of question types: technical, behavioral, situational, experience-based
- Questions should be professional and relevant to the role
- Include a mix of question categories: personal, company-fit, behavioral, technical, career

Please format the response as a JSON array of objects with the following structure:
[
  {
    "text": "Question text here",
    "type": "technical|behavioral|experience|introduction|motivation|future-goals",
    "category": "personal|company-fit|behavioral|technical|career",
    "difficulty": "${difficulty}"
  }
]

Generate exactly ${questionCount} questions.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const questions = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

      return questions.map((q, index) => ({
        ...q,
        id: `ai-generated-${Date.now()}-${index}`,
        order: index + 1
      }));

    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  /**
   * Analyze interview response and provide feedback
   * @param {string} question - The interview question
   * @param {string} response - User's response
   * @param {string} role - Job role
   * @returns {Object} Analysis results with feedback and scores
   */
  async analyzeResponse(question, response, role) {
    try {
      const prompt = `Analyze this interview response for a ${role} position.

Question: ${question}

Response: ${response}

Please provide a detailed analysis in the following JSON format:
{
  "feedback": {
    "summary": "Brief summary of the response quality",
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement 1", "Improvement 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"]
  },
  "scores": {
    "communication": 0-100,
    "content": 0-100,
    "confidence": 0-100,
    "overall": 0-100
  },
  "metrics": {
    "relevance": 0-100,
    "completeness": 0-100,
    "structure": 0-100
  }
}

Be constructive and provide actionable feedback.`;

      const result = await this.model.generateContent(prompt);
      const response_text = await result.response;
      const text = response_text.text();

      const analysis = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

      return {
        aiAnalysis: analysis.feedback,
        scores: analysis.scores,
        metrics: {
          content: analysis.metrics
        }
      };

    } catch (error) {
      console.error('Error analyzing response with Gemini:', error);
      // Return default analysis if AI fails
      return {
        aiAnalysis: {
          feedback: "Analysis temporarily unavailable",
          suggestions: ["Please try again later"]
        },
        scores: {
          communication: 70,
          content: 70,
          confidence: 70,
          overall: 70
        },
        metrics: {
          content: {
            relevance: 70,
            completeness: 70,
            structure: 70
          }
        }
      };
    }
  }

  /**
   * Generate overall interview feedback
   * @param {Array} responses - Array of question responses
   * @param {string} role - Job role
   * @returns {Object} Overall feedback
   */
  async generateOverallFeedback(responses, role) {
    try {
      const responsesText = responses.map((r, i) =>
        `Question ${i + 1}: ${r.questionText}\nResponse: ${r.response}\nScore: ${r.score}/100`
      ).join('\n\n');

      const prompt = `Based on the following interview responses for a ${role} position, provide overall feedback:

${responsesText}

Please provide comprehensive feedback in JSON format:
{
  "summary": "Overall performance summary",
  "strengths": ["Key strength 1", "Key strength 2"],
  "improvements": ["Area for improvement 1", "Area for improvement 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "overallScore": 0-100
}`;

      const result = await this.model.generateContent(prompt);
      const response_text = await result.response;
      const text = response_text.text();

      return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

    } catch (error) {
      console.error('Error generating overall feedback:', error);
      return {
        summary: "Overall feedback temporarily unavailable",
        strengths: [],
        improvements: [],
        recommendations: ["Please try again later"],
        overallScore: 70
      };
    }
  }

  /**
   * Extract skills and requirements from job description
   * @param {string} jobDescription - Job description text
   * @returns {Object} Extracted skills and requirements
   */
  async extractJobRequirements(jobDescription) {
    try {
      const prompt = `Extract key skills, requirements, and qualifications from this job description:

${jobDescription}

Return in JSON format:
{
  "skills": ["skill1", "skill2", "skill3"],
  "requirements": ["requirement1", "requirement2"],
  "qualifications": ["qualification1", "qualification2"],
  "experience": "required experience level"
}`;

      const result = await this.model.generateContent(prompt);
      const response_text = await result.response;
      const text = response_text.text();

      return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

    } catch (error) {
      console.error('Error extracting job requirements:', error);
      return {
        skills: [],
        requirements: [],
        qualifications: [],
        experience: "Not specified"
      };
    }
  }
}

export default new AIService();
