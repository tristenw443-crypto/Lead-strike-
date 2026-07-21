import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleGenAI, Content, Type } from "@google/genai";
import { firstValueFrom } from 'rxjs';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';

export interface Lead {
  id?: string;
  businessName: string;
  ownerName: string;
  url: string;
  phone: string;
  email: string;
  contactFormUrl?: string; // New field for FORM_ONLY fallback
  address: string;
  securityStatus: 'Unsecured' | 'Outdated' | 'Vulnerable';
  riskScore: number; // 1-100
  issues: string[];
  // Enhanced Contact Fields
  socialProfiles: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string; // Added Twitter/X
  };
  estimatedLeadLoss: string; // e.g. "$15,000/yr"
  estimatedLeadLossReasoning: string; // Evidence-based justification
  
  // TechStrike Fields
  techStack: string[]; // e.g. ["PHP 5.6", "jQuery", "Apache"]
  techDebtLevel: 'Low' | 'Medium' | 'High';
  websiteCategory: string; // e.g. "eCommerce", "B2B Service"
  aiUpgradeProposal: string; // e.g. "Agentic Ticket Resolution"
  ceoPitch: string; // Short pre-generated pitch for mailto
  modernizationRoadmap?: string; // New field for 60-day roadmap

  // Vulnerability Scanner Data
  vulnerabilities?: {
    outdatedSoftware: boolean;
    unencryptedConnection: boolean;
    missingSecurityHeaders: boolean;
    detectedSoftware?: string[];
  };
  
  riskScoreReasoning: string; // Evidence-based justification for risk score

  outreachStatus?: 'Not Contacted' | 'Contacted' | 'Ignored' | 'Responded' | 'Won' | 'Lost';
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private httpClient = inject(HttpClient);

  constructor() {
    const apiKey = (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '') || (process.env as any)['API_KEY'] || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      // Check for 429 Resource Exhausted (Throttling)
      const isThrottled = error.error?.code === 429 || error.status === 429 || (error.message && error.message.includes('429'));
      
      if (isThrottled && retries > 0) {
        console.warn(`Gemini API throttled. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2); // Exponential backoff
      }
      throw error;
    }
  }

  async saveLead(lead: Lead): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        ...lead,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving lead to Firestore:', error);
      throw error;
    }
  }

  async auditAndSaveLead(city: string, niche: string, proprietary: boolean): Promise<Lead[]> {
    const leads = await this.findLeads(city, niche, proprietary);
    for (const lead of leads) {
      await this.saveLead(lead);
    }
    return leads;
  }

  async findLeads(city: string, niche: string, proprietary: boolean): Promise<Lead[]> {
    // Zero-hallucination local business grounding prompt
    const prompt = `You are the "TechStrike Lead Architect" and elite growth auditor.
    Your absolute top-priority, non-negotiable directive is: **ZERO HALLUCINATION & REAL GROUNDING**.
    The user is searching for REAL, ACTIVE businesses operating in or around the city/region of "${city}" under the niche "${niche}".
    
    You MUST execute the following workflow using the Google Search tool:
    1. Run multiple high-intent Google Search queries using the search tool, such as:
       - "${niche} in ${city}"
       - "${niche} businesses in ${city}"
       - "best ${niche} near ${city}"
    2. Extract actual, live business names, physical addresses, telephone numbers, and website URLs from the search results.
    3. Verify that every business you output has a REAL, active website domain returned in the Google Search results. DO NOT make up or hallucinate generic domain names or websites (e.g., do NOT invent domains like "johns${niche}in${city}.com" or "austin${niche}pros.com" unless they are real and explicitly shown in search results). If a business has no website, look for another business that does.
    4. Anti-Hallucination & Reality Constraints:
       - **Business Name & Website URL:** MUST be completely real, live, and verified from Google Search results.
       - **Owner/CEO Name:** If you cannot find the actual owner, founder, or CEO name, set the field to "Business Owner", "Management Team", or "General Manager". NEVER invent or guess a fake personal name (such as "John Doe" or "Robert Smith"). Only use a real person's name if you find it explicitly in the search results or website.
       - **Email Address:** Search for real emails (like info@, contact@, sales@) from the business's website or search results. If no real email is listed, set the email to 'FORM_ONLY'. NEVER fabricate, hallucinate, or guess email addresses (e.g., do NOT guess "contact@domain.com").
       - **Phone & Address:** Use their real physical address and telephone number from Google Maps/Search results. Do NOT invent them.
       - **Tech Audit & Observed Friction:** Audit the actual website. Look strictly for **real, observable user experience bottlenecks** (e.g., "buried contact phone number," "no mobile-friendly layout," "manual payment portal only (Square/CashApp)," "broken social media links"). Specifically search for and include their active Instagram page URL.
       - **Honest Assessment:** Do NOT invent financial loss figures or use jargon-heavy AI/automation buzzwords unless specifically relevant and supported by evidence. Instead, describe the **functional consequence** of the friction you observe (e.g., "Customers cannot book directly on the site, forcing them to call or leave").
       - **Content Visibility Gap:** Assess the content. If they have no educational material, blog, or recent updates in the last 6 months, report this as a "Visibility Gap."
        
    PROPRIETARY DISTRESSED ASSET MODE (${proprietary ? 'ACTIVE' : 'INACTIVE'}):
    ${proprietary ? `
    Focus on real businesses that show signs of low digital sophistication—specifically those relying on simple transaction pages (like Square or CashApp links) as their primary website, lacking mobile optimization, or having no meaningful content/educational resources.
    ` : 'Identify businesses operating in the city.'}
    
    Generate and return up to 5 real businesses matching these criteria. If you can only find 2 or 3 real ones, return only those. It is a critical failure to return even a single hallucinated or fabricated business.
    `;

    const leadSchema = {
      type: Type.ARRAY,
      description: "List of real, verified local businesses identified matching the criteria.",
      items: {
        type: Type.OBJECT,
        properties: {
          businessName: {
            type: Type.STRING,
            description: "The official real-world name of the business found via search results. MUST be real.",
          },
          ownerName: {
            type: Type.STRING,
            description: "The real name of the business owner, CEO, or principal. If not explicitly found, use a general title like 'Business Owner', 'General Manager', or 'Management Team', but DO NOT invent a fake person name.",
          },
          url: {
            type: Type.STRING,
            description: "The actual website URL of the business found in search results. It must be a real, live website. MUST include http:// or https://.",
          },
          phone: {
            type: Type.STRING,
            description: "The actual phone number of the business. Set to empty string if not found, do NOT invent.",
          },
          email: {
            type: Type.STRING,
            description: "The actual verified contact email if found. If no email is explicitly listed on the site or in search, use 'FORM_ONLY'. NEVER guess or fabricate.",
          },
          contactFormUrl: {
            type: Type.STRING,
            description: "The contact form or contact page URL of the business website (e.g., https://example.com/contact). Useful if email is 'FORM_ONLY'. Set to null or empty if not found.",
          },
          address: {
            type: Type.STRING,
            description: "The actual physical address of the business. Set to empty string if not found.",
          },
          securityStatus: {
            type: Type.STRING,
            description: "Security status. Must be one of: 'Unsecured', 'Outdated', or 'Vulnerable'.",
            enum: ["Unsecured", "Outdated", "Vulnerable"]
          },
          riskScore: {
            type: Type.INTEGER,
            description: "An calculated risk score between 1 and 100 representing their technical debt/security risk.",
          },
          riskScoreReasoning: {
            type: Type.STRING,
            description: "Evidence-based justification for the calculated risk score based on identified technical issues.",
          },
          issues: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of actual or highly likely technical and business friction issues discovered (e.g., 'Unsecured connection (HTTP)', 'No booking bot', 'Legacy web architecture', 'No responsive mobile layout').",
          },
          socialProfiles: {
            type: Type.OBJECT,
            properties: {
              linkedin: { type: Type.STRING, description: "LinkedIn page URL if found, otherwise empty." },
              twitter: { type: Type.STRING, description: "Twitter/X page URL if found, otherwise empty." },
              facebook: { type: Type.STRING, description: "Facebook page URL if found, otherwise empty." },
              instagram: { type: Type.STRING, description: "Instagram page URL if found, otherwise empty." },
            },
            required: ["linkedin", "twitter", "facebook", "instagram"]
          },
          estimatedLeadLoss: {
            type: Type.STRING,
            description: "An estimate of annual monetary loss in USD due to their tech friction, formatted as '$Amount/yr' (e.g., '$15,000/yr').",
          },
          estimatedLeadLossReasoning: {
            type: Type.STRING,
            description: "Evidence-based reasoning for the estimated lead loss, referencing specific technical friction points and industry benchmarks.",
          },
          techStack: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Inferred or detected technologies used on their website (e.g., WordPress, jQuery, PHP, Wix, Squarespace, GoDaddy).",
          },
          techDebtLevel: {
            type: Type.STRING,
            description: "Overall technical debt rating: 'Low', 'Medium', or 'High'.",
            enum: ["Low", "Medium", "High"]
          },
          websiteCategory: {
            type: Type.STRING,
            description: "Primary category of the business (e.g., 'eCommerce', 'Healthcare', 'B2B Services', 'Legal Services', 'Local Retail', 'Home Services').",
          },
          aiUpgradeProposal: {
            type: Type.STRING,
            description: "A tailored AI automation solution to address their friction (e.g., 'Agentic Booking Assistant', 'Intelligent Customer Support Chatbot').",
          },
          ceoPitch: {
            type: Type.STRING,
            description: "A compelling 2-sentence hook email body addressing the owner/manager.",
          },
          vulnerabilities: {
            type: Type.OBJECT,
            properties: {
              outdatedSoftware: { type: Type.BOOLEAN, description: "Whether the software/platform is outdated." },
              unencryptedConnection: { type: Type.BOOLEAN, description: "Whether the connection is unencrypted (uses http://)." },
              missingSecurityHeaders: { type: Type.BOOLEAN, description: "Whether security headers like HSTS/CSP are likely missing." },
              detectedSoftware: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of detected software names and versions if available."
              }
            },
            required: ["outdatedSoftware", "unencryptedConnection", "missingSecurityHeaders"]
          }
        },
        required: [
          "businessName", "ownerName", "url", "phone", "email", "address", 
          "securityStatus", "riskScore", "riskScoreReasoning", "issues", "socialProfiles", 
          "estimatedLeadLoss", "estimatedLeadLossReasoning", "techStack", "techDebtLevel", "websiteCategory", 
          "aiUpgradeProposal", "ceoPitch", "vulnerabilities"
        ]
      }
    };

    try {
      console.log('Sending request to Gemini API (Grounding Mode)...');
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          responseMimeType: 'application/json',
          responseSchema: leadSchema
        }
      }));
      console.log('Received response from Gemini API');

      const text = response.text || '';
      const parsedLeads = this.extractJson(text) as Lead[];
      console.log('Parsed leads count:', parsedLeads?.length);

      if (parsedLeads && Array.isArray(parsedLeads)) {
        // Post-processing to enforce SSL check logic
        return parsedLeads.map(lead => {
            // Check if URL explicitly starts with http:// (indicating no SSL or not forcing it)
            if (lead.url && lead.url.toLowerCase().startsWith('http://')) {
                lead.securityStatus = 'Unsecured';
                
                // Ensure 'Missing SSL Certificate' is in the issues list
                if (!lead.issues) lead.issues = [];
                if (!lead.issues.includes('Missing SSL Certificate')) {
                    lead.issues.unshift('Missing SSL Certificate');
                }
                
                // Increase risk score if unsecured
                if (lead.riskScore < 80) lead.riskScore = 85;
            }
            return lead;
        });
      }

      console.warn('Could not parse JSON from response', text);
      return [];
    } catch (error) {
      console.error('Gemini API Error (Find Leads):', error);
      throw error;
    }
  }


  private extractJson(text: string): any {
    if (!text) return null;
    
    // Clean up Markdown code blocks
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find the first potential start of JSON
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    if (firstBrace === -1 && firstBracket === -1) return null;
    
    let startIndex = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) 
      ? firstBrace 
      : firstBracket;
    
    let candidate = cleaned.substring(startIndex);
    
    // Iteratively try to parse, truncating if there's trailing garbage
    // This handles cases where the LLM added text after the JSON
    while (candidate.length > 0) {
      try {
        return JSON.parse(candidate);
      } catch (e: any) {
        const errorMessage = e.message || '';
        // Check for the specific error about trailing characters
        // "Unexpected non-whitespace character after JSON at position 123"
        const match = errorMessage.match(/position (\d+)/);
        if (match && (errorMessage.includes('after JSON') || errorMessage.includes('Unexpected non-whitespace character'))) {
          const pos = parseInt(match[1], 10);
          candidate = candidate.substring(0, pos).trim();
        } else {
          // If it's another error (like unexpected end of input), try to find the last matching bracket
          const lastBrace = candidate.lastIndexOf('}');
          const lastBracket = candidate.lastIndexOf(']');
          const lastIndex = Math.max(lastBrace, lastBracket);
          
          if (lastIndex === -1 || lastIndex === candidate.length - 1) {
             // We've already tried the last possible index or there are no more brackets
             return null;
          }
          candidate = candidate.substring(0, lastIndex + 1).trim();
        }
      }
    }
    
    return null;
  }


  private validateLead(lead: Lead): void {
    if (!lead.businessName || lead.businessName.trim() === '') {
      throw new Error('Invalid Lead: Missing Business Name');
    }
    if (!lead.ownerName || lead.ownerName.trim() === '') {
      throw new Error('Invalid Lead: Missing Owner Name');
    }
    
    // URL Validation
    try {
      if (lead.url) {
        new URL(lead.url);
      }
    } catch (e) {
      throw new Error('Invalid Lead: Invalid URL format');
    }
    
    // Email Validation
    if (lead.email !== 'FORM_ONLY' && lead.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lead.email)) {
        throw new Error('Invalid Lead: Invalid email format');
      }
    }
  }

  async generateOutreachWorkflow(lead: Lead): Promise<string> {
    this.validateLead(lead);
    const prompt = `You are a "Strategic Partnership Developer."
    GOAL: Draft a compelling, multi-step cold outreach sequence to an AI or IT agency about a high-intent partnership opportunity.
    
    LEAD DATA:
    - Business: ${lead.businessName}
    - Industry: ${lead.websiteCategory || 'General Business'}
    - Identified Operational Pain Points: ${lead.issues.join(', ') || 'None reported'}
    - AI Upgrade/Opportunity: ${lead.aiUpgradeProposal || 'Operational Efficiency'}
    
    INSTRUCTIONS:
    1. Analyze the lead's business need and how it aligns with a high-end partnership program where an agency handles implementation.
    2. Draft a 3-email sequence:
       - Email 1: The "Partnership Value" Hook (Focus on why ${lead.businessName} is a perfect client for the agency due to the identified pain points/opportunity).
       - Email 2: The "Specific Solution" Case (Showcase the AI Upgrade proposal as a blueprint for the agency to execute).
       - Email 3: The "Joint Success" Close (Clear CTA for a partnership call to discuss the lead).
    
    TONE: Professional, collaborative, and results-oriented. 
    IMPORTANT: DO NOT fabricate technical risks, vulnerabilities, or fake CVEs. Base your outreach entirely on the provided LEAD DATA. Focus on growth, efficiency, and partnership value.
    
    OUTPUT FORMAT: Markdown, clearly labeled per email step.`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      }));
      return response.text || 'Error generating workflow.';
    } catch (error) {
      console.error('Gemini API Error (Generate Outreach Workflow):', error);
      return 'Failed to generate outreach sequence.';
    }
  }

  async generatePitch(lead: Lead): Promise<string> {
    this.validateLead(lead);

    const category = (lead.websiteCategory || '').toLowerCase();
    let dynamicDirectives = '';
    let tone = 'Professional, data-backed, and slightly provocative';

    if (category.includes('ecommerce') || category.includes('retail') || category.includes('shop')) {
      tone = 'ROI-driven, hyper-focused on conversion metrics, checkout optimization, and page speed';
      dynamicDirectives = `
      - TONE/ANGLE: Talk about core ecommerce metrics like conversion rates, cart abandonment, page load speed, checkout friction, and security indicators.
      - CONTEXTUAL HOOK: Address the immediate impact of unsecured connections on checkout trust (browsers displaying "Not Secure" during payment/billing operations) and checkout performance.
      - ACTIONABLE SUGGESTION: Suggest immediate visual checkout security trust badging, HTTP-to-HTTPS redirect enforcement, and modern lightweight payment APIs.
      `;
    } else if (category.includes('healthcare') || category.includes('medical') || category.includes('dental') || category.includes('clinic')) {
      tone = 'Authoritative, trust-oriented, and focused on compliance/patient safety';
      dynamicDirectives = `
      - TONE/ANGLE: Focus heavily on HIPAA compliance, patient privacy, server handshake encryption, and institutional trust.
      - CONTEXTUAL HOOK: Address patient skepticism when visiting non-HTTPS booking systems or medical intake form pages. Talk about patient data leakage risk.
      - ACTIONABLE SUGGESTION: Immediate SSL renewal, secure intake form migrations, and encryption standards for scheduling widgets.
      `;
    } else if (category.includes('b2b') || category.includes('consulting') || category.includes('professional') || category.includes('legal') || category.includes('law')) {
      tone = 'Sophisticated, direct, enterprise-grade, focusing on authority and lead flow';
      dynamicDirectives = `
      - TONE/ANGLE: Focus on business-to-business credibility, enterprise procurement trust, lead capture hygiene, and professional authority.
      - CONTEXTUAL HOOK: Highlight how sophisticated corporate or legal clients drop off instantly when a site triggers browser "insecure site" warning overlays.
      - ACTIONABLE SUGGESTION: Secure lead routing, client portal encryption, and modern DNS level security protocols (HSTS).
      `;
    } else {
      tone = 'Pragmatic, peer-to-peer, direct, and growth-oriented';
      dynamicDirectives = `
      - TONE/ANGLE: Standard local search engine positioning (SEO impact), local trust, and direct lead generation protection.
      - CONTEXTUAL HOOK: Address Google Search algorithm penalties for non-HTTPS websites and chrome warning flags impacting local traffic.
      - ACTIONABLE SUGGESTION: Full site SSL integration and SEO redirect alignment.
      `;
    }

    const prompt = `You are the "Ghost-Hunter" Lead Architect.
    TARGET: ${lead.ownerName}, owner of "${lead.businessName}" (${lead.url}).
    CONTEXT:
    - Business Type: ${lead.websiteCategory || 'General Business'}
    - Tech Debt Level: '${lead.techDebtLevel}'
    - Tech Stack: ${lead.techStack.join(', ')}
    - Estimated Annual Loss: ${lead.estimatedLeadLoss}
    
    DYNAMIC INDUSTRY DIRECTIVES:
    ${dynamicDirectives}

    INSTRUCTIONS:
    1. DYNAMIC HOOK & PITCH ANGLE:
       Tailor the message based on the specific combination of Business Type and Tech Debt:
       
       - **eCommerce + High Tech Debt**: Focus on "Abandoned Carts & Lost Revenue." Mention how legacy tech is literally bleeding sales every hour.
       - **eCommerce + Medium/Low Tech Debt**: Focus on "AI-Driven Personalization & Conversion." How can they beat Amazon-level experiences?
       
       - **Medical/Healthcare + High Tech Debt**: Focus on "HIPAA Compliance & Patient Trust." Legacy systems are a liability for sensitive data.
       - **Medical/Healthcare + Medium/Low Tech Debt**: Focus on "Patient Experience & Scheduling Automation." Reducing administrative friction.
       
       - **B2B/Professional Services + High Tech Debt**: Focus on "Operational Bottlenecks & Scalability." Their tech is a ceiling on their growth.
       - **B2B/Professional Services + Medium/Low Tech Debt**: Focus on "Agentic Workflows & Competitive Edge." Doing more with less using AI.
       
       - **General/Other**: Use a "Digital Foundation" angle. High debt = "Structural Risk"; Low debt = "Modernization Opportunity."

    2. PITCH EXECUTION:
       - Write a high-converting, personalized cold email (<200 words).
       - Tone: ${tone}.
       - **Hook:** Start with a hook that directly references their business type (${lead.websiteCategory}) and the specific pain point identified above.
    
    FORMAT: Markdown.`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      }));
      return response.text || 'Error generating pitch.';
    } catch (error) {
      console.error('Gemini API Error (Generate Pitch):', error);
      return 'Failed to generate pitch. Please try again.';
    }
  }

  async generateModernizationRoadmap(lead: Lead): Promise<string> {
    this.validateLead(lead);
    const prompt = `You are the "Lead Strike Architect" for agentic modernization.
    GOAL: Create a high-leverage, 60-day 'Agentic Modernization Roadmap' for ${lead.businessName}.

    LEAD DATA:
    - Business: ${lead.businessName}
    - Category: ${lead.websiteCategory || 'General B2B'}
    - Current Friction Points: ${lead.issues.join(', ') || 'None reported'}
    - Tech Stack: ${lead.techStack.join(', ') || 'Not specified'}

    INSTRUCTIONS:
    - Prioritize n8n (automation tool) automations that replace manual work.
    - Break it down into phases:
      Phase 1: (Day 1-20) Foundational Automation (Low hanging fruit)
      Phase 2: (Day 21-40) Core Workflow Modernization
      Phase 3: (Day 41-60) Scaling with Agentic Workers

    TONE: Professional, analytical, growth-focused.
    OUTPUT FORMAT: Markdown, clearly structured.`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      }));
      return response.text || 'Roadmap generation failed.';
    } catch (error) {
      console.error('Gemini API Error (Roadmap):', error);
      return 'Failed to generate roadmap.';
    }
  }

  async getCorporateReport(businessName: string): Promise<string> {
    const prompt = `You are a "Corporate Intelligence Specialist." Your job is to trace the ownership of "${businessName}" to identify if they are independent, a subsidiary, or PE-backed.

    TASK LOGIC:
    1. **Name Match & Recon:** Investigate "${businessName}".
    2. **Grounding Search:** Use Google Search to find the company's "About" page, Wikipedia entry, Crunchbase, SEC filings, or news articles.
    3. **Trace Ownership & M&A:** 
       - Identify the "Ultimate Parent Company" (e.g., Alphabet Inc. instead of Google).
       - EXTENSIVELY check for "Sister Companies" in the same portfolio/group.
       - INVESTIGATE recent M&A activity: Have they acquired companies or been acquired? Is there a broader strategy?

    OUTPUT TEMPLATE (Must use Markdown):
    ### **Corporate Intelligence Report**
    - **Target:** ${businessName}
    - **Ownership Status:** [Independent / Subsidiary / PE-Backed]
    - **Ultimate Parent:** [Name or "N/A"]
    - **Stock Ticker:** [Ticker or "Private"]
    - **Sister Entities:** [List companies in the same group, emphasizing relationship]
    
    #### **Strategic M&A & Ownership Insight**
    [Provide 2-3 sentences summarizing the M&A history and ownership structure.]

    #### **Strategic Pitch Angle**
    > "I noticed ${businessName} is part of the [Parent Name] ecosystem; based on your recent M&A activity [Mention specific M&A], my AI solution is designed to bridge the operational gap between you and [Sister Company Name], ensuring [Specific Benefit/ROI]."
    `;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Unable to generate intelligence report.';
    } catch (error) {
      console.error('Gemini API Error (Corp Report):', error);
      return 'Intelligence Gathering Failed. Target may be ghosted.';
    }
  }

  async findStrategicPartners(location: string): Promise<string> {
    const prompt = `You are a "Strategic Partnerships Scout." Your goal is to find AI Automation Agencies in Texas (specifically near ${location} if applicable) that have public "Referral," "Affiliate," or "Partner" programs.

    LOGIC:
    1. **Search Parameters:**
       - Keywords: "AI Automation Agency Texas", "n8n implementation partner", "Managed AI Services ${location}", "AI Agency Referral Program".
       - Filter: Look for pages containing "Referral Program," "Partner with us," or "Agentic Workflow solutions."
    2. **Entity Audit:**
       - Identify if they specialize in "Legacy Systems" or "Industrial Automation."
       - Check if they have a "Partner Manager" or "Head of Sales" listed on LinkedIn.
    3. **The "Broker" Score:** Rank them 1-10 based on how easy it is to submit a lead (e.g., Azati is a 10 because they have a simple form).

    OUTPUT FORMAT (Markdown Table):
    | Agency Name | Location | Partnership Type | Referral Fee (if listed) | Why they need my leads |
    | :--- | :--- | :--- | :--- | :--- |
    | [Name] | [City] | [Referral/White-label] | [% or $ Amount] | [e.g., They lack local field data] |

    **Next Action:** "I have a draft email for [Agency Name]'s Partner Manager ready. Would you like to see it?"
    `;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Search completed, but no data returned.';
    } catch (error) {
      console.error('Gemini API Error (Strategic Partners):', error);
      return 'Partnership Scan Failed. Network interference detected.';
    }
  }

  async findInsurTechOpportunities(location: string): Promise<string> {
    const prompt = `You are an "InsurTech Modernization Scout." Your goal is to find San Antonio (or ${location}) insurance firms with "Slow-Cycle" indicators.

    LOGIC:
    1. **Target Identification:** Find San Antonio insurance carriers or large brokerages (like USAA, SWBC, Higginbotham, or local independent firms).
    2. **The "Wait Time" Audit:** Search for Google Reviews, Glassdoor reviews, or complaints mentions of "slow claims," "manual paperwork," "faxing," or "outdated portals."
    3. **The Opportunity:** 
       - **FNOL Automation:** Can we use n8n to automate "First Notice of Loss"?
       - **Underwriting Speed:** Can Vertex AI reduce their 3-day underwriting to 12 minutes?

    OUTPUT TEMPLATE (Markdown):
    ### **Insurance Tech Audit**
    - **Carrier:** [Name]
    - **Ownership:** [Parent Group, e.g., Prosperity Bancshares for Texas Partners Bank]
    - **The Gap:** "Currently taking 20+ days for life insurance mental health disclosures." (Cite source if possible).
    - **The Solution:** "Vertex AI Digitization can reduce this to <24 hours."
    - **The Pitch:** "I’ve mapped an Agentic Workflow that automates your risk-taxonomy mapping."

    Find at least 3 opportunities.
    `;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'InsurTech Scan completed, no specific vulnerabilities found.';
    } catch (error) {
      console.error('Gemini API Error (InsurTech Scout):', error);
      return 'InsurTech Scout System Offline. Retrying recommended.';
    }
  }

  async auditLeadInsurTech(lead: Lead): Promise<string> {
    this.validateLead(lead);
    const prompt = `You are an "InsurTech Modernization Scout."
    TARGET: ${lead.businessName} located in ${lead.address || 'San Antonio'}.
    URL: ${lead.url}

    TASK: Perform an "InsurTech Audit" on this specific insurance firm.

    LOGIC:
    1. **The "Wait Time" Audit:** Use Google Search to find customer reviews, Glassdoor reviews, or complaints for "${lead.businessName}" mentioning "slow claims," "manual paperwork," "faxing," or "outdated portals."
    2. **Ownership Check:** Identify the Parent Group (e.g. is it owned by a larger bank or holding company?).
    3. **The Opportunity:** 
       - **FNOL Automation:** Can we use n8n to automate "First Notice of Loss"?
       - **Underwriting Speed:** Can Vertex AI reduce their underwriting time?

    OUTPUT TEMPLATE (Markdown):
    ### **Insurance Tech Audit: ${lead.businessName}**
    - **Carrier:** ${lead.businessName}
    - **Ownership:** [Parent Group if found]
    - **The Gap:** "[Quote about slow process or negative review]"
    - **The Solution:** "Vertex AI Digitization can reduce this to <24 hours."
    - **The Pitch:** "I’ve mapped an Agentic Workflow that automates your risk-taxonomy mapping."
    `;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Audit completed, but returned no textual data.';
    } catch (error) {
      console.error('Gemini API Error (Audit Lead InsurTech):', error);
      return 'Audit System Offline. Network interference detected.';
    }
  }

  async deepScoutLead(lead: Lead): Promise<string> {
    this.validateLead(lead);
    const prompt = `
    PERSONA: You are the "TechStrike Lead Analyst" using the "Scout's Eye" protocol.
    Your mission is to convert raw observations from San Antonio industrial sites into high-value "Lead Decks" for arbitrage.

    KNOWLEDGE BASE (SAN ANTONIO 2026):
    - IT/AI Referral Rates: 10-15% of Gross Revenue (Arcitech, Azati).
    - Target Zones: Port San Antonio, Toyota Corridor, I-35 Logistics Belt.

    TARGET DATA:
    - Business Name: ${lead.businessName}
    - Website: ${lead.url}
    - Identified Issues: ${lead.issues.join(', ')}
    - Tech Stack: ${lead.techStack.join(', ')}
    - Location: ${lead.address || 'San Antonio area'}

    OPERATIONAL WORKFLOW:
    1. HIERARCHY UNMASKING: Use Google Search to identify the Director of Operations, IT Manager, or a key decision-maker for "${lead.businessName}" at their San Antonio location. Use LinkedIn search queries if necessary.
    
    2. PROBLEM QUANTIFYING (Friction Analysis & Scout's Eye):
       - **APPLY SCOUT'S EYE OBSERVATIONS** to infer scale and friction:
         * **Employee Count:** Estimate based on company size/type (Cars in lot x 1.2 logic).
         * **Vending Status:** Does the site look like it has a breakroom or "Badge-Only" access? (Implies shift work/management layers).
         * **Tech Friction:** Look for signs of "Paper Clipboards," "Trucks backed up," or "Manual Gate Entry."
       - Analyze the specific "Friction" point.
       - Calculate the "Technical Debt Leak" (estimate Manual Hours Lost/week x $50/hr).

    3. ARBITRAGE ANALYSIS: Based on the identified friction, suggest a high-authority San Antonio-based IT/AI agency (like Arcitech, Azati, or another relevant specialist) that is best equipped to solve this specific problem. Explain *why* they are a good fit.
    
    4. LEAD DECK GENERATION: Compile the findings into a concise, professional "Lead Deck" using the exact Markdown format below. This deck is intended for a high-level executive introduction to a potential agency partner.

    OUTPUT FORMAT (Strict Markdown):
    ### **LEAD DECK: ${lead.businessName}**

    **1. Key Personnel Identified**
    - **Name:** [Full Name]
    - **Title:** [Job Title, e.g., Director of Operations]
    - **Source:** [URL where you found this info, e.g., LinkedIn Profile URL]

    **2. Primary Operational Friction (Scout's Eye View)**
    - **Scout's Eye Observations:**
      * **Estimated Employee Count:** [Range/Value, e.g., "25-50"]
      * **Automation/Vending Status:** [e.g., "High manual processing; potential for automated kiosk/service integration."]
    - **Observation:** [e.g., "High likelihood of manual gate entry based on site layout."]
    - **Analysis:** [Detailed 1-2 sentence analysis of the core business problem, e.g., "Their reliance on ${lead.techStack[0] || 'legacy systems'} likely creates significant data silos, hindering real-time inventory management."]
    - **Technical Debt Leak:** [Estimated weekly loss, e.g., "~$2,000/week (40 manual hours x $50/hr)"]

    **3. Recommended Arbitrage Partner**
    - **Agency:** [e.g., Arcitech]
    - **Justification:** [Why this agency is the perfect fit, e.g., "Arcitech specializes in legacy system integration for industrial clients and has case studies on solving similar supply chain visibility issues."]

    **4. Executive Intro Teaser**
    > **Subject: Intro: ${lead.businessName} (High-Value Legacy Tech Lead)**
    >
    > I've identified a significant modernization opportunity with **${lead.businessName}**. Their operations appear hampered by [summarize friction point], costing them an estimated [Technical Debt Leak value] weekly.
    >
    > My intelligence suggests their key decision-maker is **[Key Personnel Name]**. Your team's expertise in [Agency's Specialty] is a direct match.
    >
    > This is a high-intent lead ready for a strategic approach. Let's connect.

    ---
    ***LEGAL NOTE (Black's Law Check):*** *Ensure "Procuring Cause" is documented with the partner agency before disclosing the full lead dossier to secure your referral fee.*
    `;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Deep Scout analysis failed to yield results.';
    } catch (error) {
      console.error('Gemini API Error (Deep Scout):', error);
      return 'Deep Scout System Error. Could not connect to intelligence network.';
    }
  }

  async chatWithLeads(history: Content[], message: string, leads: Lead[]): Promise<string> {
    // Simplify leads for context to save tokens, removing redundant info
    const simplifiedLeads = leads.map(l => ({
      name: l.businessName,
      url: l.url,
      issues: l.issues,
      tech: l.techStack,
      risk: l.riskScore,
      loss: l.estimatedLeadLoss,
      security: l.securityStatus
    }));

    const contextData = JSON.stringify(simplifiedLeads);
    
    const systemInstruction = `You are the LeadStrike AI Assistant. 
    You have access to the following dataset of local business leads that were just scanned:
    ${contextData}

    Your Role:
    1. Answer questions about specific leads (e.g., "Which company has the highest risk?").
    2. Explain technical terms found in the data (e.g., "Why is missing SSL bad?").
    3. Suggest strategies for pitching to these specific businesses.
    4. If the dataset is empty, explain that the user needs to run a scan first.

    Style:
    - Cyberpunk / Professional / Concise.
    - Use bullet points for lists.
    - Be helpful but direct.
    `;

    try {
      // Construct the full conversation history for the stateless generateContent call
      // We append the new user message to the history
      const contents: Content[] = [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 500,
        }
      }));

      return response.text || 'System malfunction. No response generated.';
    } catch (error) {
      console.error('Gemini API Error (Chat):', error);
      return 'Connection interrupted. Please retry.';
    }
  }

  async generateBrutalAudit(businessName: string): Promise<string> {
    const prompt = `You are the "Lead Strike Audit Agent."
    
    GOAL: Create a "Brutal Reality" Audit for the business: "${businessName}".
    
    INSTRUCTIONS:
    1. GMB RISK: Investigate if their address is residential or if their photos are outdated/low quality. Use Google Search grounding.
    2. REVENUE LEAK: Estimate how many customers they lose per month to competitors with 4.5+ stars. Be specific and blunt.
    3. THE FIX: Provide three specific, actionable steps to claim their "Service Area" and hide home addresses if applicable.
    4. THE PITCH: Write a high-pressure, short text message (max 160 characters) the user can copy-paste to the owner.
    
    TONE: Professional, blunt, and urgent. No filler.
    
    OUTPUT FORMAT: Markdown.`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Audit failed. Target is off the grid.';
    } catch (error) {
      console.error('Gemini API Error (Brutal Audit):', error);
      return 'Audit System Failure. Neural link severed.';
    }
  }

  async scanVulnerabilities(lead: Lead): Promise<string> {
    this.validateLead(lead);
    const prompt = `You are the "Security Infrastructure Analyst."
    
    GOAL: Perform a high-level security configuration review for the website: "${lead.url}" (Business: ${lead.businessName}).
    
    INSTRUCTIONS:
    1. OUTDATED SOFTWARE: Use Google Search to identify the technologies (e.g., CMS, server software) and check for publicly known end-of-life status.
    2. ENCRYPTION: Verify if the site uses HTTPS and has a valid SSL certificate.
    3. SECURITY HEADERS: Research if they implement common security headers (e.g., HSTS, Content-Security-Policy, X-Frame-Options).
    4. SECURITY SUMMARY: Summarize your findings objectively. 
    
    CRITICAL: DO NOT invent CVEs, technical vulnerabilities, or make fake security claims. If no information is found via Google Search, report that no security information could be determined. Base your report entirely on gathered search results.
    
    TONE: Technical, objective, and professional.
    
    OUTPUT FORMAT: Markdown summarizing the security posture based on the gathered information.`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Vulnerability scan failed to yield results.';
    } catch (error) {
      console.error('Gemini API Error (Vulnerability Scan):', error);
      return 'Scanner Offline. Could not complete security audit.';
    }
  }

  async lookupContactInfo(lead: Lead): Promise<{email: string, phone: string}> {
    this.validateLead(lead);
    const prompt = `You are a "Contact Forensics Analyst."
    GOAL: Aggressively search for current contact information for "${lead.businessName}" (${lead.url}).
    
    INSTRUCTIONS:
    1. Search for current email address (prioritize info@, sales@, support@, or specific names).
    2. Search for current phone number (prioritize direct lines).
    3. If email is absolutely NOT reachable, return "FORM_ONLY".
    
    OUTPUT: Return ONLY valid JSON:
    {
      "email": "email@example.com" or "FORM_ONLY",
      "phone": "XXX-XXX-XXXX" or "N/A"
    }`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      
      const text = response.text || '{}';
      const parsed = this.extractJson(text) || { email: 'FORM_ONLY', phone: 'N/A' };
      return parsed;
    } catch (error) {
      console.error('Gemini API Error (Lookup Contact):', error);
      return { email: 'FORM_ONLY', phone: 'N/A' };
    }
  }

  async targetEquityOpportunity(lead: Lead): Promise<string> {
    this.validateLead(lead);
    const prompt = `You are the "Lead Strike Equity Analyst."
    
    GOAL: Perform an "Equity Opportunity Audit" on the business: "${lead.businessName}" (${lead.url}).
    
    INSTRUCTIONS:
    1. FINANCIAL HEALTH: Use Google Search to estimate their revenue, growth rate, and market position.
    2. OWNERSHIP STRUCTURE: Identify if they are a good candidate for equity-based deals, acquisitions, or partnerships.
    3. GROWTH POTENTIAL: Analyze their tech stack and market niche for scalability.
    4. EQUITY PITCH: Write a high-level, professional pitch for an equity-based partnership or acquisition.
    
    TONE: Professional, analytical, and strategic.
    
    OUTPUT FORMAT: Markdown with clear sections.`;

    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      }));
      return response.text || 'Equity analysis failed.';
    } catch (error) {
      console.error('Gemini API Error (Equity Targeter):', error);
      return 'Equity Targeter System Offline.';
    }
  }

  async generateColdCallScript(leadData: string): Promise<string> {
    const prompt = `You are the Lead Strike cold call script architect.
    
    GOAL: Produce a complete, battle-tested cold call script tailored to the provided business.
    
    RAW LEAD DATA:
    ${leadData}
    
    INSTRUCTIONS:
    1. Caller Mindset Brief: 3-5 sentences on the caller's perspective.
    2. Opening: First 20 seconds.
    3. Value Hook: 30-45 seconds, referencing specific business data.
    4. Objection Responses: 5 specific objections (Already have a website, Not interested, No budget, Send email, Who are you).
    5. The Ask: Request for next step (low commitment).
    6. Voicemail: 20-25 seconds.
    7. Post-Call Notes Template: Short form to fill out.

    TONE: Sharp, knowledgeable, human, no jargon, no buzzwords.`;
    
    try {
      const response = await this.withRetry(() => this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      }));
      return response.text || 'Error generating script.';
    } catch (e) {
      console.error('Gemini API Error (Cold Call Script):', e);
      return 'Failed to generate script.';
    }
  }
}
