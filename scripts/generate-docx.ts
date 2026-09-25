import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const doc = new Document({
    creator: "James Hardison",
    title: "Mercor Preparation Guide",
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Mercor Preparation Guide",
                heading: HeadingLevel.TITLE,
                spacing: { after: 400 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "This Preparation Guide provides a comprehensive toolkit for technical professionals to optimize their profiles and sharpen their interview performance for high-stakes, AI-driven evaluation pipelines. It includes a specialized tool to enhance resume scoring for algorithmic matching platforms and a voice-mode mock interview tool to coach spoken delivery and test domain expertise.",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: "Quick Tips",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ text: "• Practice sharpening genuine answers rather than scripts; follow-up questions expose canned responses.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Lead with real expertise you can defend to ensure you pass the verification check.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Deliver headlines first to avoid being cut off by the AI for rambling.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Optimize your environment with good lighting and a stable connection for the on-camera session.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Prepare one concrete LLM-application case with clear grading criteria to demonstrate domain rigor.", bullet: { level: 0 }, spacing: { after: 400 } }),
            
            new Paragraph({
                text: "Resume Preparation Guide",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "How to Use the Resume Prep Tool",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 }
            }),
            new Paragraph({ text: "1. Copy the full prompt block below.", bullet: { level: 0 } }),
            new Paragraph({ text: "2. Paste the prompt into a new AI chat and send it.", bullet: { level: 0 } }),
            new Paragraph({ text: "3. When the AI asks, provide your current resume text or a raw list of experience bullet points. Also provide the specific technical tracks or target engineering roles you want to focus on.", bullet: { level: 0 } }),
            new Paragraph({ text: "4. The AI will restructure and edit your experience to maximize its algorithmic score, strictly following the compliance guidelines listed in the prompt.", bullet: { level: 0 }, spacing: { after: 400 } }),
            
            new Paragraph({
                text: "Resume Prep Prompt (Copy & Paste):",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: "Act as an expert technical resume writer specializing in optimizing profiles for algorithmic matching platforms and applicant tracking systems (ATS).\n\nI am preparing my resume for a technical evaluation pipeline. The platform's matching backend filters out general role descriptions and actively scores profiles based on technical tool density, quantified metrics, and structured reasoning.\n\nBefore you rewrite anything, please reply by asking me to provide:\n1. My current resume text or a raw list of my experience bullet points.\n2. The specific technical tracks or target engineering roles I want to focus on.\n\nOnce I provide that information, your goal is to restructure and edit my raw experience to maximize its algorithmic scoring potential. For every bullet point you optimize, you must strictly follow these compliance guidelines:\n- Maintain absolute factual authenticity: do not fabricate tools, projects, or achievements that are not in my raw data.\n- Begin with strong, active professional verbs.\n- Weave in the exact high-value industry keywords, technical tools, frameworks, and regulatory standards present in my background.\n- Quantify the functional impact using realistic metrics or project scopes derived from my raw notes (e.g., \"reduced cycle times by X%,\" \"managed X automated protocols,\" \"achieved X% accuracy\") - only where those numbers are real.\n- Format the experience using a highly logical structure that demonstrates systematic, step-by-step reasoning.\n\nFor now, reply only by asking me for my raw experience bullets and target roles.",
                spacing: { after: 400 }
            }),

            new Paragraph({
                text: "The Interview Prep Tool",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "A voice-mode tool that simulates expert AI interviews and coaches you on your performance. It tailors practice to your resume and target role to sharpen your spoken delivery. Paste the prompt into a new AI chat to activate your mock interviewer and coach. It analyzes your resume against the target role, provides a readiness brief, conducts a spoken interview, and delivers specific feedback to mirror the high-stakes AI formats used by expert platforms.",
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: "How to Use the Interview Tool",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 }
            }),
            new Paragraph({ text: "1. Open a new AI chat and paste in the full interview prompt below. Send it.", bullet: { level: 0 } }),
            new Paragraph({ text: "2. Give it what it asks for: your resume pasted as text and the exact role you are applying for. If you have already done a real attempt, describe in your own words how it went.", bullet: { level: 0 } }),
            new Paragraph({ text: "3. Read the readiness brief. It tells you where you are strong, where the role is a stretch, and how to prep.", bullet: { level: 0 } }),
            new Paragraph({ text: "4. Turn on voice mode when prompted. The real interview is spoken, so practice it spoken.", bullet: { level: 0 } }),
            new Paragraph({ text: "5. Do the interview out loud. Keep a calculator and pen and paper next to you.", bullet: { level: 0 } }),
            new Paragraph({ text: "6. Say 'end interview' to get your score and drills.", bullet: { level: 0 }, spacing: { after: 400 } }),
            
            new Paragraph({
                text: "Interview Prep Prompt (Copy & Paste):",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: `You are running an AI expert interview by voice, then coaching me. These AI interviews are single-session, spoken, and fast. The AI verifies that resume claims are real, moves briskly, and interrupts if I ramble or stall. It asks about my domain expertise, a recent case and how I reasoned through it, a live scenario from my field, and a concrete example of how an LLM could be applied in my field with evaluation criteria and a grading rubric. It often uses a silent thinking pause before the case. Replicate this faithfully, then switch to coach mode.

## Step 1: Setup (keep this short, then go to voice)
First, tell me clearly that this practice must be done in voice mode, because the real interview is spoken, AI-driven, and fast, and voice is the only way to train for it realistically. Typing answers will not prepare me for the real thing.
Then ask me clearly for my resume (pasted as text) and the exact role I'm applying for. Wait until I provide both.
Also ask me one more thing: have I already taken a real attempt at this interview? If I have, ask me to describe the general shape of what I faced in my own words.

## Step 2: Readiness brief (text, tailored to my resume and role)
Read my resume against the exact role I named and give me a short, honest brief before we go to voice. Make it specific to me, not generic boilerplate. Cover:
1. Role fit.
2. Story spine.
3. LLM-application answer.
4. Delivery and setup.

## Step 3: The interview (by voice)
Once I'm in voice, start with one quick spoken question: how hard should this be, warm-up, realistic, or brutal? Then begin. Use the full interview behaviors by default, meaning cut me off if I ramble and use a silent thinking pause before the case.

## Step 4: Coach mode (when I say "end interview")
Drop character. Keep the spoken summary short and direct, then offer to put the full written breakdown in text.

## Step 5: Self-correction (after coaching)
After the feedback, ask me how the practice compared to the real thing in general terms. Then adjust how you run future sessions.

## Start
Begin with Step 1 now.`,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: "Disclaimer",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: "This is an independent interview-preparation aid for personal practice only. It is not affiliated with, authorized by, sponsored by, or endorsed by Mercor or any other interview platform. Use this tool only for legitimate preparation, before your interview.",
                spacing: { after: 400 }
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("/Users/176693/Desktop/Mercor_Preparation_Guide.docx", buffer);
    console.log("Document created successfully at /Users/176693/Desktop/Mercor_Preparation_Guide.docx");
});
