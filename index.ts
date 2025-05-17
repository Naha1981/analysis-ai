// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseMimeType: 'text/plain',
    systemInstruction: [
        {
          text: `You are an advanced data analysis assistant powered by the Gemini 1.5 Pro model, designed to analyze Corporate Entrepreneurship Assessment Instrument (CEAI) survey data. Your task is to process a CSV file containing CEAI survey responses, compute custom scores for five dimensions, perform reliability analysis, and generate structured output for dashboards. Follow these instructions:

1. **Input Data**:
   - Accept a CSV file with 56 columns: \`timestamp\`, \`department\` (optional), \`Answer1\` to \`Answer48\` (Likert scale 1-5), and pre-calculated averages (\`Management_Support_Avg\`, \`Autonomy_Avg\`, \`Rewards_Avg\`, \`Time_Availability_Avg\`, \`Organizational_Boundaries_Avg\`).
   - Question groupings:
     - Management Support: Answer1 to Answer10
     - Autonomy: Answer11 to Answer20
     - Rewards: Answer21 to Answer29
     - Time Availability: Answer30 to Answer38
     - Organizational Boundaries: Answer39 to Answer48

2. **Processing**:
   - **Validate Input**: Ensure the CSV has the expected columns and valid numerical responses (1-5 for Answer1 to Answer48). Flag any missing or invalid data.
   - **Compute Scores**: Recalculate dimension averages for each response to verify pre-calculated averages:
     - Management Support: Mean of Answer1 to Answer10
     - Autonomy: Mean of Answer11 to Answer20
     - Rewards: Mean of Answer21 to Answer29
     - Time Availability: Mean of Answer30 to Answer38
     - Organizational Boundaries: Mean of Answer39 to Answer48
   - **Reliability Analysis**: Calculate Cronbach’s alpha for each dimension to assess internal consistency. Use the formula:
     - α = (k / (k-1)) * (1 - Σσ²ᵢ / σ²ₜ), where k is the number of items, Σσ²ᵢ is the sum of item variances, and σ²ₜ is the variance of the total score.
   - **Department Breakdown**: If \`department\` is provided, compute average scores per dimension for each department.

3. **Output**:
   - Return a JSON object with:
     - \`overall_averages\`: Average score for each dimension across all responses.
     - \`reliability\`: Cronbach’s alpha for each dimension (to 3 decimal places).
     - \`department_breakdown\`: Average scores per dimension for each department (if applicable).
     - \`errors\`: List of any data validation issues (e.g., missing responses).
   - Format example:
     \`\`\`json
     {
       "overall_averages": {
         "Management Support": 3.9,
         "Autonomy": 3.8,
         "Rewards": 4.0,
         "Time Availability": 3.7,
         "Organizational Boundaries": 3.9
       },
       "reliability": {
         "Management Support": 0.850,
         "Autonomy": 0.820,
         "Rewards": 0.830,
         "Time Availability": 0.810,
         "Organizational Boundaries": 0.840
       },
       "department_breakdown": {
         "HR": {
           "Management Support": 3.9,
           "Autonomy": 3.9,
           "Rewards": 3.9,
           "Time Availability": 3.7,
           "Organizational Boundaries": 3.9
         },
         "IT": { ... },
         ...
       },
       "errors": []
     }. i want text based summary with clear headings, sub headings and bullet points, not jason. here is the raw data: My organization is quick to use improved work methods.	My organization is quick to use improved work methods that are developed by workers.	In my organization, developing one’s own ideas is encouraged for the improvement of the corporation.	Upper management is aware and very receptive to my ideas and suggestions.	A promotion usually follows from the development of new and innovative ideas.	Those employees who come up with innovative ideas on their own often receive management encouragement for their activities.	The ‘‘doers on projects’’ are allowed to make decisions without going through elaborate justification and approval procedures.	Senior managers encourage innovators to bend rules and rigid procedures in order to keep promising ideas on track.	Many top managers have been known for their experience with the innovation process.	Money is often available to get new project ideas off the ground.	Individuals with successful innovative projects receive additional rewards and compensation beyond the standard reward system for their ideas and efforts.	There are several options within the organization for individuals to get financial support for their innovative projects and ideas.	People are often encouraged to take calculated risks with ideas around here.	Individual risk takers are often recognized for their willingness to champion new projects, whether eventually successful or not.	The term ‘‘risk taker’’ is considered a positive attribute for people in my work area.	This organization supports many small and experimental projects, realizing that some will undoubtedly fail.	An employee with a good idea is often given free time to develop that idea.	There is considerable desire among people in the organization for generating new ideas without regard for crossing departmental or functional boundaries.	People are encouraged to talk to employees in other departments of this organization about ideas for new projects.	I feel that I am my own boss and do not have to double check all of my decisions with someone else.	Harsh criticism and punishment result from mistakes made on the job.	This organization provides the chance to be creative and try my own methods of doing the job.	This organization provides the freedom to use my own judgment.	This organization provides the chance to do something that makes use of my abilities.	I have the freedom to decide what I do on my job.	It is basically my own responsibility to decide how my job gets done.	I almost always get to decide what I do on my job.	I have much autonomy on my job and am left on my own to do my own work.	I seldom have to follow the same work methods or steps for doing my major tasks from day to day.	My manager helps me get my work done by removing obstacles and roadblocks	The rewards I receive are dependent upon my innovation on the job.	My supervisor will increase my job responsibilities if I am performing well in my job.	My supervisor will give me special recognition if my work performance is especially good.	My manager would tell his/her boss if my work was outstanding	There is a lot of challenge in my job.	During the past three months, my workload kept me from spending time on developing new ideas.	I always seem to have plenty of time to get everything done.	I have just the right amount of time and workload to do everything well.	My job is structured so that I have very little time to think about wider organizational problems.	I feel that I am always working with time constraints on my job.	My co-workers and I always find time for long-term problem solving.	In the past three months, I have always followed standard operating procedures or practices to do my major tasks.	There are many written rules and procedures that exist for doing my major tasks.	On my job I have no doubt of what is expected of me.	There is little uncertainty in my job.	During the past year, my immediate supervisor discussed my work performance with me frequently.	My job description clearly specifies the standards of performance on which my job is evaluated.	I clearly know what level of work performance is expected from me in terms of amount, quality, and timelines of output.
Disagree	Strongly Disagree	Strongly Agree	Not Sure	Not Sure	Not Sure	Agree	Disagree	Agree	Agree	Strongly Disagree	Disagree	Not Sure	Strongly Disagree	Agree	Not Sure	Agree	Disagree	Disagree	Agree	Strongly Agree	Strongly Agree	Agree	Not Sure	Not Sure	Disagree	Disagree	Disagree	Disagree	Agree	Strongly Agree	Agree	Not Sure	Not Sure	Disagree	Disagree	Disagree	Disagree	Disagree	Agree	Strongly Agree	Agree	Agree	Not Sure	Strongly Disagree	Strongly Disagree	Strongly Agree	Strongly Agree
Strongly Agree	Strongly Agree	Strongly Agree	Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Agree	Strongly Agree	Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Agree	Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Disagree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Disagree	Strongly Agree	Strongly Agree	Disagree	Agree	Agree	Agree	Agree	Disagree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree
Strongly Agree	Agree	Agree	Agree	Disagree	Agree	Agree	Disagree	Disagree	Disagree	Agree	Strongly Agree	Strongly Agree	Agree	Strongly Agree	Agree	Agree	Agree	Strongly Agree	Disagree	Strongly Disagree	Strongly Agree	Strongly Agree	Strongly Agree	Disagree	Agree	Disagree	Disagree	Disagree	Strongly Agree	Agree	Strongly Agree	Agree	Strongly Agree	Agree	Agree	Agree	Agree	Disagree	Agree	Agree	Agree	Agree	Agree	Agree	Agree	Strongly Agree	Strongly Agree
Strongly Agree	Agree	Agree	Agree	Agree	Agree	Disagree	Disagree	Not Sure	Disagree	Disagree	Disagree	Disagree	Agree	Agree	Agree	Disagree	Not Sure	Agree	Disagree	Not Sure	Agree	Agree	Agree	Disagree	Agree	Agree	Agree	Agree	Not Sure	Not Sure	Not Sure	Disagree	Agree	Agree	Agree	Not Sure	Disagree	Not Sure	Agree	Not Sure	Agree	Agree	Agree	Not Sure	Not Sure	Agree	Agree
Disagree	Disagree	Strongly Disagree	Disagree	Strongly Disagree	Disagree	Strongly Disagree	Strongly Disagree	Strongly Disagree	Strongly Disagree	Disagree	Strongly Disagree	Strongly Disagree	Strongly Disagree	Disagree	Disagree	Disagree	Strongly Disagree	Strongly Disagree	Disagree	Agree	Disagree	Disagree	Disagree	Not Sure	Not Sure	Agree	Strongly Agree	Disagree	Disagree	Disagree	Not Sure	Disagree	Disagree	Agree	Agree	Disagree	Agree	Disagree	Agree	Strongly Disagree	Disagree	Disagree	Disagree	Disagree	Strongly Disagree	Disagree	Disagree
Agree	Agree	Strongly Agree	Agree	Agree	Agree	Disagree	Strongly Disagree	Agree	Agree	Disagree	Disagree	Agree	Agree	Disagree	Disagree	Disagree	Disagree	Agree	Disagree	Not Sure	Agree	Agree	Agree	Disagree	Agree	Strongly Disagree	Disagree	Strongly Disagree	Agree	Disagree	Strongly Agree	Strongly Agree	Strongly Agree	Strongly Agree	Agree	Strongly Disagree	Strongly Disagree	Disagree	Disagree	Agree	Agree	Disagree	Agree	Agree	Strongly Agree	Strongly Disagree	Strongly Disagree
Agree	Strongly Agree	Strongly Agree	Agree	Not Sure	Strongly Agree	Strongly Agree	Strongly Disagree	Not Sure	Disagree	Not Sure	Agree	Agree	Not Sure	Not Sure	Agree	Agree	Strongly Agree	Not Sure	Agree	Agree	Agree	Agree	Agree	Agree	Agree	Agree	Strongly Agree	Agree	Agree	Strongly Agree	Agree	Agree	Agree	Agree	Strongly Agree	Strongly Disagree	Not Sure	Disagree	Not Sure	Agree	Disagree	Disagree	Strongly Agree	Strongly Agree	Not Sure	Agree	Strongly Agree
`,
        }
    ],
  };
  const model = 'gemini-2.0-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
