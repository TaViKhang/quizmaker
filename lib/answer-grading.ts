import { QuestionType } from "@prisma/client";
import { Question, Answer, Option } from "./question-utils";
import { 
  getMultipleChoiceMetadata,
  getShortAnswerMetadata,
  getFillBlankMetadata
} from "./question-utils";

/**
 * Result of grading an answer
 */
export interface GradingResult {
  isCorrect: boolean;
  score: number;
  needsManualGrading: boolean;
  feedback?: string;
}

/**
 * Result for the simplified direct grading function
 */
export interface SimpleGradingResult {
  isCorrect: boolean | null;
  score: number | null;
  feedback?: string | null;
}

/**
 * Grade an answer for any question type
 */
export async function gradeAnswer(
  question: Question, 
  answer: Answer
): Promise<GradingResult> {
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.TRUE_FALSE:
      return gradeMultipleChoiceQuestion(question, answer);
    
    case QuestionType.SHORT_ANSWER:
      return gradeShortAnswerQuestion(question, answer);
    
    case QuestionType.FILL_BLANK:
      return gradeFillBlankQuestion(question, answer);
    
    case QuestionType.MATCHING:
      return gradeMatchingQuestion(question, answer);
    
    case QuestionType.CODE:
      return gradeCodeQuestion(question, answer);
    
    case QuestionType.ESSAY:
    default:
      // Manual grading required
      return {
        isCorrect: false,
        score: 0,
        needsManualGrading: true
      };
  }
}

/**
 * Grade multiple-choice or true/false questions
 */
function gradeMultipleChoiceQuestion(
  question: Question, 
  answer: Answer
): GradingResult {
  const metadata = getMultipleChoiceMetadata(question);
  
  // Get the allowMultiple setting, checking both property names for compatibility
  let allowMultiple = metadata.allowMultiple;
  
  // Check if we have allowMultipleAnswers directly on the question (not in metadata)
  if (!allowMultiple && question.metadata) {
    if (typeof question.metadata === 'object' && 'allowMultipleAnswers' in question.metadata) {
      allowMultiple = Boolean(question.metadata.allowMultipleAnswers);
    }
  }
  
  const questionPoints = question.points || 1;
  
  if (!question.options || question.options.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true,
      feedback: "Question has no options defined"
    };
  }
  
  const correctOptionIds = question.options
    .filter(option => option.isCorrect)
    .map(option => option.id);
  
  if (correctOptionIds.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true,
      feedback: "Question has no correct options defined"
    };
  }
  
  // Get selected options from answer
  const selectedOptionIds = answer.selectedOptions || [];
    
  // Use the new direct grading function with the extracted data
  const result = gradeMultipleChoiceAnswer(
    selectedOptionIds,
    correctOptionIds,
    questionPoints,
    allowMultiple,
    metadata.allowPartialCredit !== false,
    question.options.length
  );
  
  // Convert SimpleGradingResult to GradingResult
    return {
    isCorrect: result.isCorrect === null ? false : result.isCorrect,
    score: result.score === null ? 0 : result.score,
      needsManualGrading: false,
    feedback: result.feedback || undefined
    };
}

/**
 * Grade short answer questions
 */
function gradeShortAnswerQuestion(
  question: Question, 
  answer: Answer
): GradingResult {
  if (!answer.textAnswer) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: false
    };
  }
  
  const questionPoints = question.points || 1;
  const metadata = getShortAnswerMetadata(question);
  const caseSensitive = metadata.caseSensitive;
  
  // Get all correct answers from options
  const correctOptions = question.options?.filter(option => option.isCorrect) || [];
  
  if (correctOptions.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true,
      feedback: "Question has no correct answers defined"
    };
  }
  
  // Normalize answers based on case sensitivity
  const normalizeAnswer = (text: string) => 
    caseSensitive ? text.trim() : text.trim().toLowerCase();
  
  const userAnswer = normalizeAnswer(answer.textAnswer);
  
  // Check if any correct option matches the user's answer
  const isCorrect = correctOptions.some(option => {
    const correctAnswer = normalizeAnswer(option.content);
    return userAnswer === correctAnswer;
  });
  
  return {
    isCorrect,
    score: isCorrect ? questionPoints : 0,
    needsManualGrading: false
  };
}

/**
 * Grade fill-in-the-blank questions
 */
export function gradeFillBlankQuestion(
  question: Question, 
  answer: Answer
): GradingResult {
  const questionPoints = question.points || 1;
  const metadata = getFillBlankMetadata(question);
  const caseSensitive = metadata.caseSensitive;
  
  // Get expected answers from options
  const blanks = question.options?.filter(
    opt => opt.position !== null && opt.position !== undefined
  ) || [];
  
  if (blanks.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true,
      feedback: "Question has no blank positions defined"
    };
  }

  let userBlankAnswers: Record<string, string> = {};
  if (answer.jsonData && typeof answer.jsonData === 'string') {
    try {
      const parsedData = JSON.parse(answer.jsonData);
      if (typeof parsedData === 'object' && parsedData !== null) {
        // Safely build userBlankAnswers Record<string, string>
        for (const key in parsedData) {
          if (Object.prototype.hasOwnProperty.call(parsedData, key) && typeof parsedData[key] === 'string') {
            userBlankAnswers[key] = parsedData[key];
          }
        }
      } else {
        // jsonData parsed, but not into an object suitable for blank answers
        return {
          isCorrect: false,
          score: 0,
          needsManualGrading: false,
          feedback: "Invalid answer data format for fill-in-the-blank (not an object)."
        };
      }
    } catch (e) {
      console.error("Error parsing jsonData in fill-blank question:", e);
      return {
        isCorrect: false,
        score: 0,
        needsManualGrading: false,
        feedback: "Invalid answer data format for fill-in-the-blank (JSON parse failed)."
      };
    }
  } else if (answer.jsonData) { 
    // jsonData exists but is not a string, which is unexpected based on Answer interface
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: false,
      feedback: "Invalid answer data type for fill-in-the-blank (expected JSON string)."
    };
  }
  // If no jsonData, userBlankAnswers will be an empty object, leading to 0 correctCount
  
  // Normalize answers based on case sensitivity
  const normalizeAnswer = (text: string) => 
    caseSensitive ? text.trim() : text.trim().toLowerCase();
  
  // Check each blank
  let correctCount = 0;
  
  for (const blank of blanks) {
    // Ensure blank.position is not null or undefined before converting to string
    if (blank.position === null || blank.position === undefined) continue;
    const positionKey = blank.position.toString();
    
    const userAnswerText = userBlankAnswers[positionKey];
    if (!userAnswerText) continue; // No answer provided for this blank
    
    const expectedAnswer = normalizeAnswer(blank.content);
    const normalizedUserAnswer = normalizeAnswer(userAnswerText);
    
    if (normalizedUserAnswer === expectedAnswer) {
      correctCount++;
    }
  }
  
  // Calculate score based on proportion of correct answers
  const proportion = blanks.length > 0 ? correctCount / blanks.length : 0;
  const score = Math.round(questionPoints * proportion);
  const isCorrect = blanks.length > 0 && correctCount === blanks.length;
  
  return {
    isCorrect,
    score,
    needsManualGrading: false,
    feedback: isCorrect ? undefined : `${correctCount}/${blanks.length} correct answers`
  };
}

/**
 * Grade matching questions
 */
export function gradeMatchingQuestion(
  question: Question, 
  answer: Answer
): GradingResult {
  const questionPoints = question.points || 1;

  // Group options - support both premise/response and legacy left/right
  const premiseOptions = question.options?.filter(opt => opt.group === 'premise' || opt.group === 'left') || [];
  const responseOptions = question.options?.filter(opt => opt.group === 'response' || opt.group === 'right') || [];

  if (premiseOptions.length === 0 || responseOptions.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true, // Requires setup
      feedback: "Question has no premise or response options defined"
    };
  }

  // Get correct matches from options
  // Ensure premiseOption.id and premiseOption.matchId are valid strings
  const correctMatches: Record<string, string> = {};
  for (const premiseOption of premiseOptions) {
    if (premiseOption.id && typeof premiseOption.id === 'string' && 
        premiseOption.matchId && typeof premiseOption.matchId === 'string') {
      // Find the actual response option that this premise should match to
      const matchingResponse = responseOptions.find(
        response => response.id === premiseOption.matchId
      );
      if (matchingResponse && matchingResponse.id && typeof matchingResponse.id === 'string') {
        correctMatches[premiseOption.id] = matchingResponse.id;
      }
    }
  }

  // If no correct matches are defined in the question setup, it needs manual grading or review
  if (Object.keys(correctMatches).length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true, // Requires setup
      feedback: "No correct matches defined for this question. Please check question setup."
    };
  }

  let userAnswers: Record<string, string> = {};
  if (answer.jsonData && typeof answer.jsonData === 'string') {
    try {
      const parsedData = JSON.parse(answer.jsonData);
      if (typeof parsedData === 'object' && parsedData !== null) {
        // Safely build userAnswers Record<string, string>
        const tempUserAnswers: Record<string, string> = {};
        let allValuesAreStrings = true;
        for (const key in parsedData) {
          if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
            if (typeof parsedData[key] === 'string') {
              tempUserAnswers[key] = parsedData[key];
            } else {
              allValuesAreStrings = false;
              break;
            }
          }
        }
        if (allValuesAreStrings) {
          userAnswers = tempUserAnswers;
        } else {
          return {
            isCorrect: false,
            score: 0,
            needsManualGrading: false,
            feedback: "Invalid answer data format (some values are not strings)."
          };
        }
      } else {
        // jsonData parsed, but not into an object
        return {
            isCorrect: false,
            score: 0,
            needsManualGrading: false, 
            feedback: "Invalid answer data format (not an object)."
        };
      }
    } catch (e) {
      console.error("Error parsing jsonData in matching question:", e);
      return {
        isCorrect: false,
        score: 0,
        needsManualGrading: false, 
        feedback: "Invalid answer data format (JSON parse failed)."
      };
    }
  } else {
    // No jsonData provided in the answer or it's not a string
    return {
        isCorrect: false,
        score: 0,
        needsManualGrading: false,
        feedback: "No valid answer data provided."
    };
  }
  
  let correctUserMatchCount = 0;
  // Iterate over the *defined correct matches* from the question setup
  for (const [definedPremiseId, definedResponseId] of Object.entries(correctMatches)) {
    // Check if the user's answer for this premise matches the defined correct response
    if (userAnswers[definedPremiseId] === definedResponseId) {
      correctUserMatchCount++;
    }
  }
  
  const totalPossibleCorrectMatches = Object.keys(correctMatches).length;
  
  // Calculate score based on proportion of correct matches
  // Ensure no division by zero if totalPossibleCorrectMatches is somehow 0 (though caught above)
  const proportion = totalPossibleCorrectMatches > 0 
                   ? correctUserMatchCount / totalPossibleCorrectMatches 
                   : 0;
  const score = Math.round(questionPoints * proportion);
  const isCorrect = correctUserMatchCount === totalPossibleCorrectMatches;
  
  return {
    isCorrect,
    score,
    needsManualGrading: false, // Matching questions are auto-graded
    feedback: isCorrect ? "All matches correct." : `${correctUserMatchCount}/${totalPossibleCorrectMatches} correct matches`
  };
}

/**
 * Grade code questions
 * Note: Real implementation would likely use a sandbox environment to run code
 */
function gradeCodeQuestion(
  question: Question, 
  answer: Answer
): GradingResult {
  if (!answer.textAnswer) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: false
    };
  }
  
  // Get question points
  const questionPoints = question.points || 1;
  const userCode = answer.textAnswer;
  
  // Try to parse metadata for expected output or test cases
  let expectedOutput: string[] = [];
  let testCases: Array<{input: string, output: string}> = [];
  let requiredKeywords: string[] = [];
  let prohibitedKeywords: string[] = [];
  
  try {
    // Extract metadata for code grading
    if (question.metadata) {
      const metadata = typeof question.metadata === 'string' 
        ? JSON.parse(question.metadata) 
        : question.metadata;
      
      expectedOutput = metadata.expectedOutput || [];
      testCases = metadata.testCases || [];
      requiredKeywords = metadata.requiredKeywords || [];
      prohibitedKeywords = metadata.prohibitedKeywords || [];
    }
  } catch (error) {
    console.error("Error parsing code question metadata:", error);
  }
  
  // Get expected keywords from options marked as correct
  const keywordsFromOptions = question.options
    ?.filter(opt => opt.isCorrect)
    .map(opt => opt.content.toLowerCase()) || [];
  
  // Merge with required keywords from metadata
  requiredKeywords = [...requiredKeywords, ...keywordsFromOptions];
  
  // If no grading criteria defined, require manual grading
  if (requiredKeywords.length === 0 && 
      prohibitedKeywords.length === 0 &&
      expectedOutput.length === 0 && 
      testCases.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true,
      feedback: "No automated grading criteria defined"
    };
  }
  
  // Initialize scoring variables
  let totalCriteria = 0;
  let passedCriteria = 0;
  let feedbackDetails: string[] = [];
  
  // Check for required keywords
  if (requiredKeywords.length > 0) {
    totalCriteria += requiredKeywords.length;
    const userCodeLower = userCode.toLowerCase();
    
    const matchedKeywords = requiredKeywords.filter(
      keyword => userCodeLower.includes(keyword.toLowerCase())
    );
    
    passedCriteria += matchedKeywords.length;
    
    if (matchedKeywords.length < requiredKeywords.length) {
      feedbackDetails.push(`Found ${matchedKeywords.length}/${requiredKeywords.length} required elements`);
    }
  }
  
  // Check for prohibited keywords
  if (prohibitedKeywords.length > 0) {
    totalCriteria += prohibitedKeywords.length;
    const userCodeLower = userCode.toLowerCase();
    
    const avoidedKeywords = prohibitedKeywords.filter(
      keyword => !userCodeLower.includes(keyword.toLowerCase())
    );
    
    passedCriteria += avoidedKeywords.length;
    
    if (avoidedKeywords.length < prohibitedKeywords.length) {
      feedbackDetails.push(`Used ${prohibitedKeywords.length - avoidedKeywords.length} prohibited elements`);
    }
  }
  
  // Check expected output if provided
  // Note: In a real implementation, this would execute the code in a sandbox
  // Here we're just doing a simple check if the output appears in the code
  if (expectedOutput.length > 0) {
    totalCriteria += expectedOutput.length;
    const userCodeLower = userCode.toLowerCase();
    
    const matchedOutputs = expectedOutput.filter(
      output => userCodeLower.includes(output.toLowerCase())
    );
    
    passedCriteria += matchedOutputs.length;
    
    if (matchedOutputs.length < expectedOutput.length) {
      feedbackDetails.push(`Code likely produces ${matchedOutputs.length}/${expectedOutput.length} expected outputs`);
    }
  }
  
  // Calculate score based on proportion of passed criteria
  const proportion = totalCriteria > 0 ? passedCriteria / totalCriteria : 0;
  const score = Math.round(questionPoints * proportion);
  const isCorrect = totalCriteria > 0 && passedCriteria === totalCriteria;
  
  // Always require manual grading for code questions
  return {
    isCorrect,
    score,
    needsManualGrading: true,
    feedback: feedbackDetails.length > 0 
      ? `Automatic pre-grading: ${feedbackDetails.join("; ")}` 
      : `Automatic pre-grading: ${passedCriteria}/${totalCriteria} criteria met`
  };
}

/**
 * Grades a multiple choice answer directly (without requiring Question and Answer objects)
 * Works for both single-choice and multiple-choice questions
 * 
 * @param selectedOptions Array of selected option IDs
 * @param correctOptions Array of correct option IDs
 * @param maxPoints Maximum points for the question
 * @param allowMultiple Whether multiple selections are allowed
 * @param allowPartialCredit Whether partial credit is allowed
 * @param totalOptionsCount Total number of options in the question
 * @returns SimpleGradingResult with isCorrect and score
 */
export function gradeMultipleChoiceAnswer(
  selectedOptions: string[],
  correctOptions: string[],
  maxPoints: number,
  allowMultiple: boolean = false,
  allowPartialCredit: boolean = true,
  totalOptionsCount: number = 0
): SimpleGradingResult {
  // Handle empty selections
  if (selectedOptions.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      feedback: "No answer selected"
    };
  }

  // For single-choice questions (traditional MCQ)
  if (!allowMultiple) {
    // If more than one option selected for single-choice question
    if (selectedOptions.length > 1) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Multiple options selected for a single-choice question"
      };
    }

    // Check if the selected option is correct
    const isCorrect = correctOptions.includes(selectedOptions[0]);
    return {
      isCorrect,
      score: isCorrect ? maxPoints : 0,
      feedback: isCorrect ? "Correct answer" : "Incorrect answer"
    };
  }

  // For multiple-choice questions
  // Count correct selections and incorrect selections
  const selectedCorrectCount = selectedOptions.filter(id => 
    correctOptions.includes(id)
  ).length;
  
  const selectedIncorrectCount = selectedOptions.filter(id => 
    !correctOptions.includes(id)
  ).length;
  
  // Perfect answer: all correct options selected and no incorrect options
  const allCorrectSelected = selectedCorrectCount === correctOptions.length;
  const noIncorrectSelected = selectedIncorrectCount === 0;
  const isCorrect = allCorrectSelected && noIncorrectSelected;
  
  // Calculate score
  if (isCorrect) {
    // Full credit for perfect answer
    return {
      isCorrect: true,
      score: maxPoints,
      feedback: "All correct answers selected"
    };
  } else if (allowPartialCredit) {
    // Calculate partial credit
    // Start with proportion of correct options selected
    let partialScore = (selectedCorrectCount / correctOptions.length) * maxPoints;
    
    // Apply penalty for incorrect selections
    if (selectedIncorrectCount > 0 && totalOptionsCount > 0) {
      const penalty = (selectedIncorrectCount / totalOptionsCount) * maxPoints;
      partialScore = Math.max(0, partialScore - penalty);
    }
    
    const roundedScore = Math.round(partialScore);
    
    let feedback = "";
    if (selectedCorrectCount === 0) {
      feedback = "No correct answers selected";
    } else if (!allCorrectSelected && noIncorrectSelected) {
      feedback = "Some correct answers missed";
    } else if (allCorrectSelected && !noIncorrectSelected) {
      feedback = "All correct answers selected but with additional incorrect answers";
    } else {
      feedback = "Partially correct answer";
    }
    
    return {
      isCorrect: false,
      score: roundedScore,
      feedback
    };
  } else {
    // No partial credit
    return {
      isCorrect: false,
      score: 0,
      feedback: "Answer is incorrect (no partial credit)"
    };
  }
}